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
 *   node scripts/check-endpoint-comments.mjs [--provider openai]
 */
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
  TSV_ONLY_PROVIDERS,
} from "./lib/endpoint-walk.mjs";
import path from "node:path";

// Per-provider allow-list of hostnames that may appear in `// Docs:` lines.
// Keeps reviewers from accidentally pasting e.g. an openai docs URL onto an
// xai endpoint. Populated as specific docs URLs are filled in.
const DOCS_HOSTNAME_ALLOWLIST = {
  zaicoding: ["docs.z.ai"],
  openai: ["platform.openai.com", "developers.openai.com"],
  xai: ["docs.x.ai"],
  anthropic: ["docs.anthropic.com", "docs.claude.com"],
  fireworks: ["docs.fireworks.ai", "fireworks.ai"],
  fal: ["docs.fal.ai", "fal.ai"],
  kie: ["docs.kie.ai", "kie.ai"],
  kimicoding: ["platform.moonshot.ai", "platform.moonshot.cn"],
  google: ["docs.cloud.google.com", "cloud.google.com"],
  googleflow: ["useapi.net"],
  alibaba: [
    "help.aliyun.com",
    "bailian.console.aliyun.com",
    "dashscope.console.aliyun.com",
    "www.alibabacloud.com",
  ],
  binance: ["developers.binance.com"],
  dropbox: ["www.dropbox.com"],
  openligadb: ["api.openligadb.de", "github.com"],
  openf1: ["openf1.org"],
  s3: ["docs.aws.amazon.com"],
  "free-media-upload": [
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
  x: ["docs.x.com"],
  meta: ["developers.facebook.com"],
  polymarket: ["docs.polymarket.com"],
  youtube: ["developers.google.com", "github.com"],
  telegram: ["core.telegram.org"],
  quo: ["www.quo.com"],
  dolthub: ["www.dolthub.com", "dolthub.com"],
  simplefunctions: ["docs.simplefunctions.dev"],
  thesportsdb: ["www.thesportsdb.com", "thedatadb.readme.io"],
};

const METHOD_LINE_RE =
  /^\s*\/\/\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s+(https?:\/\/\S+)\s*$/;
const DOCS_LINE_RE = /^\s*\/\/\s+Docs:\s+(https?:\/\/\S+)\s*$/;

function parseArgs(argv) {
  const options = {
    providers: new Set(),
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--provider" || arg === "--providers") {
      if (i + 1 >= argv.length) {
        throw new Error(`${arg} requires a comma-separated provider list`);
      }
      i++;
      addProviders(options.providers, argv[i]);
      continue;
    }
    if (arg.startsWith("--provider=") || arg.startsWith("--providers=")) {
      addProviders(options.providers, arg.slice(arg.indexOf("=") + 1));
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  validateProviders(options.providers);
  return options;
}

function addProviders(providers, value) {
  for (const provider of value.split(",")) {
    const normalized = provider.trim();
    if (normalized) providers.add(normalized);
  }
}

function validateProviders(providers) {
  const known = new Set([
    ...PROVIDERS.map((provider) => provider.name),
    ...TSV_ONLY_PROVIDERS,
  ]);
  const unknown = [...providers].filter((provider) => !known.has(provider));
  if (unknown.length) {
    throw new Error(
      `Unknown provider(s): ${unknown.join(", ")}. ` +
        `Known providers: ${[...known].join(", ")}`
    );
  }
}

function usage() {
  console.log(`Usage: node scripts/check-endpoint-comments.mjs [options]

  --provider <list>    Comma-separated provider filter, e.g. "openai,xai"
  --providers <list>   Alias for --provider
  --help, -h           Show this help`);
}

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
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const providers = [...options.providers];
  const project = loadProject(providers);
  const errors = [];
  let total = 0;
  const seen = new Set();

  for await (const ep of walkAllEndpoints(project, { providers })) {
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

  const providerLabel =
    providers.length > 0
      ? ` for ${providers.join(", ")}`
      : ` across ${PROVIDERS.length} providers`;

  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(
      `\n${errors.length} endpoint comment violation(s) across ${total} endpoints${providerLabel}.`
    );
    process.exit(1);
  }
  console.log(
    `Checked ${total} endpoints${providerLabel} — all have valid URL comments.`
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
