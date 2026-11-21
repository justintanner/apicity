import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createKie } from "@apicity/kie";
import {
  canonicalHash,
  dispatchGated,
  mintGrant,
  mintOtp,
} from "@apicity/cost";

import { providerEnvVars } from "../../packages/cli/src/credentials";
import type { CliWriter } from "../../packages/cli/src/envelope";
import { runEndpoint, type EndpointOptions } from "../../packages/cli/src/main";
import {
  LedgerRefusal,
  createPaygateLedgerStore,
  ledgerDirectory,
  ledgerMarkerName,
} from "../../packages/cli/src/paygate-ledger";
import { GRANT_USES_FILE } from "../../packages/cli/src/paygate";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";

const SECRET = "replay-ledger-test-secret";
const tempDirs: string[] = [];

function sandbox(): string {
  const dir = mkdtempSync(join(tmpdir(), "apicity-cli-replay-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
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

describe("consumed-OTP ledger across CLI runs", () => {
  it("blocks replay across separate runEndpoint runs for both gate: sdk (real createKie) and gate: cli", async () => {
    const home = sandbox();
    const secretFile = join(home, "paygate.secret");
    writeFileSync(secretFile, `${SECRET}\n`);
    const ledgerDir = join(home, "ledger");

    // 1. Registry row (`kie api.v1.jobs.createTask`) with the real createKie factory and fake fetch.
    const kieBody = { model: "veo3", prompt: "cat", aspectRatio: "16:9" };
    const kieFile = join(home, "kie.json");
    writeFileSync(kieFile, JSON.stringify(kieBody));
    let kieFetchCalls = 0;
    const kieFakeFetch = (async () => {
      kieFetchCalls++;
      return new Response(
        JSON.stringify({ code: 200, msg: "success", data: { taskId: "t_1" } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as unknown as typeof globalThis.fetch;

    const kieOtp = mintOtp(SECRET, {
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      request: kieBody,
    });
    const kieOpts: EndpointOptions = {
      env: makeEnv("kie", home, { APICITY_PAYGATE_LEDGER_DIR: ledgerDir }),
      stdoutIsTTY: false,
      instantiate: (_name, _spec, paygateSecret, overrides) =>
        Promise.resolve(
          createKie({
            apiKey: "kie-test",
            fetch: kieFakeFetch,
            paygate: paygateSecret
              ? { secret: paygateSecret, replayStore: overrides.replayStore }
              : undefined,
          }) as unknown as InstantiatedProvider
        ),
    };

    const kieFirst = capture();
    expect(
      await runEndpoint(
        "kie",
        [
          "api.v1.jobs.createTask",
          "--data-file",
          kieFile,
          "--paygate-secret-file",
          secretFile,
          "--otp",
          kieOtp,
        ],
        kieFirst.writer,
        kieOpts
      )
    ).toBe(0);
    expect(kieFetchCalls).toBe(1);

    const kieSecond = capture();
    expect(
      await runEndpoint(
        "kie",
        [
          "api.v1.jobs.createTask",
          "--data-file",
          kieFile,
          "--paygate-secret-file",
          secretFile,
          "--otp",
          kieOtp,
        ],
        kieSecond.writer,
        kieOpts
      )
    ).toBe(4);
    expect(kieFetchCalls).toBe(1);
    expect(String(errorOf(kieSecond).hint)).toContain("otp-replayed");

    // 2. CLI-gated row (`openai v1.embeddings`).
    const oaBody = { model: "text-embedding-3-small", input: "hello" };
    const oaFile = join(home, "oa.json");
    writeFileSync(oaFile, JSON.stringify(oaBody));
    let oaCalls = 0;
    const oaOtp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
      request: oaBody,
    });
    const oaOpts: EndpointOptions = {
      env: makeEnv("openai", home, { APICITY_PAYGATE_LEDGER_DIR: ledgerDir }),
      stdoutIsTTY: false,
      instantiate: () =>
        Promise.resolve({
          post: {
            v1: {
              embeddings: async () => {
                oaCalls++;
                return { data: [] };
              },
            },
          },
        } as InstantiatedProvider),
    };

    expect(
      await runEndpoint(
        "openai",
        [
          "v1.embeddings",
          "--data-file",
          oaFile,
          "--paygate-secret-file",
          secretFile,
          "--otp",
          oaOtp,
        ],
        capture().writer,
        oaOpts
      )
    ).toBe(0);
    expect(oaCalls).toBe(1);

    const oaReplay = capture();
    expect(
      await runEndpoint(
        "openai",
        [
          "v1.embeddings",
          "--data-file",
          oaFile,
          "--paygate-secret-file",
          secretFile,
          "--otp",
          oaOtp,
        ],
        oaReplay.writer,
        oaOpts
      )
    ).toBe(4);
    expect(oaCalls).toBe(1);
    expect(String(errorOf(oaReplay).hint)).toContain("otp-replayed");
  });

  it("lets only one pass when two calls race on the same OTP", async () => {
    const ledgerDir = sandbox();
    const request = { model: "text-embedding-3-small", input: "race" };
    const otp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
      request,
    });

    // Force both stores to observe has() === false before either writes its marker.
    const realA = createPaygateLedgerStore({
      ledgerDir,
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
    });
    const realB = createPaygateLedgerStore({
      ledgerDir,
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
    });
    const racingA = { has: () => false, add: (jti: string) => realA.add(jti) };
    const racingB = { has: () => false, add: (jti: string) => realB.add(jti) };

    let dispatched = 0;
    const outcomes = await Promise.allSettled([
      dispatchGated(
        "openai",
        "POST",
        "v1.embeddings",
        request,
        { otp },
        async () => {
          dispatched++;
          return "winner";
        },
        { secret: SECRET, replayStore: racingA }
      ),
      dispatchGated(
        "openai",
        "POST",
        "v1.embeddings",
        request,
        { otp },
        async () => {
          dispatched++;
          return "winner";
        },
        { secret: SECRET, replayStore: racingB }
      ),
    ]);

    expect(dispatched).toBe(1);
    const fulfilled = outcomes.filter((r) => r.status === "fulfilled");
    const rejected = outcomes.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const raceErr = (rejected[0] as PromiseRejectedResult).reason;
    expect(raceErr).toBeInstanceOf(LedgerRefusal);
    expect(raceErr).toMatchObject({
      name: "PayGateError",
      code: "otp-replayed",
    });
  });

  it("fails closed before calling provider when the ledger directory is unwritable and names it", async () => {
    const home = sandbox();
    const secretFile = join(home, "paygate.secret");
    writeFileSync(secretFile, `${SECRET}\n`);
    const body = { model: "text-embedding-3-small", input: "blocked" };
    const bodyFile = join(home, "req.json");
    writeFileSync(bodyFile, JSON.stringify(body));

    // Point APICITY_PAYGATE_LEDGER_DIR at a regular file so mkdir/open fails reliably even under root.
    const blockedPath = join(home, "not-a-dir");
    writeFileSync(blockedPath, "occupied");
    let calls = 0;
    const cap = capture();
    const otp = mintOtp(SECRET, {
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
      request: body,
    });

    const exit = await runEndpoint(
      "openai",
      [
        "v1.embeddings",
        "--data-file",
        bodyFile,
        "--paygate-secret-file",
        secretFile,
        "--otp",
        otp,
      ],
      cap.writer,
      {
        env: makeEnv("openai", home, {
          APICITY_PAYGATE_LEDGER_DIR: blockedPath,
        }),
        stdoutIsTTY: false,
        instantiate: () =>
          Promise.resolve({
            post: {
              v1: {
                embeddings: async () => {
                  calls++;
                  return { data: [] };
                },
              },
            },
          } as InstantiatedProvider),
      }
    );

    expect(exit).toBe(4);
    expect(calls).toBe(0);
    const envelope = errorOf(cap);
    expect(envelope.code).toBe("paygate");
    expect(String(envelope.error)).toContain(blockedPath);
    expect(String(envelope.hint)).toContain("paygate-ledger-unwritable");
  });

  it("prunes markers strictly past token expiry and never by file age", () => {
    const ledgerDir = sandbox();
    const baseSec = 1_700_000_000;
    let clockMs = baseSec * 1000;
    const now = () => clockMs;

    const shortStore = createPaygateLedgerStore({
      ledgerDir,
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
      tokenExpSeconds: baseSec + 10,
      now,
    });
    const longStore = createPaygateLedgerStore({
      ledgerDir,
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
      tokenExpSeconds: baseSec + 86400,
      now,
    });
    shortStore.add("short-jti");
    longStore.add("long-jti");

    // Backdate mtimes on both files; pruning must honor `exp` inside JSON, not file mtime.
    const oldDate = new Date((baseSec - 86400 * 30) * 1000);
    const shortPath = join(ledgerDir, ledgerMarkerName("short-jti"));
    const longPath = join(ledgerDir, ledgerMarkerName("long-jti"));
    utimesSync(shortPath, oldDate, oldDate);
    utimesSync(longPath, oldDate, oldDate);

    // At exp (baseSec + 10): still valid -> NOT pruned.
    clockMs = (baseSec + 10) * 1000;
    expect(shortStore.has("short-jti")).toBe(true);
    expect(longStore.has("long-jti")).toBe(true);

    // Past short exp (baseSec + 11): short marker pruned, long marker preserved.
    clockMs = (baseSec + 11) * 1000;
    expect(longStore.has("long-jti")).toBe(true);
    expect(existsSync(shortPath)).toBe(false);
    expect(existsSync(longPath)).toBe(true);
  });

  it("creates no ledger directory on unarmed hosts, non-billed endpoints, bad OTPs, or valid grants", async () => {
    const home = sandbox();
    const secretFile = join(home, "paygate.secret");
    writeFileSync(secretFile, `${SECRET}\n`);
    const ledgerDir = join(home, "never-created-ledger");
    const grantDir = join(home, "grants");
    mkdirSync(grantDir, { recursive: true, mode: 0o700 });
    const oaBody = { model: "text-embedding-3-small", input: "grant-ok" };
    const oaFile = join(home, "oa.json");
    writeFileSync(oaFile, JSON.stringify(oaBody));

    let oaCalls = 0;
    const oaOpts: EndpointOptions = {
      env: makeEnv("openai", home, {
        APICITY_PAYGATE_LEDGER_DIR: ledgerDir,
        APICITY_PAYGATE_GRANT_DIR: grantDir,
      }),
      stdoutIsTTY: false,
      instantiate: () =>
        Promise.resolve({
          post: {
            v1: {
              embeddings: async () => {
                oaCalls++;
                return { data: [] };
              },
            },
          },
        } as InstantiatedProvider),
    };

    // Unarmed host
    expect(
      await runEndpoint(
        "openai",
        ["v1.embeddings", "--data-file", oaFile],
        capture().writer,
        oaOpts
      )
    ).toBe(0);
    expect(existsSync(ledgerDir)).toBe(false);

    // Armed host, grant passed as --otp -> otp-malformed before asking ledger
    const grant = mintGrant(SECRET, { provider: "openai" });
    expect(
      await runEndpoint(
        "openai",
        [
          "v1.embeddings",
          "--data-file",
          oaFile,
          "--paygate-secret-file",
          secretFile,
          "--otp",
          grant,
        ],
        capture().writer,
        oaOpts
      )
    ).toBe(4);
    expect(existsSync(ledgerDir)).toBe(false);

    // Armed host with valid provider grant -> 2 separate calls pass, uses.jsonl written, ledgerDir absent (AC9)
    writeFileSync(join(grantDir, "openai.grant"), `${grant}\n`);
    expect(
      await runEndpoint(
        "openai",
        [
          "v1.embeddings",
          "--data-file",
          oaFile,
          "--paygate-secret-file",
          secretFile,
        ],
        capture().writer,
        oaOpts
      )
    ).toBe(0);
    expect(
      await runEndpoint(
        "openai",
        [
          "v1.embeddings",
          "--data-file",
          oaFile,
          "--paygate-secret-file",
          secretFile,
        ],
        capture().writer,
        oaOpts
      )
    ).toBe(0);
    expect(oaCalls).toBe(3);
    expect(existsSync(join(grantDir, GRANT_USES_FILE))).toBe(true);
    expect(existsSync(ledgerDir)).toBe(false);
  });

  it("hashes jti into safe filenames so path separators cannot escape the ledger directory", () => {
    const ledgerDir = sandbox();
    const evilJti = "../../../outside/escape\\win";
    const filename = ledgerMarkerName(evilJti);
    expect(filename).toMatch(/^[0-9a-f]{64}\.consumed$/);
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("\\");

    const store = createPaygateLedgerStore({
      ledgerDir,
      provider: "openai",
      method: "POST",
      dotPath: "v1.embeddings",
      tokenExpSeconds: Math.floor(Date.now() / 1000) + 60,
    });
    store.add(evilJti);
    expect(readdirSync(ledgerDir)).toEqual([filename]);
    expect(
      ledgerDirectory({ APICITY_PAYGATE_LEDGER_DIR: "/tmp/custom-ledger" })
    ).toBe("/tmp/custom-ledger");
    expect(canonicalHash({ ok: true })).toMatch(/^sha256:/);
  });
});
