import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import fs, {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  FLOW_KEY,
  FLOW_RECORDING,
  runFlow,
  type FlowOptions,
  type FlowResult,
} from "../fixtures/interrupted-recording/flow";
import {
  lastExchangeWasLive,
  PARTIAL_MARKER,
  recordingState,
  openRecordingSandbox,
  teardownPolly,
  type PartialMarker,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";

// A stand-in provider: one paid submit, then free polls of the task. Every
// request is counted, so a second submit cannot hide. It answers "processing"
// to the first two polls it sees and "completed" from the third on.
const hits = { POST: 0, GET: 0 };
let holdSubmits = false;
let onSubmitReceived: (() => void) | undefined;
// Submits the stand-in provider took and has not answered yet.
const held: Array<() => void> = [];
let server: Server;
let base = "";

function answer(req: IncomingMessage, res: ServerResponse): void {
  const method = req.method as "POST" | "GET";
  hits[method]++;
  req.resume();
  req.on("end", () => {
    if (method === "POST") {
      const accept = () =>
        res
          .writeHead(200, {
            "content-type": "application/json",
            "x-request-id": "req-submit-1",
          })
          .end(JSON.stringify({ id: "task-1", status: "created" }));
      if (holdSubmits) held.push(accept);
      else accept();
      onSubmitReceived?.();
      return;
    }
    const status = hits.GET <= 2 ? "processing" : "completed";
    res.writeHead(200, { "content-type": "application/json" }).end(
      JSON.stringify({
        id: "task-1",
        status,
        outputs:
          status === "completed" ? ["https://example.invalid/a.mp4"] : [],
      })
    );
  });
}

beforeAll(async () => {
  server = createServer(answer);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  server.close();
  await once(server, "close");
});

const realOpenSync = fs.openSync;
const realRenameSync = fs.renameSync;
const sandboxes: string[] = [];
const abandoned: PollyContext[] = [];

function sandbox(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "apicity-interrupted-"));
  sandboxes.push(dir);
  hits.POST = 0;
  hits.GET = 0;
  holdSubmits = false;
  onSubmitReceived = undefined;
  held.length = 0;
  return dir;
}

