import { BUILTIN_COMMANDS } from "./commands.js";
import type { CliError } from "./errors.js";

/**
 * The two output streams, injected so tests can read what an invocation
 * printed without capturing the process streams.
 */
export interface CliWriter {
  out(text: string): void;
  err(text: string): void;
}

export const defaultWriter: CliWriter = {
  out: (text) => process.stdout.write(`${text}\n`),
  err: (text) => process.stderr.write(`${text}\n`),
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

/**
 * Report a failure and answer the exit status for it. W3 adds the success
 * envelope, `--json`/`--quiet` and the TTY rule on top of this one path.
 */
export function writeError(writer: CliWriter, err: CliError): number {
  writer.err(JSON.stringify(errorEnvelope(err)));
  return err.exit;
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
    'Run "apicity mcp --help" for the MCP server flags.',
  ].join("\n");
}

export function printUsage(writer: CliWriter): void {
  writer.out(usageText());
}
