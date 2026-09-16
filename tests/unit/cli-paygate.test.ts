import { execFile } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { mintOtp, withPaidGate } from "@apicity/cost";

import {
  loadCatalog,
  findEntries,
  selectEntry,
} from "../../packages/cli/src/catalog";
import { CALL_SHAPES, callShapeKey } from "../../packages/cli/src/call-shapes";
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
  it("exits 4 with paygate-not-configured in the hint", async () => {
    const calls: unknown[][] = [];
    const cap = capture();

    const exit = await runEndpoint(
      "kie",
      [DOT_PATH, "--data-file", requestFile()],
      cap.writer,
      options(calls)
    );

    expect(exit).toBe(4);
    expect(calls).toEqual([]);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("paygate");
    expect(String(envelope.hint)).toContain("paygate-not-configured");
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
    expect(envelope.code).toBe("paygate");
    expect(envelope.hint).toBe(
      `otp-missing; mint with: apicity-paygate otp mint ` +
        `--secret-file ${secret} --dot-path ${DOT_PATH} ` +
        `--payload-file ${request}`
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
});
