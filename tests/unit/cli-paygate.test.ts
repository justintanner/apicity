import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalHash, mintOtp, withPaidGate } from "@apicity/cost";

import {
  loadCatalog,
  findEntries,
  selectEntry,
} from "../../packages/cli/src/catalog";
import { CALL_SHAPES, callShapeKey } from "../../packages/cli/src/call-shapes";
import { providerEnvVars } from "../../packages/cli/src/credentials";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { bindArguments } from "../../packages/cli/src/invoke";
import {
  runEndpoint,
  type EndpointOptions,
  type ProviderInstantiator,
} from "../../packages/cli/src/main";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";

// AC-06 / EX-04: the pay gate, end to end, with the real `withPaidGate` and a
// real `mintOtp`. The CLI is the code client — it holds the shared secret only
// to hand to the factory and verify with, and it never mints. The last test
// here is that second half: no minting path exists in the CLI's source at all.

const DOT_PATH = "api.v1.jobs.createTask";
const SECRET = "shared-paygate-secret";
const REQUEST = { model: "veo3", prompt: "a cat", aspectRatio: "16:9" };

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

function sandbox(): string {
  return mkdtempSync(join(tmpdir(), "apicity-cli-paygate-"));
}

function requestFile(): string {
  const file = join(sandbox(), "req.json");
  writeFileSync(file, JSON.stringify(REQUEST));
  return file;
}

function secretFile(): string {
  const file = join(sandbox(), "paygate.secret");
  writeFileSync(file, `${SECRET}\n`);
  return file;
}

/**
 * A kie factory shaped like the real one: it applies `withPaidGate` to its
 * tree, configured only when the code client handed it a secret.
 */
function fakeKieFactory(calls: unknown[][]): ProviderInstantiator {
  return (_name, _spec, paygateSecret) => {
    const tree = {
      post: {
        api: {
          v1: {
            jobs: {
              createTask: (...args: unknown[]): Promise<unknown> => {
                calls.push(args);
                return Promise.resolve({ taskId: "task_1" });
              },
            },
          },
        },
      },
    };
    return Promise.resolve(
      withPaidGate("kie", tree, {
        config: paygateSecret ? { secret: paygateSecret } : undefined,
      }) as InstantiatedProvider
    );
  };
}

function options(
  calls: unknown[][],
  extra: EndpointOptions = {}
): EndpointOptions {
  return {
    env: { HOME: sandbox(), KIE_API_KEY: "kie-test" },
    stdoutIsTTY: false,
    instantiate: fakeKieFactory(calls),
    ...extra,
  };
}

function errorOf(cap: Capture): Record<string, unknown> {
  return JSON.parse(cap.err.join("\n")) as Record<string, unknown>;
}

describe("a paid endpoint with no pay gate configured", () => {
  it("reaches the leaf without --otp and answers the success envelope", async () => {
    const calls: unknown[][] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      [DOT_PATH, "--data-file", requestFile()],
      cap.writer,
      options(calls)
    );

    expect(exit).toBe(0);
    // The gate dispatches the request alone, armed or not: the approval slot
    // `bindArguments` appends stops at the gate.
    expect(calls).toEqual([[REQUEST]]);
    expect(JSON.parse(cap.out[0])).toEqual({
      ok: true,
      data: { taskId: "task_1" },
    });
  });

  it("refuses an --otp with exit 4 and a hint that names the secret file", async () => {
    const calls: unknown[][] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      [DOT_PATH, "--data-file", requestFile(), "--otp", "not-a-token"],
      cap.writer,
      options(calls)
    );

    expect(exit).toBe(4);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("paygate");
    const hint = String(envelope.hint);
    expect(hint).toContain("paygate-not-configured");
    expect(hint).toContain("--paygate-secret-file");
    expect(hint).toContain("APICITY_PAYGATE_SECRET_FILE");
    expect(hint).not.toContain("otp mint");
    expect(hint).not.toContain("without --otp");
  });

  it("refuses an empty secret file as usage, before any provider exists", async () => {
    const empty = join(sandbox(), "empty.secret");
    writeFileSync(empty, "\n");
    let instantiated = 0;
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      [DOT_PATH, "--data-file", requestFile(), "--paygate-secret-file", empty],
      cap.writer,
      options([], {
        instantiate: () => {
          instantiated++;
          return Promise.resolve(null);
        },
      })
    );

    expect(exit).toBe(1);
    expect(instantiated).toBe(0);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("usage");
    expect(String(envelope.error)).toContain(`${empty} is empty`);
  });
});

