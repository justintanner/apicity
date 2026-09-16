import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CliWriter } from "../../packages/cli/src/envelope";
import { createWriter } from "../../packages/cli/src/envelope";
import { CliError, EXIT_CODES } from "../../packages/cli/src/errors";
import { exitCodeTable } from "../../packages/cli/src/help";
import {
  runEndpoint,
  type EndpointOptions,
  type ProviderInstantiator,
} from "../../packages/cli/src/main";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";

// AC-04: the output contract and the exit table. Every status 0 through 8 is
// reached here through the documented trigger, with a fake provider whose leaf
// throws it — no network, and no provider package involved in deciding what a
// failure means.

const HOME = mkdtempSync(join(tmpdir(), "apicity-cli-home-"));
const KIE_ENV: NodeJS.ProcessEnv = { HOME, KIE_API_KEY: "kie-test" };
const DOT_PATH = "api.v1.jobs.recordInfo";

interface Capture {
  writer: CliWriter;
  out: string[];
  err: string[];
}

function capture(): Capture {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

/** A provider error as all 27 classes shape one: a message and a status. */
class FakeProviderError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "KieError";
    this.status = status;
  }
}

/** The pay-gate refusal, duck-typed exactly as `PayGateError` declares it. */
function payGateRefusal(): Error {
  const err = new Error("Paid endpoint requires an OTP approval.");
  return Object.assign(err, {
    name: "PayGateError",
    provider: "kie",
    method: "POST",
    dotPath: DOT_PATH,
    code: "otp-missing",
  });
}

function fakeKie(leaf: () => unknown): InstantiatedProvider {
  return {
    get: { api: { v1: { jobs: { recordInfo: () => leaf() } } } },
  } as InstantiatedProvider;
}

function instantiator(instance: InstantiatedProvider): ProviderInstantiator {
  return () => Promise.resolve(instance);
}

function options(
  leaf: () => unknown,
  extra: EndpointOptions = {}
): EndpointOptions {
  return {
    env: KIE_ENV,
    stdoutIsTTY: false,
    instantiate: instantiator(fakeKie(leaf)),
    ...extra,
  };
}

const ok = (): unknown => ({ taskId: "abc", state: "success" });

const throwing = (err: unknown) => (): unknown => {
  throw err;
};

interface ExitCase {
  title: string;
  /** Defaults to kie; the ambiguous case needs a multi-method dotPath. */
  provider?: string;
  argv: string[];
  leaf: () => unknown;
  env?: NodeJS.ProcessEnv;
  exit: number;
  code?: string;
}

const EXIT_CASES: ExitCase[] = [
  {
    title: "0 — the call succeeded",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: ok,
    exit: 0,
  },
  {
    title: "1 usage — an unknown flag",
    argv: [DOT_PATH, "--taskId", "abc", "--nope", "1"],
    leaf: ok,
    exit: 1,
    code: "usage",
  },
  {
    title: "2 not_found — the upstream answered 404",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new FakeProviderError("no such task", 404)),
    exit: 2,
    code: "not_found",
  },
  {
    title: "3 auth — nothing configured for the addressed provider",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: ok,
    env: { HOME },
    exit: 3,
    code: "auth",
  },
  {
    title: "3 auth — the upstream answered 401",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new FakeProviderError("bad key", 401)),
    exit: 3,
    code: "auth",
  },
  {
    title: "4 forbidden — the upstream answered 403",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new FakeProviderError("not allowed", 403)),
    exit: 4,
    code: "forbidden",
  },
  {
    title: "4 paygate — the gate refused",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(payGateRefusal()),
    exit: 4,
    code: "paygate",
  },
  {
    title: "5 rate_limit — the upstream answered 429",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new FakeProviderError("slow down", 429)),
    exit: 5,
    code: "rate_limit",
  },
  {
    title: "6 network — the request never landed",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new TypeError("fetch failed")),
    exit: 6,
    code: "network",
  },
  {
    title: "6 network — a DNS failure under the cause",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(
      Object.assign(new Error("request to api.kie.ai failed"), {
        cause: { code: "ENOTFOUND" },
      })
    ),
    exit: 6,
    code: "network",
  },
  {
    title: "7 api — any other upstream status",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new FakeProviderError("upstream exploded", 500)),
    exit: 7,
    code: "api",
  },
  {
    title: "7 api — a provider exception with no status at all",
    argv: [DOT_PATH, "--taskId", "abc"],
    leaf: throwing(new Error("the SDK threw")),
    exit: 7,
    code: "api",
  },
  {
    // No kie dotPath carries two methods; openai's `v1.files` carries three,
    // and the ambiguity is settled before a provider is ever instantiated.
    title: "8 ambiguous — the dotPath carries several methods",
    provider: "openai",
    argv: ["v1.files", "--id", "file_abc"],
    leaf: ok,
    exit: 8,
    code: "ambiguous",
  },
];

