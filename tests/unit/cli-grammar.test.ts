import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { CliWriter } from "../../packages/cli/src/envelope";
import {
  runEndpoint,
  type EndpointOptions,
  type ProviderInstantiator,
} from "../../packages/cli/src/main";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";

// AC-03: the invocation grammar. Every case here drives the real catalog and
// the real generated call-shape table against a fake provider tree, so what is
// under test is the binding — which flag reaches an argument, which reaches
// the request object, and which is refused — and never a network.

interface Call {
  method: string;
  args: unknown[];
}

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

/** A tree whose leaves record what they were called with and answer a stub. */
function tree(
  calls: Call[],
  shape: (leaf: (method: string) => unknown) => Record<string, unknown>
): InstantiatedProvider {
  const leaf =
    (method: string) =>
    (...args: unknown[]): Promise<unknown> => {
      calls.push({ method, args });
      return Promise.resolve({ ok: method });
    };
  return shape(leaf) as InstantiatedProvider;
}

/** EX-02: one dotPath, three methods, each a distinct leaf. */
function fakeOpenAi(calls: Call[]): InstantiatedProvider {
  return tree(calls, (leaf) => ({
    get: { v1: { files: leaf("GET") } },
    post: { v1: { files: leaf("POST") } },
    delete: { v1: { files: leaf("DELETE") } },
  }));
}

/** EX-03: `{taskId}` is a positional argument, confirmed by the shape table. */
function fakeKie(calls: Call[]): InstantiatedProvider {
  return tree(calls, (leaf) => ({
    get: { api: { v1: { jobs: { recordInfo: leaf("GET") } } } },
  }));
}

/** A field-bound row: `{bucket}` travels inside the request object. */
function fakeS3(calls: Call[]): InstantiatedProvider {
  return tree(calls, (leaf) => ({
    put: { buckets: { create: leaf("PUT") } },
  }));
}

/** An injected row: `{token}` is the credential the factory substitutes. */
function fakeTelegram(calls: Call[]): InstantiatedProvider {
  return tree(calls, (leaf) => ({ post: { sendMessage: leaf("POST") } }));
}

function instantiator(instance: InstantiatedProvider): ProviderInstantiator {
  return () => Promise.resolve(instance);
}

function options(
  instance: InstantiatedProvider,
  env: NodeJS.ProcessEnv,
  extra: EndpointOptions = {}
): EndpointOptions {
  return {
    env,
    stdoutIsTTY: false,
    instantiate: instantiator(instance),
    ...extra,
  };
}

// Every env below is sandboxed: `resolveCredentials` falls back to
// `$HOME/.config/apicity/.env`, and a developer machine that has one must not
// change what these tests prove.
const HOME = mkdtempSync(join(tmpdir(), "apicity-cli-home-"));

const OPENAI_ENV: NodeJS.ProcessEnv = { HOME, OPENAI_API_KEY: "sk-test" };
const KIE_ENV: NodeJS.ProcessEnv = { HOME, KIE_API_KEY: "kie-test" };
const S3_ENV: NodeJS.ProcessEnv = {
  HOME,
  S3_ACCESS_KEY_ID: "id",
  S3_SECRET_ACCESS_KEY: "secret",
};
const TELEGRAM_ENV: NodeJS.ProcessEnv = { HOME, TELEGRAM_BOT_KEY: "bot-test" };

function envelopeOf(capture: Capture): Record<string, unknown> {
  return JSON.parse(capture.out.join("\n")) as Record<string, unknown>;
}

function errorOf(capture: Capture): Record<string, unknown> {
  return JSON.parse(capture.err.join("\n")) as Record<string, unknown>;
}

describe("method selection (EX-02)", () => {
  it("is ambiguous when a dotPath carries several methods", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      ["v1.files", "--id", "file_abc"],
      cap.writer,
      options(fakeOpenAi(calls), OPENAI_ENV)
    );

    expect(exit).toBe(8);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("ambiguous");
    expect(String(envelope.hint)).toContain("--method");
    for (const method of ["DELETE", "GET", "POST"]) {
      expect(String(envelope.hint)).toContain(method);
    }
  });

  it("calls the GET row's leaf with its positional argument", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      ["v1.files", "--method", "GET", "--idOrOpts", "file_abc"],
      cap.writer,
      options(fakeOpenAi(calls), OPENAI_ENV)
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([{ method: "GET", args: ["file_abc"] }]);
  });

  it("calls the DELETE row through its own placeholder name", async () => {
    const calls: Call[] = [];
    const cap = capture();

    await runEndpoint(
      "openai",
      ["v1.files", "--method=DELETE", "--id=file_abc"],
      cap.writer,
      options(fakeOpenAi(calls), OPENAI_ENV)
    );

    expect(calls).toEqual([{ method: "DELETE", args: ["file_abc"] }]);
  });

  it("reports a method the pair does not carry", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      ["v1.files", "--method", "PATCH"],
      cap.writer,
      options(fakeOpenAi(calls), OPENAI_ENV)
    );

    expect(exit).toBe(2);
    expect(calls).toEqual([]);
    expect(String(errorOf(cap).hint)).toContain("GET");
  });

  it("reports an unknown dotPath with the discovery hint (EX-07)", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      ["v1.nope"],
      cap.writer,
      options(fakeOpenAi([]), OPENAI_ENV)
    );

    expect(exit).toBe(2);
    expect(errorOf(cap).code).toBe("not_found");
    expect(String(errorOf(cap).hint)).toBe(
      "run: apicity commands --provider openai"
    );
  });
});

