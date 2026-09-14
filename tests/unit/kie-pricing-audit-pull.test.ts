import { mkdtempSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import fixtures from "../fixtures/kie-pricing-page-sequences.json";
import {
  atomicWriteFile,
  canonicalJson,
  collectPricingPages,
  fetchPricingPage,
  parsePageResponse,
  requestSummary,
  resolveBaselineAsOf,
  sanitizeCapture,
  sha256Json,
  validateRequestSummary,
  validateSnapshotMetadata,
  validateSnapshotRecordAlignment,
  validateCaptureContent,
  validateSourceIndex,
  writePullArtifacts,
} from "../../scripts/lib/kie-pricing-pull.mjs";
import { check, parseArgs, pull } from "../../scripts/kie-pricing-audit.mjs";
import {
  KIE_PRICING_METADATA_PATH,
  KIE_PRICING_SNAPSHOT_PATH,
} from "../../scripts/lib/kie-pricing-evidence-paths.mjs";

type FixturePage = Record<string, unknown>;
type FixtureSet = Record<string, FixturePage[]>;

interface TestResponse {
  [key: string]: unknown;
  data: {
    [key: string]: unknown;
    records: Array<Record<string, unknown>>;
  };
}

interface TestRow {
  occurrenceId: string;
  rowHash: string;
  semanticKey: string;
  raw: Record<string, unknown>;
}

interface TestSnapshot {
  schema: string;
  pages: Array<{ pageNum: number; response: TestResponse }>;
  records: TestRow[];
}

interface TestCollection {
  reportedTotal: number;
  capturedTotal: number;
  pages: Array<{ pageNum: number }>;
  rows: TestRow[];
  duplicateAnalysis: { rawDuplicateOccurrences: number };
  responseCompleteness: { complete: boolean };
}

const pageFixtures = fixtures as FixtureSet;

function sequenceFetcher(sequence: FixturePage[]) {
  return async (pageNum: number) => {
    const body = sequence[pageNum - 1];
    if (!body) throw new Error(`fixture has no page ${pageNum}`);
    return parsePageResponse(body, pageNum);
  };
}

async function expectPullFailure(name: string, code: string) {
  await expect(
    collectPricingPages({
      fetchPage: sequenceFetcher(pageFixtures[name]),
      pageSize: 2,
      endpoint: "https://example.test/pricing",
    })
  ).rejects.toMatchObject({ code });
}

async function makeAnnotatedSnapshot() {
  const result = (await collectPricingPages({
    fetchPage: sequenceFetcher(pageFixtures.valid),
    pageSize: 2,
  })) as unknown as {
    pages: Array<{ pageNum: number; response: TestResponse }>;
    rows: TestRow[];
  };
  return {
    schema: "gc.kie-pricing-snapshot.v1",
    pages: result.pages.map((page) => ({
      pageNum: page.pageNum,
      response: page.response,
    })),
    records: result.rows.map((row) => ({
      occurrenceId: row.occurrenceId,
      rowHash: row.rowHash,
      semanticKey: row.semanticKey,
      raw: row.raw,
    })),
  } satisfies TestSnapshot;
}

describe("Kie pricing pagination", () => {
  it("captures every page and preserves API order", async () => {
    const result = (await collectPricingPages({
      fetchPage: sequenceFetcher(pageFixtures.valid),
      pageSize: 2,
    })) as unknown as TestCollection;

    expect(result.reportedTotal).toBe(3);
    expect(result.capturedTotal).toBe(3);
    expect(result.pages.map((page) => page.pageNum)).toEqual([1, 2]);
    expect(result.rows.map((row) => row.raw.modelDescription)).toEqual([
      "Fixture model A",
      "Fixture model B",
      "Fixture model C",
    ]);
    expect(result.responseCompleteness.complete).toBe(true);
  });

  it("fails closed when the reported total changes", async () => {
    await expectPullFailure("changingTotal", "changing-total");
  });

  it("fails closed on a repeated page identity", async () => {
    await expectPullFailure("repeatedPages", "repeated-page");
  });

  it("fails closed on an empty page before the final page", async () => {
    await expectPullFailure("earlyEmpty", "early-empty-page");
  });

  it("retains duplicate occurrences with ordinal occurrence IDs", async () => {
    const result = (await collectPricingPages({
      fetchPage: sequenceFetcher(pageFixtures.duplicateOccurrences),
      pageSize: 2,
    })) as unknown as TestCollection;

    expect(result.duplicateAnalysis.rawDuplicateOccurrences).toBe(1);
    expect(result.rows[0].occurrenceId).toMatch(/#1$/);
    expect(result.rows[1].occurrenceId).toMatch(/#2$/);
    expect(result.rows[0].rowHash).toBe(result.rows[1].rowHash);
  });

  it("rejects malformed row cells instead of dropping them", async () => {
    expect(() =>
      parsePageResponse(pageFixtures.malformedRows[0], 1)
    ).toThrowError(expect.objectContaining({ code: "malformed-row" }));
  });

  it("rejects a page row reorder even when row counts still match", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    snapshot.pages[0].response.data.records.reverse();

    expect(() => validateSnapshotRecordAlignment(snapshot)).toThrowError(
      expect.objectContaining({ code: "snapshot-record-divergence" })
    );
  });

  it("rejects a substituted annotated row even when its hash is recomputed", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    snapshot.records[0].raw = {
      ...snapshot.records[0].raw,
      modelDescription: "substituted after pull",
    };
    snapshot.records[0].rowHash = sha256Json(snapshot.records[0].raw);

    expect(() => validateSnapshotRecordAlignment(snapshot)).toThrowError(
      expect.objectContaining({ code: "snapshot-record-divergence" })
    );
  });
});

describe("Kie pricing HTTP and evidence safety", () => {
  it("fails closed on HTTP errors", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ error: "temporarily unavailable" }), {
        status: 503,
      });

    await expect(
      fetchPricingPage({ fetchImpl, pageNum: 1, pageSize: 100 })
    ).rejects.toMatchObject({ code: "http-status" });
  });

  it("fails closed on a non-JSON response", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response("<!doctype html>", { status: 200 });

    await expect(
      fetchPricingPage({ fetchImpl, pageNum: 1, pageSize: 100 })
    ).rejects.toMatchObject({ code: "malformed-json" });
  });

  it("redacts secret-like response fields in source captures", () => {
    expect(
      sanitizeCapture({ apiKey: "secret", nested: { token: "secret" } })
    ).toEqual({ apiKey: "[REDACTED]", nested: { token: "[REDACTED]" } });
  });

  it("removes temporary files after an atomic rename failure", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "kie-pricing-atomic-"));
    const target = path.join(root, "artifact.json");
    const temporary = path.join(root, "artifact.tmp");
    const removed: string[] = [];

    await expect(
      atomicWriteFile(target, "{}\n", {
        tempPath: temporary,
        renameImpl: async () => {
          throw new Error("simulated rename failure");
        },
        removeImpl: async (filePath, options) => {
          removed.push(String(filePath));
          await rm(filePath, options);
        },
      } as Parameters<typeof atomicWriteFile>[2] & { tempPath: string })
    ).rejects.toThrow("simulated rename failure");

    expect(removed).toEqual([temporary]);
    await expect(readFile(temporary)).rejects.toMatchObject({ code: "ENOENT" });
    await rm(root, { recursive: true, force: true });
  });

  it("requires one capture entry per snapshot page", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    const metadata = {
      sourceCaptures: {
        files: [
          {
            pageNum: 1,
            path: "captures/page-001.json",
            sha256: "sha256:one",
          },
        ],
      },
    };

    expect(() =>
      validateSourceIndex({
        snapshot,
        metadata,
        sources: { schema: "gc.kie-pricing-sources.v1" },
      })
    ).toThrowError(
      expect.objectContaining({ code: "source-capture-count-mismatch" })
    );
  });

  it("requires source facts to cover rows and verified capture checksums", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    const captures = snapshot.pages.map((page, index) => ({
      pageNum: page.pageNum,
      path: `captures/page-${String(index + 1).padStart(3, "0")}.json`,
      sha256: `sha256:${index + 1}`,
    }));
    const metadata = { sourceCaptures: { files: captures } };
    const sources = {
      schema: "gc.kie-pricing-sources.v1",
      captures,
      facts: snapshot.records.map((record, index) => ({
        occurrenceId: record.occurrenceId,
        rowHash: record.rowHash,
        semanticKey: record.semanticKey,
        officialFields: record.raw,
        evidence: {
          pageNum: index === 2 ? 2 : 1,
          capturePath: captures[index === 2 ? 1 : 0].path,
          captureSha256: "sha256:not-the-capture",
          jsonPointer: `/data/records/${index === 2 ? 0 : index}`,
        },
      })),
    };

    expect(() =>
      validateSourceIndex({ snapshot, metadata, sources })
    ).toThrowError(
      expect.objectContaining({
        code: "source-fact-capture-reference-mismatch",
      })
    );
  });

  it("rejects a duplicated source occurrence even if fact count is unchanged", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    const captures = snapshot.pages.map((page, index) => ({
      pageNum: page.pageNum,
      path: `captures/page-${String(index + 1).padStart(3, "0")}.json`,
      sha256: `sha256:${index + 1}`,
    }));
    const metadata = { sourceCaptures: { files: captures } };
    const facts = snapshot.records.map((record, index) => ({
      occurrenceId:
        index === 1 ? snapshot.records[0].occurrenceId : record.occurrenceId,
      rowHash: record.rowHash,
      semanticKey: record.semanticKey,
      officialFields: record.raw,
      evidence: {
        pageNum: 1,
        capturePath: captures[0].path,
        captureSha256: captures[0].sha256,
        jsonPointer: `/data/records/${index}`,
      },
    }));

    expect(() =>
      validateSourceIndex({
        snapshot,
        metadata,
        sources: { schema: "gc.kie-pricing-sources.v1", captures, facts },
      })
    ).toThrowError(
      expect.objectContaining({ code: "source-fact-occurrence-mismatch" })
    );
  });

  it("uses canonical content when validating source facts", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    const captures = snapshot.pages.map((page, index) => ({
      pageNum: page.pageNum,
      path: `captures/page-${String(index + 1).padStart(3, "0")}.json`,
      sha256: `sha256:${index + 1}`,
    }));
    const metadata = { sourceCaptures: { files: captures } };
    const facts = snapshot.records.map((record, index) => ({
      occurrenceId: record.occurrenceId,
      rowHash: record.rowHash,
      semanticKey: record.semanticKey,
      officialFields: Object.fromEntries(Object.entries(record.raw).reverse()),
      evidence: {
        pageNum: index === 2 ? 2 : 1,
        capturePath: captures[index === 2 ? 1 : 0].path,
        captureSha256: captures[index === 2 ? 1 : 0].sha256,
        jsonPointer: `/data/records/${index === 2 ? 0 : index}`,
      },
    }));

    expect(canonicalJson(facts[0].officialFields)).toBe(
      canonicalJson(snapshot.records[0].raw)
    );
    expect(() =>
      validateSourceIndex({
        snapshot,
        metadata,
        sources: { schema: "gc.kie-pricing-sources.v1", captures, facts },
      })
    ).not.toThrow();
  });

  it("round-trips generated source captures with secret redaction", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "kie-pricing-redaction-"));
    const body = {
      code: 200,
      msg: "success",
      authorization: "Bearer should-not-be-persisted",
      data: {
        records: [{ modelDescription: "secret fixture" }],
        total: 1,
        size: 1,
        current: 1,
        pages: 1,
      },
    };
    const collection = await collectPricingPages({
      fetchPage: sequenceFetcher([body]),
      pageSize: 1,
    });
    const artifacts = await writePullArtifacts({
      collection,
      artifactRoot: root,
      startedAt: "2026-08-11T00:00:00.000Z",
      completedAt: "2026-08-11T00:00:01.000Z",
    });
    const capture = JSON.parse(
      await readFile(path.join(artifacts.captureRoot, "page-001.json"), "utf8")
    );
    const snapshot = JSON.parse(await readFile(artifacts.snapshotPath, "utf8"));
    const metadata = JSON.parse(await readFile(artifacts.metadataPath, "utf8"));
    const sources = JSON.parse(await readFile(artifacts.sourcesPath, "utf8"));

    expect(snapshot.pages[0].response.authorization).toBe("[REDACTED]");
    expect(capture.authorization).toBe("[REDACTED]");
    expect(canonicalJson(capture)).toBe(
      canonicalJson(sanitizeCapture(snapshot.pages[0].response))
    );
    expect(() => validateCaptureContent(snapshot, 0, capture)).not.toThrow();
    const generatedContents = await Promise.all([
      readFile(artifacts.snapshotPath, "utf8"),
      readFile(artifacts.metadataPath, "utf8"),
      readFile(artifacts.sourcesPath, "utf8"),
      readFile(path.join(artifacts.captureRoot, "page-001.json"), "utf8"),
    ]);
    expect(generatedContents.join("\n")).not.toContain(
      "Bearer should-not-be-persisted"
    );
    expect(() =>
      validateSourceIndex({ snapshot, metadata, sources })
    ).not.toThrow();
    await rm(root, { recursive: true, force: true });
  });

  it("fails closed if sanitization would alter a pricing record", async () => {
    const root = mkdtempSync(
      path.join(tmpdir(), "kie-pricing-record-redaction-")
    );
    const body = {
      code: 200,
      data: {
        records: [{ modelDescription: "priced row", token: "credential" }],
        total: 1,
        size: 1,
        current: 1,
        pages: 1,
      },
    };
    const collection = await collectPricingPages({
      fetchPage: sequenceFetcher([body]),
      pageSize: 1,
    });

    await expect(
      writePullArtifacts({
        collection,
        artifactRoot: root,
        startedAt: "2026-08-11T00:00:00.000Z",
        completedAt: "2026-08-11T00:00:01.000Z",
      })
    ).rejects.toMatchObject({ code: "pricing-record-redaction" });
    await rm(root, { recursive: true, force: true });
  });

  it("rejects a source fact that references another valid page", async () => {
    const snapshot = await makeAnnotatedSnapshot();
    const captures = snapshot.pages.map((page, index) => ({
      pageNum: page.pageNum,
      path: `captures/page-${String(index + 1).padStart(3, "0")}.json`,
      sha256: `sha256:${index + 1}`,
    }));
    const metadata = { sourceCaptures: { files: captures } };
    const facts = snapshot.records.map((record) => ({
      occurrenceId: record.occurrenceId,
      rowHash: record.rowHash,
      semanticKey: record.semanticKey,
      officialFields: record.raw,
      evidence: {
        pageNum: 1,
        capturePath: captures[0].path,
        captureSha256: captures[0].sha256,
        jsonPointer: "/data/records/0",
      },
    }));

    expect(() =>
      validateSourceIndex({
        snapshot,
        metadata,
        sources: { schema: "gc.kie-pricing-sources.v1", captures, facts },
      })
    ).toThrowError(
      expect.objectContaining({ code: "source-fact-position-mismatch" })
    );
  });
});

