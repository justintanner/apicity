import { execFile } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  canonicalHash,
  grantFileName,
  mintGrant,
  mintOtp,
  withPaidGate,
} from "@apicity/cost";

import { loadCatalog, type CatalogEntry } from "../../packages/cli/src/catalog";
import { providerEnvVars } from "../../packages/cli/src/credentials";
import { runDescribe } from "../../packages/cli/src/discovery";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { runEndpoint, type EndpointOptions } from "../../packages/cli/src/main";
import {
  GRANT_USES_FILE,
  GrantRefusal,
  dispatchThroughGate,
  gateRequest,
} from "../../packages/cli/src/paygate";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";

const SECRET = "grant-integration-test-secret";
const CLI_PAYGATE_DIST = "packages/provider/cost/dist/src/paygate-cli.js";

const tempDirs: string[] = [];

function sandbox(): string {
  const dir = mkdtempSync(join(tmpdir(), "apicity-cli-grant-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

function capture(): { writer: CliWriter; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

function errorOf(cap: { err: string[] }): Record<string, unknown> {
  return JSON.parse(cap.err.join("\n")) as Record<string, unknown>;
}

function samplePositional(entry: CatalogEntry): Record<string, string> {
  return Object.fromEntries(entry.pathParams.map((p) => [p, `id-${p}`]));
}

function runPaygateCli(
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [CLI_PAYGATE_DIST, ...args],
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`paygate-cli failed: ${stderr || err.message}`));
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

describe("catalog-wide provider grant scope", () => {
  it("opens every gate: cli row with its provider grant and records each call", async () => {
    const catalog = await loadCatalog({ env: {} });
    const grantDir = sandbox();
    const cliRows = catalog.filter((entry) => entry.gate === "cli");
    const cliProviders = new Set(cliRows.map((entry) => entry.provider));

    const grants = new Map<string, string>();
    for (const provider of cliProviders) {
      const token = mintGrant(SECRET, { provider });
      grants.set(provider, token);
      writeFileSync(join(grantDir, grantFileName(provider)), `${token}\n`);
    }

    for (const entry of cliRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      const result = await dispatchThroughGate({
        entry,
        request,
        secret: SECRET,
        grantDir,
        cwd: "/tmp/lane-a",
        dispatch: () => {
          dispatched++;
          return Promise.resolve("ok");
        },
      });
      expect(result).toBe("ok");
      expect(
        dispatched,
        `${entry.provider} ${entry.method} ${entry.dotPath}`
      ).toBe(1);
    }

    const lines = readFileSync(join(grantDir, GRANT_USES_FILE), "utf8")
      .trim()
      .split("\n");
    expect(lines).toHaveLength(cliRows.length);
    const first = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(Object.keys(first).sort()).toEqual([
      "cwd",
      "dotPath",
      "expires",
      "grant",
      "method",
      "provider",
      "requestHash",
      "ts",
    ]);
    for (const line of lines) {
      for (const token of grants.values()) {
        expect(line).not.toContain(token);
      }
    }
  });

  it("refuses with otp-missing when only other providers hold grants, and GrantRefusal on mismatched file contents", async () => {
    const catalog = await loadCatalog({ env: {} });
    const cliRows = catalog.filter((entry) => entry.gate === "cli");
    const wrongGrantDir = sandbox();

    // Only mint an unrelated synthetic provider grant in wrongGrantDir.
    const wrongToken = mintGrant(SECRET, { provider: "other-provider" });
    writeFileSync(
      join(wrongGrantDir, grantFileName("other-provider")),
      `${wrongToken}\n`
    );

    for (const entry of cliRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      await expect(
        dispatchThroughGate({
          entry,
          request,
          secret: SECRET,
          grantDir: wrongGrantDir,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("ok");
          },
        })
      ).rejects.toMatchObject({ name: "PayGateError", code: "otp-missing" });
      expect(dispatched).toBe(0);
    }
    expect(existsSync(join(wrongGrantDir, GRANT_USES_FILE))).toBe(false);

    // Putting another provider's signed grant under the target provider's filename
    // raises GrantRefusal(grant-mismatched-provider) on every CLI-gated row.
    const mismatchedDir = sandbox();
    for (const provider of new Set(cliRows.map((entry) => entry.provider))) {
      writeFileSync(
        join(mismatchedDir, grantFileName(provider)),
        `${wrongToken}\n`
      );
    }
    for (const entry of cliRows) {
      let dispatched = 0;
      const request = gateRequest(entry, samplePositional(entry), {});
      await expect(
        dispatchThroughGate({
          entry,
          request,
          secret: SECRET,
          grantDir: mismatchedDir,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("ok");
          },
        })
      ).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof GrantRefusal &&
          err.code === "grant-mismatched-provider"
      );
      expect(dispatched).toBe(0);
    }
    expect(existsSync(join(mismatchedDir, GRANT_USES_FILE))).toBe(false);
  });

  it("leaves gate: sdk, gate: none, and unarmed hosts untouched by grants", async () => {
    const catalog = await loadCatalog({ env: {} });
    const grantDir = sandbox();
    for (const provider of new Set(catalog.map((e) => e.provider))) {
      writeFileSync(
        join(grantDir, grantFileName(provider)),
        `${mintGrant(SECRET, { provider })}\n`
      );
    }

    // gate: "none" runs armed without touching grantDir.
    for (const entry of catalog.filter((e) => e.gate === "none")) {
      let dispatched = 0;
      await expect(
        dispatchThroughGate({
          entry,
          request: {},
          secret: SECRET,
          grantDir,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("free-ok");
          },
        })
      ).resolves.toBe("free-ok");
      expect(dispatched).toBe(1);
    }
    expect(existsSync(join(grantDir, GRANT_USES_FILE))).toBe(false);

    // Unarmed host runs every row without reading grantDir (put invalid content to prove).
    const poisonGrantDir = sandbox();
    for (const provider of new Set(catalog.map((e) => e.provider))) {
      writeFileSync(join(poisonGrantDir, grantFileName(provider)), "garbage");
    }
    for (const entry of catalog) {
      let dispatched = 0;
      await expect(
        dispatchThroughGate({
          entry,
          request: {},
          grantDir: poisonGrantDir,
          dispatch: () => {
            dispatched++;
            return Promise.resolve("unarmed-ok");
          },
        })
      ).resolves.toBe("unarmed-ok");
      expect(dispatched).toBe(1);
    }
    expect(existsSync(join(poisonGrantDir, GRANT_USES_FILE))).toBe(false);
  });
});

