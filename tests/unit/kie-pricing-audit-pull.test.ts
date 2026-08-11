import { mkdtempSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/kie-pricing-page-sequences.json";
import {
  atomicWriteFile,
  canonicalJson,
  collectPricingPages,
  fetchPricingPage,
  parsePageResponse,
  sanitizeCapture,
  sha256Json,
  validateSnapshotRecordAlignment,
  validateCaptureContent,
  validateSourceIndex,
  writePullArtifacts,
} from "../../scripts/lib/kie-pricing-pull.mjs";

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