afterEach(() => {
  // A context left without teardown stands in for a dead process in the
  // in-process tests; give its fetch patch and dispatcher hold back.
  for (const ctx of abandoned.splice(0)) {
    ctx.polly.disconnect();
    ctx.releaseDispatcher?.();
  }
  // No submit stays held past its test.
  for (const accept of held.splice(0)) accept();
  for (const dir of sandboxes.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

function recordingDir(root: string): string {
  const [dir] = readdirSync(root);
  const [leaf] = readdirSync(path.join(root, dir));
  return path.join(root, dir, leaf);
}

interface Entry extends PersistedHarRecording {
  _order: number;
  request: PersistedHarRecording["request"] & { method: string; url: string };
}

function cassette(root: string): { text: string; entries: Entry[] } {
  const text = readFileSync(
    path.join(recordingDir(root), "recording.har"),
    "utf8"
  );
  const har = JSON.parse(text) as { log: { entries: Entry[] } };
  return { text, entries: har.log.entries };
}

function marker(root: string): PartialMarker {
  return JSON.parse(
    readFileSync(path.join(recordingDir(root), PARTIAL_MARKER), "utf8")
  ) as PartialMarker;
}

const shape = (entries: Entry[]) =>
  entries.map(
    (entry) =>
      `${entry.request.method} ${new URL(entry.request.url).pathname} #${entry._order}`
  );

function expectSanitized(root: string): void {
  const { text, entries } = cassette(root);
  expect(text).not.toContain(FLOW_KEY);
  for (const entry of entries) {
    const auth = entry.request.headers?.find(
      (header) => header.name?.toLowerCase() === "authorization"
    );
    expect(auth?.value).toBe("Bearer ***");
  }
}

const flowPath = path.resolve(
  import.meta.dirname,
  "../fixtures/interrupted-recording/flow.ts"
);

interface ChildRun {
  code: number | null;
  signal: NodeJS.Signals | null;
  result: FlowResult | null;
  stderr: string;
}

// The flow in a process of its own, so it can really die. spawn, not
// spawnSync: this process has to keep answering as the stand-in provider.
async function child(
  options: FlowOptions,
  onSpawn?: (kill: () => void) => void
): Promise<ChildRun> {
  const proc = spawn(
    process.execPath,
    ["--import", "tsx", flowPath, JSON.stringify(options)],
    {
      cwd: path.resolve(import.meta.dirname, "../.."),
      env: {
        ...process.env,
        TSX_TSCONFIG_PATH: path.resolve(
          import.meta.dirname,
          "../tsconfig.json"
        ),
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  let stdout = "";
  let stderr = "";
  proc.stdout.on("data", (chunk) => (stdout += String(chunk)));
  proc.stderr.on("data", (chunk) => (stderr += String(chunk)));
  onSpawn?.(() => proc.kill("SIGKILL"));
  const [code, signal] = (await once(proc, "close")) as [
    number | null,
    NodeJS.Signals | null,
  ];
  const line = stdout.trim().split("\n").pop() ?? "";
  return {
    code,
    signal,
    result: line.startsWith("{") ? (JSON.parse(line) as FlowResult) : null,
    stderr,
  };
}

const CHILD_TIMEOUT_MS = 120_000;

describe("an interrupted recording", () => {
  it(
    "keeps a submit accepted before SIGKILL and resumes without a second one",
    async () => {
      const recordingsDir = sandbox();
      const options: FlowOptions = {
        base,
        sandbox: { mode: "record-missing", recordingsDir },
      };

      // 1. The recorder dies the instant the submit's response is in hand.
      const killed = await child({ ...options, dieAfterSubmit: true });
      expect(killed.signal).toBe("SIGKILL");
      expect(hits).toEqual({ POST: 1, GET: 0 });
      expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
      expect(shape(cassette(recordingsDir).entries)).toEqual([
        "POST /v1/submit #0",
      ]);
      expectSanitized(recordingsDir);
      expect(marker(recordingsDir)).toMatchObject({
        unanswered: [],
        recorded: [{ method: "POST", order: 0, url: `${base}/v1/submit` }],
      });

      // 2. record-missing again: the submit replays, the polls are recorded.
      const resumed = await child(options);
      expect(resumed.stderr).toContain("resuming the interrupted recording");
      expect(resumed.code).toBe(0);
      expect(resumed.result).toEqual({
        taskId: "task-1",
        status: "completed",
        polls: 3,
        live: [false, true, true, true],
      });
      expect(hits).toEqual({ POST: 1, GET: 3 });
      expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
      expect(shape(cassette(recordingsDir).entries)).toEqual([
        "POST /v1/submit #0",
        "GET /v1/result/task-1 #0",
        "GET /v1/result/task-1 #1",
        "GET /v1/result/task-1 #2",
      ]);
      expectSanitized(recordingsDir);

      // 3. Pure replay: the same flow, and the provider hears nothing.
      const replayed = await child({
        ...options,
        sandbox: { mode: "replay", recordingsDir },
      });
      expect(replayed.code).toBe(0);
      expect(replayed.result).toEqual({
        taskId: "task-1",
        status: "completed",
        polls: 3,
        live: [false, false, false, false],
      });
      expect(hits).toEqual({ POST: 1, GET: 3 });
    },
    CHILD_TIMEOUT_MS
  );

  it(
    "replays the polls a killed run recorded and records the rest",
    async () => {
      const recordingsDir = sandbox();
      const options: FlowOptions = {
        base,
        sandbox: { mode: "record-missing", recordingsDir },
      };
      const killed = await child({ ...options, dieAfterPolls: 2 });
      expect(killed.signal).toBe("SIGKILL");
      expect(hits).toEqual({ POST: 1, GET: 2 });
      expect(shape(cassette(recordingsDir).entries)).toHaveLength(3);

      const resumed = await child(options);
      expect(resumed.code).toBe(0);
      expect(resumed.result?.live).toEqual([false, false, false, true]);
      expect(hits).toEqual({ POST: 1, GET: 3 });
      expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
    },
    CHILD_TIMEOUT_MS
  );

  it(
    "refuses a submit that no longer matches the accepted one",
    async () => {
      const recordingsDir = sandbox();
      const options: FlowOptions = {
        base,
        sandbox: { mode: "record-missing", recordingsDir },
      };
      await child({ ...options, dieAfterSubmit: true });

      const drifted = await child({ ...options, prompt: "a blue paper boat" });
      expect(drifted.code).not.toBe(0);
      expect(drifted.stderr).toContain("Refusing to send POST");
      expect(drifted.stderr).toContain("already recorded POST");
      expect(hits).toEqual({ POST: 1, GET: 0 });
      // The refusal keeps the marker: a plain rerun is refused again.
      expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");

      const resumed = await child(options);
      expect(resumed.code).toBe(0);
      expect(hits).toEqual({ POST: 1, GET: 3 });
    },
    CHILD_TIMEOUT_MS
  );

  it(
    "refuses to resend a submit whose answer never arrived",
    async () => {
      const recordingsDir = sandbox();
      const options: FlowOptions = {
        base,
        sandbox: { mode: "record-missing", recordingsDir },
      };
      // The provider takes the submit and stays silent; the recorder dies.
      holdSubmits = true;
      const killed = await child(options, (kill) => {
        onSubmitReceived = kill;
      });
      expect(killed.signal).toBe("SIGKILL");
      expect(hits).toEqual({ POST: 1, GET: 0 });
      expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
      expect(
        existsSync(path.join(recordingDir(recordingsDir), "recording.har"))
      ).toBe(false);
      expect(marker(recordingsDir).unanswered).toMatchObject([
        { method: "POST", order: 0, url: `${base}/v1/submit` },
      ]);

      holdSubmits = false;
      onSubmitReceived = undefined;
      const refused = await child(options);
      expect(refused.code).not.toBe(0);
      expect(refused.stderr).toContain(
        "the cassette does not hold the response"
      );
      expect(hits).toEqual({ POST: 1, GET: 0 });
      expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");

      // The operator checked the provider and discards the dead session.
      rmSync(path.join(recordingDir(recordingsDir), PARTIAL_MARKER));
      const fresh = await child(options);
      expect(fresh.code).toBe(0);
      expect(hits).toEqual({ POST: 2, GET: 3 });
    },
    CHILD_TIMEOUT_MS
  );
});

describe("recording checkpoints", () => {
  const SUBMIT = {
    method: "POST",
    headers: {
      authorization: `Bearer ${FLOW_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ prompt: "a red paper boat" }),
  };

  // Stands in for a dead process: the context never reaches teardownPolly.
  function abandon(ctx: PollyContext): void {
    ctx.polly.disconnect();
    ctx.releaseDispatcher?.();
    abandoned.splice(abandoned.indexOf(ctx), 1);
  }

  function open(
    recordingsDir: string,
    mode: "record" | "record-missing" | "replay" = "record-missing",
    beforePersist?: (recording: PersistedHarRecording) => void
  ): PollyContext {
    const ctx = openRecordingSandbox(
      FLOW_RECORDING,
      { mode, recordingsDir },
      beforePersist
    );
    abandoned.push(ctx);
    return ctx;
  }

  async function close(ctx: PollyContext): Promise<void> {
    abandoned.splice(abandoned.indexOf(ctx), 1);
    await teardownPolly(ctx);
  }

  it("writes each exchange before the caller sees its response", async () => {
    const recordingsDir = sandbox();
    const scrubbed: string[] = [];
    const ctx = open(recordingsDir, "record-missing", (recording) => {
      // A custom scrubber runs on every checkpoint, as it does at teardown.
      scrubbed.push(new URL(recording.request?.url ?? "").pathname);
      const content = recording.response?.content;
      if (content?.text)
        content.text = content.text.replace("task-1", "task-x");
    });
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("missing");
    expect(lastExchangeWasLive(FLOW_RECORDING)).toBe(true);

    const submitted = await fetch(`${base}/v1/submit`, SUBMIT);
    // No await sits between the response and these reads.
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
    const first = cassette(recordingsDir);
    expect(shape(first.entries)).toEqual(["POST /v1/submit #0"]);
    expect(first.entries[0].response?.content?.text).toContain("task-x");
    expectSanitized(recordingsDir);
    expect(marker(recordingsDir)).toMatchObject({
      version: 1,
      recording: FLOW_RECORDING,
      mode: "record-missing",
      pid: process.pid,
      unanswered: [],
      recorded: [{ method: "POST", order: 0 }],
    });
    // The caller still gets the provider's own bytes.
    expect(await submitted.json()).toEqual({ id: "task-1", status: "created" });

    await Promise.all([1, 2, 3].map(() => fetch(`${base}/v1/result/task-1`)));
    expect(shape(cassette(recordingsDir).entries)).toHaveLength(4);

    await close(ctx);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
    // Each exchange is scrubbed at its checkpoint and again at teardown.
    expect(scrubbed.filter((p) => p === "/v1/submit")).toHaveLength(2);

    // A finished cassette is byte for byte what Polly's own writer produces:
    // sorted keys, two-space indent, one trailing newline, no extra log keys,
    // and nothing else left in its directory.
    const { text } = cassette(recordingsDir);
    const har = JSON.parse(text) as { log: Record<string, unknown> };
    expect(text).toBe(JSON.stringify(har, null, 2) + "\n");
    expect(Object.keys(har.log)).toEqual([
      "_recordingName",
      "creator",
      "entries",
      "pages",
      "version",
    ]);
    expect(readdirSync(recordingDir(recordingsDir))).toEqual(["recording.har"]);
  });

  it("marks the cassette partial before a first live GET is saved", async () => {
    const recordingsDir = sandbox();
    const ctx = open(recordingsDir);
    await fetch(`${base}/v1/result/task-1`);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
    expect(marker(recordingsDir).unanswered).toEqual([]);
    await close(ctx);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
  });

  it("replaces the cassette and the marker by rename, never in place", async () => {
    const recordingsDir = sandbox();
    const opened: string[] = [];
    const renamed: string[] = [];
    const open_ = vi.spyOn(fs, "openSync").mockImplementation(((
      file: fs.PathLike,
      flags: fs.OpenMode,
      mode?: fs.Mode | null
    ) => {
      if (flags === "w") opened.push(path.basename(String(file)));
      return realOpenSync(file, flags, mode);
    }) as typeof fs.openSync);
    const write = vi.spyOn(fs, "writeFileSync");
    const sync = vi.spyOn(fs, "fsyncSync");
    const rename = vi.spyOn(fs, "renameSync").mockImplementation(((
      from: fs.PathLike,
      to: fs.PathLike
    ) => {
      renamed.push(path.basename(String(to)));
      return realRenameSync(from, to);
    }) as typeof fs.renameSync);
    try {
      const ctx = open(recordingsDir);
      await fetch(`${base}/v1/submit`, SUBMIT);
      await fetch(`${base}/v1/result/task-1`);
      await close(ctx);
      const direct = write.mock.calls
        .map(([file]) => file)
        .filter((file) => typeof file === "string");
      // Nothing is written to a final name; every final name arrives by rename.
      expect(direct).toEqual([]);
      expect(opened.every((name) => name.endsWith(".tmp"))).toBe(true);
      // Each temporary file is flushed before it takes the final name.
      expect(sync).toHaveBeenCalledTimes(renamed.length);
      expect(renamed.sort()).toEqual([
        "recording.har",
        "recording.har",
        "recording.har",
        PARTIAL_MARKER,
        PARTIAL_MARKER,
      ]);
    } finally {
      open_.mockRestore();
      write.mockRestore();
      sync.mockRestore();
      rename.mockRestore();
    }
  });

  it("does not deliver a response it could not save", async () => {
    const recordingsDir = sandbox();
    const ctx = open(recordingsDir, "record-missing", () => {
      throw new Error("scrubber failed");
    });
    await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow(
      "scrubber failed"
    );
    expect(hits).toEqual({ POST: 1, GET: 0 });
    abandon(ctx);
    // The accepted submit is not on disk, so a rerun must not send it again.
    expect(marker(recordingsDir).unanswered).toMatchObject([
      { method: "POST" },
    ]);
    const resumed = open(recordingsDir);
    await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow(
      "the cassette does not hold the response"
    );
    expect(hits).toEqual({ POST: 1, GET: 0 });
    await expect(close(resumed)).rejects.toThrow("Refusing to send POST");
  });

  it("keeps exchanges a run has yet to replay, and prunes at teardown", async () => {
    const recordingsDir = sandbox();
    const record = { mode: "record-missing", recordingsDir } as const;
    await runFlow({ base, sandbox: record });
    expect(hits).toEqual({ POST: 1, GET: 3 });

    // The test grows a new first request; the rest of the cassette must
    // survive that request's checkpoint, or the submit would be sent again.
    const ctx = open(recordingsDir);
    await fetch(`${base}/v1/result/extra`);
    expect(shape(cassette(recordingsDir).entries)).toHaveLength(5);
    const submitted = await fetch(`${base}/v1/submit`, SUBMIT);
    expect(await submitted.json()).toEqual({ id: "task-1", status: "created" });
    expect(lastExchangeWasLive(FLOW_RECORDING)).toBe(false);
    expect(hits).toEqual({ POST: 1, GET: 4 });
    await close(ctx);
    // Teardown prunes what this run never asked for, as it always has.
    expect(shape(cassette(recordingsDir).entries).sort()).toEqual([
      "GET /v1/result/extra #0",
      "POST /v1/submit #0",
    ]);
  });

  it("lets a resumed run send a new request once it has replayed the old ones", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);

    // A two-step flow: the second POST was never sent, so it may go out, but
    // only after the accepted first one has replayed.
    const resumed = open(recordingsDir);
    const second = { ...SUBMIT, body: JSON.stringify({ prompt: "step two" }) };
    await expect(fetch(`${base}/v1/submit`, second)).rejects.toThrow(
      "already recorded POST"
    );
    await fetch(`${base}/v1/submit`, SUBMIT);
    expect(hits).toEqual({ POST: 1, GET: 0 });
    await fetch(`${base}/v1/submit`, second);
    expect(hits).toEqual({ POST: 2, GET: 0 });
    // The earlier refusal still fails the run and keeps the marker.
    await expect(close(resumed)).rejects.toThrow("Refusing to send POST");
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
  });

  it("keeps an accepted submit that a resumed run failed to reach", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);

    // The resumed run records something new and stops before the submit.
    // Teardown prunes what a run did not replay; it must not prune this.
    const markerFile = path.join(recordingDir(recordingsDir), PARTIAL_MARKER);
    writeFileSync(
      markerFile,
      JSON.stringify({ ...marker(recordingsDir), pid: 0 })
    );
    const early = open(recordingsDir);
    expect(marker(recordingsDir).pid).toBe(process.pid);
    await fetch(`${base}/v1/result/extra`);
    await close(early);
    expect(shape(cassette(recordingsDir).entries).sort()).toEqual([
      "GET /v1/result/extra #0",
      "POST /v1/submit #0",
    ]);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");

    const resumed = await runFlow({
      base,
      sandbox: { mode: "record-missing", recordingsDir },
    });
    expect(resumed.live[0]).toBe(false);
    expect(hits.POST).toBe(1);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
  });

  it("keeps the marker while a dead run's unanswered submit is unexplained", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    holdSubmits = true;
    const received = new Promise<void>((resolve) => {
      onSubmitReceived = resolve;
    });
    void fetch(`${base}/v1/submit`, SUBMIT).catch(() => undefined);
    await received;
    abandon(dead);
    holdSubmits = false;

    // A run that sends only reads is not refused anything, yet it must not
    // clear the marker: the next run would send the submit a second time.
    const reads = open(recordingsDir);
    await fetch(`${base}/v1/result/task-1`);
    await close(reads);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
    expect(marker(recordingsDir).unanswered).toMatchObject([
      { method: "POST", order: 0 },
    ]);

    const again = open(recordingsDir);
    await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow(
      "the cassette does not hold the response"
    );
    await expect(close(again)).rejects.toThrow("Refusing to send POST");
    expect(hits.POST).toBe(1);
  });

  it("journals a request under its cassette identity, with no URL secret", async () => {
    const recordingsDir = sandbox();
    const SIGNATURE = "sig-live-secret-do-not-persist";
    const signed = `${base}/v1/submit?X-Amz-Signature=${SIGNATURE}&part=1`;
    const dead = open(recordingsDir);
    holdSubmits = true;
    const received = new Promise<void>((resolve) => {
      onSubmitReceived = resolve;
    });
    const pending = fetch(signed, SUBMIT);
    await received;
    // In flight: the journal names the request, and holds no secret.
    const markerFile = path.join(recordingDir(recordingsDir), PARTIAL_MARKER);
    const inFlight = readFileSync(markerFile, "utf8");
    expect(inFlight).not.toContain(SIGNATURE);
    expect(inFlight).not.toContain(FLOW_KEY);
    const [journaled] = marker(recordingsDir).unanswered;
    // The harness drops a signed-URL credential from the URL it persists.
    expect(journaled.url).toBe(`${base}/v1/submit?part=1`);
    for (const accept of held.splice(0)) accept();
    await pending;
    holdSubmits = false;
    const [entry] = cassette(recordingsDir).entries as Array<
      Entry & { _id: string }
    >;
    expect(journaled).toMatchObject({
      id: entry._id,
      order: entry._order,
      url: entry.request.url,
    });
    // The process dies after the cassette write and before the journal
    // entry is cleared: the journal still lists a request that is on disk.
    writeFileSync(markerFile, inFlight);
    abandon(dead);

    const resumed = open(recordingsDir);
    const replayed = await fetch(`${base}/v1/submit?part=1`, SUBMIT);
    expect(replayed.status).toBe(200);
    expect(lastExchangeWasLive(FLOW_RECORDING)).toBe(false);
    await close(resumed);
    expect(hits.POST).toBe(1);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
  });

  it("does not hold the marker for an exchange older than the dead run", async () => {
    const recordingsDir = sandbox();
    const record = { mode: "record-missing", recordingsDir } as const;
    await runFlow({ base, sandbox: record });
    // The test's prompt changes; the run that records the new submit dies.
    const changed = "a blue paper boat";
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, {
      ...SUBMIT,
      body: JSON.stringify({ prompt: changed }),
    });
    abandon(dead);
    expect(marker(recordingsDir).recorded).toHaveLength(1);

    // The old submit is still in the cassette and will never replay. Only
    // what the dead run recorded has to be accounted for.
    const resumed = await runFlow({ base, sandbox: record, prompt: changed });
    expect(resumed.live[0]).toBe(false);
    expect(hits.POST).toBe(2);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("complete");
  });

  it("starts a re-record from an empty cassette, so a resume replays nothing stale", async () => {
    const recordingsDir = sandbox();
    await runFlow({ base, sandbox: { mode: "record-missing", recordingsDir } });
    expect(shape(cassette(recordingsDir).entries)).toHaveLength(4);

    // POLLY_MODE=record dies after its submit. The three old polls must not
    // be what the resume replays: they belong to the cassette it replaces.
    const dead = open(recordingsDir, "record");
    await fetch(`${base}/v1/submit`, SUBMIT);
    expect(shape(cassette(recordingsDir).entries)).toEqual([
      "POST /v1/submit #0",
    ]);
    abandon(dead);
    expect(hits).toEqual({ POST: 2, GET: 3 });

    const resumed = await runFlow({
      base,
      sandbox: { mode: "record-missing", recordingsDir },
    });
    expect(resumed.live).toEqual([false, true]);
    expect(hits).toEqual({ POST: 2, GET: 4 });
  });

  it("refuses an unanswered re-record even when the old HAR has a matching submit", async () => {
    const recordingsDir = sandbox();
    await runFlow({ base, sandbox: { mode: "record-missing", recordingsDir } });
    holdSubmits = true;
    const killed = await child(
      { base, sandbox: { mode: "record", recordingsDir } },
      (kill) => {
        onSubmitReceived = kill;
      }
    );
    expect(killed.signal).toBe("SIGKILL");
    expect(hits).toEqual({ POST: 2, GET: 3 });
    const resumed = open(recordingsDir);
    await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow(
      "the cassette does not hold the response"
    );
    await expect(close(resumed)).rejects.toThrow("Refusing to send POST");
    expect(hits).toEqual({ POST: 2, GET: 3 });
    expect(marker(recordingsDir).unanswered).toHaveLength(1);
  });

  it("checks ownership again if another recorder sent a submit after setup", async () => {
    const recordingsDir = sandbox();
    const ctx = open(recordingsDir);
    holdSubmits = true;
    const received = new Promise<void>((resolve) => {
      onSubmitReceived = resolve;
    });
    let stopChild = () => {};
    const writer = child(
      { base, sandbox: { mode: "record-missing", recordingsDir } },
      (kill) => {
        stopChild = kill;
      }
    );
    try {
      await Promise.race([
        received,
        writer.then(() => {
          throw new Error("writer exited before submit");
        }),
      ]);
      await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow(
        "recording changed after setup"
      );
      await close(ctx);
      expect(hits.POST).toBe(1);
      expect(marker(recordingsDir).unanswered).toHaveLength(1);
    } finally {
      stopChild();
      await writer;
    }
  });

  it("keeps an unanswered submit when the server drops the connection before teardown", async () => {
    const recordingsDir = sandbox();
    const ctx = open(recordingsDir);
    holdSubmits = true;
    onSubmitReceived = () => server.closeAllConnections();
    await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow();
    await close(ctx);
    expect(marker(recordingsDir).unanswered).toHaveLength(1);
    const resumed = open(recordingsDir);
    await expect(fetch(`${base}/v1/submit`, SUBMIT)).rejects.toThrow(
      "the cassette does not hold the response"
    );
    await expect(close(resumed)).rejects.toThrow("Refusing to send POST");
    expect(hits.POST).toBe(1);
  });

  it("refuses to re-record over an interrupted recording", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);

    expect(() => open(recordingsDir, "record")).toThrow(
      "holds an interrupted recording"
    );
    abandoned.length = 0;
    expect(hits).toEqual({ POST: 1, GET: 0 });
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
  });

  it("refuses to share a cassette with a recorder that is still running", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);
    // Killing only the launcher orphans the recorder. Stand in for it with
    // a live pid that is not this process.
    const markerFile = path.join(recordingDir(recordingsDir), PARTIAL_MARKER);
    const left = marker(recordingsDir);
    writeFileSync(markerFile, JSON.stringify({ ...left, pid: process.ppid }));
    for (const mode of ["record-missing", "record"] as const)
      expect(() => open(recordingsDir, mode)).toThrow(
        `is still being recorded by pid ${process.ppid}`
      );
    abandoned.length = 0;
    expect(hits).toEqual({ POST: 1, GET: 0 });
  });

  it("fails the recordings lint until the cassette is finished", async () => {
    const recordingsDir = sandbox();
    const tests = mkdtempSync(path.join(tmpdir(), "apicity-interrupted-"));
    sandboxes.push(tests);
    // The lint reads recording names from setupPolly calls in *.test.ts.
    writeFileSync(
      path.join(tests, "stub.test.ts"),
      `set${"upPolly"}("${FLOW_RECORDING}");\n`
    );
    const lint = () =>
      spawnSync(
        process.execPath,
        [
          path.resolve(
            import.meta.dirname,
            "../../scripts/check-orphan-recordings.mjs"
          ),
          "--recordings",
          recordingsDir,
          "--tests",
          tests,
        ],
        { encoding: "utf8" }
      );

    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);
    const partial = lint();
    expect(partial.status).toBe(1);
    expect(partial.stderr).toContain("1 PARTIAL recording(s)");
    expect(partial.stderr).toContain(FLOW_RECORDING);

    await runFlow({ base, sandbox: { mode: "record-missing", recordingsDir } });
    const finished = lint();
    expect(finished.stderr).toBe("");
    expect(finished.status).toBe(0);
  });

  it("clears a temporary file a dead recorder left behind", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);
    // It died between writing a temporary file and renaming it.
    for (const name of ["recording.har.tmp", `${PARTIAL_MARKER}.tmp`])
      writeFileSync(path.join(recordingDir(recordingsDir), name), "{ torn");

    await runFlow({ base, sandbox: { mode: "record-missing", recordingsDir } });
    expect(readdirSync(recordingDir(recordingsDir))).toEqual(["recording.har"]);
    expect(hits.POST).toBe(1);
  });

  it("reads an unreadable marker as a request that was never answered", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);
    const markerFile = path.join(recordingDir(recordingsDir), PARTIAL_MARKER);
    writeFileSync(markerFile, "{ torn");
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");

    // What is recorded still replays, but nothing new may be created, and
    // the marker outlives the run.
    const resumed = open(recordingsDir);
    expect((await fetch(`${base}/v1/submit`, SUBMIT)).status).toBe(200);
    const second = { ...SUBMIT, body: JSON.stringify({ prompt: "step two" }) };
    await expect(fetch(`${base}/v1/submit`, second)).rejects.toThrow(
      "the cassette does not hold the response"
    );
    await expect(close(resumed)).rejects.toThrow("Refusing to send POST");
    expect(hits.POST).toBe(1);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
  });

  it("drops an answer that arrives after teardown, as before", async () => {
    const recordingsDir = sandbox();
    const ctx = open(recordingsDir);
    holdSubmits = true;
    const received = new Promise<void>((resolve) => {
      onSubmitReceived = resolve;
    });
    const late = fetch(`${base}/v1/submit`, SUBMIT);
    await received;
    await close(ctx);
    // The provider answers only now, with the context already torn down.
    for (const accept of held.splice(0)) accept();
    expect((await late).status).toBe(200);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("missing");
    expect(readdirSync(recordingDir(recordingsDir))).toEqual([]);
  });

  it("leaves the marker alone in replay", async () => {
    const recordingsDir = sandbox();
    const dead = open(recordingsDir);
    await fetch(`${base}/v1/submit`, SUBMIT);
    abandon(dead);
    const markerFile = path.join(recordingDir(recordingsDir), PARTIAL_MARKER);
    const before = readFileSync(markerFile, "utf8");

    const reads = vi.spyOn(fs, "readFileSync");
    try {
      const replay = open(recordingsDir, "replay");
      const response = await fetch(`${base}/v1/submit`, SUBMIT);
      expect(response.status).toBe(200);
      expect(lastExchangeWasLive(FLOW_RECORDING)).toBe(false);
      await close(replay);
      expect(reads.mock.calls.map(([file]) => String(file))).not.toContain(
        markerFile
      );
    } finally {
      reads.mockRestore();
    }
    expect(hits).toEqual({ POST: 1, GET: 0 });
    expect(readFileSync(markerFile, "utf8")).toBe(before);
    expect(recordingState(FLOW_RECORDING, recordingsDir)).toBe("partial");
  });
});
