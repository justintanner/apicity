#!/usr/bin/env node
/**
 * One-off seed script: cluster-fill the `docsUrl` column in
 * scripts/endpoint-docs.tsv with provider docs roots (or host-specific roots
 * for "free") for every row whose docsUrl is currently empty.
 *
 * Run once to bootstrap the TSV, then hand-edit specific rows to point at
 * more precise docs pages. Running again is safe — existing non-empty
 * docsUrl values are preserved.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TSV_PATH = path.join(__dirname, "endpoint-docs.tsv");

const DEFAULT_DOCS = {
  openai: () => "https://platform.openai.com/docs/api-reference",
  xai: () => "https://docs.x.ai/docs/api-reference",
  anthropic: () => "https://docs.anthropic.com/en/api",
  fireworks: () => "https://docs.fireworks.ai/api-reference",
  fal: () => "https://docs.fal.ai",
  kie: () => "https://docs.kie.ai",
  kimicoding: () => "https://platform.moonshot.ai/docs",
  alibaba: () => "https://help.aliyun.com/zh/model-studio",
  free: (row) => {
    // Match the first segment of dotPath to a per-host docs page.
    const seg = row.dotPath.split(".")[0];
    return (
      {
        tmpfiles: "https://tmpfiles.org/",
        uguu: "https://uguu.se/",
        catbox: "https://catbox.moe/tools.php",
        litterbox: "https://litterbox.catbox.moe/",
        gofile: "https://gofile.io/api",
        filebin: "https://filebin.net/",
        tempsh: "https://temp.sh/",
        tflink: "https://tmpfile.link/",
      }[seg] ?? "https://tmpfiles.org/"
    );
  },
};

function main() {
  const text = fs.readFileSync(TSV_PATH, "utf8");
  const lines = text.split("\n").filter(Boolean);
  const [header, ...rows] = lines;

  const out = [header];
  let filled = 0;
  for (const line of rows) {
    const parts = line.split("\t");
    const [provider, dotPath, method, fullUrl, docsUrl = ""] = parts;
    if (docsUrl) {
      out.push(line);
      continue;
    }
    const provide = DEFAULT_DOCS[provider];
    const docs = provide ? provide({ provider, dotPath, method, fullUrl }) : "";
    if (docs) filled++;
    out.push([provider, dotPath, method, fullUrl, docs].join("\t"));
  }

  fs.writeFileSync(TSV_PATH, out.join("\n") + "\n");
  console.log(`Filled ${filled} docsUrl cells with provider/host defaults.`);
}

main();
