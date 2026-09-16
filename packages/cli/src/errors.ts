/**
 * Exit code for every CLI error code, as `apicity help exit-codes` prints it.
 *
 * Codes, not exit numbers, are the stable contract: several codes share an
 * exit status (`usage` and `skill_unmanaged` both exit 1), so callers branch on
 * `code` and humans read the number. W1 only raises `not_found`; the rest of
 * the table is here so later slices add cases, never a second table.
 */
export const EXIT_CODES = {
  usage: 1,
  skill_unmanaged: 1,
  not_found: 2,
  auth: 3,
  forbidden: 4,
  paygate: 4,
  rate_limit: 5,
  network: 6,
  api: 7,
  setup_incomplete: 7,
  ambiguous: 8,
} as const;

export type CliErrorCode = keyof typeof EXIT_CODES;

export interface CliErrorOptions {
  /** One actionable line telling the caller what to run or set next. */
  hint?: string;
  meta?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * An error the CLI itself raises, carrying the code and exit status the
 * envelope reports. Upstream provider failures are classified into these by
 * `classifyError`, which W3 adds alongside this class.
 */
export class CliError extends Error {
  readonly code: CliErrorCode;
  readonly exit: number;
  readonly hint?: string;
  readonly meta?: Record<string, unknown>;

  constructor(
    code: CliErrorCode,
    message: string,
    options: CliErrorOptions = {}
  ) {
    super(message, { cause: options.cause });
    this.name = "CliError";
    this.code = code;
    this.exit = EXIT_CODES[code];
    this.hint = options.hint;
    this.meta = options.meta;
  }
}

/**
 * Everything `classifyError` needs that the error itself does not carry: the
 * files and dot path a pay-gate hint names, so the caller can copy the minting
 * command instead of reconstructing it.
 */
export interface ClassifyContext {
  paygateSecretFile?: string;
  dataFile?: string;
  dotPath?: string;
}

/** The transport-level `cause.code`s that mean "the request never landed". */
const NETWORK_CAUSE_CODES = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNABORTED",
]);

const NETWORK_ERROR_NAMES = new Set(["AbortError", "TimeoutError"]);

/**
 * Map anything thrown on the call path onto the REQ-005 table, first match
 * wins: the CLI's own errors, the pay gate, a provider error carrying an HTTP
 * status, a transport failure, and everything else as `api`.
 *
 * The 27 `<Provider>Error` classes agree on one thing — a numeric `status` —
 * so the status branch covers all of them without importing a provider
 * package. xai is the documented exception: it wraps a transport failure as
 * status 500, so that one surfaces as `api` rather than `network`.
 */
export function classifyError(
  err: unknown,
  context: ClassifyContext = {}
): CliError {
  if (err instanceof CliError) return err;

  if (isPayGateErrorLike(err)) {
    const dotPath = err.dotPath || context.dotPath || "<dotPath>";
    const secretFile = context.paygateSecretFile ?? "<path>";
    const payloadFile = context.dataFile ?? "<file>";
    return new CliError("paygate", err.message, {
      hint:
        `${err.code}; mint with: apicity-paygate otp mint ` +
        `--secret-file ${secretFile} --dot-path ${dotPath} ` +
        `--payload-file ${payloadFile}`,
      cause: err,
    });
  }

  const status = httpStatus(err);
  if (status !== undefined) {
    const code = codeForStatus(status);
    return new CliError(code, errorMessage(err), {
      hint: hintForStatus(status),
      meta: { status },
      cause: err,
    });
  }

  if (isNetworkError(err)) {
    return new CliError("network", errorMessage(err), {
      hint: "check connectivity, the base URL and --timeout",
      cause: err,
    });
  }

  return new CliError("api", errorMessage(err), { cause: err });
}

/**
 * `PayGateError` duck-typed exactly as its own `Symbol.hasInstance` does.
 *
 * Restated rather than imported: the CLI reads `@apicity/cost` only through
 * `loadCostHelpers`, and this module must stay synchronous and dependency-free
 * so every command can raise a classified error.
 */
export interface PayGateErrorLike {
  name: string;
  message: string;
  provider: string;
  method: string;
  dotPath: string;
  code: string;
}

export function isPayGateErrorLike(value: unknown): value is PayGateErrorLike {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.name === "PayGateError" &&
    typeof record.provider === "string" &&
    typeof record.method === "string" &&
    typeof record.dotPath === "string" &&
    typeof record.code === "string"
  );
}

function codeForStatus(status: number): CliErrorCode {
  if (status === 401) return "auth";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limit";
  return "api";
}

function hintForStatus(status: number): string | undefined {
  if (status === 401)
    return "run: apicity providers — the credential was rejected";
  if (status === 403)
    return "the credential is valid but not allowed this call";
  if (status === 404) return "run: apicity describe <provider> <dotPath>";
  if (status === 429) return "slow down, or retry after the provider's window";
  return undefined;
}

function httpStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const status = (err as Record<string, unknown>).status;
  return typeof status === "number" ? status : undefined;
}

function isNetworkError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const record = err as Record<string, unknown>;
  if (typeof record.name === "string" && NETWORK_ERROR_NAMES.has(record.name)) {
    return true;
  }
  if (err instanceof TypeError && /fetch failed/i.test(err.message))
    return true;
  const cause = record.cause;
  if (typeof cause !== "object" || cause === null) return false;
  const code = (cause as Record<string, unknown>).code;
  if (typeof code !== "string") return false;
  return NETWORK_CAUSE_CODES.has(code) || code.startsWith("UND_ERR_");
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return String(err);
}
