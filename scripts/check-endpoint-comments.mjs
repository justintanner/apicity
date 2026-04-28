#!/usr/bin/env node
/**
 * Verify every endpoint in every provider factory has the two-line URL comment:
 *
 *   // <METHOD> <fullUrl>
 *   // Docs: <docsUrl>
 *
 * Exits non-zero if any endpoint is missing the comment, has malformed lines,
 * or has a docs URL whose hostname isn't on the per-provider allow-list.
 *
 * Usage:
 *   node scripts/check-endpoint-comments.mjs
 */
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
} from "./lib/endpoint-walk.mjs";
import path from "node:path";

// Per-provider allow-list of hostnames that may appear in `// Docs:` lines.
// Keeps reviewers from accidentally pasting e.g. an openai docs URL onto an
// xai endpoint. Populated as specific docs URLs are filled in.
const DOCS_HOSTNAME_ALLOWLIST = {
  openai: ["platform.openai.com"],
  xai: ["docs.x.ai"],
  anthropic: ["docs.anthropic.com", "docs.claude.com"],
  fireworks: ["docs.fireworks.ai", "fireworks.ai"],
  fal: ["docs.fal.ai", "fal.ai"],
  kie: ["docs.kie.ai", "kie.ai"],
  kimicoding: ["platform.moonshot.ai", "platform.moonshot.cn"],
  alibaba: [
    "help.aliyun.com",
    "bailian.console.aliyun.com",
    "dashscope.console.aliyun.com",
    "www.alibabacloud.com",
  ],
  free: [
    "tmpfiles.org",
    "uguu.se",
    "catbox.moe",
    "litterbox.catbox.moe",
    "gofile.io",
    "filebin.net",
    "temp.sh",
    "tmpfile.link",
  ],
  elevenlabs: ["elevenlabs.io"],
};

const METHOD_LINE_RE =
  /^\s*\/\/\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s+(https?:\/\/\S+)\s*$/;
const DOCS_LINE_RE = /^\s*\/\/\s+Docs:\s+(https?:\/\/\S+)\s*$/;

function getLeadingCommentLines(node) {
  const sourceFile = node.getSourceFile();
  const fullText = sourceFile.getFullText();
  const start = node.getStart(false);
  let lineStart = fullText.lastIndexOf("\n", start - 1) + 1;

  const lines = [];
  let cursor = lineStart;
  while (cursor > 0) {
    const prevLineEnd = cursor - 1;
    if (prevLineEnd <= 0) break;
    const prevLineStart = fullText.lastIndexOf("\n", prevLineEnd - 1) + 1;
    const lineText = fullText.slice(prevLineStart, prevLineEnd);
    const trimmed = lineText.trim();
    if (!trimmed.startsWith("//")) break;
    lines.unshift(lineText);
    cursor = prevLineStart;
  }
  return lines;
}

function hostnameOf(urlStr) {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return null;
  }
}

async function main() {
  const project = loadProject();
  const errors = [];
  let total = 0;
  const seen = new Set();

  for await (const ep of walkAllEndpoints(project)) {
    // Dedup by the node we'd attach a comment to (definition anchor)
    const anchor = ep.commentNode ?? ep.propNode;
    const nodeKey = anchor
      ? `${anchor.getSourceFile().getFilePath()}:${anchor.getStart()}`
      : `${ep.file}:${ep.fullDotPath}:${ep.method}`;
    if (seen.has(nodeKey)) continue;
    seen.add(nodeKey);
    total++;
    const relFile = path.relative(process.cwd(), ep.file);
    const label = `${ep.provider}.${ep.dotPath} (${ep.method ?? "?"})`;

    if (!anchor) {
      errors.push(
        `${relFile}: ${label}: unable to locate definition anchor for comment check`
      );
      continue;
    }

    const leading = getLeadingCommentLines(anchor);
    // Take the last two leading comment lines (the ones immediately above the node).
    const lastTwo = leading.slice(-2);
    if (lastTwo.length < 2) {
      errors.push(
        `${relFile}: ${label}: missing 2-line URL comment above the endpoint`
      );
      continue;
    }
    const [methodLine, docsLine] = lastTwo;
    const methodMatch = methodLine.match(METHOD_LINE_RE);
    const docsMatch = docsLine.match(DOCS_LINE_RE);
    if (!methodMatch) {
      errors.push(
        `${relFile}: ${label}: first comment line must match \`// <METHOD> <url>\` — got: ${methodLine.trim()}`
      );
      continue;
    }
    if (!docsMatch) {
      errors.push(
        `${relFile}: ${label}: second comment line must match \`// Docs: <url>\` — got: ${docsLine.trim()}`
      );
      continue;
    }
    const [, commentMethod, commentUrl] = methodMatch;
    const [, commentDocs] = docsMatch;

    if (ep.method && commentMethod !== ep.method) {
      errors.push(
        `${relFile}: ${label}: comment method ${commentMethod} does not match code-derived ${ep.method}`
      );
    }
    if (ep.fullUrl && ep.fullUrl !== "?" && commentUrl !== ep.fullUrl) {
      errors.push(
        `${relFile}: ${label}: comment URL ${commentUrl} does not match code-derived ${ep.fullUrl}`
      );
    }
    const allow = DOCS_HOSTNAME_ALLOWLIST[ep.provider] ?? [];
    const host = hostnameOf(commentDocs);
    if (allow.length && host && !allow.includes(host)) {
      errors.push(
        `${relFile}: ${label}: docs host ${host} not in allow-list for ${ep.provider} (${allow.join(", ")})`
      );
    }
  }

  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(
      `\n${errors.length} endpoint comment violation(s) across ${total} endpoints.`
    );
    process.exit(1);
  }
  console.log(
    `Checked ${total} endpoints across ${PROVIDERS.length} providers — all have valid URL comments.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
