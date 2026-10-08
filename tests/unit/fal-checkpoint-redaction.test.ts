import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { main as checkRecordingSecrets } from "../../scripts/check-recording-secrets.mjs";
import {
  FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER,
  findLiveFalCheckpoints,
  redactFalCheckpoints,
} from "../../scripts/lib/har-secrets.mjs";
import {
  redactPersistedHarSecrets,
  type PersistedHarRecording,
} from "../harness";

// A fal minimax/h3-max extend-video response carries a `checkpoint`: a
// `.safetensors` URL and a `signature` fal issues for a day. The recording of
// ac-b5tt8y stored one live in a public repository, and its turbo twin stored
// another (ac-yv3xum). The harness now redacts a checkpoint at persist time,
// and `pnpm run lint:recordings` fails a committed recording that still holds
// one, through check-recording-secrets.mjs. Both act on a `checkpoint` object
// only: kimicoding recordings carry thinking-block signatures that their next
// request echoes, so redacting those breaks replay.

/** The checkpoint's shape as fal returns it, with made-up values. */
const CHECKPOINT = {
  url: "https://v3b.fal.media/files/b/0aad0000/example_minimax-h3-av-checkpoint.safetensors",
  sha256: "5".repeat(64),
  size_bytes: 942360,
  version: 1,
  model: "minimax-h3",
  checkpoint_id: "4".repeat(32),
  owner_id: "e".repeat(64),
  issued_at: 1791360099,
  expires_at: 1791446499,
  audience: "minimax-h3/continue-video",
  signature: "0123456789abcdef".repeat(4),
};

const EXTEND_VIDEO_HARS = [
  "tests/recordings/fal_2801268556/minimax-h3-max-extend-video_1930136450/recording.har",
  "tests/recordings/fal_2801268556/minimax-h3-max-turbo-extend-video_1816985905/recording.har",
];

interface StoredEntry {
  request?: {
    headers?: Array<{ name?: string; value?: string }>;
    postData?: { text?: string };
  };
  response?: {
    bodySize?: number;
    content?: { size?: number; text?: string };
  };
}

interface StoredHar {
  log: { entries: StoredEntry[] };
}

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function jsonResponse(url: string, body: unknown): PersistedHarRecording {
  const text = JSON.stringify(body);
  return {
    request: { url },
    response: {
      bodySize: byteLength(text),
      content: { mimeType: "application/json", size: byteLength(text), text },
    },
  };
}

function harOf(...entries: StoredEntry[]): StoredHar {
  return { log: { entries } };
}

function responseText(body: unknown): StoredEntry {
  return {
    response: { content: { text: JSON.stringify(body) } },
  };
}

function listHarFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listHarFiles(fullPath);
    return entry.name.endsWith(".har") ? [fullPath] : [];
  });
}

