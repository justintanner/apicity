import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { loadCatalog } from "../../packages/cli/src/catalog";
import { BUILTIN_COMMANDS } from "../../packages/cli/src/commands";
import { HELP_TOPICS } from "../../packages/cli/src/help";

// AC-08 (REQ-009): the agent skill is the whole point of the CLI — it is how
// an agent reaches 1,658 endpoints without a tool list in its context. These
// assertions are the contract that keeps it usable: parseable front matter,
// the eight sections in order, a size an agent can actually hold, and — the
// one that matters most — every invocation it prints being a command that
// exists. A skill that teaches a dotPath the catalog does not carry is worse
// than no skill at all.

const SKILL_PATH = "skills/apicity/SKILL.md";

/** Hard budget: the file an agent loads into context (plan W4, REQ-009). */
const MAX_BYTES = 65_536;

/** It teaches discovery; it does not enumerate the catalog. */
const MAX_ENDPOINT_LITERALS = 150;

const SECTIONS = [
  "Agent Invariants",
  "Output and exit codes",
  "Quick Reference",
  "Decision Tree",
  "Provider Reference",
  "Credentials and configuration",
  "Paid endpoints",
  "Troubleshooting",
];

/**
 * Commands a later slice registers that the skill may already name.
 *
 * `doctor` is W5's (REQ-013), and W3's own `auth` hint already tells callers
 * to "see apicity doctor" — the skill saying the same thing is consistent with
 * what the shipped CLI prints. Every other word must be a registered built-in
 * or a catalog row today.
 */
const PLANNED_COMMANDS = ["doctor"];

const skill = readFileSync(SKILL_PATH, "utf8");

// ---------------------------------------------------------------------------
// front matter
// ---------------------------------------------------------------------------

interface FrontMatter {
  name?: string;
  description?: string;
  triggers?: string[];
}

/**
 * Parse the front matter this file is allowed to use, and nothing else.
 *
 * Hand-written rather than delegated: `tests/` declares no YAML dependency and
 * js-yaml exists here only as a transitive `.pnpm` entry at two versions, so
 * reaching into that layout would pin the test to an install detail. The
 * grammar accepted is exactly the three keys the skill declares — a scalar, a
 * `|` block and a `-` list — and anything else throws, which is itself the
 * assertion that the block stays simple enough for every agent host to read.
 */
function parseFrontMatter(text: string): { front: FrontMatter; body: string } {
  const opened = text.startsWith("---\n");
  const end = text.indexOf("\n---\n", 3);
  if (!opened || end === -1) throw new Error("no front matter delimiters");

  const front: FrontMatter = {};
  const lines = text.slice(4, end + 1).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    const match = /^([a-z][a-z_-]*):\s*(.*)$/.exec(line);
    if (!match) throw new Error(`unparsed front-matter line: ${line}`);
    const [, key, value] = match;

    if (value === "|") {
      const block: string[] = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        block.push(lines[++i].trim());
      }
      front[key as "description"] = block.join(" ");
      continue;
    }
    if (value === "") {
      const items: string[] = [];
      while (i + 1 < lines.length && /^\s+- /.test(lines[i + 1])) {
        items.push(lines[++i].replace(/^\s+- /, "").trim());
      }
      if (items.length === 0) throw new Error(`empty block: ${key}`);
      front[key as "triggers"] = items;
      continue;
    }
    front[key as "name"] = value;
  }

  return { front, body: text.slice(end + 5) };
}

const { front, body } = parseFrontMatter(skill);

// ---------------------------------------------------------------------------
// invocations
// ---------------------------------------------------------------------------

interface Invocation {
  /** Everything after the `apicity` token, as written. */
  text: string;
  head: string;
  second?: string;
  tokens: string[];
}

/** Fences whose contents are commands rather than documents. */
const SHELL_FENCES = new Set(["", "bash", "sh", "shell", "console"]);

/**
 * Every `apicity …` invocation in a shell block or a table cell.
 *
 * Prose is deliberately out of scope — "the apicity CLI" is a sentence, not a
 * command — so table cells contribute only their backticked spans. So are
 * `jsonc` and `json` blocks: the envelope example carries the summary string
 * "apicity skill installed", which is output, not something to run. The
 * leading-character class keeps `apicity-paygate` (a different binary, shipped
 * by `@apicity/cost`) from matching.
 */
