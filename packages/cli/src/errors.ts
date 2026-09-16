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