describe("fal checkpoint redaction at persist time", () => {
  it("stores the signature as *** and keeps the rest of the body", () => {
    const body = {
      video: { url: "https://v3b.fal.media/files/b/0aad0000/clip.mp4" },
      checkpoint: CHECKPOINT,
      seed: 7,
    };
    const recording = jsonResponse(
      "https://fal.run/minimax/h3-max/extend-video",
      body
    );

    redactPersistedHarSecrets(recording);

    const stored = recording.response?.content?.text ?? "";
    expect(JSON.parse(stored)).toEqual({
      ...body,
      checkpoint: { ...CHECKPOINT, signature: "***" },
    });
    expect(Object.keys(JSON.parse(stored).checkpoint)).toEqual(
      Object.keys(CHECKPOINT)
    );
    expect(stored).not.toContain(CHECKPOINT.signature);
    // The sizes describe the text as stored, not as received.
    expect(recording.response?.content?.size).toBe(byteLength(stored));
    expect(recording.response?.bodySize).toBe(byteLength(stored));
    expect(findLiveFalCheckpoints(harOf(recording))).toEqual([]);
  });

  it("cuts a signed query from the checkpoint URL", () => {
    const signedUrl = `${CHECKPOINT.url}?Expires=1791446499&Signature=c2ln`;
    const recording = jsonResponse("https://queue.fal.run/minimax/h3-max", {
      checkpoint: { ...CHECKPOINT, url: signedUrl, signature: "***" },
    });

    redactPersistedHarSecrets(recording);

    const stored = recording.response?.content?.text ?? "";
    expect(JSON.parse(stored).checkpoint.url).toBe(CHECKPOINT.url);
    expect(Object.keys(JSON.parse(stored).checkpoint)).toEqual(
      Object.keys(CHECKPOINT)
    );
    expect(stored).not.toContain("Signature=");
    expect(recording.response?.content?.size).toBe(byteLength(stored));
  });

  it("holds a checkpoint signature to exactly ***", () => {
    for (const signature of ["***x", "*** ", "", "Bearer ***", "REDACTED"]) {
      const body = { checkpoint: { signature } };

      expect(
        findLiveFalCheckpoints(harOf(responseText(body))),
        JSON.stringify(signature)
      ).toEqual([{ entryIndex: 0, path: "$.checkpoint", field: "signature" }]);
      expect(redactFalCheckpoints(body), JSON.stringify(signature)).toEqual({
        value: { checkpoint: { signature: "***" } },
        redacted: true,
      });
    }
  });

  it("keeps a URL fragment and reads a ? inside it as no query", () => {
    expect(
      redactFalCheckpoints({
        checkpoint: { url: `${CHECKPOINT.url}?token=c2ln#part-2` },
      })
    ).toEqual({
      value: { checkpoint: { url: `${CHECKPOINT.url}#part-2` } },
      redacted: true,
    });
    expect(
      redactFalCheckpoints({
        checkpoint: { url: `${CHECKPOINT.url}#part?2` },
      })
    ).toEqual({
      value: { checkpoint: { url: `${CHECKPOINT.url}#part?2` } },
      redacted: false,
    });
  });

  it("leaves kimicoding thinking signatures, and every non-checkpoint signature, as recorded", () => {
    const body = {
      type: "message",
      content: [
        {
          type: "thinking",
          thinking: "The user wants the weather.",
          signature: "EqQBCkgIBRABGAIiQL1",
        },
        { type: "text", text: "Checking." },
      ],
      // The streaming form: a signature_delta object under `delta`.
      delta: { type: "signature_delta", signature: "EqQBCkgIBRABGAIiQL2" },
      signature: "top-level-signature",
      checkpoints: [{ signature: "plural-key-signature" }],
      meta: { checkpoint: "a string, not an object" },
      video: { url: "https://cdn.example.com/clip.mp4?token=c2ln" },
    };
    const recording = jsonResponse(
      "https://api.kimi.com/coding/v1/messages",
      body
    );
    const text = recording.response?.content?.text;

    redactPersistedHarSecrets(recording);

    expect(recording.response?.content?.text).toBe(text);
    expect(recording.response?.content?.size).toBe(byteLength(text ?? ""));
    expect(findLiveFalCheckpoints(harOf(recording))).toEqual([]);
  });

  it("finds exactly the fields the persist-time rule would change", () => {
    const bodies: unknown[] = [
      { checkpoint: CHECKPOINT },
      { checkpoint: { ...CHECKPOINT, signature: "***" } },
      { checkpoint: { ...CHECKPOINT, url: `${CHECKPOINT.url}?a=1` } },
      { results: [{ checkpoint: CHECKPOINT }, { checkpoint: null }] },
      { checkpoint: { signature: 42, url: null } },
      { content: [{ type: "thinking", signature: "kept" }] },
      [{ checkpoint: { checkpoint: { signature: "nested" } } }],
      "plain string",
    ];

    for (const body of bodies) {
      const label = JSON.stringify(body);
      const live = findLiveFalCheckpoints(harOf(responseText(body)));
      const result = redactFalCheckpoints(body);

      expect(result.redacted, label).toBe(live.length > 0);
      expect(
        findLiveFalCheckpoints(harOf(responseText(result.value))),
        label
      ).toEqual([]);
      // A second pass over redacted output changes nothing.
      expect(redactFalCheckpoints(result.value), label).toEqual({
        value: result.value,
        redacted: false,
      });
    }
  });

  it("reports the entry, the checkpoint path and the field, never the value", () => {
    const findings = findLiveFalCheckpoints(
      harOf(
        responseText({ checkpoint: { ...CHECKPOINT, signature: "***" } }),
        responseText({
          checkpoint: { ...CHECKPOINT, url: `${CHECKPOINT.url}?sig=c2ln` },
        }),
        responseText({
          results: [
            { checkpoint: { signature: "***" } },
            { "per-clip": { checkpoint: { signature: "c2lnbmF0dXJl" } } },
          ],
        }),
        // Not JSON: an event stream is not parsed, here or at persist time.
        { response: { content: { text: 'data: {"checkpoint":{"a":1}}\n' } } },
        // Request bodies are out of scope; the harness already stores every
        // JSON request-body signature as ***.
        {
          request: {
            postData: { text: JSON.stringify({ checkpoint: CHECKPOINT }) },
          },
        }
      )
    );

    expect(findings).toEqual([
      { entryIndex: 1, path: "$.checkpoint", field: "signature" },
      { entryIndex: 1, path: "$.checkpoint", field: "url" },
      {
        entryIndex: 2,
        path: '$.results[1]["per-clip"].checkpoint',
        field: "signature",
      },
    ]);
    const report = JSON.stringify(findings);
    expect(report).not.toContain(CHECKPOINT.signature);
    expect(report).not.toContain("c2ln");
    expect(FAL_CHECKPOINT_SIGNATURE_PLACEHOLDER).toBe("***");
  });

  it("ignores documents without entries or response bodies", () => {
    expect(findLiveFalCheckpoints(null)).toEqual([]);
    expect(findLiveFalCheckpoints({})).toEqual([]);
    expect(findLiveFalCheckpoints({ log: { entries: [{}, null] } })).toEqual(
      []
    );
  });
});

