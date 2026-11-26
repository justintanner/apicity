// Crash-safe recording for the Polly harness (ac-anz4xg).
//
// Polly keeps every recorded exchange in memory and writes the cassette once,
// at stop(). A recording process that dies before teardown therefore loses
// every exchange it paid for (2026-11-25: a WaveSpeed submit was accepted,
// the recorder got SIGTERM, and the cassette never reached disk).
//
// CheckpointFSPersister writes the cassette after every recorded response,
// before that response is handed to the caller, and CheckpointFetchAdapter
// journals each request that can create something before it leaves. The
// journal lives in a marker beside the cassette, `recording.har.partial`,
// which exists from the first live request of a session until its teardown.
// A marker left behind means the session died: the next record-missing run
// replays what the cassette holds and refuses to send again a request that
// the dead session may already have had accepted.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Request as PollyRequest } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";

// @pollyjs/persister is not a direct dependency; take its types from the
// class this file extends.
type Har = Parameters<FSPersister["onSaveRecording"]>[1];

export const RECORDING_FILE = "recording.har";
export const PARTIAL_MARKER = "recording.har.partial";

/** Methods a resumed session may always send: they create nothing. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface PartialMarkerRequest {
  /** The `_id` its cassette entry carries (after secret redaction). */
  id: string;
  order: number;
  method: string;
  /** Redacted the same way as the cassette's request URL. */
  url: string;
  sentAt: string;
}

export interface PartialMarker {
  version: 1;
  recording: string;
  mode: string;
  pid: number;
  startedAt: string;
  /** The pre-existing cassette a destructive re-record was replacing. */
  supersededCassette?: string;
  /**
   * Requests with a method outside GET/HEAD/OPTIONS that were sent and whose
   * exchange is not in the cassette. One left here by a dead session may have
   * been accepted, and billed, by the provider.
   */
  unanswered: PartialMarkerRequest[];
  /**
   * The same kind of request, once its exchange is in the cassette. A resumed
   * session has to replay each of these before it may send a new one.
   */
  recorded: PartialMarkerRequest[];
}

export interface CheckpointOptions {
  /** The harness mode, e.g. "record-missing" (Polly itself says "replay"). */
  mode: string;
  /** Redacts a request URL for the marker and for refusal messages. */
  redactUrl: (url: string) => string;
  /** The `_id` beforePersist will give this request's entry, if not `id`. */
  persistedId: (request: PollyRequest) => string | undefined;
}

/** Raised instead of sending a request an interrupted session may have sent. */
export class RecordingResumeRefusal extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordingResumeRefusal";
  }
}

/**
 * Writes `text` to `file` so a reader sees the old bytes or the new ones.
 * The temporary name is fixed, so the next write replaces one a dead process
 * left behind.
 */
function writeFileAtomic(file: string, text: string, claim?: () => void): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = claim ? `${file}.${process.pid}.tmp` : `${file}.tmp`;
  const fd = fs.openSync(tmp, "w");
  try {
    try {
      fs.writeFileSync(fd, text);
      fs.fsyncSync(fd);
      claim?.();
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmp, file);
  } catch (error) {
    fs.rmSync(tmp, { force: true });
    throw error;
  }
}

