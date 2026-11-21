import { createHash } from "node:crypto";
import {
  accessSync,
  chmodSync,
  closeSync,
  constants,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_OTP_TTL_SECONDS = 600;
const MARKER_EXT = ".consumed";

/** Minimal synchronous replay store interface matching `@apicity/cost`. */
export interface PayGateReplayStore {
  has(jti: string): boolean;
  add(jti: string): void;
}

export interface PaygateLedgerOptions {
  ledgerDir: string;
  provider: string;
  method: string;
  dotPath: string;
  /** Token expiration (UNIX seconds) read from the OTP payload for pruning. */
  tokenExpSeconds?: number;
  /** Optional clock override returning epoch ms (defaults to `Date.now`). */
  now?: () => number;
}

/**
 * Pay-gate error raised when the on-disk OTP ledger rejects a replay or
 * cannot access/write the ledger directory. Sets `name = "PayGateError"` so
 * `isPayGateErrorLike` classifies it as `paygate` (exit 4).
 */
export class LedgerRefusal extends Error {
  readonly provider: string;
  readonly method: string;
  readonly dotPath: string;
  readonly code: "otp-replayed" | "paygate-ledger-unwritable";

  constructor(
    provider: string,
    method: string,
    dotPath: string,
    code: "otp-replayed" | "paygate-ledger-unwritable",
    message: string
  ) {
    super(message);
    this.name = "PayGateError";
    this.provider = provider;
    this.method = method;
    this.dotPath = dotPath;
    this.code = code;
  }
}

/**
 * Resolve the consumed-OTP ledger directory: `$APICITY_PAYGATE_LEDGER_DIR`,
 * else `<home>/.config/apicity/paygate-consumed`.
 */
export function ledgerDirectory(env: NodeJS.ProcessEnv = process.env): string {
  const override = env.APICITY_PAYGATE_LEDGER_DIR;
  if (override !== undefined && override !== "") {
    return override;
  }
  const home =
    env.HOME !== undefined && env.HOME !== ""
      ? env.HOME
      : env.USERPROFILE !== undefined && env.USERPROFILE !== ""
        ? env.USERPROFILE
        : homedir();
  return join(home, ".config", "apicity", "paygate-consumed");
}

/**
 * Derive a fixed safe filename inside the ledger directory by SHA-256 hashing
 * the token's `jti`, so caller/minter `jti` strings cannot traverse paths.
 */
export function ledgerMarkerName(jti: string): string {
  const digest = createHash("sha256").update(jti, "utf8").digest("hex");
  return `${digest}${MARKER_EXT}`;
}

/**
 * Best-effort extraction of `exp` from an OTP envelope so consumed markers can
 * record their exact expiration timestamp (only written after HMAC verifies).
 */
export function readOtpExpirySeconds(
  otp: string | undefined
): number | undefined {
  if (!otp) return undefined;
  const parts = otp.split(".");
  if (parts.length !== 2 || !parts[0]) return undefined;
  try {
    const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const json = Buffer.from(base64 + "=".repeat(padLen), "base64").toString(
      "utf8"
    );
    const parsed = JSON.parse(json) as { exp?: unknown };
    if (typeof parsed.exp === "number" && Number.isFinite(parsed.exp)) {
      return parsed.exp;
    }
  } catch {
    // Signature/shape checks in verifyOtp handle malformed tokens cleanly.
  }
  return undefined;
}

/**
 * Create a lazy, fail-closed, file-backed `ReplayStore` for CLI OTP checks.
 *
 * Performs zero disk I/O until `has(jti)` or `add(jti)` runs (after HMAC
 * verification passes on non-grant calls), prunes markers past `exp`, and uses
 * exclusive file creation (`O_EXCL`) to stop concurrent races.
 */
export function createPaygateLedgerStore(
  options: PaygateLedgerOptions
): PayGateReplayStore {
  const nowMs = (): number => (options.now ? options.now() : Date.now());
  const nowSeconds = (): number => Math.floor(nowMs() / 1000);

  function failUnwritable(): never {
    throw new LedgerRefusal(
      options.provider,
      options.method,
      options.dotPath,
      "paygate-ledger-unwritable",
      `Cannot access or write pay-gate ledger directory ${options.ledgerDir}`
    );
  }

  function prepareLedger(): void {
    try {
      const existed = existsSync(options.ledgerDir);
      mkdirSync(options.ledgerDir, { recursive: true, mode: 0o700 });
      if (!existed) {
        chmodSync(options.ledgerDir, 0o700);
      }
      accessSync(
        options.ledgerDir,
        constants.R_OK | constants.W_OK | constants.X_OK
      );
      const current = nowSeconds();
      for (const entry of readdirSync(options.ledgerDir)) {
        if (!entry.endsWith(MARKER_EXT)) continue;
        const markerPath = join(options.ledgerDir, entry);
        try {
          const parsed = JSON.parse(readFileSync(markerPath, "utf8")) as {
            exp?: unknown;
          };
          if (typeof parsed.exp === "number" && parsed.exp < current) {
            rmSync(markerPath, { force: true });
          }
        } catch {
          // Preserve unreadable/non-JSON markers instead of deleting active ones.
        }
      }
    } catch {
      failUnwritable();
    }
  }

  return {
    has(jti: string): boolean {
      prepareLedger();
      return existsSync(join(options.ledgerDir, ledgerMarkerName(jti)));
    },
    add(jti: string): void {
      prepareLedger();
      const markerPath = join(options.ledgerDir, ledgerMarkerName(jti));
      const exp =
        options.tokenExpSeconds ?? nowSeconds() + DEFAULT_OTP_TTL_SECONDS;
      try {
        const fd = openSync(
          markerPath,
          constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
          0o600
        );
        try {
          writeSync(fd, `${JSON.stringify({ v: 1, exp })}\n`, null, "utf8");
        } finally {
          closeSync(fd);
        }
      } catch (err) {
        const errno = (err as NodeJS.ErrnoException | undefined)?.code;
        if (errno === "EEXIST") {
          throw new LedgerRefusal(
            options.provider,
            options.method,
            options.dotPath,
            "otp-replayed",
            `OTP jti ${jti} has already been consumed`
          );
        }
        failUnwritable();
      }
    },
  };
}