describe("positional placeholders (EX-03)", () => {
  it("requires the path parameter and names it in the hint", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      ["api.v1.jobs.recordInfo"],
      cap.writer,
      options(fakeKie(calls), KIE_ENV)
    );

    expect(exit).toBe(1);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("usage");
    expect(envelope.hint).toBe(
      "--taskId is required (path parameter {taskId})"
    );
  });

  it("passes it positionally once given", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      ["api.v1.jobs.recordInfo", "--taskId", "abc"],
      cap.writer,
      options(fakeKie(calls), KIE_ENV)
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([{ method: "GET", args: ["abc"] }]);
  });

  it("lets the body take an absent optional positional's slot (F-7)", async () => {
    const calls: Call[] = [];
    const cap = capture();

    // openai's `v1.files` GET is `files(idOrOpts?, signal?)`: with no
    // `--idOrOpts` the request object is the first argument, not the second.
    const exit = await runEndpoint(
      "openai",
      ["v1.files", "--method", "GET", "--data", '{"purpose":"assistants"}'],
      cap.writer,
      options(fakeOpenAi(calls), OPENAI_ENV)
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([
      { method: "GET", args: [{ purpose: "assistants" }] },
    ]);
  });
});

describe("field placeholders", () => {
  it("binds --bucket and --data to the same request object", async () => {
    const viaFlag: Call[] = [];
    const viaData: Call[] = [];

    await runEndpoint(
      "s3",
      ["buckets.create", "--bucket", "my-bucket"],
      capture().writer,
      options(fakeS3(viaFlag), S3_ENV)
    );
    await runEndpoint(
      "s3",
      ["buckets.create", "--data", '{"bucket":"my-bucket"}'],
      capture().writer,
      options(fakeS3(viaData), S3_ENV)
    );

    expect(viaFlag).toEqual([
      { method: "PUT", args: [{ bucket: "my-bucket" }] },
    ]);
    expect(viaFlag).toEqual(viaData);
  });

  it("merges the flag over the body it is given alongside", async () => {
    const calls: Call[] = [];

    await runEndpoint(
      "s3",
      [
        "buckets.create",
        "--data",
        '{"bucket":"from-body","acl":"private"}',
        "--bucket",
        "from-flag",
      ],
      capture().writer,
      options(fakeS3(calls), S3_ENV)
    );

    expect(calls).toEqual([
      { method: "PUT", args: [{ bucket: "from-flag", acl: "private" }] },
    ]);
  });

  it("requires a field placeholder that was not supplied", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "s3",
      ["buckets.create"],
      cap.writer,
      options(fakeS3(calls), S3_ENV)
    );

    expect(exit).toBe(1);
    expect(calls).toEqual([]);
    expect(errorOf(cap).hint).toBe(
      "--bucket is required (request field bucket)"
    );
  });
});

describe("injected placeholders", () => {
  it("refuses a flag for the credential the factory substitutes", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "telegram",
      ["sendMessage", "--token", "12345:secret", "--data", '{"text":"hi"}'],
      cap.writer,
      options(fakeTelegram(calls), TELEGRAM_ENV)
    );

    expect(exit).toBe(1);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("usage");
    expect(String(envelope.error)).toContain("{token}");
    // The refused value must not survive into the envelope either.
    expect(cap.err.join("\n")).not.toContain("12345:secret");
  });

  it("calls the same row with the credential left to the factory", async () => {
    const calls: Call[] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "telegram",
      ["sendMessage", "--data", '{"chat_id":1,"text":"hi"}'],
      cap.writer,
      options(fakeTelegram(calls), TELEGRAM_ENV)
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([
      { method: "POST", args: [{ chat_id: 1, text: "hi" }] },
    ]);
  });

  it("reports an unknown flag rather than forwarding it", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "telegram",
      ["sendMessage", "--nope", "1"],
      cap.writer,
      options(fakeTelegram([]), TELEGRAM_ENV)
    );

    expect(exit).toBe(1);
    expect(String(errorOf(cap).error)).toContain("--nope");
  });
});