function readPartialMarker(dir: string): PartialMarker | null {
  let text: string;
  try {
    text = fs.readFileSync(path.join(dir, PARTIAL_MARKER), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
  try {
    const marker = JSON.parse(text) as PartialMarker;
    if (
      marker.version === 1 &&
      Array.isArray(marker.unanswered) &&
      Array.isArray(marker.recorded)
    )
      return marker;
  } catch {
    // Fall through: an unreadable marker still marks the cassette partial.
  }
  return {
    version: 1,
    recording: "",
    mode: "unknown",
    pid: 0,
    startedAt: "",
    unanswered: [
      {
        id: "",
        order: 0,
        method: "UNKNOWN",
        url: `(unreadable ${PARTIAL_MARKER})`,
        sentAt: "",
      },
    ],
    recorded: [],
  };
}

function generation(file: string): string | undefined {
  const stat = fs.statSync(file, { bigint: true, throwIfNoEntry: false });
  return stat ? `${stat.dev}:${stat.ino}:${stat.ctimeNs}` : undefined;
}

function cassetteDigest(dir: string): string {
  return createHash("sha256")
    .update(fs.readFileSync(path.join(dir, RECORDING_FILE)))
    .digest("hex");
}

function processAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

const key = (id: string, order: number) => `${id}#${order}`;

interface SessionState {
  dir: string;
  markerGeneration?: string;
  cassetteGeneration?: string;
  ignoreExisting: boolean;
  sendFailed: boolean;
  /** The marker a dead session left, read when this session first looked. */
  inherited: PartialMarker | null;
  /** Journaled requests whose exchange is not in the cassette. */
  inheritedUnanswered: PartialMarkerRequest[];
  /** Journaled requests whose exchange is in the cassette, by entry key. */
  inheritedRecorded: Map<string, PartialMarkerRequest>;
  marker: PartialMarker | null;
  replayed: Set<string>;
  intents: Map<PollyRequest, PartialMarkerRequest>;
  recorded: PollyRequest[];
  /** True once this session has written the cassette. */
  written: boolean;
  refusals: string[];
}

/**
 * True while a resumed session has not accounted for the dead one: it was
 * refused a request, the dead session left a request unanswered, or an
 * exchange the dead session recorded for a non-safe method has not replayed.
 */
function stillInterrupted(state: SessionState): boolean {
  if (state.sendFailed) return true;
  if (!state.inherited) return false;
  if (state.refusals.length > 0 || state.inheritedUnanswered.length > 0)
    return true;
  for (const entryKey of state.inheritedRecorded.keys())
    if (!state.replayed.has(entryKey)) return true;
  return false;
}

export class CheckpointFSPersister extends FSPersister {
  private sessions = new Map<string, SessionState>();
  private queue: Promise<void> = Promise.resolve();
  private closing = false;

  private get checkpointOptions(): CheckpointOptions {
    return (
      this.polly.config.persisterOptions as { checkpoint: CheckpointOptions }
    ).checkpoint;
  }

  private dirFor(recordingId: string): string {
    return path.join(this.options.recordingsDir as string, recordingId);
  }

  /** Runs `task` after every earlier one, so cassette writes never overlap. */
  private exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task);
    this.queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private session(recordingId: string): SessionState {
    let state = this.sessions.get(recordingId);
    if (state) return state;
    const dir = this.dirFor(recordingId);
    const markerGeneration = generation(path.join(dir, PARTIAL_MARKER));
    const cassetteGeneration = generation(path.join(dir, RECORDING_FILE));
    const inherited = readPartialMarker(dir);
    const ignoreExisting =
      this.polly.mode === "record" ||
      (cassetteGeneration !== undefined &&
        inherited?.supersededCassette !== undefined &&
        inherited.supersededCassette === cassetteDigest(dir));
    // What the dead session journaled, split by what the cassette holds now.
    // A request it listed as unanswered may be on disk all the same: it can
    // have died after the cassette write and before the journal update.
    const inheritedUnanswered: PartialMarkerRequest[] = [];
    const inheritedRecorded = new Map<string, PartialMarkerRequest>();
    if (inherited) {
      let onDisk = new Set<string>();
      try {
        const har = JSON.parse(
          fs.readFileSync(path.join(dir, RECORDING_FILE), "utf8")
        ) as Har;
        if (!ignoreExisting)
          onDisk = new Set(har.log.entries.map((e) => key(e._id, e._order)));
      } catch {
        // No readable cassette: nothing the journal lists is on disk.
      }
      for (const request of [...inherited.recorded, ...inherited.unanswered]) {
        const entryKey = key(request.id, request.order);
        if (onDisk.has(entryKey)) inheritedRecorded.set(entryKey, request);
        else inheritedUnanswered.push(request);
      }
    }
    state = {
      dir,
      markerGeneration,
      cassetteGeneration,
      ignoreExisting,
      sendFailed: false,
      inherited,
      inheritedUnanswered,
      inheritedRecorded,
      marker: null,
      replayed: new Set(),
      intents: new Map(),
      recorded: [],
      written: false,
      refusals: [],
    };
    this.sessions.set(recordingId, state);
    return state;
  }

  /** Check the previous owner's journal before accepting requests. */
  start(): void {
    const state = this.session(this.polly.recordingId);
    const marker = state.inherited;
    if (!marker) return;
    const name = this.polly.recordingName;
    if (marker.pid !== process.pid && processAlive(marker.pid))
      throw new Error(
        `"${name}" is still being recorded by pid ${marker.pid} (started ${marker.startedAt}). ` +
          `Wait for it to finish. If the PID was reused, verify the recorder exited before setting pid to 0 in ${PARTIAL_MARKER}.`
      );
    if (this.checkpointOptions.mode === "record")
      throw new Error(
        `"${name}" holds an interrupted recording. POLLY_MODE=record would send its accepted requests again. ` +
          `Resume with pnpm run dev:record -- <file>, or check the provider before discarding ${PARTIAL_MARKER}.`
      );

    // Claim even a read-only resume: another worker must see our live PID.
    this.startMarker(state, name);
    console.warn(
      `[harness] resuming the interrupted recording "${name}" (pid ${marker.pid}, ${marker.startedAt})`
    );
  }

  private startMarker(
    state: SessionState,
    recording: string,
    intent?: PartialMarkerRequest
  ): void {
    const file = path.join(state.dir, PARTIAL_MARKER);
    const mode = this.checkpointOptions.mode;
    const marker: PartialMarker = {
      version: 1,
      recording,
      mode,
      pid: process.pid,
      startedAt: new Date().toISOString(),
      supersededCassette:
        mode === "record" && state.cassetteGeneration
          ? cassetteDigest(state.dir)
          : state.inherited?.supersededCassette,
      unanswered: [...state.inheritedUnanswered, ...(intent ? [intent] : [])],
      recorded: [...state.inheritedRecorded.values()],
    };
    // Each contender publishes its own temporary file before inspecting the
    // others. A competing writer either sees our temp or our renamed marker.
    writeFileAtomic(file, JSON.stringify(marker, null, 2) + "\n", () => {
      for (const name of fs.readdirSync(state.dir)) {
        const match = /^recording\.har\.partial\.(\d+)\.tmp$/.exec(name);
        if (!match || Number(match[1]) === process.pid) continue;
        if (processAlive(Number(match[1])))
          throw new Error(
            `Another recorder is claiming ${file}. Retry after it finishes.`
          );
        fs.rmSync(path.join(state.dir, name), { force: true });
      }
      if (
        generation(file) !== state.markerGeneration ||
        generation(path.join(state.dir, RECORDING_FILE)) !==
          state.cassetteGeneration
      )
        throw new Error(
          `The recording changed after setup. Rerun to resume ${file}.`
        );
    });
    state.marker = marker;
  }

  /** Requests this session refused to send; teardownPolly fails on them. */
  refusals(): string[] {
    return [...this.sessions.values()].flatMap((state) => state.refusals);
  }

  private writeMarker(state: SessionState): void {
    if (!state.marker) return;
    writeFileAtomic(
      path.join(state.dir, PARTIAL_MARKER),
      JSON.stringify(state.marker, null, 2) + "\n"
    );
  }

  private describe(request: { method: string; url: string }): string {
    return `${request.method} ${request.url}`;
  }

  /**
   * Called by CheckpointFetchAdapter when a request is about to reach the
   * network. Synchronous on purpose: nothing else runs between the check and
   * the journal write.
   */
  beforeLive(request: PollyRequest): void {
    const state = this.session(request.recordingId);
    const { redactUrl, persistedId } = this.checkpointOptions;
    const method = request.method.toUpperCase();
    const sideEffect = !SAFE_METHODS.has(method);
    const url = redactUrl(request.absoluteUrl);

    if (sideEffect && state.sendFailed) {
      const message = `Refusing to send ${method} ${url} after a submission failed without a saved response. Check ${path.join(state.dir, PARTIAL_MARKER)} before resuming.`;
      state.refusals.push(message);
      throw new RecordingResumeRefusal(message);
    }
    if (sideEffect && state.inherited) {
      const pending = [...state.inheritedRecorded]
        .filter(([entryKey]) => !state.replayed.has(entryKey))
        .map(([, request]) => this.describe(request));
      const marker = path.join(state.dir, PARTIAL_MARKER);
      let reason = "";
      if (state.inheritedUnanswered.length > 0) {
        reason =
          `an earlier recording session (pid ${state.inherited.pid}, ` +
          `${state.inherited.startedAt}) sent ` +
          state.inheritedUnanswered
            .map((r) => `${this.describe(r)} at ${r.sentAt}`)
            .join(", ") +
          ", and the cassette does not hold the response: the session died " +
          "before saving it, or the cassette was replaced since. The " +
          "provider may have accepted and billed it. Look the task up with " +
          "the provider's free reads before sending anything again.";
      } else if (pending.length > 0) {
        reason =
          "the interrupted session already recorded " +
          pending.join(", ") +
          ", and this run has not replayed it. The request no longer " +
          "matches what was recorded, so sending it would repeat a call " +
          "that was already accepted. Restore the request so it replays.";
      }
      if (reason) {
        const message =
          `Refusing to send ${method} ${url} while resuming the interrupted ` +
          `recording "${request.recordingName}": ${reason} To discard the ` +
          `interrupted session instead, delete ${marker}.`;
        state.refusals.push(message);
        throw new RecordingResumeRefusal(message);
      }
    }

    let intent: PartialMarkerRequest | undefined;
    if (sideEffect) {
      intent = {
        id: persistedId(request) ?? request.id ?? "",
        order: request.order ?? 0,
        method,
        url,
        sentAt: new Date().toISOString(),
      };
      state.intents.set(request, intent);
    }
    if (!state.marker) this.startMarker(state, request.recordingName, intent);
    else if (intent) {
      state.marker.unanswered.push(intent);
      this.writeMarker(state);
    }
  }

  replayed(request: PollyRequest): void {
    this.session(request.recordingId).replayed.add(
      key(request.id ?? "", request.order ?? 0)
    );
  }

  failed(request: PollyRequest): void {
    const state = this.session(request.recordingId);
    if (state.intents.has(request)) state.sendFailed = true;
  }

  // A destructive re-record replaces the cassette. Its first checkpoint must
  // not merge into the old one, or a resume would replay the old exchanges
  // this session never reached.
  override async onFindRecording(recordingId: string): Promise<Har | null> {
    const state = this.session(recordingId);
    if (state.ignoreExisting && !state.written) return null;
    return super.onFindRecording(recordingId);
  }

  override async onSaveRecording(recordingId: string, har: Har): Promise<void> {
    // The bytes fs-extra's outputJsonSync gives Polly's own FSPersister.
    const text =
      JSON.stringify(JSON.parse(this.stringify(har)), null, 2) + "\n";
    writeFileAtomic(path.join(this.dirFor(recordingId), RECORDING_FILE), text);
    this.session(recordingId).written = true;
  }

  /**
   * Polly's adapter awaits this before it answers the caller, so the caller
   * never holds a response that is not on disk.
   */
  override recordRequest(request: PollyRequest): Promise<void> {
    if (this.closing || this.polly.mode === "stopped") {
      // The stopped context no longer owns the cassette.
      return Promise.resolve();
    }
    const state = this.session(request.recordingId);
    state.recorded.push(request);
    return this.exclusive(async () => {
      super.recordRequest(request);
      const options = this.polly.config.persisterOptions as {
        keepUnusedRequests?: boolean;
      };
      const keep = options.keepUnusedRequests;
      // A checkpoint must not drop exchanges this run has yet to replay.
      options.keepUnusedRequests = true;
      try {
        await super.persist();
      } finally {
        options.keepUnusedRequests = keep;
      }
      const intent = state.intents.get(request);
      if (intent && state.marker) {
        state.intents.delete(request);
        state.marker.unanswered = state.marker.unanswered.filter(
          (item) => item !== intent
        );
        state.marker.recorded.push(intent);
        this.writeMarker(state);
      }
    });
  }

  /**
   * Polly calls this once, from stop(). Every exchange the session recorded
   * goes back in the queue, so Polly's own write rebuilds, scrubs, sorts and
   * prunes them exactly as it did before checkpoints existed.
   */
  override persist(): Promise<void> {
    this.closing = true;
    return this.exclusive(async () => {
      let interrupted = false;
      for (const state of this.sessions.values()) {
        interrupted ||= stillInterrupted(state);
        for (const request of state.recorded) super.recordRequest(request);
        state.recorded = [];
      }
      const options = this.polly.config.persisterOptions as {
        keepUnusedRequests?: boolean;
      };
      const keep = options.keepUnusedRequests;
      // Pruning drops what this run did not replay. A run that has yet to
      // replay an accepted exchange must not be the one that deletes it.
      if (interrupted) options.keepUnusedRequests = true;
      try {
        await super.persist();
      } finally {
        options.keepUnusedRequests = keep;
      }
    });
  }

  /**
   * teardownPolly calls this after stop(). A session that reached teardown
   * was not interrupted, so its marker goes, unless it was resuming a dead
   * session it has not accounted for: then the marker stays, holding what
   * that session left unanswered.
   */
  finish(): void {
    for (const state of this.sessions.values()) {
      if (!state.marker) continue;
      if (stillInterrupted(state)) {
        state.marker.pid = 0;
        this.writeMarker(state);
        continue;
      }
      for (const name of [
        `${PARTIAL_MARKER}.tmp`,
        `${RECORDING_FILE}.tmp`,
        PARTIAL_MARKER,
      ])
        fs.rmSync(path.join(state.dir, name), { force: true });
    }
  }
}

export class CheckpointFetchAdapter extends FetchAdapter {
  override async onRecord(request: PollyRequest): Promise<void> {
    const persister = this.persister as unknown as CheckpointFSPersister;
    persister.beforeLive(request);
    try {
      await super.onRecord(request);
      if (request.aborted) persister.failed(request);
    } catch (error) {
      persister.failed(request);
      throw error;
    }
  }
}