describe("every exit code the table declares", () => {
  const reached = new Set<number>();

  for (const testCase of EXIT_CASES) {
    it(`exits ${testCase.title}`, async () => {
      const cap = capture();

      const exit = await runEndpoint(
        testCase.provider ?? "kie",
        testCase.argv,
        cap.writer,
        options(testCase.leaf, testCase.env ? { env: testCase.env } : {})
      );
      reached.add(exit);

      expect(exit).toBe(testCase.exit);
      if (testCase.code === undefined) {
        expect(cap.err).toEqual([]);
        return;
      }
      // A failure is exactly one JSON document, on stderr, and stdout stays
      // empty: a pipeline never sees half a result.
      expect(cap.out).toEqual([]);
      expect(cap.err).toHaveLength(1);
      const envelope = JSON.parse(cap.err[0]) as Record<string, unknown>;
      expect(envelope.ok).toBe(false);
      expect(envelope.code).toBe(testCase.code);
      expect(typeof envelope.error).toBe("string");
    });
  }

  it("reaches all nine of them", () => {
    expect([...reached].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("keeps the exit set closed at 0 through 8 (D-10)", () => {
    const declared = new Set<number>([0, ...Object.values(EXIT_CODES)]);
    expect([...declared].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });
});

describe("the one output rule (D-5)", () => {
  it("wraps the result in the envelope when stdout is not a terminal", async () => {
    const cap = capture();

    await runEndpoint("kie", [DOT_PATH, "--taskId", "abc"], cap.writer, {
      ...options(ok),
      stdoutIsTTY: false,
    });

    expect(cap.out).toHaveLength(1);
    expect(JSON.parse(cap.out[0])).toEqual({
      ok: true,
      data: { taskId: "abc", state: "success" },
    });
  });

  it("prints the result alone at a terminal, and the envelope with --json", async () => {
    const human = capture();
    const forced = capture();

    await runEndpoint("kie", [DOT_PATH, "--taskId", "abc"], human.writer, {
      ...options(ok),
      stdoutIsTTY: true,
    });
    await runEndpoint(
      "kie",
      [DOT_PATH, "--taskId", "abc", "--json"],
      forced.writer,
      { ...options(ok), stdoutIsTTY: true }
    );

    expect(JSON.parse(human.out[0])).toEqual({
      taskId: "abc",
      state: "success",
    });
    expect(JSON.parse(forced.out[0])).toEqual({
      ok: true,
      data: { taskId: "abc", state: "success" },
    });
  });

  it("prints Error and hint at a terminal instead of the envelope", async () => {
    const cap = capture();

    const exit = await runEndpoint("kie", [DOT_PATH], cap.writer, {
      ...options(ok),
      stdoutIsTTY: true,
    });

    expect(exit).toBe(1);
    expect(cap.out).toEqual([]);
    expect(cap.err[0]).toBe("Error: missing required flag: --taskId");
    expect(cap.err[1]).toBe(
      "hint: --taskId is required (path parameter {taskId})"
    );
  });

  it("prints the data alone for --quiet, compactly with --json", async () => {
    const quiet = capture();
    const compact = capture();

    await runEndpoint(
      "kie",
      [DOT_PATH, "--taskId", "abc", "--quiet"],
      quiet.writer,
      options(ok)
    );
    await runEndpoint(
      "kie",
      [DOT_PATH, "--taskId", "abc", "--quiet", "--json"],
      compact.writer,
      options(ok)
    );

    expect(JSON.parse(quiet.out[0])).toEqual({
      taskId: "abc",
      state: "success",
    });
    expect(quiet.out[0]).toContain("\n");
    expect(compact.out[0]).toBe('{"taskId":"abc","state":"success"}');
  });

  it("buffers an async-iterable result into an array (REQ-004)", async () => {
    const cap = capture();
    async function* stream(): AsyncGenerator<unknown> {
      yield { chunk: 1 };
      yield { chunk: 2 };
    }

    await runEndpoint(
      "kie",
      [DOT_PATH, "--taskId", "abc", "--quiet"],
      cap.writer,
      options(() => stream())
    );

    expect(JSON.parse(cap.out[0])).toEqual([{ chunk: 1 }, { chunk: 2 }]);
  });
});

describe("the writer in isolation", () => {
  it("carries summary and meta only when they were given", () => {
    const out: string[] = [];
    const writer = createWriter({
      json: true,
      stdout: (text) => out.push(text),
      stderr: () => {},
    });

    writer.success({ n: 1 });
    writer.success({ n: 2 }, { summary: "1 command", meta: { total: 1 } });

    expect(JSON.parse(out[0])).toEqual({ ok: true, data: { n: 1 } });
    expect(JSON.parse(out[1])).toEqual({
      ok: true,
      data: { n: 2 },
      summary: "1 command",
      meta: { total: 1 },
    });
  });

  it("answers the error's own exit status", () => {
    const err: string[] = [];
    const writer = createWriter({
      json: true,
      stdout: () => {},
      stderr: (text) => err.push(text),
    });

    const exit = writer.failure(
      new CliError("rate_limit", "too many", { hint: "wait" })
    );

    expect(exit).toBe(5);
    expect(JSON.parse(err[0])).toEqual({
      ok: false,
      error: "too many",
      code: "rate_limit",
      hint: "wait",
    });
  });
});

describe("persisting what a call returned", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  afterEach(() => {
    fetchSpy.mockReset();
  });

  it("writes a binary result under the output directory", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "apicity-cli-out-"));
    const cap = capture();

    await runEndpoint(
      "kie",
      [DOT_PATH, "--taskId", "abc", "--output-dir", outputDir, "--quiet"],
      cap.writer,
      options(() => new Uint8Array([1, 2, 3, 4]))
    );

    const data = JSON.parse(cap.out[0]) as {
      savedTo: string;
      bytes: number;
    };
    expect(data.bytes).toBe(4);
    expect(data.savedTo.startsWith(outputDir)).toBe(true);
    expect(statSync(data.savedTo).size).toBe(4);
  });

  it("downloads a media URL and reports it beside the URL", async () => {
    const outputDir = mkdtempSync(join(tmpdir(), "apicity-cli-out-"));
    const cap = capture();
    fetchSpy.mockResolvedValue(
      new Response(new Uint8Array([9, 9, 9]), {
        headers: { "content-type": "image/png" },
      })
    );

    await runEndpoint(
      "kie",
      [DOT_PATH, "--taskId", "abc", "--output-dir", outputDir, "--quiet"],
      cap.writer,
      options(() => ({ url: "https://example.test/result.png" }))
    );

    const data = JSON.parse(cap.out[0]) as Record<string, string>;
    expect(data.url).toBe("https://example.test/result.png");
    expect(existsSync(data.url_savedTo)).toBe(true);
  });

  it("reports an unwritable output directory as api (exit 7)", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      [
        DOT_PATH,
        "--taskId",
        "abc",
        "--output-dir",
        "/proc/version/nope",
        "--quiet",
      ],
      cap.writer,
      options(() => new Uint8Array([1]))
    );

    expect(exit).toBe(7);
    expect(JSON.parse(cap.err[0])).toMatchObject({ code: "api" });
  });
});

// The README's exit table and `apicity help exit-codes` have to be the same
// bytes. W6 writes that README section; until it does, this guard reports
// itself as waiting rather than passing on an absent file.
const README = "packages/cli/README.md";
const TABLE_TITLE = "the exit table in packages/cli/README.md is byte-equal";
const readmeText = existsSync(README) ? readFileSync(README, "utf8") : "";
const armed = readmeText.includes(exitCodeTable().split("\n")[0]);

describe("apicity help exit-codes", () => {
  it.skipIf(!armed)(
    armed ? TABLE_TITLE : `${TABLE_TITLE} [skipped: W6 writes that table]`,
    () => {
      expect(readFileSync(README, "utf8")).toContain(exitCodeTable());
    }
  );

  it("names every code the CLI can raise", () => {
    const table = exitCodeTable();
    for (const code of Object.keys(EXIT_CODES)) {
      expect(table, code).toContain(code);
    }
  });
});
