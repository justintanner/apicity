/**
 * Generates a self-contained HTML report of changed HAR recordings.
 * Used in CI via: npx tsx tests/harness-report.ts > harness-report.html
 * Works locally too: npx tsx tests/harness-report.ts
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { type HarEntry, type HarRecording } from "./har-data.js";

interface ChangedRecording {
  filePath: string;
  changeType: "new" | "modified";
  provider: string;
  recordingName: string;
  entries: HarEntry[];
}

function getBaseBranch(): string {
  const base = process.env.GITHUB_BASE_REF;
  return base ? `origin/${base}` : "origin/main";
}

function getChangedRecordings(baseBranch: string): ChangedRecording[] {
  let diff: string;
  try {
    diff = execSync(
      `git diff --name-status --diff-filter=ACMR ${baseBranch}...HEAD -- tests/recordings/`,
      { encoding: "utf-8" }
    ).trim();
  } catch {
    return [];
  }

  if (!diff) return [];

  const recordings: ChangedRecording[] = [];

  for (const line of diff.split("\n")) {
    const [status, filePath] = line.split("\t");
    if (!filePath || !filePath.endsWith("recording.har")) continue;

    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) continue;

    let har: { log?: { _recordingName?: string; entries?: HarEntry[] } };
    try {
      har = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    } catch {
      continue;
    }

    const provider = extractProvider(filePath);
    const recordingName =
      har.log?._recordingName ?? path.basename(path.dirname(filePath));

    recordings.push({
      filePath,
      changeType: status === "A" ? "new" : "modified",
      provider,
      recordingName,
      entries: har.log?.entries ?? [],
    });
  }

  return recordings;
}

function extractProvider(filePath: string): string {
  const parts = filePath.split("/");
  const recordingsIdx = parts.indexOf("recordings");
  if (recordingsIdx < 0 || recordingsIdx + 1 >= parts.length) return "unknown";
  const providerDir = parts[recordingsIdx + 1];
  return providerDir.replace(/_\d+$/, "");
}

function generateHtml(changed: ChangedRecording[]): string {
  const viewerHtml = fs.readFileSync(
    path.resolve(import.meta.dirname, "har-viewer.html"),
    "utf-8"
  );

  const harRecordings: HarRecording[] = changed.map((r) => ({
    name: `${r.provider}/${r.recordingName}`,
    source: r.filePath,
    entries: r.entries,
  }));

  const data = {
    recordings: harRecordings,
    features: { gitApprove: false },
  };

  const dataScript = `<script>var HAR_DATA = ${JSON.stringify(data)};</script>`;
  return viewerHtml.replace("</head>", dataScript + "\n</head>");
}

function generateEmptyHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Harness Report</title>
<style>body{font-family:system-ui;background:#1e1e2e;color:#cdd6f4;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
p{font-size:16px;color:#6c7086}</style></head>
<body><p>No recording changes in this PR.</p></body></html>`;
}

const baseBranch = getBaseBranch();
const recordings = getChangedRecordings(baseBranch);

if (recordings.length === 0) {
  console.log(generateEmptyHtml());
} else {
  console.log(generateHtml(recordings));
}