describe("end-to-end provider grants via runEndpoint", () => {
  const EMBEDDINGS = "v1.embeddings";
  const BODY = { model: "text-embedding-3-small", input: "hello" };

  function makeEnv(
    provider: string,
    home: string,
    extra: NodeJS.ProcessEnv = {}
  ): NodeJS.ProcessEnv {
    return {
      HOME: home,
      ...Object.fromEntries(providerEnvVars(provider).map((k) => [k, "test"])),
      ...extra,
    };
  }

  function makeFiles(home: string): { secret: string; body: string } {
    const secret = join(home, "paygate.secret");
    writeFileSync(secret, `${SECRET}\n`);
    const body = join(home, "req.json");
    writeFileSync(body, JSON.stringify(BODY));
    return { secret, body };
  }

  function fakeOpenAi(calls: unknown[][]): EndpointOptions["instantiate"] {
    return () =>
      Promise.resolve({
        post: {
          v1: {
            embeddings: (...args: unknown[]): Promise<unknown> => {
              calls.push(args);
              return Promise.resolve({ data: ["ok"] });
            },
          },
        },
      } as InstantiatedProvider);
  }

  it("prints the grant mint command and allows repeated calls after running it verbatim", async () => {
    const home = sandbox();
    const { secret, body } = makeFiles(home);
    const grantDir = join(home, "custom-grants");
    const calls: unknown[][] = [];
    const env = makeEnv("openai", home, {
      APICITY_PAYGATE_GRANT_DIR: grantDir,
    });
    const opts: EndpointOptions = {
      env,
      stdoutIsTTY: false,
      cwd: "/tmp/work-lane",
      instantiate: fakeOpenAi(calls),
    };

    const refusalCap = capture();
    const refusedExit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", body, "--paygate-secret-file", secret],
      refusalCap.writer,
      opts
    );
    expect(refusedExit).toBe(4);
    expect(calls).toEqual([]);
    const refusal = errorOf(refusalCap);
    const hint = String(refusal.hint);
    expect(hint).toBe(
      `otp-missing; mint with: apicity-paygate otp mint ` +
        `--secret-file ${secret} --provider openai --method POST ` +
        `--dot-path ${EMBEDDINGS} --request-hash ${canonicalHash(BODY)}; ` +
        `or grant openai for a time window with: apicity-paygate grant mint ` +
        `--secret-file ${secret} --provider openai --grant-dir ${grantDir}`
    );

    // Run the exact printed grant mint command via apicity-paygate CLI.
    const grantCommand = hint.split(
      "or grant openai for a time window with: "
    )[1]!;
    const cliArgs = grantCommand
      .replace(/^apicity-paygate\s+/, "")
      .split(/\s+/);
    const mintResult = await runPaygateCli(cliArgs);
    const grantToken = readFileSync(
      join(grantDir, grantFileName("openai")),
      "utf8"
    ).trim();
    expect(mintResult.stdout).not.toContain(grantToken);
    expect(mintResult.stderr).not.toContain(grantToken);

    // Run 3 consecutive calls under that single grant.
    for (let i = 0; i < 3; i++) {
      const okCap = capture();
      const okExit = await runEndpoint(
        "openai",
        [EMBEDDINGS, "--data-file", body, "--paygate-secret-file", secret],
        okCap.writer,
        opts
      );
      expect(okExit).toBe(0);
      const output = [...okCap.out, ...okCap.err].join("\n");
      expect(output).not.toContain(grantToken);
      expect(output).not.toContain(SECRET);
    }
    expect(calls).toEqual([[BODY], [BODY], [BODY]]);

    const lines = readFileSync(join(grantDir, GRANT_USES_FILE), "utf8")
      .trim()
      .split("\n");
    expect(lines).toHaveLength(3);
    const record = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(Object.keys(record).sort()).toEqual([
      "cwd",
      "dotPath",
      "expires",
      "grant",
      "method",
      "provider",
      "requestHash",
      "ts",
    ]);
    expect(record).toMatchObject({
      provider: "openai",
      method: "POST",
      dotPath: EMBEDDINGS,
      requestHash: canonicalHash(BODY),
      cwd: "/tmp/work-lane",
    });
    expect(lines.join("\n")).not.toContain(grantToken);
  });

  it("reads APICITY_PAYGATE_GRANT_DIR from the CLI env file", async () => {
    const home = sandbox();
    const { secret, body } = makeFiles(home);
    const customDir = join(home, "from-env-file");
    mkdirSync(join(home, ".config", "apicity"), { recursive: true });
    writeFileSync(
      join(home, ".config", "apicity", ".env"),
      `APICITY_PAYGATE_GRANT_DIR=${customDir}\n`
    );
    mkdirSync(customDir, { recursive: true, mode: 0o700 });
    writeFileSync(
      join(customDir, grantFileName("openai")),
      `${mintGrant(SECRET, { provider: "openai" })}\n`
    );

    const calls: unknown[][] = [];
    const cap = capture();
    const exit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", body, "--paygate-secret-file", secret],
      cap.writer,
      {
        env: makeEnv("openai", home),
        stdoutIsTTY: false,
        instantiate: fakeOpenAi(calls),
      }
    );

    expect(exit).toBe(0);
    expect(calls).toEqual([[BODY]]);
    expect(existsSync(join(customDir, GRANT_USES_FILE))).toBe(true);
  });

  it("refuses bad grants with their own code and never dispatches", async () => {
    const home = sandbox();
    const { secret, body } = makeFiles(home);
    const grantDir = join(home, "grants");
    mkdirSync(grantDir, { recursive: true, mode: 0o700 });
    const grantPath = join(grantDir, grantFileName("openai"));

    const nowSec = Math.floor(Date.now() / 1000);
    const expiredGrant = mintGrant(SECRET, {
      provider: "openai",
      ttl: 10,
      now: () => (nowSec - 100) * 1000,
    });
    const futureGrant = mintGrant(SECRET, {
      provider: "openai",
      now: () => (nowSec + 600) * 1000,
    });

    const cases: Array<[string, string]> = [
      ["grant-malformed", "not-a-grant-token"],
      [
        "grant-invalid-signature",
        mintGrant("wrong-secret", { provider: "openai" }),
      ],
      ["grant-not-yet-valid", futureGrant],
      ["grant-expired", expiredGrant],
      ["grant-mismatched-provider", mintGrant(SECRET, { provider: "fal" })],
    ];

    for (const [expectedCode, tokenValue] of cases) {
      writeFileSync(grantPath, `${tokenValue}\n`);
      const calls: unknown[][] = [];
      const cap = capture();
      const exit = await runEndpoint(
        "openai",
        [EMBEDDINGS, "--data-file", body, "--paygate-secret-file", secret],
        cap.writer,
        {
          env: makeEnv("openai", home, { APICITY_PAYGATE_GRANT_DIR: grantDir }),
          stdoutIsTTY: false,
          instantiate: fakeOpenAi(calls),
        }
      );
      expect(exit, expectedCode).toBe(4);
      expect(calls).toEqual([]);
      const envelope = errorOf(cap);
      expect(envelope.code).toBe("paygate");
      expect(String(envelope.error)).toContain(grantPath);
      expect(String(envelope.error)).not.toContain(tokenValue);
      expect(String(envelope.hint)).toContain(`${expectedCode}; mint with:`);
      expect(String(envelope.hint)).toContain("apicity-paygate grant mint");
    }

    // grant-unreadable: point grant path to a directory or chmod 000.
    writeFileSync(grantPath, `${mintGrant(SECRET, { provider: "openai" })}\n`, {
      mode: 0o000,
    });
    chmodSync(grantPath, 0o000);
    const unreadableCap = capture();
    const unreadableExit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", body, "--paygate-secret-file", secret],
      unreadableCap.writer,
      {
        env: makeEnv("openai", home, { APICITY_PAYGATE_GRANT_DIR: grantDir }),
        stdoutIsTTY: false,
        instantiate: fakeOpenAi([]),
      }
    );
    chmodSync(grantPath, 0o600);
    // Note: if running as non-root, chmod 000 triggers grant-unreadable.
    if (process.getuid?.() !== 0) {
      expect(unreadableExit).toBe(4);
      expect(String(errorOf(unreadableCap).hint)).toContain("grant-unreadable");
    }

    // grant-unrecorded: read-only uses.jsonl stops the call before dispatch.
    writeFileSync(grantPath, `${mintGrant(SECRET, { provider: "openai" })}\n`);
    const usesPath = join(grantDir, GRANT_USES_FILE);
    writeFileSync(usesPath, "", { mode: 0o444 });
    chmodSync(usesPath, 0o444);
    const unrecordedCalls: unknown[][] = [];
    const unrecordedCap = capture();
    const unrecordedExit = await runEndpoint(
      "openai",
      [EMBEDDINGS, "--data-file", body, "--paygate-secret-file", secret],
      unrecordedCap.writer,
      {
        env: makeEnv("openai", home, { APICITY_PAYGATE_GRANT_DIR: grantDir }),
        stdoutIsTTY: false,
        instantiate: fakeOpenAi(unrecordedCalls),
      }
    );
    chmodSync(usesPath, 0o600);
    if (process.getuid?.() !== 0) {
      expect(unrecordedExit).toBe(4);
      expect(unrecordedCalls).toEqual([]);
      expect(String(errorOf(unrecordedCap).hint)).toContain("grant-unrecorded");
    }
  });

  it("lets an explicit --otp win (or fail) over a present valid grant", async () => {
    const home = sandbox();
    const { secret, body } = makeFiles(home);
    const grantDir = join(home, "grants");
    mkdirSync(grantDir, { recursive: true, mode: 0o700 });
    writeFileSync(
      join(grantDir, grantFileName("openai")),
      `${mintGrant(SECRET, { provider: "openai" })}\n`
    );

    const calls: unknown[][] = [];
    const env = makeEnv("openai", home, {
      APICITY_PAYGATE_GRANT_DIR: grantDir,
    });
    const opts: EndpointOptions = {
      env,
      stdoutIsTTY: false,
      instantiate: fakeOpenAi(calls),
    };

    const goodOtp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: EMBEDDINGS,
      request: BODY,
    });
    const okCap = capture();
    const okExit = await runEndpoint(
      "openai",
      [
        EMBEDDINGS,
        "--data-file",
        body,
        "--paygate-secret-file",
        secret,
        "--otp",
        goodOtp,
      ],
      okCap.writer,
      opts
    );
    expect(okExit).toBe(0);
    expect(calls).toEqual([[BODY]]);
    expect(existsSync(join(grantDir, GRANT_USES_FILE))).toBe(false);

    // Bad OTP is NOT rescued by the valid grant.
    const wrongBodyOtp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: EMBEDDINGS,
      request: { ...BODY, input: "different" },
    });
    const badCap = capture();
    const badExit = await runEndpoint(
      "openai",
      [
        EMBEDDINGS,
        "--data-file",
        body,
        "--paygate-secret-file",
        secret,
        "--otp",
        wrongBodyOtp,
      ],
      badCap.writer,
      opts
    );
    expect(badExit).toBe(4);
    expect(calls).toHaveLength(1);
    expect(String(errorOf(badCap).hint)).toContain("otp-mismatched-request");
    expect(existsSync(join(grantDir, GRANT_USES_FILE))).toBe(false);
  });

  it("never lets a grant open a gate: sdk registry row", async () => {
    const home = sandbox();
    const secret = join(home, "paygate.secret");
    writeFileSync(secret, `${SECRET}\n`);
    const kieBody = { model: "veo3", prompt: "cat", aspectRatio: "16:9" };
    const bodyFile = join(home, "kie.json");
    writeFileSync(bodyFile, JSON.stringify(kieBody));
    const grantDir = join(home, "grants");
    mkdirSync(grantDir, { recursive: true, mode: 0o700 });
    const kieGrant = mintGrant(SECRET, { provider: "kie" });
    writeFileSync(join(grantDir, grantFileName("kie")), `${kieGrant}\n`);

    const calls: unknown[][] = [];
    const opts: EndpointOptions = {
      env: makeEnv("kie", home, { APICITY_PAYGATE_GRANT_DIR: grantDir }),
      stdoutIsTTY: false,
      instantiate: (_name, _spec, paygateSecret) =>
        Promise.resolve(
          withPaidGate(
            "kie",
            {
              post: {
                api: {
                  v1: {
                    jobs: {
                      createTask: (...args: unknown[]) => {
                        calls.push(args);
                        return Promise.resolve({ taskId: "t1" });
                      },
                    },
                  },
                },
              },
            },
            { config: paygateSecret ? { secret: paygateSecret } : undefined }
          ) as InstantiatedProvider
        ),
    };

    const missingCap = capture();
    const missingExit = await runEndpoint(
      "kie",
      [
        "api.v1.jobs.createTask",
        "--data-file",
        bodyFile,
        "--paygate-secret-file",
        secret,
      ],
      missingCap.writer,
      opts
    );
    expect(missingExit).toBe(4);
    expect(calls).toEqual([]);
    expect(String(errorOf(missingCap).hint)).toMatch(
      /; no grant covers this endpoint: the provider package checks it$/
    );

    const asOtpCap = capture();
    const asOtpExit = await runEndpoint(
      "kie",
      [
        "api.v1.jobs.createTask",
        "--data-file",
        bodyFile,
        "--paygate-secret-file",
        secret,
        "--otp",
        kieGrant,
      ],
      asOtpCap.writer,
      opts
    );
    expect(asOtpExit).toBe(4);
    expect(calls).toEqual([]);
    expect(String(errorOf(asOtpCap).hint)).toContain("otp-malformed");
    expect(existsSync(join(grantDir, GRANT_USES_FILE))).toBe(false);
  });

  it("prints the grant explanation on the gate: line of apicity describe", async () => {
    const cliCap = capture();
    await runDescribe(cliCap.writer, "openai", EMBEDDINGS, {
      stdoutIsTTY: true,
    });
    expect(cliCap.out.join("\n")).toContain(
      "gate:          cli (armed: an OTP for the request, or a grant for the provider)"
    );

    const freeCap = capture();
    await runDescribe(freeCap.writer, "nunchux", "v1.credits", {
      stdoutIsTTY: true,
    });
    expect(freeCap.out.join("\n")).toContain("gate:          none");
  });
});
