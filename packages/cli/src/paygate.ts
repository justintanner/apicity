import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeSync,
} from "node:fs";
import { join } from "node:path";

import type { CatalogEntry } from "./catalog.js";
import { loadCostHelpers, type CostHelpers } from "./cost.js";

export const GRANT_USES_FILE = "uses.jsonl";

export type GrantRefusalCode =
  | "grant-malformed"
  | "grant-invalid-signature"
  | "grant-not-yet-valid"
  | "grant-expired"
  | "grant-mismatched-provider"
  | "grant-unreadable"
  | "grant-unrecorded";

/**
 * Pay-gate refusal raised when an armed grant check fails or cannot record
 * its audit line. Carries `name = "PayGateError"` so `isPayGateErrorLike`
 * routes it through the standard `paygate` error envelope and hint.
 */
export class GrantRefusal extends Error {
  readonly provider: string;
  readonly method: string;
  readonly dotPath: string;
  readonly code: GrantRefusalCode;

  constructor(
    provider: string,
    method: string,
    dotPath: string,
    code: GrantRefusalCode,
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

/** Everything `dispatchThroughGate` needs to enforce the CLI pay gate. */
export interface GatedCall {
  entry: Pick<CatalogEntry, "provider" | "method" | "dotPath" | "gate">;
  /** Request shape produced by `gateRequest` and hashed into the OTP. */
  request: unknown;
  otp?: string;
  secret?: string;
  grantDir?: string;
  requestHash?: `sha256:${string}`;
  cwd?: string;
  dispatch: () => Promise<unknown>;
  now?: () => number;
}

/**
 * Build the value hashed and bound into an OTP for a catalog invocation.
 *
 * A `cli`-gated endpoint with URL path parameters hashes `{ path, body }`
 * (keyed by `entry.pathParams`) so distinct target IDs never share a token.
 * Every other row hashes the merged request object alone, matching what
 * `withPaidGate` hashes inside the `sdk`-gated provider packages.
 */
export function gateRequest(
  entry: Pick<CatalogEntry, "gate" | "pathParams">,
  positional: Record<string, string>,
  body: unknown
): unknown {
  const requestBody = body ?? {};
  if (entry.gate !== "cli" || entry.pathParams.length === 0) {
    return requestBody;
  }
  const path: Record<string, string> = {};
  for (const param of entry.pathParams) {
    const value = positional[param];
    if (value !== undefined) {
      path[param] = value;
    }
  }
  return { path, body: requestBody };
}

function readGrantFile(call: GatedCall, grantPath: string): string | undefined {
  try {
    return readFileSync(grantPath, "utf8").trim();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return undefined;
    }
    throw new GrantRefusal(
      call.entry.provider,
      call.entry.method,
      call.entry.dotPath,
      "grant-unreadable",
      `Pay-gate grant file ${grantPath} could not be read`
    );
  }
}

function appendGrantUse(call: GatedCall, grantDir: string, line: string): void {
  const usesPath = join(grantDir, GRANT_USES_FILE);
  try {
    mkdirSync(grantDir, { recursive: true, mode: 0o700 });
    const fd = openSync(usesPath, "a", 0o600);
    try {
      writeSync(fd, `${line}\n`, null, "utf8");
    } finally {
      closeSync(fd);
    }
  } catch {
    throw new GrantRefusal(
      call.entry.provider,
      call.entry.method,
      call.entry.dotPath,
      "grant-unrecorded",
      `Cannot record grant use in ${usesPath}`
    );
  }
}

/**
 * Apply the CLI's pay gate immediately before calling a provider function.
 *
 * Only `gate: "cli"` rows are checked here: `gate: "sdk"` rows are enforced
 * inside the provider package via `withPaidGate`, and `gate: "none"` rows do
 * not bill. When armed with a non-empty secret, no `--otp`, and `grantDir`,
 * a valid provider grant is checked and recorded before `dispatch()`.
 */
export async function dispatchThroughGate(
  call: GatedCall,
  helpers?: Pick<
    CostHelpers,
    "dispatchGated" | "canonicalHash" | "verifyGrant" | "grantFileName"
  >
): Promise<unknown> {
  if (call.entry.gate !== "cli") {
    return call.dispatch();
  }
  const resolvedHelpers = helpers ?? (await loadCostHelpers());

  if (
    call.secret !== undefined &&
    call.secret !== "" &&
    call.otp === undefined &&
    call.grantDir !== undefined
  ) {
    const grantPath = join(
      call.grantDir,
      resolvedHelpers.grantFileName(call.entry.provider)
    );
    const token = readGrantFile(call, grantPath);
    if (token !== undefined) {
      const nowMs = call.now ? call.now() : Date.now();
      const verified = resolvedHelpers.verifyGrant({
        token,
        secret: call.secret,
        provider: call.entry.provider,
        nowSeconds: Math.floor(nowMs / 1000),
      });
      if (!verified.ok) {
        throw new GrantRefusal(
          call.entry.provider,
          call.entry.method,
          call.entry.dotPath,
          verified.code as GrantRefusalCode,
          `${verified.message} (${grantPath})`
        );
      }

      const record = {
        ts: new Date(nowMs).toISOString(),
        grant: verified.payload.jti,
        provider: call.entry.provider,
        method: call.entry.method,
        dotPath: call.entry.dotPath,
        requestHash:
          call.requestHash ?? resolvedHelpers.canonicalHash(call.request),
        expires: new Date(verified.payload.exp * 1000).toISOString(),
        cwd: call.cwd ?? process.cwd(),
      };
      appendGrantUse(call, call.grantDir, JSON.stringify(record));
      return call.dispatch();
    }
  }

  return resolvedHelpers.dispatchGated(
    call.entry.provider,
    call.entry.method,
    call.entry.dotPath,
    call.request,
    call.otp === undefined ? undefined : { otp: call.otp },
    call.dispatch,
    call.secret !== undefined
      ? { secret: call.secret, ...(call.now ? { now: call.now } : {}) }
      : undefined
  );
}
