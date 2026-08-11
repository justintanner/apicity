#!/usr/bin/env node

import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  KIE_PRICING_ENDPOINT,
  KIE_PRICING_PAGE_SIZE,
  KiePricingPullError,
  collectPricingPages,
  comparePricingRows,
  fetchPricingPage,
  readJson,
  sha256Bytes,
  sha256Json,
  validateSnapshotMetadata,
  validateSnapshotRecordAlignment,
  validateCaptureContent,
  validateSourceIndex,
  writePullArtifacts,
} from "./lib/kie-pricing-pull.mjs";

const DEFAULT_ARTIFACT_ROOT = "tests/fixtures/kie-pricing-evidence";

function parseArgs(argv) {
  const [command = "help", ...tokens] = argv;
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) {
      throw new KiePricingPullError(
        "invalid-argument",
        `unexpected argument ${token}`
      );
    }
    const key = token.slice(2);
    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) {
      throw new KiePricingPullError(
        "invalid-argument",
        `missing value for --${key}`
      );
    }
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

function requiredOption(options, name) {
  if (!options[name]) {
    throw new KiePricingPullError("invalid-argument", `--${name} is required`);
  }
  return options[name];
}

function integerOption(options, name, fallback) {
  const value = options[name] ?? fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new KiePricingPullError(
      "invalid-argument",
      `--${name} must be a positive integer`
    );
  }
  return parsed;
}

function rawRowsFromSnapshot(value) {
  if (!Array.isArray(value.records)) {
    throw new KiePricingPullError(
      "invalid-baseline",
      "baseline must contain a records array"
    );
  }
  return value.records.map((record) => record.raw ?? record);
}

async function pull(options) {
  const artifactRoot = path.resolve(
    options["artifact-root"] ?? DEFAULT_ARTIFACT_ROOT
  );
  const endpoint = options.endpoint ?? KIE_PRICING_ENDPOINT;
  const pageSize = integerOption(options, "page-size", KIE_PRICING_PAGE_SIZE);
  const startedAt = new Date().toISOString();
  const collection = await collectPricingPages({
    endpoint,
    pageSize,
    fetchPage: (pageNum, requestedPageSize) =>
      fetchPricingPage({
        endpoint,
        pageNum,
        pageSize: requestedPageSize,
        apiKey: process.env.KIE_API_KEY,
      }),
  });
  const completedAt = new Date().toISOString();

  let baseline;
  if (options.baseline) {
    const baselinePath = path.resolve(options.baseline);
    const baselineValue = await readJson(baselinePath);
    const baselineRows = rawRowsFromSnapshot(baselineValue);
    baseline = {
      path: path.relative(process.cwd(), baselinePath),
      asOf: options["baseline-as-of"] ?? "2026-08-06",
      rows: baselineRows,
      comparison: comparePricingRows(
        collection.rows.map((row) => row.raw),
        baselineRows
      ),
    };
  }

  const artifacts = await writePullArtifacts({
    collection,
    artifactRoot,
    startedAt,
    completedAt,
    baseline,
  });
  const result = {
    status: "ok",
    command: "pull",
    endpoint,
    reportedTotal: collection.reportedTotal,
    capturedTotal: collection.capturedTotal,
    comparison: artifacts.metadata.comparison,
    snapshotPath: artifacts.snapshotPath,
    metadataPath: artifacts.metadataPath,
    captureRoot: artifacts.captureRoot,
    sourcesPath: artifacts.sourcesPath,
    snapshotSha256: artifacts.snapshotSha256,
  };
  console.log(JSON.stringify(result, null, 2));
}