describe("the three body sources", () => {
  const body = { chat_id: 1, text: "hi" };

  it("reads --data", async () => {
    const calls: Call[] = [];

    await runEndpoint(
      "telegram",
      ["sendMessage", "--data", JSON.stringify(body)],
      capture().writer,
      options(fakeTelegram(calls), TELEGRAM_ENV)
    );

    expect(calls[0].args).toEqual([body]);
  });

  it("reads --data-file", async () => {
    const calls: Call[] = [];
    const file = join(mkdtempSync(join(tmpdir(), "apicity-cli-")), "req.json");
    writeFileSync(file, JSON.stringify(body));

    await runEndpoint(
      "telegram",
      ["sendMessage", "--data-file", file],
      capture().writer,
      options(fakeTelegram(calls), TELEGRAM_ENV)
    );

    expect(calls[0].args).toEqual([body]);
  });

  it("reads stdin for --data - through the injected reader", async () => {
    const calls: Call[] = [];
    let reads = 0;

    await runEndpoint(
      "telegram",
      ["sendMessage", "--data", "-"],
      capture().writer,
      options(fakeTelegram(calls), TELEGRAM_ENV, {
        readStdin: () => {
          reads++;
          return Promise.resolve(JSON.stringify(body));
        },
      })
    );

    expect(reads).toBe(1);
    expect(calls[0].args).toEqual([body]);
  });

  it("refuses --data together with --data-file", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "telegram",
      ["sendMessage", "--data", "{}", "--data-file", "req.json"],
      cap.writer,
      options(fakeTelegram([]), TELEGRAM_ENV)
    );

    expect(exit).toBe(1);
    expect(String(errorOf(cap).error)).toContain("only one of");
  });

  it("reports an unparsable body as usage, with the parser's own message", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "telegram",
      ["sendMessage", "--data", "{not json}"],
      cap.writer,
      options(fakeTelegram([]), TELEGRAM_ENV)
    );

    expect(exit).toBe(1);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("usage");
    expect(String(envelope.hint).length).toBeGreaterThan(0);
  });

  it("reports a --data-file that is not there", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "telegram",
      ["sendMessage", "--data-file", "/nope/missing.json"],
      cap.writer,
      options(fakeTelegram([]), TELEGRAM_ENV)
    );

    expect(exit).toBe(1);
    expect(String(errorOf(cap).error)).toContain("/nope/missing.json");
  });
});

describe("--help on the endpoint form", () => {
  it("prints the POST row's URL, docs URL and schema", async () => {
    const cap = capture();

    // At a terminal; piped, the same description is the success envelope.
    const exit = await runEndpoint(
      "openai",
      ["v1.chat.completions", "--help"],
      cap.writer,
      { env: { HOME }, stdoutIsTTY: true }
    );

    expect(exit).toBe(0);
    const text = cap.out.join("\n");
    expect(text).toContain("https://api.openai.com/v1/chat/completions");
    expect(text).toContain("docs:");
    expect(text).toContain("schema:");
    // The other methods are named, on stderr, so stdout stays one document.
    expect(cap.err.join("\n")).toContain("--method");
  });

  it("needs no credential and calls nothing", async () => {
    const calls: Call[] = [];
    const cap = capture();

    await runEndpoint(
      "kie",
      ["api.v1.jobs.recordInfo", "--help", "--json"],
      cap.writer,
      options(fakeKie(calls), { HOME })
    );

    expect(calls).toEqual([]);
    const description = envelopeOf(cap).data as Record<string, unknown>;
    expect(description.method).toBe("GET");
    expect(description.paid).toBe(false);
  });
});

describe("the provider form without a dotPath", () => {
  it("lists that provider's commands", async () => {
    const cap = capture();

    const exit = await runEndpoint("openligadb", ["--json"], cap.writer, {
      env: { HOME },
      stdoutIsTTY: false,
    });

    expect(exit).toBe(0);
    const entries = envelopeOf(cap).data as unknown[];
    expect(entries.length).toBeGreaterThan(0);
  });

  it("reports a flag with no endpoint as usage", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "openligadb",
      ["--taskId", "x"],
      cap.writer,
      {
        env: { HOME },
        stdoutIsTTY: false,
      }
    );

    expect(exit).toBe(1);
    expect(String(errorOf(cap).error)).toContain("--taskId");
  });
});

describe("the success envelope of a call", () => {
  it("wraps the provider's answer once", async () => {
    const cap = capture();

    await runEndpoint(
      "kie",
      ["api.v1.jobs.recordInfo", "--taskId", "abc"],
      cap.writer,
      options(fakeKie([]), KIE_ENV)
    );

    expect(cap.out).toHaveLength(1);
    expect(envelopeOf(cap)).toEqual({ ok: true, data: { ok: "GET" } });
  });
});