interface RequestSummary {
  pageSize: number;
  pageNum: { first: number; last: number };
  pageCount: number;
}

const EXPECTED_RANGE: RequestSummary = {
  pageSize: 2,
  pageNum: { first: 1, last: 2 },
  pageCount: 2,
};

interface ResolveBaselineAsOfInput {
  explicit?: string;
  baseline?: Record<string, unknown>;
  baselinePath?: string;
}

interface ResolveBaselineAsOfResult {
  asOf: string;
  source: string;
}

const resolveDate = resolveBaselineAsOf as unknown as (
  input: ResolveBaselineAsOfInput
) => ResolveBaselineAsOfResult;

async function writeValidPair() {
  const root = mkdtempSync(path.join(tmpdir(), "kie-pricing-range-"));
  const collection = await collectPricingPages({
    fetchPage: sequenceFetcher(pageFixtures.valid),
    pageSize: 2,
  });
  const artifacts = await writePullArtifacts({
    collection,
    artifactRoot: root,
    startedAt: "2026-09-12T00:00:00.000Z",
    completedAt: "2026-09-12T00:00:01.000Z",
  });
  const snapshotBytes = await readFile(artifacts.snapshotPath);
  const snapshot = JSON.parse(snapshotBytes.toString("utf8"));
  const metadata = JSON.parse(await readFile(artifacts.metadataPath, "utf8"));
  return { root, artifacts, snapshotBytes, snapshot, metadata };
}