function invocations(markdown: string): Invocation[] {
  const candidates: string[] = [];
  let fenced = false;
  let shell = false;
  for (const line of markdown.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      if (!fenced) {
        shell = SHELL_FENCES.has(line.trim().replace(/^`+/, "").trim());
      }
      fenced = !fenced;
      continue;
    }
    if (fenced) {
      if (shell) candidates.push(line);
      continue;
    }
    if (!line.trimStart().startsWith("|")) continue;
    for (const span of line.matchAll(/`([^`]+)`/g)) candidates.push(span[1]);
  }

  const found: Invocation[] = [];
  for (const candidate of candidates) {
    for (const match of candidate.matchAll(/(?:^|[\s|(`"'])apicity(?=\s)/g)) {
      const text = candidate.slice(match.index + match[0].length).trim();
      const tokens = text.split(/\s+/).filter((token) => token.length > 0);
      const [head, second] = tokens;
      if (head === undefined) continue;
      found.push({ text, head, second, tokens });
    }
  }
  return found;
}

/** `<provider>` and `<dotPath>` are the skill's own placeholders, not rows. */
function isPlaceholder(token: string | undefined): boolean {
  return token !== undefined && token.startsWith("<");
}

function isFlag(token: string | undefined): boolean {
  return token !== undefined && token.startsWith("-");
}

const BUILTIN_HEADS = new Set([
  ...BUILTIN_COMMANDS.map((command) => command.name.split(" ")[0]),
  ...PLANNED_COMMANDS,
]);

describe("skills/apicity/SKILL.md front matter", () => {
  it("declares the skill's name", () => {
    expect(front.name).toBe("apicity");
  });

  it("describes what apicity is and when to use it", () => {
    expect(front.description).toBeDefined();
    expect((front.description ?? "").length).toBeGreaterThan(80);
    expect(front.description).toMatch(/provider API/i);
  });

  it("carries a non-empty trigger list", () => {
    expect(front.triggers).toBeDefined();
    expect(front.triggers?.length ?? 0).toBeGreaterThan(0);
    expect(front.triggers).toContain("apicity");
  });
});

describe("skills/apicity/SKILL.md body", () => {
  it("has the eight sections, in order", () => {
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
    expect(headings).toEqual(SECTIONS);
  });

  it("fits the context budget", () => {
    expect(Buffer.byteLength(skill, "utf8")).toBeLessThanOrEqual(MAX_BYTES);
  });

  it("names at most 150 distinct endpoint invocations", () => {
    const literals = new Set<string>();
    for (const invocation of invocations(body)) {
      if (BUILTIN_HEADS.has(invocation.head)) continue;
      if (isPlaceholder(invocation.head)) continue;
      if (isFlag(invocation.second) || isPlaceholder(invocation.second)) {
        continue;
      }
      if (invocation.second === undefined) continue;
      literals.add(`${invocation.head} ${invocation.second}`);
    }
    expect(literals.size).toBeLessThanOrEqual(MAX_ENDPOINT_LITERALS);
  });
});

describe("skills/apicity/SKILL.md invocations", () => {
  it("only names commands and endpoints that exist", async () => {
    const catalog = await loadCatalog({ env: {} });
    const providers = new Set(catalog.map((entry) => entry.provider));
    const pairs = new Set(
      catalog.map((entry) => `${entry.provider} ${entry.dotPath}`)
    );

    const unknown: string[] = [];
    for (const { head, second, text } of invocations(body)) {
      if (isPlaceholder(head) || isFlag(head)) continue;

      if (BUILTIN_HEADS.has(head)) {
        // The two built-ins that take a word of their own.
        if (isFlag(second) || second === undefined) continue;
        if (
          head === "help" &&
          !(HELP_TOPICS as readonly string[]).includes(second)
        ) {
          unknown.push(text);
        }
        if (head === "skill" && second !== "install") unknown.push(text);
        continue;
      }

      if (!providers.has(head)) {
        unknown.push(text);
        continue;
      }
      // `apicity <provider>` on its own is the commands shorthand.
      if (second === undefined || isFlag(second) || isPlaceholder(second)) {
        continue;
      }
      if (!pairs.has(`${head} ${second}`)) unknown.push(text);
    }

    expect(unknown).toEqual([]);
  });

  it("never demonstrates an invocation that would exit ambiguous", async () => {
    const catalog = await loadCatalog({ env: {} });
    const methods = new Map<string, string[]>();
    for (const entry of catalog) {
      const key = `${entry.provider} ${entry.dotPath}`;
      methods.set(key, [...(methods.get(key) ?? []), entry.method]);
    }

    const ambiguous: string[] = [];
    for (const { head, second, tokens, text } of invocations(body)) {
      if (BUILTIN_HEADS.has(head) || isPlaceholder(head) || isFlag(head)) {
        continue;
      }
      if (second === undefined || isFlag(second) || isPlaceholder(second)) {
        continue;
      }
      const carried = methods.get(`${head} ${second}`) ?? [];
      if (carried.length <= 1) continue;
      // `--help` on the endpoint form is `describe`, which picks the POST row
      // deliberately rather than refusing; every other form needs `--method`.
      const resolves = tokens.some(
        (token) =>
          token === "--method" ||
          token.startsWith("--method=") ||
          token === "--help" ||
          token === "-h"
      );
      if (!resolves) ambiguous.push(`${text} [${carried.join(", ")}]`);
    }

    expect(ambiguous).toEqual([]);
  });
});
