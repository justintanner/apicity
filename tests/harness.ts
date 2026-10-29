import { Polly, Timing } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import FSPersister from "@pollyjs/persister-fs";
import path from "path";
import fs from "fs";
import {
  type PersistedHarRecording,
  redactPersistedHarSecrets,
  persistSafeTextRequestBody,
  summarizeJsonRequestBodyMedia,
  redactedRequestId,
  summarizeMultipartRequestBody,
} from "@apicity/har";

Polly.register(FetchAdapter);
Polly.register(FSPersister);

export interface PollyContext {
  polly: Polly;
  mode: string;
  /** Releases this context's hold on the recording dispatcher. */
  releaseDispatcher?: () => void;
  /** Requests replay found no recording for; teardownPolly fails on them. */
  replayMisses?: string[];
}

export {
  type PersistedHarRecording,
  PERSISTED_REQUEST_HEADER_PLACEHOLDERS,
  redactPersistedHarSecrets,
  persistSafeTextRequestBody,
  summarizeJsonRequestBodyMedia,
  redactedRequestId,
  summarizeMultipartFormData,
  summarizeMultipartRequestBody,
} from "@apicity/har";
export function setupPolly(recordingName: string): PollyContext {
  return setupPollyWithOptions(recordingName, {});
}

export function setupPollyWithPersistScrubber(
  recordingName: string,
  beforePersist: (recording: PersistedHarRecording) => void
): PollyContext {
  return setupPollyWithOptions(recordingName, { beforePersist });
}

export function setupPollyForFileUploads(recordingName: string): PollyContext {
  // Disable body matching for upload compatibility. FormData recordings get
  // sanitized multipart summaries in beforePersist; raw Blob uploads stay
  // summary-less so HARs never commit file bytes.
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "user-agent",
          "x-api-key",
          "xi-api-key",
          "x-dashscope-ossresourceresolve",
          "x-goog-api-key",
          "x-amz-date",
          "x-amz-security-token",
          "api-key",
        ],
      },
      body: false,
    },
  });
}

export function setupPollyIgnoringBody(recordingName: string): PollyContext {
  // Disable body matching when the factory injects defaults that weren't in
  // the original HAR (e.g. NSFW/safety permissive defaults). Headers are
  // still matched so requests can't collide across endpoints.
  return setupPollyWithOptions(recordingName, {
    matchRequestsBy: {
      headers: {
        exclude: [
          "authorization",
          "user-agent",
          "x-api-key",
          "xi-api-key",
          "x-dashscope-ossresourceresolve",
          "x-goog-api-key",
          "x-amz-date",
          "x-amz-security-token",
          "api-key",
        ],
      },
      body: false,
    },
  });
}

type RawPollyMode = "record" | "replay" | "passthrough" | "record-missing";
type PollyAdapterMode = "record" | "replay" | "passthrough";

function resolvePollyMode(): {
  raw: RawPollyMode;
  adapter: PollyAdapterMode;
  recordIfMissing: boolean;
} {
  const raw = (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
  if (raw === "record-missing") {
    return { raw, adapter: "replay", recordIfMissing: true };
  }
  return { raw, adapter: raw, recordIfMissing: false };
}

// ---------------------------------------------------------------------------
// Slow responses while recording
// ---------------------------------------------------------------------------
//
// Node's built-in fetch (undici) aborts a request whose response headers take
// longer than 300 s, or whose body stalls for 300 s, whatever timeout the
// provider sets. A sync call such as fal.run sends nothing until the media is
// ready, so a long recording would die on our side while the provider still
// finished and billed it, leaving no HAR (ac-qpennr: a Vidu Q4
// reference-to-video call queued for 147 s and ran for 261 s). Outside
// replay, setupPolly therefore holds a global dispatcher with both timeouts
// disabled until teardownPolly, so the provider's own timeout decides. Replay
// never reaches the network and leaves the dispatcher alone.

// Node's bundled undici keeps its global dispatcher under this symbol.
const UNDICI_GLOBAL_DISPATCHER = Symbol.for("undici.globalDispatcher.1");

type UndiciAgentClass = new (options: {
  headersTimeout: number;
  bodyTimeout: number;
}) => object;

/**
 * Builds an Agent of Node's own bundled undici class whose headers and body
 * timeouts are `timeoutMs` (0 disables them). Pass it as a fetch init's
 * `dispatcher`, or let holdRecordingDispatcher install one globally.
 */
export function createUndiciAgent(timeoutMs: number): object {
  // Reading fetch loads Node's bundled undici, which registers its Agent.
  void globalThis.fetch;
  const globalAgent = (globalThis as unknown as Record<symbol, unknown>)[
    UNDICI_GLOBAL_DISPATCHER
  ];
  if (typeof globalAgent !== "object" || globalAgent === null) {
    throw new Error(
      "tests/harness.ts: Node's undici global dispatcher is missing, so a " +
        "recording slower than 300 s would abort after the provider billed " +
        "it; update UNDICI_GLOBAL_DISPATCHER before recording."
    );
  }
  const Agent = globalAgent.constructor as UndiciAgentClass;
  return new Agent({ headersTimeout: timeoutMs, bodyTimeout: timeoutMs });
}

let recordingDispatcherHolds = 0;
let dispatcherBeforeRecording: unknown;

/**
 * Outside replay, installs a patient undici Agent (timeouts `timeoutMs`,
 * disabled by default) as the global fetch dispatcher and returns the
 * function that releases this hold. Holds are counted: the first installs the
 * Agent (its `timeoutMs` wins) and the last release restores the previous
 * dispatcher. In replay it changes nothing and returns a no-op.
 */
export function holdRecordingDispatcher(
  mode: RawPollyMode,
  timeoutMs = 0
): () => void {
  if (mode === "replay") return () => {};
  const globals = globalThis as unknown as Record<symbol, unknown>;
  if (recordingDispatcherHolds === 0) {
    const patient = createUndiciAgent(timeoutMs);
    dispatcherBeforeRecording = globals[UNDICI_GLOBAL_DISPATCHER];
    globals[UNDICI_GLOBAL_DISPATCHER] = patient;
  }
  recordingDispatcherHolds++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    recordingDispatcherHolds--;
    if (recordingDispatcherHolds === 0) {
      globals[UNDICI_GLOBAL_DISPATCHER] = dispatcherBeforeRecording;
      dispatcherBeforeRecording = undefined;
    }
  };
}