async function checkSourceCaptures(metadata, snapshotPath) {
  const entries = metadata.sourceCaptures?.files ?? [];
  const snapshot = await readJson(snapshotPath);
  const sourcesPath = path.resolve(process.cwd(), requiredSourcePath(metadata));
  const sources = await readJson(sourcesPath);
  validateSourceIndex({ snapshot, metadata, sources });
  const artifactRoot = path.dirname(snapshotPath);
  const checked = [];
  for (const [index, entry] of entries.entries()) {
    const filePath = path.resolve(artifactRoot, entry.path);
    const contents = await readFile(filePath);
    const actual = sha256Bytes(contents);
    if (actual !== entry.sha256) {
      throw new KiePricingPullError(
        "source-capture-checksum-mismatch",
        `${entry.path} has checksum ${actual}, expected ${entry.sha256}`
      );
    }
    const capture = JSON.parse(contents);
    validateCaptureContent(snapshot, index, capture);
    checked.push(entry.path);
  }
  return { checked, sourcesPath };
}

function requiredSourcePath(metadata) {
  const sourcesPath = metadata.sourceCaptures?.sourcesPath;
  if (!sourcesPath) {
    throw new KiePricingPullError(
      "invalid-source-index",
      "metadata sourceCaptures.sourcesPath is required"
    );
  }
  return sourcesPath;
}

function checkSnapshotRows(snapshot) {
  const seen = new Set();
  for (const [index, record] of snapshot.records.entries()) {
    if (!record || typeof record !== "object" || !record.raw) {
      throw new KiePricingPullError(
        "invalid-snapshot-row",
        `records[${index}] must include raw row data`
      );
    }
    const rowHash = sha256Json(record.raw);
    if (record.rowHash !== rowHash) {
      throw new KiePricingPullError(
        "row-checksum-mismatch",
        `records[${index}] rowHash does not reproduce from raw data`
      );
    }
    if (seen.has(record.occurrenceId)) {
      throw new KiePricingPullError(
        "duplicate-occurrence-id",
        `records[${index}] repeats ${record.occurrenceId}`
      );
    }
    seen.add(record.occurrenceId);
  }
}

async function check(options) {
  const snapshotPath = path.resolve(requiredOption(options, "snapshot"));
  const metadataPath = path.resolve(requiredOption(options, "metadata"));
  const snapshotBytes = await readFile(snapshotPath);
  const snapshot = JSON.parse(snapshotBytes);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const summary = validateSnapshotMetadata(snapshot, metadata, snapshotBytes);
  validateSnapshotRecordAlignment(snapshot);
  checkSnapshotRows(snapshot);
  const captureResult = await checkSourceCaptures(metadata, snapshotPath);

  if (options.manifest) {
    const manifest = await readJson(path.resolve(options.manifest));
    if (
      manifest.snapshot?.sha256 &&
      manifest.snapshot.sha256 !== summary.actualHash
    ) {
      throw new KiePricingPullError(
        "manifest-checksum-mismatch",
        "manifest snapshot checksum does not match the snapshot"
      );
    }
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        command: "check",
        snapshotPath,
        metadataPath,
        snapshotSha256: summary.actualHash,
        capturedTotal: summary.capturedTotal,
        pageCount: summary.pageCount,
        sourceCapturesChecked: captureResult.checked.length,
        sourcesPath: captureResult.sourcesPath,
      },
      null,
      2
    )
  );
}

function printHelp() {
  console.log(`Usage:
  node scripts/kie-pricing-audit.mjs pull [--artifact-root PATH] [--baseline PATH]
  node scripts/kie-pricing-audit.mjs check --snapshot PATH --metadata PATH

pull writes committed evidence under ${DEFAULT_ARTIFACT_ROOT} by default and uses
POST ${KIE_PRICING_ENDPOINT} with pageSize ${KIE_PRICING_PAGE_SIZE}.
The optional KIE_API_KEY is sent only as a Bearer request header and is never
written to evidence.`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (command === "pull") return pull(options);
  if (command === "check") return check(options);
  printHelp();
}

try {
  await main();
} catch (error) {
  const result = {
    status: "error",
    code: error.code ?? "unexpected-error",
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  };
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
}