describe("a paid endpoint with a secret but no approval", () => {
  it("exits 4 with otp-missing and the minting command", async () => {
    const calls: unknown[][] = [];
    const cap = capture();
    const secret = secretFile();
    const request = requestFile();

    const exit = await runEndpoint(
      "kie",
      [DOT_PATH, "--data-file", request, "--paygate-secret-file", secret],
      cap.writer,
      options(calls)
    );

    expect(exit).toBe(4);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    const requestHash = canonicalHash(REQUEST);
    expect(envelope.code).toBe("paygate");
    expect(envelope.meta).toEqual({ requestHash });
    expect(envelope.hint).toBe(
      `otp-missing; mint with: apicity-paygate otp mint ` +
        `--secret-file ${secret} --provider kie --method POST ` +
        `--dot-path ${DOT_PATH} --request-hash ${requestHash}`
    );
    // The shared secret is read only to hand to the factory.
    expect([...cap.out, ...cap.err].join("\n")).not.toContain(SECRET);
  });

  it("reads the secret file named by APICITY_PAYGATE_SECRET_FILE too", async () => {
    const calls: unknown[][] = [];
    const cap = capture();
    const secret = secretFile();

    const exit = await runEndpoint(
      "kie",
      [DOT_PATH, "--data-file", requestFile()],
      cap.writer,
      options(calls, {
        env: {
          HOME: sandbox(),
          KIE_API_KEY: "kie-test",
          APICITY_PAYGATE_SECRET_FILE: secret,
        },
      })
    );

    expect(exit).toBe(4);
    expect(String(errorOf(cap).hint)).toContain("otp-missing");
  });

  it("reports a secret file that cannot be read", async () => {
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      [
        DOT_PATH,
        "--data-file",
        requestFile(),
        "--paygate-secret-file",
        "/nope/missing.secret",
      ],
      cap.writer,
      options([])
    );

    expect(exit).toBe(1);
    expect(String(errorOf(cap).error)).toContain("/nope/missing.secret");
  });
});

describe("a paid endpoint with a valid approval", () => {
  it("passes the gate and reaches the leaf", async () => {
    const calls: unknown[][] = [];
    const cap = capture();
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: DOT_PATH,
      request: REQUEST,
    });

    const exit = await runEndpoint(
      "kie",
      [
        DOT_PATH,
        "--data-file",
        requestFile(),
        "--paygate-secret-file",
        secretFile(),
        "--otp",
        otp,
      ],
      cap.writer,
      options(calls)
    );

    expect(exit).toBe(0);
    // The gate verifies the approval and dispatches the request alone.
    expect(calls).toEqual([[REQUEST]]);
    expect(JSON.parse(cap.out[0])).toEqual({
      ok: true,
      data: { taskId: "task_1" },
    });
  });

  it("refuses an OTP minted for a different request", async () => {
    const calls: unknown[][] = [];
    const cap = capture();
    const otp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: DOT_PATH,
      request: { ...REQUEST, prompt: "a different cat" },
    });

    const exit = await runEndpoint(
      "kie",
      [
        DOT_PATH,
        "--data-file",
        requestFile(),
        "--paygate-secret-file",
        secretFile(),
        "--otp",
        otp,
      ],
      cap.writer,
      options(calls)
    );

    expect(exit).toBe(4);
    expect(calls).toEqual([]);
    expect(String(errorOf(cap).hint)).toContain("otp-mismatched-request");
  });

  it("binds a paid call as (body, { otp })", async () => {
    const catalog = await loadCatalog({ env: {} });
    const entry = selectEntry(findEntries(catalog, "kie", DOT_PATH));

    expect(entry.paid).toBe(true);
    expect(
      bindArguments({
        entry,
        shape: CALL_SHAPES[callShapeKey("kie", entry.method, DOT_PATH)],
        positional: {},
        body: REQUEST,
        otp: "otp-value",
      })
    ).toEqual([REQUEST, { otp: "otp-value" }]);
  });

  it("still sends the approval slot when --otp is absent, so the gate answers", async () => {
    const catalog = await loadCatalog({ env: {} });
    const entry = selectEntry(findEntries(catalog, "kie", DOT_PATH));

    expect(bindArguments({ entry, positional: {}, body: REQUEST })).toEqual([
      REQUEST,
      undefined,
    ]);
  });
});