// The error Polly's adapter raises in replay when no recorded entry matches
// a request's identifiers.
const MISSING_RECORDING_MESSAGE =
  "Recording for the following request is not found";

function isMissingRecordingError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes(MISSING_RECORDING_MESSAGE)
  );
}

function recordingsRoot(): string {
  const override = process.env.POLLY_RECORDINGS_DIR;
  if (!override) return path.resolve(import.meta.dirname, "recordings");
  if ((process.env.POLLY_MODE ?? "replay") !== "replay") {
    throw new Error(
      "POLLY_RECORDINGS_DIR is replay-only; unset it to record into tests/recordings."
    );
  }
  return path.resolve(override);
}

function setupPollyWithOptions(
  recordingName: string,
  options: {
    matchRequestsBy?: Record<string, unknown>;
    beforePersist?: (recording: PersistedHarRecording) => void;
  }
): PollyContext {
  const { raw, adapter, recordIfMissing } = resolvePollyMode();
  const recordingsDir = recordingsRoot();
  const releaseDispatcher = holdRecordingDispatcher(raw);

  const defaultMatchRequestsBy = {
    headers: {
      exclude: [
        "authorization",
        "user-agent",
        "x-api-key",
        "xi-api-key",
        "x-dashscope-ossresourceresolve",
        "x-goog-api-key",
        "x-amz-date",
        "x-amz-security-token",
        "api-key",
      ],
    },
  };

  let polly: Polly;
  try {
    polly = new Polly(recordingName, {
      mode: adapter,
      adapters: [FetchAdapter],
      persister: FSPersister,
      persisterOptions: {
        fs: { recordingsDir },
      },
      recordIfMissing,
      recordFailedRequests: true,
      timing: Timing.fixed(0),
      matchRequestsBy: options.matchRequestsBy ?? defaultMatchRequestsBy,
    });
  } catch (error) {
    // No context exists to tear down, so give the hold back here.
    releaseDispatcher();
    throw error;
  }

  // Providers wrap a replay miss into their own error, so a test that only
  // asserts the call rejects passes without replaying anything (ac-wzvwud:
  // two fireworks fixtures with stale entry ids). teardownPolly fails on
  // these instead.
  const replayMisses: string[] = [];
  polly.server.any().on("error", (req, error) => {
    if (isMissingRecordingError(error)) {
      replayMisses.push(`${req.method} ${req.url}`);
    }
  });

  // Redact sensitive values before persisting to disk and keep a scrubbed
  // multipart summary so prompts remain visible in the harness viewer.
  polly.server.any().on("beforePersist", (req, recording) => {
    if (recording.request?.url) {
      const requestId = redactedRequestId(req);
      if (requestId) recording._id = requestId;
    }

    const multipartSummary = summarizeMultipartRequestBody(req.body);
    if (multipartSummary && recording.request) {
      const contentType =
        recording.request.headers?.find(
          (header: { name?: string; value?: string }) =>
            header.name?.toLowerCase() === "content-type"
        )?.value ?? "multipart/form-data";
      recording.request.postData ??= { mimeType: contentType, params: [] };
      recording.request.postData.mimeType = contentType;
      recording.request.postData.text = JSON.stringify(multipartSummary);
    }

    persistSafeTextRequestBody(recording as PersistedHarRecording, req.body);
    options.beforePersist?.(recording as PersistedHarRecording);
    summarizeJsonRequestBodyMedia(recording as PersistedHarRecording);
    redactPersistedHarSecrets(recording as PersistedHarRecording);
  });

  return { polly, mode: raw, releaseDispatcher, replayMisses };
}

