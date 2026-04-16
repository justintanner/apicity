#!/usr/bin/env node
/**
 * Insert a `// sig-ok: <reason>` comment line above any endpoint whose
 * dotPath drifts from its URL-derived signature. Idempotent — skips
 * endpoints that already carry a `// sig-ok:` line.
 *
 * Reasons are auto-classified by the kind of drift; tweak by hand later if
 * you want a more specific note.
 *
 * Usage:
 *   node scripts/apply-sigok-comments.mjs [--dry-run]
 */
import { loadProject, walkAllEndpoints } from "./lib/endpoint-walk.mjs";
import { urlToDotPath } from "./lib/url-to-dotpath.mjs";
import fs from "node:fs";

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

function reasonFor(provider) {
  switch (provider) {
    case "free":
      return "service-name grouping (multi-host wrapper)";
    case "fireworks":
      return "walker can't see baseURL override / management subpath";
    case "alibaba":
      return "dashscope subdomain hoisted by walker";
    case "fal":
      return "stylistic dotPath divergence from URL";
    case "kimicoding":
      return "ergonomic name (URL is /tokens/count)";
    default:
      return "intentional";
  }
}

function dryRunFlag(argv) {
  return argv.includes("--dry-run");
}

async function main() {
  const dryRun = dryRunFlag(process.argv);
  const project = loadProject();

  const perFile = new Map();
  const seenNodes = new Set();

  for await (const ep of walkAllEndpoints(project)) {
    if (!ep.fullUrl || ep.fullUrl === "?" || !ep.dotPath) continue;
    const expected = urlToDotPath(ep.fullUrl, {
      keepFullHostname: ep.provider === "free",
    });
    if (!expected) continue;
    const actual = ep.dotPath.split(".").filter(Boolean);
    if (matches(actual, expected)) continue;

    const anchor = ep.commentNode ?? ep.propNode;
    if (!anchor) continue;

    const filePath = anchor.getSourceFile().getFilePath();
    const nodeStart = anchor.getStart(false);
    const nodeKey = `${filePath}:${nodeStart}`;
    if (seenNodes.has(nodeKey)) continue;
    seenNodes.add(nodeKey);

    const bucket = perFile.get(filePath) ?? [];
    bucket.push({ nodeStart, reason: reasonFor(ep.provider) });
    perFile.set(filePath, bucket);
  }

  let inserted = 0;
  let alreadyMarked = 0;
  const changedFiles = new Set();

  for (const [filePath, edits] of perFile) {
    let text = fs.readFileSync(filePath, "utf8");
    edits.sort((a, b) => b.nodeStart - a.nodeStart);
    for (const e of edits) {
      const lineStart = text.lastIndexOf("\n", e.nodeStart - 1) + 1;
      const indent = (text.slice(lineStart, e.nodeStart).match(/^[ \t]*/) ?? [
        "",
      ])[0];

      // Find the topmost contiguous comment block above the anchor
      let topOfComments = lineStart;
      let cursor = lineStart;
      let hasSigOk = false;
      while (cursor > 0) {
        const prevLineEnd = cursor - 1;
        if (prevLineEnd <= 0) break;
        const prevLineStart = text.lastIndexOf("\n", prevLineEnd - 1) + 1;
        const lineText = text.slice(prevLineStart, prevLineEnd).trim();
        if (!lineText.startsWith("//")) break;
        if (/^\/\/\s*sig-ok\b/.test(lineText)) hasSigOk = true;
        topOfComments = prevLineStart;
        cursor = prevLineStart;
      }

      if (hasSigOk) {
        alreadyMarked++;
        continue;
      }

      const newLine = `${indent}// sig-ok: ${e.reason}\n`;
      text = text.slice(0, topOfComments) + newLine + text.slice(topOfComments);
      inserted++;
      changedFiles.add(filePath);
    }

    if (!dryRun && changedFiles.has(filePath)) {
      fs.writeFileSync(filePath, text);
    }
  }

  console.log(
    `sig-ok markers: inserted=${inserted} alreadyMarked=${alreadyMarked} files=${changedFiles.size}${dryRun ? " (dry-run)" : ""}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
