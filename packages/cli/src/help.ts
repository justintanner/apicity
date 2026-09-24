import type { CliWriter } from "./envelope.js";
import { EXIT_CODES, type CliErrorCode } from "./errors.js";

export const HELP_TOPICS = [
  "output",
  "exit-codes",
  "environment",
  "agents",
] as const;

export type HelpTopic = (typeof HELP_TOPICS)[number];

export function isHelpTopic(name: string): name is HelpTopic {
  return (HELP_TOPICS as readonly string[]).includes(name);
}

/**
 * The exit-code table, rendered from the single constant in `errors.ts`.
 *
 * Codes are the contract and several share a status, so the table is grouped
 * by number: a caller branching on `code` reads the left column, a shell
 * script reads the right one.
 */
export function exitCodeTable(): string {
  const byExit = new Map<number, CliErrorCode[]>();
  for (const [code, exit] of Object.entries(EXIT_CODES) as [
    CliErrorCode,
    number,
  ][]) {
    const bucket = byExit.get(exit);
    if (bucket) bucket.push(code);
    else byExit.set(exit, [code]);
  }

  const rows = [...byExit.entries()].sort((a, b) => a[0] - b[0]);
  const width = Math.max(...rows.map(([, codes]) => codes.join(", ").length));
  return [
    `${"code".padEnd(width)}  exit`,
    `${"0".padEnd(width)}  0`,
    ...rows.map(
      ([exit, codes]) => `${codes.join(", ").padEnd(width)}  ${exit}`
    ),
  ].join("\n");
}

const TOPIC_TEXT: Record<HelpTopic, () => string> = {
  output: () =>
    [
      "apicity help output — what a command prints",
      "",
      "Success goes to stdout, failure to stderr, and never both for one",
      "invocation. Whenever stdout is not a terminal — a pipe, a file, an",
      "agent — or `--json` is passed, a failure is exactly one JSON document:",
      "",
      '  {"ok": false, "error": "...", "code": "...", "hint": "..."}',
      "",
      "`code` is the stable contract — see `apicity help exit-codes`. `hint`,",
      "when present, is one line naming what to run or set next. At a terminal",
      "without `--json` the same failure prints as `Error:` and `hint:` lines,",
      "on stderr, with the same exit status.",
      "",
      "Success follows the same rule. Piped or with `--json`, a call,",
      "`doctor`, `setup`, `skill install` and the discovery commands",
      "(`commands`, `describe`, `providers`) print one JSON document, with",
      "the result under `data`:",
      "",
      '  {"ok": true, "data": ..., "summary": "..."}',
      "",
      "`--quiet` prints `data` alone, compactly with `--json`. At a terminal",
      "without `--json`, `commands` and `providers` print an aligned table",
      "and `describe` a text block, meant for a human reader.",
    ].join("\n"),

  "exit-codes": () =>
    [
      "apicity help exit-codes — every status the CLI returns",
      "",
      exitCodeTable(),
      "",
      "Branch on the `code` field of the error envelope, not on the number:",
      "several codes share a status and the numbers may gain siblings.",
    ].join("\n"),

  environment: () =>
    [
      "apicity help environment — credentials and configuration",
      "",
      "Every provider reads its credential from the environment. Run",
      "`apicity providers` for the env var names and which are set; the CLI",
      "prints names only and never a value.",
      "",
      "Providers with no credential at all (binance, openligadb, openf1,",
      "free-media-upload, and polymarket's public market data) are always",
      "reported as configured.",
      "",
      "`apicity commands` and `apicity describe` need no credential: they read",
      "a generated catalog rather than calling upstream.",
    ].join("\n"),

  agents: () =>
    [
      "apicity help agents — using this CLI from an agent",
      "",
      "Discovery is three steps, all of them offline:",
      "",
      "  apicity providers --json              which providers exist and are set",
      "  apicity commands --provider <p> --json   that provider's endpoints",
      "  apicity describe <p> <dotPath> --json    one endpoint in full",
      "",
      "`describe` answers the request schema, a recorded example payload and",
      "the call shape. Read both parameter lists: `pathParams` are positional",
      "arguments and `requestParams` are properties of the request object.",
      "Passing one where the other belongs is the single most common mistake.",
      "",
      "A dotPath carrying more than one method exits `ambiguous` (8) until you",
      "pass `--method`.",
    ].join("\n"),
};

export function helpTopicText(topic: HelpTopic): string {
  return TOPIC_TEXT[topic]();
}

export function printHelpTopic(writer: CliWriter, topic: HelpTopic): void {
  writer.out(helpTopicText(topic));
}

/** The one-line pointers usage prints under its command list. */
export function helpTopicsLine(): string {
  return `Help topics: ${HELP_TOPICS.join(", ")} — run "apicity help <topic>".`;
}