describe("committed fal recordings", () => {
  it("hold no live checkpoint signature or signed checkpoint URL", () => {
    const recordingsRoot = path.join(process.cwd(), "tests", "recordings");
    const falDirs = readdirSync(recordingsRoot).filter((name) =>
      name.startsWith("fal_")
    );
    const files = falDirs.flatMap((dir) =>
      listHarFiles(path.join(recordingsRoot, dir))
    );
    const live = files.flatMap((file) =>
      findLiveFalCheckpoints(JSON.parse(readFileSync(file, "utf8"))).map(
        (finding) =>
          `${path.relative(process.cwd(), file)}: entry ` +
          `${finding.entryIndex} ${finding.path}.${finding.field}`
      )
    );

    expect(files.length).toBeGreaterThan(0);
    expect(live).toEqual([]);
  });

  it.each(EXTEND_VIDEO_HARS)("%s stores its checkpoint scrubbed", (file) => {
    const har = JSON.parse(readFileSync(file, "utf8")) as StoredHar;
    const [entry] = har.log.entries;
    const text = entry.response?.content?.text ?? "";
    const { checkpoint } = JSON.parse(text) as {
      checkpoint: { signature: string; url: string };
    };

    expect(checkpoint.signature).toBe("***");
    expect(checkpoint.url).toMatch(
      /^https:\/\/v3b\.fal\.media\/files\/[^?#]+\.safetensors$/
    );
    expect(entry.response?.content?.size).toBe(byteLength(text));
    expect(entry.response?.bodySize).toBe(byteLength(text));
  });
});

describe("check-recording-secrets", () => {
  let dir: string;
  let out: string[];
  let err: string[];
  const io = {
    stdout: { write: (chunk: string) => out.push(chunk) },
    stderr: { write: (chunk: string) => err.push(chunk) },
  };

  function writeHar(relativePath: string, har: StoredHar | string): string {
    const file = path.join(dir, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(
      file,
      typeof har === "string" ? har : `${JSON.stringify(har, null, 2)}\n`
    );
    return path.relative(process.cwd(), file);
  }

  function run(...args: string[]): number {
    out = [];
    err = [];
    return checkRecordingSecrets(["--recordings", dir, ...args], io);
  }

  /** A recording as the harness persists it: clean by construction. */
  function recordedHar(authorization = "Bearer ***", signature = "***") {
    return {
      log: {
        entries: [
          {
            request: {
              headers: [
                { name: "authorization", value: authorization },
                { name: "content-type", value: "application/json" },
              ],
            },
            response: {
              content: {
                text: JSON.stringify({
                  checkpoint: { ...CHECKPOINT, signature },
                }),
              },
            },
          },
          {
            request: { headers: [{ name: "x-api-key", value: "***" }] },
            response: {
              content: {
                text: JSON.stringify({
                  content: [{ type: "thinking", signature: "EqQBCkgIBRAB" }],
                }),
              },
            },
          },
        ],
      },
    };
  }

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "check-recording-secrets-"));
    out = [];
    err = [];
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("passes recordings that hold only placeholders and thinking signatures", () => {
    writeHar("kimicoding_1/thinking_2/recording.har", recordedHar());

    expect(run()).toBe(0);
    expect(out.join("")).toBe("check-recording-secrets: OK (1 recording)\n");
    expect(err).toEqual([]);
  });

  it("fails a seeded authorization value and passes once it is restored", () => {
    const file = writeHar(
      "fal_1/extend_2/recording.har",
      recordedHar("Bearer kie0123456789abcdefLIVE")
    );

    expect(run()).toBe(1);
    const report = err.join("");
    expect(report).toContain(
      `${file}: entry 0 request header authorization is not "Bearer ***"\n`
    );
    expect(report).toContain("1 stored secret(s) in 1 recording.");
    expect(report).not.toContain("LIVE");
    expect(out).toEqual([]);

    writeHar("fal_1/extend_2/recording.har", recordedHar());
    expect(run()).toBe(0);
  });

  it("fails a live checkpoint signature and a signed checkpoint URL", () => {
    const signed = recordedHar("Bearer ***", CHECKPOINT.signature);
    const file = writeHar("fal_1/extend_2/recording.har", signed);
    const urlFile = writeHar(
      "fal_1/turbo_3/recording.har",
      harOf(
        responseText({
          checkpoint: {
            url: `${CHECKPOINT.url}?Signature=c2ln`,
            signature: "***",
          },
        })
      )
    );

    expect(run()).toBe(1);
    const report = err.join("");
    expect(report).toContain(
      `${file}: entry 0 response body $.checkpoint.signature is not "***"\n`
    );
    expect(report).toContain(
      `${urlFile}: entry 0 response body $.checkpoint.url carries a query string\n`
    );
    expect(report).not.toContain(CHECKPOINT.signature);
    expect(report).not.toContain("c2ln");
  });

  it("fails a recording that is not JSON without quoting it", () => {
    const file = writeHar("fal_1/broken_2/recording.har", '{"log": Bearer sk-');

    expect(run()).toBe(1);
    expect(err.join("")).toContain(`${file}: not valid JSON\n`);
    expect(err.join("")).not.toContain("sk-");
  });

  it("fails when there is no recording to check", () => {
    mkdirSync(path.join(dir, "fal_1"));

    expect(run()).toBe(1);
    expect(err.join("")).toContain("nothing was checked");
  });

  it("rejects an unknown argument, a bare --recordings and a missing directory", () => {
    expect(run("--provider")).toBe(2);
    expect(err.join("")).toContain(
      'unknown or incomplete argument "--provider"'
    );

    out = [];
    err = [];
    expect(checkRecordingSecrets(["--recordings"], io)).toBe(2);

    expect(
      checkRecordingSecrets(["--recordings", path.join(dir, "missing")], io)
    ).toBe(2);
    expect(err.join("")).toContain("cannot read");
  });

  it("prints its usage for --help", () => {
    expect(checkRecordingSecrets(["--help"], io)).toBe(0);
    expect(out.join("")).toContain("--recordings <dir>");
  });

  it("runs inside pnpm run lint, through lint:recordings", () => {
    const { scripts } = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>;
    };

    expect(scripts["lint:recordings"]).toBe(
      "node scripts/check-orphan-recordings.mjs && " +
        "node scripts/check-recording-secrets.mjs"
    );
    expect(scripts.lint).toContain("pnpm run lint:full");
    expect(scripts["lint:full"]).toContain("pnpm run lint:repo");
    expect(scripts["lint:repo"]).toContain("pnpm run lint:recordings");
  });
});
