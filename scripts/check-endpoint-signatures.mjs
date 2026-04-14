#!/usr/bin/env node
/**
 * Warn when an endpoint's dotPath (where it lives in the factory object
 * tree) drifts from the upstream URL path.
 *
 * The convention (CLAUDE.md): `provider.<url-path-segment-by-segment>` with
 * kebab/snake → camelCase. This check flags drift so it can be reviewed
 * manually — it never fails the build.
 *
 * Standard REST aliases on the trailing segment (`list`, `retrieve`, `del`,
 * …) are allowed when everything before them matches the URL, since those
 * verbs never appear in the URL path itself.
 *
 * Usage:
 *   node scripts/check-endpoint-signatures.mjs
 */
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
} from "./lib/endpoint-walk.mjs";
import { urlToDotPath } from "./lib/url-to-dotpath.mjs";
import path from "node:path";

const REST_ALIASES = new Set([
  "list",
  "retrieve",
  "create",
  "del",
  "delete",
  "update",
  "cancel",
  "get",
  "results",
]);

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function matches(actual, expected) {
  if (arraysEqual(actual, expected)) return true;
  if (
    actual.length === expected.length + 1 &&
    REST_ALIASES.has(actual[actual.length - 1]) &&
    arraysEqual(actual.slice(0, -1), expected)
  ) {
    return true;
  }
  return false;
}

function hasSigOkComment(anchorNode) {
  const sourceFile = anchorNode.getSourceFile();
  const fullText = sourceFile.getFullText();
  const start = anchorNode.getStart(false);
  let cursor = fullText.lastIndexOf("\n", start - 1) + 1;
  while (cursor > 0) {
    const prevLineEnd = cursor - 1;
    if (prevLineEnd <= 0) break;
    const prevLineStart = fullText.lastIndexOf("\n", prevLineEnd - 1) + 1;
    const lineText = fullText.slice(prevLineStart, prevLineEnd).trim();
    if (!lineText.startsWith("//")) break;
    if (/^\/\/\s*sig-ok\b/.test(lineText)) return true;
    cursor = prevLineStart;
  }
  return false;
}

async function main() {
  const project = loadProject();
  const warnings = [];
  let total = 0;
  let skipped = 0;
  const seen = new Set();

  for await (const ep of walkAllEndpoints(project)) {
    const anchor = ep.commentNode ?? ep.propNode;
    const key = anchor
      ? `${anchor.getSourceFile().getFilePath()}:${anchor.getStart()}`
      : `${ep.file}:${ep.fullDotPath}:${ep.method}`;
    if (seen.has(key)) continue;
    seen.add(key);
    total++;

    if (!ep.fullUrl || ep.fullUrl === "?" || !ep.dotPath) {
      skipped++;
      continue;
    }
    if (anchor && hasSigOkComment(anchor)) {
      skipped++;
      continue;
    }
    const expected = urlToDotPath(ep.fullUrl, {
      keepFullHostname: ep.provider === "free",
    });
    if (!expected) {
      skipped++;
      continue;
    }
    const actual = ep.dotPath.split(".").filter(Boolean);
    if (matches(actual, expected)) continue;

    const relFile = path.relative(process.cwd(), ep.file);
    warnings.push({
      provider: ep.provider,
      actual: actual.join("."),
      expected: expected.join("."),
      url: ep.fullUrl,
      file: relFile,
    });
  }

  for (const w of warnings) {
    console.warn(
      `⚠  ${w.provider}.${w.actual}  ↔  url-derived ${w.expected}  (${w.url})\n   ${w.file}`
    );
  }

  const checked = total - skipped;
  console.log(
    `\nChecked ${checked} of ${total} endpoints across ${PROVIDERS.length} providers — ${warnings.length} signature warning${warnings.length === 1 ? "" : "s"}.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
