#!/usr/bin/env node
/**
 * Apply a 2-line URL comment above every endpoint in a provider's factory:
 *
 *   // POST https://api.openai.com/v1/chat/completions
 *   // Docs: https://platform.openai.com/docs/api-reference/chat/create
 *
 * Reads endpoint metadata from scripts/endpoint-docs.tsv (source of truth for
 * docsUrl). Idempotent: if the two comment lines already sit immediately above
 * the endpoint property assignment, they are replaced; otherwise inserted.
 *
 * Usage:
 *   node scripts/apply-endpoint-comments.mjs [--provider=<name>] [--dry-run]
 */
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
} from "./lib/endpoint-walk.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TSV_PATH = path.join(__dirname, "endpoint-docs.tsv");

function parseArgs(argv) {
  const args = { provider: null, dryRun: false };
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") args.dryRun = true;
    else if (a.startsWith("--provider="))
      args.provider = a.slice("--provider=".length);
  }
  return args;
}

function loadTsv() {
  if (!fs.existsSync(TSV_PATH)) {
    throw new Error(
      `${TSV_PATH} not found. Run \`node scripts/endpoint-map.mjs\` first.`
    );
  }
  const text = fs.readFileSync(TSV_PATH, "utf8");
  const lines = text.split("\n").filter(Boolean);
  const [, ...rest] = lines;
  const map = new Map();
  for (const line of rest) {
    const [provider, dotPath, method, fullUrl, docsUrl] = line.split("\t");
    const key = `${provider}\t${dotPath}\t${method}`;
    map.set(key, {
      provider,
      dotPath,
      method,
      fullUrl,
      docsUrl: docsUrl ?? "",
    });
  }
  return map;
}

async function main() {
  const args = parseArgs(process.argv);
  const tsv = loadTsv();
  const project = loadProject();

  const providers = args.provider
    ? PROVIDERS.filter((p) => p.name === args.provider)
    : PROVIDERS;
  if (args.provider && !providers.length) {
    throw new Error(`Unknown provider: ${args.provider}`);
  }

  // Phase 1: collect all edit targets (filePath, nodeStart, lines) while the
  // AST is still stable. We capture the node position up-front and do the
  // mutations in Phase 2 against the raw text of each file, avoiding ts-morph
  // node invalidation from mid-walk mutations.
  const perFile = new Map(); // filePath -> [{ nodeStart, lines }]
  let missingDocs = 0;
  const seenNodes = new Set();

  for await (const ep of walkAllEndpoints(project)) {
    if (!providers.find((p) => p.name === ep.provider)) continue;
    if (!ep.method || !ep.fullUrl) continue;
    const anchor = ep.commentNode ?? ep.propNode;
    if (!anchor) continue;

    const key = `${ep.provider}\t${ep.dotPath}\t${ep.method}`;
    const row = tsv.get(key);
    const docsUrl = row?.docsUrl ?? "";
    if (!docsUrl) {
      missingDocs++;
      continue;
    }

    const filePath = anchor.getSourceFile().getFilePath();
    const nodeStart = anchor.getStart(false);
    const nodeKey = `${filePath}:${nodeStart}`;
    if (seenNodes.has(nodeKey)) continue;
    seenNodes.add(nodeKey);

    const line1 = `// ${ep.method} ${ep.fullUrl}`;
    const line2 = `// Docs: ${docsUrl}`;
    const bucket = perFile.get(filePath) ?? [];
    bucket.push({ nodeStart, lines: [line1, line2] });
    perFile.set(filePath, bucket);
  }

  // Phase 2: for each file, apply the edits in descending nodeStart order so
  // earlier positions remain valid as we mutate later ones.
  let inserted = 0;
  let replaced = 0;
  const changedFiles = new Set();

  for (const [filePath, edits] of perFile) {
    let text = fs.readFileSync(filePath, "utf8");
    edits.sort((a, b) => b.nodeStart - a.nodeStart);
    for (const e of edits) {
      // Find the start of the line that contains nodeStart
      const lineStart = text.lastIndexOf("\n", e.nodeStart - 1) + 1;
      const indent = (text.slice(lineStart, e.nodeStart).match(/^[ \t]*/) ?? [
        "",
      ])[0];

      // Scan backward for any existing matching comment lines we own.
      const existing = [];
      let cursor = lineStart;
      while (cursor > 0) {
        const prevLineEnd = cursor - 1; // '\n'
        if (prevLineEnd <= 0) break;
        const prevLineStart = text.lastIndexOf("\n", prevLineEnd - 1) + 1;
        const lineText = text.slice(prevLineStart, prevLineEnd);
        const trimmed = lineText.trim();
        if (!trimmed.startsWith("//")) break;
        if (
          // Our canonical 2-line comment
          /^\/\/\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s+https?:\/\//.test(
            trimmed
          ) ||
          /^\/\/\s+Docs:\s+https?:\/\//.test(trimmed) ||
          // Legacy style: `// POST /files` or `// GET /models (list)`
          /^\/\/\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s+\//.test(trimmed) ||
          // Legacy namespace header: `// POST v1 namespace`
          /^\/\/\s+(GET|POST|PUT|DELETE|PATCH|HEAD)\s+\w+\s+namespace/i.test(
            trimmed
          )
        ) {
          existing.unshift({ start: prevLineStart, end: cursor });
          cursor = prevLineStart;
          continue;
        }
        break;
      }

      const newBlock = e.lines.map((l) => `${indent}${l}`).join("\n") + "\n";

      if (existing.length === 0) {
        text = text.slice(0, lineStart) + newBlock + text.slice(lineStart);
        inserted++;
        changedFiles.add(filePath);
      } else {
        const replaceStart = existing[0].start;
        const replaceEnd = existing[existing.length - 1].end;
        const current = text.slice(replaceStart, replaceEnd);
        if (current === newBlock) continue;
        text = text.slice(0, replaceStart) + newBlock + text.slice(replaceEnd);
        replaced++;
        changedFiles.add(filePath);
      }
    }

    if (args.dryRun) {
      console.log(
        `=== ${path.relative(process.cwd(), filePath)} (dry-run) ===`
      );
      // Show just the count + first few lines of diff-able context
      console.log(`  ${edits.length} edits prepared`);
    } else if (changedFiles.has(filePath)) {
      fs.writeFileSync(filePath, text);
    }
  }

  console.log(
    `inserted=${inserted} replaced=${replaced} missingDocs=${missingDocs} files=${changedFiles.size}${args.dryRun ? " (dry-run)" : ""}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
