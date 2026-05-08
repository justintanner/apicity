/**
 * Generates a SPA shell HTML report of changed HAR recordings.
 * Emits a directory containing:
 *   - harness-report.html : SPA shell with manifest
 *   - har-data-<shortSha>.json : per-commit recording data
 *
 * CI via: npx tsx tests/harness-report.ts --out-dir <path> [--media-only]
 * Local: npx tsx tests/harness-report.ts [--media-only]
 */

import fs from "node:fs";
import path from "node:path";
import {
  type HarRecording,
  getBaseBranch,
  getCommitsOnBranch,
  getChangedRecordingsByCommit,
  recordingHasMedia,
} from "./har-data.js";

interface ManifestEntry {
  sha: string;
  shortSha: string;
  subject: string;
  author: string;
  date: string;
  recordingCount: number;
  dataUrl?: string;
}

function generateSpaHtml(manifest: ManifestEntry[]): string {
  const viewerHtml = fs.readFileSync(
    path.resolve(import.meta.dirname, "har-viewer.html"),
    "utf-8"
  );

  const manifestScript = `<script>var HAR_MANIFEST = ${JSON.stringify(manifest)};</script>`;
  return viewerHtml.replace("</head>", manifestScript + "\n</head>");
}

function generateEmptyHtml(mediaOnly: boolean): string {
  const message = mediaOnly
    ? "No media-bearing recording changes in this PR."
    : "No recording changes in this PR.";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Harness Report</title>
<style>body{font-family:system-ui;background:#1e1e2e;color:#cdd6f4;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
p{font-size:16px;color:#6c7086}</style></head>
<body><p>${message}</p></body></html>`;
}

// --- CLI parsing ---
const mediaOnly = process.argv.includes("--media-only");
const outDirIdx = process.argv.indexOf("--out-dir");
const outDir = outDirIdx >= 0 ? process.argv[outDirIdx + 1] : ".";
if (outDirIdx >= 0 && !outDir) {
  console.error(
    "Usage: npx tsx tests/harness-report.ts [--out-dir <path>] [--media-only]"
  );
  process.exit(1);
}

const baseBranch = getBaseBranch();
const commits = getCommitsOnBranch(baseBranch);

// No commits on branch → empty state
if (commits.length === 0) {
  const emptyHtml = generateEmptyHtml(mediaOnly);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "harness-report.html"),
    emptyHtml,
    "utf-8"
  );
  process.exit(0);
}

const changeset = getChangedRecordingsByCommit(baseBranch);

const manifest: ManifestEntry[] = [];
let totalRecordings = 0;

for (const commit of commits) {
  let recordings = changeset.get(commit.sha) ?? [];
  if (mediaOnly) {
    recordings = recordings.filter(recordingHasMedia);
  }

  totalRecordings += recordings.length;

  if (recordings.length > 0) {
    const harRecordings: HarRecording[] = recordings.map((r) => ({
      name: `${r.provider}/${r.recordingName}`,
      source: r.filePath,
      entries: r.entries,
    }));

    const jsonFileName = `har-data-${commit.shortSha}.json`;
    fs.writeFileSync(
      path.join(outDir, jsonFileName),
      JSON.stringify(harRecordings, null, 2),
      "utf-8"
    );

    manifest.push({
      sha: commit.sha,
      shortSha: commit.shortSha,
      subject: commit.subject,
      author: commit.author,
      date: commit.date,
      recordingCount: recordings.length,
      dataUrl: jsonFileName,
    });
  } else {
    manifest.push({
      sha: commit.sha,
      shortSha: commit.shortSha,
      subject: commit.subject,
      author: commit.author,
      date: commit.date,
      recordingCount: 0,
    });
  }
}

const html =
  totalRecordings === 0
    ? generateEmptyHtml(mediaOnly)
    : generateSpaHtml(manifest);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "harness-report.html"), html, "utf-8");