describe("Kie pricing pull page range and baseline date", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // T-1
  it("records the captured page range identically in the snapshot and the metadata", async () => {
    const { root, snapshotBytes, snapshot, metadata } = await writeValidPair();
    expect(snapshot.request).toEqual(EXPECTED_RANGE);
    expect(metadata.request).toEqual(EXPECTED_RANGE);
    expect(JSON.stringify(snapshot.request)).toBe(
      JSON.stringify(metadata.request)
    );
    expect(metadata.pages).toHaveLength(2);
    expect(
      validateSnapshotMetadata(snapshot, metadata, snapshotBytes)
    ).toMatchObject({ pageCount: 2, capturedTotal: 3 });
    expect(validateRequestSummary(snapshot, metadata)).toEqual({
      first: 1,
      last: 2,
      pageCount: 2,
    });
    expect(
      requestSummary({
        requestedPageSize: 7,
        pages: [{ pageNum: 3 }, { pageNum: 4 }, { pageNum: 5 }],
      })
    ).toEqual({ pageSize: 7, pageNum: { first: 3, last: 5 }, pageCount: 3 });
    await rm(root, { recursive: true, force: true });
  });

  // T-2
  it("lets an explicit --baseline-as-of win and records the flag as its source", () => {
    expect(
      resolveDate({
        explicit: "2026-01-02",
        baseline: { pulledAt: { completedAt: "2026-08-25T06:31:02.421Z" } },
        baselinePath: "kie-pricing-snapshot-2026-08-25T06-31-02-421Z.json",
      })
    ).toEqual({ asOf: "2026-01-02", source: "flag" });
  });

  // T-3
  it("derives the date from the baseline's pulledAt.completedAt in UTC", () => {
    const baselinePath = "kie-pricing-snapshot-2026-08-25T06-31-02-421Z.json";
    expect(
      resolveDate({
        baseline: { pulledAt: { completedAt: "2026-08-25T06:31:02.421Z" } },
        baselinePath,
      })
    ).toEqual({ asOf: "2026-08-25", source: "baseline-pulled-at" });
    expect(
      resolveDate({
        baseline: { pulledAt: { completedAt: "2026-08-25T23:59:59.999Z" } },
        baselinePath,
      })
    ).toEqual({ asOf: "2026-08-25", source: "baseline-pulled-at" });
    // An offset timestamp resolves to its UTC date whatever the host TZ.
    expect(
      resolveDate({
        baseline: {
          pulledAt: { completedAt: "2026-08-26T02:00:00.000+07:00" },
        },
        baselinePath: "baseline.json",
      })
    ).toEqual({ asOf: "2026-08-25", source: "baseline-pulled-at" });
  });

  // T-4
  it("falls back to the first date in the baseline filename", () => {
    expect(
      resolveDate({
        baseline: { count: 404, records: [] },
        baselinePath: "/tmp/x/kie-pricing-baseline-2026-08-06.json",
      })
    ).toEqual({ asOf: "2026-08-06", source: "baseline-filename" });
  });

  // T-5
  it("fails closed on an unresolvable or malformed baseline date", () => {
    expect(() =>
      resolveDate({
        baseline: { records: [] },
        baselinePath: "/tmp/x/baseline.json",
      })
    ).toThrowError(
      expect.objectContaining({ code: "baseline-as-of-unresolvable" })
    );
    for (const explicit of [
      "2026-8-25",
      "2026-13-01",
      "2026-02-30",
      "yesterday",
    ]) {
      expect(() => resolveDate({ explicit })).toThrowError(
        expect.objectContaining({ code: "invalid-argument" })
      );
    }
    expect(() => resolveDate({ explicit: "2026-13-01" })).toThrow(
      "--baseline-as-of must be YYYY-MM-DD"
    );
  });

  // T-6
  it("rejects a recorded range that disagrees with the walk and accepts legacy evidence", async () => {
    const { root, snapshotBytes, snapshot, metadata } = await writeValidPair();
    const bumpedLast = structuredClone(metadata);
    bumpedLast.request.pageNum.last += 1;
    expect(() =>
      validateSnapshotMetadata(snapshot, bumpedLast, snapshotBytes)
    ).toThrowError(expect.objectContaining({ code: "page-range-mismatch" }));
    const offByOne = {
      snapshot: structuredClone(snapshot),
      metadata: structuredClone(metadata),
    };
    offByOne.snapshot.request.pageCount = 3;
    offByOne.metadata.request.pageCount = 3;
    expect(() =>
      validateRequestSummary(offByOne.snapshot, offByOne.metadata)
    ).toThrowError(expect.objectContaining({ code: "page-range-mismatch" }));
    const oneSided = structuredClone(snapshot);
    delete oneSided.request.pageNum;
    expect(() => validateRequestSummary(oneSided, metadata)).toThrowError(
      expect.objectContaining({ code: "page-range-mismatch" })
    );
    // Legacy: the pinned committed pair predates the block.
    const legacySnapshotBytes = await readFile(KIE_PRICING_SNAPSHOT_PATH);
    const legacySnapshot = JSON.parse(legacySnapshotBytes.toString("utf8"));
    const legacyMetadata = JSON.parse(
      await readFile(KIE_PRICING_METADATA_PATH, "utf8")
    );
    expect(legacyMetadata.request).toEqual({ pageSize: 100 });
    expect(validateRequestSummary(legacySnapshot, legacyMetadata)).toBeNull();
    expect(() =>
      validateSnapshotMetadata(
        legacySnapshot,
        legacyMetadata,
        legacySnapshotBytes
      )
    ).not.toThrow();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    await expect(
      check({
        snapshot: KIE_PRICING_SNAPSHOT_PATH,
        metadata: KIE_PRICING_METADATA_PATH,
      })
    ).resolves.toBeUndefined();
    await rm(root, { recursive: true, force: true });
  });

  // T-7
  it("runs the CLI pull in-process with a stubbed fetch and a derived baseline date", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "kie-pricing-cli-"));
    const baselinePath = path.join(root, "baseline.json");
    await writeFile(
      baselinePath,
      JSON.stringify({
        schema: "gc.kie-pricing-snapshot.v1",
        pulledAt: {
          startedAt: "2026-08-25T06:31:00.498Z",
          completedAt: "2026-08-25T06:31:02.421Z",
        },
        records: [],
      })
    );
    const fetchStub: typeof fetch = async (_input, init) => {
      const { pageNum } = JSON.parse(String(init?.body)) as { pageNum: number };
      const body = pageFixtures.valid[pageNum - 1];
      return new Response(JSON.stringify(body ?? {}), {
        status: body ? 200 : 404,
      });
    };
    vi.stubGlobal("fetch", fetchStub);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await pull({
      "artifact-root": root,
      baseline: baselinePath,
      endpoint: "https://example.test/pricing",
      "page-size": "2",
    });
    const printed = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      comparison: { baselineAsOf: string; baselineAsOfSource: string };
      metadataPath: string;
      snapshotPath: string;
    };
    expect(printed.comparison).toMatchObject({
      baselineAsOf: "2026-08-25",
      baselineAsOfSource: "baseline-pulled-at",
    });
    const metadata = JSON.parse(await readFile(printed.metadataPath, "utf8"));
    expect(metadata.request).toEqual(EXPECTED_RANGE);
    expect(Object.keys(metadata.comparison).slice(0, 3)).toEqual([
      "baselinePath",
      "baselineAsOf",
      "baselineAsOfSource",
    ]);
    expect(metadata.comparison).toMatchObject({
      baselineAsOf: "2026-08-25",
      baselineAsOfSource: "baseline-pulled-at",
    });
    await expect(
      check({ snapshot: printed.snapshotPath, metadata: printed.metadataPath })
    ).resolves.toBeUndefined();
    expect(parseArgs(["pull", "--baseline", "x"])).toEqual({
      command: "pull",
      options: { baseline: "x" },
    });
    await rm(root, { recursive: true, force: true });
  });
});