describe("a billed endpoint outside the pay-gate registry", () => {
  const EMBEDDINGS = "v1.embeddings";
  const BODY = { model: "text-embedding-3-small", input: "hello" };

  /** A provider whose leaf takes `(body, signal?)`, like every ungated one. */
  function fakeOpenAi(calls: unknown[][]): ProviderInstantiator {
    return () =>
      Promise.resolve({
        post: {
          v1: {
            embeddings: (...args: unknown[]): Promise<unknown> => {
              calls.push(args);
              return Promise.resolve({ data: [] });
            },
          },
        },
      } as InstantiatedProvider);
  }

  function bodyFile(): string {
    const file = join(sandbox(), "req.json");
    writeFileSync(file, JSON.stringify(BODY));
    return file;
  }

  function openAiOptions(calls: unknown[][]): EndpointOptions {
    return {
      env: { HOME: sandbox(), OPENAI_API_KEY: "openai-test" },
      stdoutIsTTY: false,
      instantiate: fakeOpenAi(calls),
    };
  }

  function fakeEnv(provider: string): NodeJS.ProcessEnv {
    return {
      HOME: sandbox(),
      ...Object.fromEntries(providerEnvVars(provider).map((k) => [k, "test"])),
    };
  }

  function fakeProvider(
    calls: unknown[][],
    pathParts: string[]
  ): ProviderInstantiator {
    return () => {
      const leaf = (...args: unknown[]): Promise<unknown> => {
        calls.push(args);
        return Promise.resolve({ ok: true });
      };
      let node: unknown = leaf;
      for (let i = pathParts.length - 1; i >= 0; i--) {
        node = { [pathParts[i]!]: node };
      }
      return Promise.resolve(node as InstantiatedProvider);
    };
  }

  it("is paid, gated, and marked cli-gated in the catalog", async () => {
    const catalog = await loadCatalog({ env: {} });
    const entry = selectEntry(findEntries(catalog, "openai", EMBEDDINGS));

    expect(entry).toMatchObject({
      paid: true,
      gated: true,
      gate: "cli",
      billing: "metered",
    });
  });

  it("binds the body alone, so the signal slot stays empty", async () => {
    const catalog = await loadCatalog({ env: {} });
    const entry = selectEntry(findEntries(catalog, "openai", EMBEDDINGS));

    expect(bindArguments({ entry, positional: {}, body: BODY })).toEqual([
      BODY,
    ]);
    expect(
      bindArguments({ entry, positional: {}, body: BODY, otp: "otp-value" })
    ).toEqual([BODY]);
  });

  it("binds the metered Nunchux submit the same way", async () => {
    const catalog = await loadCatalog({ env: {} });
    const entry = selectEntry(
      findEntries(catalog, "nunchux", "v1.google.v1beta.interactions")
    );
    const body = { model: "gemini-nano-banana-2.1", input: "A red boat" };

    expect(entry).toMatchObject({
      paid: true,
      gated: true,
      gate: "cli",
      billing: "metered",
    });
    expect(bindArguments({ entry, positional: {}, body })).toEqual([body]);
    expect(
      bindArguments({ entry, positional: {}, body, otp: "otp-value" })
    ).toEqual([body]);
  });

  it("calls upstream with the body alone when no gate is configured", async () => {
    const calls: unknown[][] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", bodyFile()],
      cap.writer,
      openAiOptions(calls)
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([[BODY]]);
  });

  it("refuses without an OTP when the gate is armed, with hint and meta.requestHash", async () => {
    const calls: unknown[][] = [];
    const cap = capture();
    const secret = secretFile();

    const exit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", bodyFile(), "--paygate-secret-file", secret],
      cap.writer,
      openAiOptions(calls)
    );

    expect(exit).toBe(4);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    const expectedHash = canonicalHash(BODY);
    expect(envelope.code).toBe("paygate");
    expect(envelope.meta).toEqual({ requestHash: expectedHash });
    expect(envelope.hint).toBe(
      `otp-missing; mint with: apicity-paygate otp mint ` +
        `--secret-file ${secret} --provider openai --method POST ` +
        `--dot-path ${EMBEDDINGS} --request-hash ${expectedHash}`
    );
  });

  it("passes with a token minted from meta.requestHash and keeps unchanged arguments", async () => {
    const calls: unknown[][] = [];
    const cap = capture();
    const secret = secretFile();
    const refusalCap = capture();

    await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", bodyFile(), "--paygate-secret-file", secret],
      refusalCap.writer,
      openAiOptions([])
    );
    const { requestHash } = errorOf(refusalCap).meta as {
      requestHash: `sha256:${string}`;
    };
    const otp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: EMBEDDINGS,
      requestHash,
    });

    const exit = await runEndpoint(
      "openai",
      [
        EMBEDDINGS,
        "--data-file",
        bodyFile(),
        "--paygate-secret-file",
        secret,
        "--otp",
        otp,
      ],
      cap.writer,
      openAiOptions(calls)
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([[BODY]]);
  });

  it("refuses an OTP for a different request or endpoint", async () => {
    const calls: unknown[][] = [];
    const secret = secretFile();

    const wrongBodyOtp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: EMBEDDINGS,
      request: { ...BODY, input: "other" },
    });
    const cap1 = capture();
    const exit1 = await runEndpoint(
      "openai",
      [
        EMBEDDINGS,
        "--data-file",
        bodyFile(),
        "--paygate-secret-file",
        secret,
        "--otp",
        wrongBodyOtp,
      ],
      cap1.writer,
      openAiOptions(calls)
    );
    expect(exit1).toBe(4);
    expect(calls).toEqual([]);
    expect(String(errorOf(cap1).hint)).toContain("otp-mismatched-request");

    const wrongEndpointOtp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: "v1.chat.completions",
      request: BODY,
    });
    const cap2 = capture();
    const exit2 = await runEndpoint(
      "openai",
      [
        EMBEDDINGS,
        "--data-file",
        bodyFile(),
        "--paygate-secret-file",
        secret,
        "--otp",
        wrongEndpointOtp,
      ],
      cap2.writer,
      openAiOptions(calls)
    );
    expect(exit2).toBe(4);
    expect(calls).toEqual([]);
    expect(String(errorOf(cap2).hint)).toContain("otp-mismatched-request");
  });

  it("binds path parameters into the CLI request hash", async () => {
    const calls: unknown[][] = [];
    const secret = secretFile();
    const ttsBody = { text: "hello" };
    const ttsFile = join(sandbox(), "tts.json");
    writeFileSync(ttsFile, JSON.stringify(ttsBody));
    const opts: EndpointOptions = {
      env: fakeEnv("elevenlabs"),
      stdoutIsTTY: false,
      instantiate: fakeProvider(calls, ["post", "v1", "textToSpeech"]),
    };

    const refusalCap = capture();
    const refusedExit = await runEndpoint(
      "elevenlabs",
      [
        "v1.textToSpeech",
        "--voiceId",
        "voice-a",
        "--data-file",
        ttsFile,
        "--paygate-secret-file",
        secret,
      ],
      refusalCap.writer,
      opts
    );
    expect(refusedExit).toBe(4);
    expect(calls).toEqual([]);
    const refusedMeta = errorOf(refusalCap).meta as {
      requestHash: `sha256:${string}`;
    };
    expect(refusedMeta.requestHash).toBe(
      canonicalHash({ path: { voiceId: "voice-a" }, body: ttsBody })
    );

    const otp = mintOtp(SECRET, {
      provider: "elevenlabs",
      method: "POST",
      dotPath: "v1.textToSpeech",
      requestHash: refusedMeta.requestHash,
    });

    // Different path parameter is refused even with identical body.
    const mismatchCap = capture();
    const mismatchExit = await runEndpoint(
      "elevenlabs",
      [
        "v1.textToSpeech",
        "--voiceId",
        "voice-b",
        "--data-file",
        ttsFile,
        "--paygate-secret-file",
        secret,
        "--otp",
        otp,
      ],
      mismatchCap.writer,
      opts
    );
    expect(mismatchExit).toBe(4);
    expect(calls).toEqual([]);
    expect(String(errorOf(mismatchCap).hint)).toContain(
      "otp-mismatched-request"
    );

    // Matching voiceId passes and keeps positional + body arguments unchanged.
    const okCap = capture();
    const okExit = await runEndpoint(
      "elevenlabs",
      [
        "v1.textToSpeech",
        "--voiceId",
        "voice-a",
        "--data-file",
        ttsFile,
        "--paygate-secret-file",
        secret,
        "--otp",
        otp,
      ],
      okCap.writer,
      opts
    );
    expect(okExit).toBe(0);
    expect(calls).toEqual([["voice-a", ttsBody]]);
  });

  it("folds request-field flags into the hashed request", async () => {
    const calls: unknown[][] = [];
    const secret = secretFile();
    const opts: EndpointOptions = {
      env: fakeEnv("s3"),
      stdoutIsTTY: false,
      instantiate: fakeProvider(calls, ["get", "objects", "get"]),
    };
    const otp = mintOtp(SECRET, {
      provider: "s3",
      method: "GET",
      dotPath: "objects.get",
      request: { bucket: "b", key: "k" },
    });

    const okCap = capture();
    const okExit = await runEndpoint(
      "s3",
      [
        "objects.get",
        "--method",
        "GET",
        "--bucket",
        "b",
        "--key",
        "k",
        "--paygate-secret-file",
        secret,
        "--otp",
        otp,
      ],
      okCap.writer,
      opts
    );
    expect(okExit).toBe(0);
    expect(calls).toEqual([[{ bucket: "b", key: "k" }]]);

    const badCap = capture();
    const badExit = await runEndpoint(
      "s3",
      [
        "objects.get",
        "--method",
        "GET",
        "--bucket",
        "other",
        "--key",
        "k",
        "--paygate-secret-file",
        secret,
        "--otp",
        otp,
      ],
      badCap.writer,
      opts
    );
    expect(badExit).toBe(4);
    expect(calls).toHaveLength(1);
    expect(String(errorOf(badCap).hint)).toContain("otp-mismatched-request");
  });

  it("refuses --otp on a CLI-gated row when no secret is configured", async () => {
    const calls: unknown[][] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", bodyFile(), "--otp", "not-a-token"],
      cap.writer,
      openAiOptions(calls)
    );

    expect(exit).toBe(4);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("paygate");
    expect(String(envelope.hint)).toContain("paygate-not-configured");
    expect(String(envelope.hint)).not.toContain("otp mint");
  });

  it("allows a free row without --otp even when the gate is armed", async () => {
    const calls: unknown[][] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "nunchux",
      ["v1.credits", "--paygate-secret-file", secretFile()],
      cap.writer,
      {
        env: fakeEnv("nunchux"),
        stdoutIsTTY: false,
        instantiate: fakeProvider(calls, ["get", "v1", "credits"]),
      }
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([[]]);
    expect(JSON.parse(cap.out[0])).toEqual({ ok: true, data: { ok: true } });
  });
});

describe("the CLI is the code client, never the minter", () => {
  it("has no minting path anywhere under packages/cli/src", async () => {
    const found = await new Promise<string>((resolve) => {
      execFile(
        "grep",
        ["-rn", "mintOtp", "packages/cli/src"],
        (_error, stdout) => resolve(stdout)
      );
    });

    expect(found.trim()).toBe("");
  });

  it("has a single callEndpoint( call site, inside dispatchThroughGate", async () => {
    const found = await new Promise<string>((resolve) => {
      execFile(
        "grep",
        ["-rn", "callEndpoint(", "packages/cli/src"],
        (_error, stdout) => resolve(stdout)
      );
    });
    const callSites = found
      .trim()
      .split("\n")
      .filter(
        (line) => line && !line.includes("export async function callEndpoint(")
      );

    expect(callSites).toHaveLength(1);
    expect(callSites[0]).toMatch(/^packages\/cli\/src\/main\.ts:/);

    const mainSource = readFileSync("packages/cli/src/main.ts", "utf8");
    const gateCall = /dispatchThroughGate\(\{[\s\S]*?\}\);/.exec(
      mainSource
    )?.[0];
    expect(gateCall).toContain("callEndpoint(");
  });
});
