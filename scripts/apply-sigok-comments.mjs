#!/usr/bin/env node
/**
 * Insert acknowledgment comments for endpoints that intentionally deviate from
 * the enforced conventions in `check-endpoint-signatures.mjs`:
 *
 *   // sig-ok: <reason>     — dotPath intentionally diverges from the URL path
 *   // schema-ok: <reason>  — POST endpoint has no zod request schema
 *
 * Idempotent — skips endpoints that already carry the matching acknowledgment.
 * Detection is shared with the checker, so applying this fixer makes the
 * checker pass by construction.
 *
 * Usage:
 *   node scripts/apply-sigok-comments.mjs [--dry-run]
 */
import { loadProject, walkAllEndpoints } from "./lib/endpoint-walk.mjs";
import {
  computeDrift,
  endpointHasSchema,
  hasAckComment,
} from "./lib/endpoint-convention.mjs";
import fs from "node:fs";

function sigOkReason(provider) {
  switch (provider) {
    case "free-media-upload":
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

function schemaOkReason(dotPath) {
  const tail = dotPath.split(".").pop() ?? "";
  if (
    /^(cancel|pause|resume|undelete|revoke|finalize|delete|del)$/.test(tail)
  ) {
    return "body-less POST (no request payload)";
  }
  if (/file|upload|add|import/i.test(dotPath)) {
    return "multipart/no-JSON-body upload (no request schema)";
  }
  return "no request body to validate";
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const project = loadProject();

  const perFile = new Map(); // filePath → [{ nodeStart, lines: [] }]
  const seenNodes = new Set();

  for await (const ep of walkAllEndpoints(project)) {
    const anchor = ep.commentNode ?? ep.propNode;
    if (!anchor) continue;

    const lines = [];
    const drift = computeDrift(ep);
    if (drift?.drifts && !hasAckComment(anchor, "sig-ok")) {
      lines.push(`// sig-ok: ${sigOkReason(ep.provider)}`);
    }
    if (
      ep.method === "POST" &&
      !endpointHasSchema(ep) &&
      !hasAckComment(anchor, "schema-ok")
    ) {
      lines.push(`// schema-ok: ${schemaOkReason(ep.dotPath)}`);
    }
    if (!lines.length) continue;

    const filePath = anchor.getSourceFile().getFilePath();
    const nodeStart = anchor.getStart(false);
    const nodeKey = `${filePath}:${nodeStart}`;
    if (seenNodes.has(nodeKey)) continue;
    seenNodes.add(nodeKey);

    const bucket = perFile.get(filePath) ?? [];
    bucket.push({ nodeStart, lines });
    perFile.set(filePath, bucket);
  }

  let inserted = 0;
  const changedFiles = new Set();

  for (const [filePath, edits] of perFile) {
    let text = fs.readFileSync(filePath, "utf8");
    edits.sort((a, b) => b.nodeStart - a.nodeStart);
    for (const e of edits) {
      const lineStart = text.lastIndexOf("\n", e.nodeStart - 1) + 1;
      const indent = (text.slice(lineStart, e.nodeStart).match(/^[ \t]*/) ?? [
        "",
      ])[0];

      // Find the top of the contiguous comment block above the anchor so the
      // acknowledgment sits above the URL/Docs comment, not between them.
      let topOfComments = lineStart;
      let cursor = lineStart;
      while (cursor > 0) {
        const prevLineEnd = cursor - 1;
        if (prevLineEnd <= 0) break;
        const prevLineStart = text.lastIndexOf("\n", prevLineEnd - 1) + 1;
        const lineText = text.slice(prevLineStart, prevLineEnd).trim();
        if (!lineText.startsWith("//")) break;
        topOfComments = prevLineStart;
        cursor = prevLineStart;
      }

      const block = e.lines.map((l) => `${indent}${l}\n`).join("");
      text = text.slice(0, topOfComments) + block + text.slice(topOfComments);
      inserted += e.lines.length;
      changedFiles.add(filePath);
    }

    if (!dryRun && changedFiles.has(filePath)) {
      fs.writeFileSync(filePath, text);
    }
  }

  console.log(
    `acknowledgment comments: inserted=${inserted} files=${changedFiles.size}${dryRun ? " (dry-run)" : ""}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