export async function teardownPolly(ctx: PollyContext): Promise<void> {
  try {
    await ctx.polly.stop();
  } finally {
    ctx.releaseDispatcher?.();
  }
  const misses = ctx.replayMisses ?? [];
  if (misses.length > 0) {
    throw new Error(
      `Polly replay found no recording in "${ctx.polly.recordingName}" for ` +
        `${misses.join(", ")}. Fix the request or the recording's entry so ` +
        "they match, or record it with `pnpm run dev:record -- <file>`."
    );
  }
}

export function recordingExists(recordingName: string): boolean {
  const recordingsDir = recordingsRoot();
  // Polly normalizes dots to hyphens when creating directory names
  const parts = recordingName.split("/").map((p) => p.replace(/\./g, "-"));
  function walk(dir: string, depth: number): boolean {
    if (depth === parts.length) {
      return fs.existsSync(path.join(dir, "recording.har"));
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(parts[depth] + "_")) {
        if (walk(path.join(dir, entry.name), depth + 1)) {
          return true;
        }
      }
    }
    return false;
  }
  try {
    return walk(recordingsDir, 0);
  } catch {
    return false;
  }
}

export function getPollyMode(): RawPollyMode {
  return (process.env.POLLY_MODE ?? "replay") as RawPollyMode;
}

// ---------------------------------------------------------------------------
// OTP helpers for paid-endpoint tests
// ---------------------------------------------------------------------------
import { mintOtp } from "../packages/provider/cost/src/paygate";

/**
 * Fixed shared HMAC secret used across paid-endpoint tests. Construct gated
 * providers with `{ paygate: { secret: TEST_PAYGATE_SECRET } }` and mint OTPs
 * with the same secret.
 */
export const TEST_PAYGATE_SECRET = "apicity-test-paygate-secret";

/**
 * Generate a valid OTP for a KIE createTask request, signed with the test
 * secret and bound to the exact request payload.
 */
export function mintKieCreateTaskOtp(request: Record<string, unknown>): {
  otp: string;
} {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request,
    }),
  };
}

export function mintKieVeoOtp(
  dotPath:
    | "api.v1.veo.generate"
    | "api.v1.veo.extend"
    | "api.v1.veo.get1080pVideo"
    | "api.v1.veo.get4kVideo",
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      dotPath,
      request,
    }),
  };
}

export function mintKieFluxKontextOtp(request: Record<string, unknown>): {
  otp: string;
} {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.flux.kontext.generate",
      request,
    }),
  };
}

export function mintKieGpt4oImageOtp(request: Record<string, unknown>): {
  otp: string;
} {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.gpt4oImage.generate",
      request,
    }),
  };
}

export function mintKieMjOtp(request: Record<string, unknown>): {
  otp: string;
} {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.mj.generate",
      request,
    }),
  };
}

export function mintKieRunwayOtp(
  dotPath: "api.v1.runway.generate" | "api.v1.runway.extend",
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      provider: "kie",
      method: "POST",
      dotPath,
      request,
    }),
  };
}

export function mintKieSunoOtp(
  dotPath:
    | "api.v1.generate"
    | "api.v1.generate.generatePersona"
    | "api.v1.mp4.generate"
    | "api.v1.wav.generate"
    | "api.v1.vocalRemoval.generate"
    | "api.v1.midi.generate"
    | "api.v1.voice.generate"
    | "api.v1.voice.validate"
    | "api.v1.voice.regenerate"
    | "api.v1.suno.cover.generate",
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      provider: "kie",
      method: "POST",
      dotPath,
      request,
    }),
  };
}

export function mintKieOmniOtp(
  dotPath: "api.v1.omni.audio.create" | "api.v1.omni.character.create",
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      provider: "kie",
      method: "POST",
      dotPath,
      request,
    }),
  };
}

export function mintXaiOtp(
  dotPath: string,
  request: Record<string, unknown>
): { otp: string } {
  return {
    otp: mintOtp(TEST_PAYGATE_SECRET, {
      dotPath,
      request,
    }),
  };
}
