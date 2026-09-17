import { BUILTIN_COMMANDS } from "./commands.js";
import type { CliError } from "./errors.js";
import { helpTopicsLine } from "./help.js";

/**
 * The two output streams, injected so tests can read what an invocation
 * printed without capturing the process streams.
 */
export interface CliWriter {
  out(text: string): void;
  err(text: string): void;
  /**
   * Bytes to stdout exactly as given, with no trailing newline of its own.
   *
   * Only the raw-output commands use it — `apicity skill` has to print the
   * file byte-for-byte — and it is optional so a test writer can capture the
   * line-oriented channels alone.
   */
  raw?(text: string): void;
}

export const defaultWriter: CliWriter = {
  out: (text) => process.stdout.write(`${text}\n`),
  err: (text) => process.stderr.write(`${text}\n`),
  raw: (text) => process.stdout.write(text),
};

/** The failure envelope, exactly one JSON document on stderr. */
export interface ErrorEnvelope {
  ok: false;
  error: string;
  code: string;
  hint?: string;
  meta?: Record<string, unknown>;
}

export function errorEnvelope(err: CliError): ErrorEnvelope {
  const envelope: ErrorEnvelope = {
    ok: false,
    error: err.message,
    code: err.code,
  };
  if (err.hint !== undefined) envelope.hint = err.hint;
  if (err.meta !== undefined) envelope.meta = err.meta;
  return envelope;
}

export function usageText(): string {
  const width = Math.max(...BUILTIN_COMMANDS.map((c) => c.name.length));
  return [
    "apicity — command-line interface for every @apicity provider endpoint.",
    "",
    "Usage:",
    "  apicity <command> [flags]",
    "",
    "Commands:",
    ...BUILTIN_COMMANDS.map((c) => `  ${c.name.padEnd(width)}  ${c.summary}`),
    "",
    "  apicity <provider>            shorthand for: commands --provider <provider>",
    "",
    helpTopicsLine(),
  ].join("\n");
}

export function printUsage(writer: CliWriter): void {
  writer.out(usageText());
}

/** The success envelope, exactly one JSON document on stdout. */
export interface SuccessEnvelope {
  ok: true;
  data: unknown;
  summary?: string;
  meta?: Record<string, unknown>;
}

export interface SuccessExtras {
  summary?: string;
  meta?: Record<string, unknown>;
}

export interface WriterOptions {
  json?: boolean;
  quiet?: boolean;
  /** Defaults to the real stdout's TTY state; injected by tests. */
  stdoutIsTTY?: boolean;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

/**
 * The one thing that writes to stdout.
 *
 * `machine` is the whole output decision (D-5): `--json` or a stdout that is
 * not a terminal selects the envelopes, a terminal without `--json` selects
 * the pretty form. Both read the same `data`, so a pipeline and a human see
 * the same result differently framed, never a different result.
 */
export interface OutputWriter extends CliWriter {
  readonly machine: boolean;
  success(data: unknown, extras?: SuccessExtras): number;
  failure(err: CliError): number;
  text(lines: string | string[]): void;
}

export function createWriter(options: WriterOptions = {}): OutputWriter {
  const out = options.stdout ?? ((text) => process.stdout.write(`${text}\n`));
  const err = options.stderr ?? ((text) => process.stderr.write(`${text}\n`));
  const isTTY = options.stdoutIsTTY ?? Boolean(process.stdout.isTTY);
  const machine = Boolean(options.json) || !isTTY;

  return {
    machine,
    out,
    err,
    success(data, extras) {
      // `--quiet` is the "just the data" escape hatch in both modes; with
      // `--json` it is compact, so `apicity … --json --quiet` is one line a
      // shell can hand straight to another program.
      if (options.quiet) {
        out(options.json ? compact(data) : pretty(data));
        return 0;
      }
      if (!machine) {
        out(pretty(data));
        return 0;
      }
      const envelope: SuccessEnvelope = { ok: true, data };
      if (extras?.summary !== undefined) envelope.summary = extras.summary;
      if (extras?.meta !== undefined) envelope.meta = extras.meta;
      out(pretty(envelope));
      return 0;
    },
    failure(error) {
      if (machine) {
        // One line: an error envelope is read by a log pipeline far more often
        // than by a person.
        err(compact(errorEnvelope(error)));
        return error.exit;
      }
      err(`Error: ${error.message}`);
      if (error.hint !== undefined) err(`hint: ${error.hint}`);
      return error.exit;
    },
    text(lines) {
      out(Array.isArray(lines) ? lines.join("\n") : lines);
    },
  };
}

/**
 * Where binary results and downloaded media land: `--output-dir`, else
 * `APICITY_OUTPUT_DIR`, else `CLAUDE_PROJECT_DIR` (set for every agent session
 * this CLI is meant to run inside), else the working directory.
 */
export function resolveOutputDirectory(
  explicit: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): string {
  return explicit ?? env.APICITY_OUTPUT_DIR ?? env.CLAUDE_PROJECT_DIR ?? cwd;
}

function pretty(value: unknown): string {
  return stringify(value, 2);
}

function compact(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown, space?: number): string {
  try {
    const text = JSON.stringify(value, undefined, space);
    return text === undefined ? String(value) : text;
  } catch {
    return String(value);
  }
}
