#!/usr/bin/env node
import { loadProject, walkAllEndpoints } from "./lib/endpoint-walk.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_PATH = path.join(__dirname, "endpoint-docs.tsv");

async function main() {
  const project = loadProject();
  const rows = [];
  const seen = new Set();
  for await (const ep of walkAllEndpoints(project)) {
    const method = ep.method ?? "?";
    const fullUrl = ep.fullUrl ?? "?";
    const key = `${ep.provider}\t${ep.dotPath}\t${method}\t${fullUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      provider: ep.provider,
      dotPath: ep.dotPath,
      method,
      fullUrl,
      docsUrl: "",
    });
  }
  rows.sort((a, b) => {
    if (a.provider !== b.provider) return a.provider < b.provider ? -1 : 1;
    if (a.dotPath !== b.dotPath) return a.dotPath < b.dotPath ? -1 : 1;
    if (a.method !== b.method) return a.method < b.method ? -1 : 1;
    return 0;
  });

  // Preserve existing docsUrl values from an existing TSV.
  const existing = new Map();
  if (fs.existsSync(OUT_PATH)) {
    const text = fs.readFileSync(OUT_PATH, "utf8");
    const lines = text.split("\n").filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const [provider, dotPath, , , docsUrl] = lines[i].split("\t");
      existing.set(`${provider}\t${dotPath}`, docsUrl ?? "");
    }
  }

  const header = ["provider", "dotPath", "method", "fullUrl", "docsUrl"].join(
    "\t"
  );
  const body = rows
    .map((r) => {
      const key = `${r.provider}\t${r.dotPath}`;
      const prev = existing.get(key);
      const docs = prev && prev.length > 0 ? prev : r.docsUrl;
      return [r.provider, r.dotPath, r.method, r.fullUrl, docs].join("\t");
    })
    .join("\n");

  fs.writeFileSync(OUT_PATH, header + "\n" + body + "\n");

  // Print a summary
  const counts = new Map();
  for (const r of rows) {
    counts.set(r.provider, (counts.get(r.provider) ?? 0) + 1);
  }
  console.log(
    `Wrote ${rows.length} endpoints to ${path.relative(process.cwd(), OUT_PATH)}`
  );
  for (const [p, n] of [...counts.entries()].sort()) {
    console.log(`  ${p}: ${n}`);
  }

  // Report any rows with missing method or fullUrl
  const missing = rows.filter((r) => r.method === "?" || r.fullUrl === "?");
  if (missing.length > 0) {
    console.log(`\n${missing.length} endpoints with missing method/URL:`);
    for (const r of missing.slice(0, 30)) {
      console.log(
        `  ${r.provider}.${r.dotPath}  method=${r.method}  url=${r.fullUrl}`
      );
    }
    if (missing.length > 30) console.log(`  ... +${missing.length - 30} more`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
