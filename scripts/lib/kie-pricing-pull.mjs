import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const KIE_PRICING_ENDPOINT =
  "https://api.kie.ai/client/v1/model-pricing/page";
export const KIE_PRICING_PAGE_SIZE = 100;

const RESPONSE_REDACTION_KEY =
  /(?:api[-_]?key|authorization|credential|password|secret|token)/i;

export class KiePricingPullError extends Error {
  constructor(code, message, details = {}) {
    super(`${code}: ${message}`);
    this.name = "KiePricingPullError";
    this.code = code;
    this.details = details;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireInteger(value, name, { minimum = 0 } = {}) {
  if (!Number.isInteger(value) || value < minimum) {
    throw new KiePricingPullError(
      "invalid-page-metadata",
      `${name} must be an integer >= ${minimum}`,
      { name, value }
    );
  }
  return value;
}

/**
 * Return JSON with object keys sorted recursively. Arrays retain API order.
 * This is deliberately stricter than JSON.stringify so row hashes are stable
 * when an upstream response changes object-key order.
 */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])])
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256Bytes(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function sha256Json(value) {
  return sha256Bytes(canonicalJson(value));
}

function unwrapPageData(body) {
  if (!isRecord(body)) {
    throw new KiePricingPullError(
      "malformed-json",
      "pricing response must be a JSON object"
    );
  }

  const data = isRecord(body.data) ? body.data : body;
  if (!Array.isArray(data.records)) {
    throw new KiePricingPullError(
      "malformed-page",
      "pricing response data.records must be an array"
    );
  }
  return data;
}

/**
 * Validate one API response while retaining the original envelope and rows.
 * A malformed row is an incomplete evidence pull, not a row to normalize away.
 */
export function parsePageResponse(body, requestedPage) {
  const data = unwrapPageData(body);
  const total = requireInteger(data.total, "total");
  const size = requireInteger(data.size, "size", { minimum: 1 });
  const current = requireInteger(data.current, "current", { minimum: 1 });
  const pages = requireInteger(data.pages, "pages", { minimum: 1 });

  if (current !== requestedPage) {
    throw new KiePricingPullError(
      "page-identity-mismatch",
      `requested page ${requestedPage}, response identifies page ${current}`,
      { requestedPage, current }
    );
  }

  const expectedPages = Math.ceil(total / size);
  if (pages !== expectedPages) {
    throw new KiePricingPullError(
      "page-count-mismatch",
      `response reports ${pages} pages for ${total} rows of size ${size}`,
      { total, size, pages, expectedPages }
    );
  }

  for (const [index, record] of data.records.entries()) {
    if (!isRecord(record)) {
      throw new KiePricingPullError(
        "malformed-row",
        `data.records[${index}] must be an object`,
        { index, value: record }
      );
    }
  }

  if (data.records.length > size) {
    throw new KiePricingPullError(
      "page-overflow",
      `page ${current} returned ${data.records.length} rows for size ${size}`,
      { current, recordCount: data.records.length, size }
    );
  }

  return {
    body,
    data,
    records: data.records,
    total,
    size,
    current,
    pages,
  };
}

export async function fetchPricingPage({
  fetchImpl = globalThis.fetch,
  endpoint = KIE_PRICING_ENDPOINT,
  pageNum,
  pageSize = KIE_PRICING_PAGE_SIZE,
  apiKey = undefined,
}) {
  if (typeof fetchImpl !== "function") {
    throw new KiePricingPullError(
      "fetch-unavailable",
      "global fetch is unavailable"
    );
  }

  const headers = { "content-type": "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ pageNum, pageSize }),
    });
  } catch (error) {
    throw new KiePricingPullError("http-request", error.message, {
      pageNum,
      cause: error,
    });
  }

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new KiePricingPullError(
      "malformed-json",
      `page ${pageNum} did not return JSON`,
      { pageNum, status: response.status, cause: error }
    );
  }

  if (!response.ok) {
    throw new KiePricingPullError(
      "http-status",
      `page ${pageNum} returned HTTP ${response.status}`,
      { pageNum, status: response.status, body }
    );
  }

  return parsePageResponse(body, pageNum);
}

function pageIdentity(page) {
  return sha256Json(page.records);
}

function stablePageMetadata(first, page) {
  return (
    page.total === first.total &&
    page.size === first.size &&
    page.pages === first.pages
  );
}

function expectedRowsOnPage(pageNum, pages, total, size) {
  if (pageNum < pages) return size;
  return total - size * (pages - 1);
}

function annotateRows(records) {
  const rowOccurrences = new Map();
  return records.map((raw, index) => {
    const rowHash = sha256Json(raw);
    const ordinal = (rowOccurrences.get(rowHash) ?? 0) + 1;
    rowOccurrences.set(rowHash, ordinal);
    const semanticKey = sha256Json({
      provider: raw.provider,
      anchor: raw.anchor,
      modelDescription: raw.modelDescription,
      interfaceType: raw.interfaceType,
      creditUnit: raw.creditUnit,
    });
    return {
      occurrenceId: `${rowHash}#${ordinal}`,
      rowHash,
      semanticKey,
      pageNum: index,
      raw,
    };
  });
}

function duplicateGroups(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const values = groups.get(row[field]) ?? [];
    values.push(row.occurrenceId);
    groups.set(row[field], values);
  }
  return [...groups.entries()]
    .filter(([, occurrences]) => occurrences.length > 1)
    .map(([value, occurrences]) => ({
      [field]: value,
      occurrences,
      count: occurrences.length,
    }));
}

/**
 * Walk the reported page range and reject every incomplete or inconsistent
 * sequence before it can become evidence.
 */
export async function collectPricingPages({
  fetchPage,
  pageSize = KIE_PRICING_PAGE_SIZE,
  endpoint = KIE_PRICING_ENDPOINT,
}) {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new KiePricingPullError("invalid-page-size", "pageSize must be >= 1");
  }
  if (typeof fetchPage !== "function") {
    throw new KiePricingPullError(
      "fetch-unavailable",
      "fetchPage must be a function"
    );
  }

  const pages = [];
  const identities = new Set();
  let first;

  for (let pageNum = 1; ; pageNum += 1) {
    const page = await fetchPage(pageNum, pageSize);
    if (!first) first = page;

    if (!stablePageMetadata(first, page)) {
      throw new KiePricingPullError(
        "changing-total",
        `page ${pageNum} changed the reported pagination metadata`,
        {
          first: {
            total: first.total,
            size: first.size,
            pages: first.pages,
          },
          current: {
            total: page.total,
            size: page.size,
            pages: page.pages,
          },
        }
      );
    }

    const identity = pageIdentity(page);
    if (identities.has(identity)) {
      throw new KiePricingPullError(
        "repeated-page",
        `page ${pageNum} has the same row identity as an earlier page`,
        { pageNum, identity }
      );
    }
    identities.add(identity);

    const expectedCount = expectedRowsOnPage(
      pageNum,
      page.pages,
      page.total,
      page.size
    );
    if (page.records.length === 0 && pageNum < page.pages) {
      throw new KiePricingPullError(
        "early-empty-page",
        `page ${pageNum} was empty before the final page`,
        { pageNum, pages: page.pages }
      );
    }
    if (page.records.length !== expectedCount) {
      throw new KiePricingPullError(
        "page-row-count-mismatch",
        `page ${pageNum} returned ${page.records.length} rows; expected ${expectedCount}`,
        { pageNum, actual: page.records.length, expected: expectedCount }
      );
    }

    pages.push({
      pageNum,
      request: { pageNum, pageSize },
      response: page.body,
      records: page.records,
      meta: {
        total: page.total,
        size: page.size,
        current: page.current,
        pages: page.pages,
        rowCount: page.records.length,
        identity,
      },
    });

    if (pageNum === page.pages) break;
    if (pageNum > page.pages) {
      throw new KiePricingPullError(
        "pagination-overrun",
        `received page ${pageNum} after reported final page ${page.pages}`
      );
    }
  }

  const flatRecords = pages.flatMap((page) => page.records);
  if (flatRecords.length !== first.total) {
    throw new KiePricingPullError(
      "captured-total-mismatch",
      `captured ${flatRecords.length} rows but API reported ${first.total}`,
      { captured: flatRecords.length, reported: first.total }
    );
  }

  const rows = annotateRows(flatRecords);
  const rawDuplicateGroups = duplicateGroups(rows, "rowHash");
  const semanticDuplicateGroups = duplicateGroups(rows, "semanticKey");
  return {
    endpoint,
    method: "POST",
    requestedPageSize: pageSize,
    pages,
    rows,
    reportedTotal: first.total,
    reportedPages: first.pages,
    capturedTotal: rows.length,
    rawUniqueCount: new Set(rows.map((row) => row.rowHash)).size,
    semanticUniqueCount: new Set(rows.map((row) => row.semanticKey)).size,
    duplicateAnalysis: {
      rawDuplicateOccurrences:
        rows.length - new Set(rows.map((row) => row.rowHash)).size,
      semanticDuplicateOccurrences:
        rows.length - new Set(rows.map((row) => row.semanticKey)).size,
      rawDuplicateGroups,
      semanticDuplicateGroups,
    },
    responseCompleteness: {
      complete: true,
      totalsStable: true,
      pageIdentitiesStable: true,
      noEarlyEmptyPages: true,
      termination: "reported-pages",
    },
  };
}

function sanitizeCapture(value, key = "") {
  if (RESPONSE_REDACTION_KEY.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => sanitizeCapture(item));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeCapture(childValue, childKey),
      ])
    );
  }
  return value;
}

export { sanitizeCapture };

export function validateCaptureContent(snapshot, pageIndex, capture) {
  if (
    canonicalJson(capture) !==
    canonicalJson(sanitizeCapture(snapshot.pages[pageIndex]?.response))
  ) {
    throw new KiePricingPullError(
      "source-capture-content-mismatch",
      `capture ${pageIndex} does not match the sanitized snapshot response`
    );
  }
  return true;
}

/**
 * Remove credential-like envelope fields before any evidence is persisted.
 * Pricing rows are a special case: changing one would silently discard a
 * billable field, so the pull fails closed instead of writing a lossy record.
 */
export function preparePersistedCollection(collection) {
  const pages = collection.pages.map((page) => {
    const safeResponse = sanitizeCapture(page.response);
    const originalRecords = page.response?.data?.records;
    const safeRecords = safeResponse?.data?.records;
    if (
      !Array.isArray(originalRecords) ||
      !Array.isArray(safeRecords) ||
      canonicalJson(originalRecords) !== canonicalJson(safeRecords)
    ) {
      throw new KiePricingPullError(
        "pricing-record-redaction",
        `sanitization would alter pricing records on page ${page.pageNum}`
      );
    }
    return {
      ...page,
      response: safeResponse,
      records: safeRecords,
    };
  });

  const safeRecords = pages.flatMap((page) => page.records);
  if (safeRecords.length !== collection.rows.length) {
    throw new KiePricingPullError(
      "pricing-record-count-mismatch",
      "sanitized page records do not match annotated row count"
    );
  }
  const rows = collection.rows.map((row, index) => {
    const safeRaw = safeRecords[index];
    if (row.rowHash !== sha256Json(safeRaw)) {
      throw new KiePricingPullError(
        "pricing-record-redaction",
        `sanitization changed annotated row ${index}`
      );
    }
    return { ...row, raw: safeRaw };
  });
  return { ...collection, pages, rows };
}

export async function atomicWriteFile(
  targetPath,
  contents,
  {
    writeFileImpl = writeFile,
    renameImpl = rename,
    removeImpl = rm,
    mkdirImpl = mkdir,
    tempPath,
  } = {}
) {
  await mkdirImpl(path.dirname(targetPath), { recursive: true });
  const temporaryPath =
    tempPath ??
    `${targetPath}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  try {
    await writeFileImpl(temporaryPath, contents, "utf8");
    await renameImpl(temporaryPath, targetPath);
  } finally {
    await removeImpl(temporaryPath, { force: true }).catch(() => undefined);
  }
}

export async function atomicWriteJson(targetPath, value, options = {}) {
  const contents = `${JSON.stringify(value, null, 2)}\n`;
  await atomicWriteFile(targetPath, contents, options);
  return contents;
}

function fileStamp(iso) {
  return iso.replace(/[:.]/g, "-");
}

function comparisonKey(record) {
  return canonicalJson([
    record.modelDescription,
    record.interfaceType,
    record.provider,
    record.creditUnit,
    record.anchor,
  ]);
}

const COMPARISON_FIELDS = [
  "creditPrice",
  "usdPrice",
  "falPrice",
  "discountRate",
  "discountPrice",
];

export function comparePricingRows(currentRows, baselineRows) {
  const current = new Map(currentRows.map((row) => [comparisonKey(row), row]));
  const baseline = new Map(
    baselineRows.map((row) => [comparisonKey(row), row])
  );
  const added = [...current.keys()].filter((key) => !baseline.has(key));
  const removed = [...baseline.keys()].filter((key) => !current.has(key));
  const changed = [...current.keys()]
    .filter(
      (key) =>
        baseline.has(key) &&
        COMPARISON_FIELDS.some(
          (field) =>
            JSON.stringify(current.get(key)[field]) !==
            JSON.stringify(baseline.get(key)[field])
        )
    )
    .map((key) => ({
      key,
      modelDescription: current.get(key).modelDescription,
      before: Object.fromEntries(
        COMPARISON_FIELDS.map((field) => [field, baseline.get(key)[field]])
      ),
      after: Object.fromEntries(
        COMPARISON_FIELDS.map((field) => [field, current.get(key)[field]])
      ),
    }));
  return {
    baselineRows: baselineRows.length,
    currentRows: currentRows.length,
    added: added.map((key) => current.get(key)),
    removed: removed.map((key) => baseline.get(key)),
    changed,
    counts: {
      added: added.length,
      removed: removed.length,
      changed: changed.length,
    },
  };
}

function sourceFacts(collection, captureEntries, completedAt) {
  let offset = 0;
  return collection.pages.flatMap((page, pageIndex) =>
    page.records.map((record, recordIndex) => {
      const row = collection.rows[offset++];
      const capture = captureEntries[pageIndex];
      return {
        occurrenceId: row.occurrenceId,
        rowHash: row.rowHash,
        semanticKey: row.semanticKey,
        officialFields: record,
        evidence: {
          url: collection.endpoint,
          retrievedAt: completedAt,
          pageNum: page.pageNum,
          capturePath: capture.path,
          captureSha256: capture.sha256,
          jsonPointer: `/data/records/${recordIndex}`,
        },
      };
    })
  );
}

export async function writePullArtifacts({
  collection,
  artifactRoot,
  startedAt,
  completedAt,
  baseline = undefined,
}) {
  if (!collection || !artifactRoot || !startedAt || !completedAt) {
    throw new KiePricingPullError(
      "invalid-artifact-input",
      "collection, artifactRoot, startedAt, and completedAt are required"
    );
  }

  collection = preparePersistedCollection(collection);
  if (baseline) {
    const safeBaselineRows = baseline.rows.map((row) => sanitizeCapture(row));
    if (
      baseline.rows.some(
        (row, index) =>
          canonicalJson(row) !== canonicalJson(safeBaselineRows[index])
      )
    ) {
      throw new KiePricingPullError(
        "baseline-record-redaction",
        "sanitization would alter a baseline pricing record"
      );
    }
    baseline = {
      ...baseline,
      rows: safeBaselineRows,
      comparison: comparePricingRows(
        collection.rows.map((row) => row.raw),
        safeBaselineRows
      ),
    };
  }

  const stamp = fileStamp(completedAt);
  const snapshotPath = path.resolve(
    artifactRoot,
    `kie-pricing-snapshot-${stamp}.json`
  );
  const metadataPath = path.resolve(
    artifactRoot,
    `kie-pricing-pull-${stamp}.json`
  );
  const captureRoot = path.resolve(
    artifactRoot,
    `kie-pricing-source-captures-${stamp}`
  );
  const sourcesPath = path.resolve(
    artifactRoot,
    `kie-pricing-sources-${stamp}.json`
  );

  const snapshot = {
    schema: "gc.kie-pricing-snapshot.v1",
    endpoint: collection.endpoint,
    method: collection.method,
    pulledAt: { startedAt, completedAt },
    request: { pageSize: collection.requestedPageSize },
    reported: {
      total: collection.reportedTotal,
      pages: collection.reportedPages,
    },
    pages: collection.pages.map((page) => ({
      pageNum: page.pageNum,
      request: page.request,
      response: page.response,
    })),
    records: collection.rows.map((row) => ({
      occurrenceId: row.occurrenceId,
      rowHash: row.rowHash,
      semanticKey: row.semanticKey,
      raw: row.raw,
    })),
  };
  const snapshotContents = `${JSON.stringify(snapshot, null, 2)}\n`;
  await atomicWriteFile(snapshotPath, snapshotContents);
  const snapshotSha256 = sha256Bytes(snapshotContents);

  const captureEntries = [];
  for (const [pageIndex, page] of collection.pages.entries()) {
    const capturePath = path.join(
      captureRoot,
      `page-${String(pageIndex + 1).padStart(3, "0")}.json`
    );
    const captureContents = `${JSON.stringify(sanitizeCapture(page.response), null, 2)}\n`;
    await atomicWriteFile(capturePath, captureContents);
    captureEntries.push({
      pageNum: page.pageNum,
      path: path.relative(artifactRoot, capturePath),
      url: collection.endpoint,
      retrievedAt: completedAt,
      mediaType: "application/json",
      bytes: Buffer.byteLength(captureContents),
      sha256: sha256Bytes(captureContents),
      redaction: { applied: true, rule: "sensitive response key names" },
    });
  }

  const sources = {
    schema: "gc.kie-pricing-sources.v1",
    endpoint: collection.endpoint,
    retrievedAt: completedAt,
    captures: captureEntries,
    facts: sourceFacts(collection, captureEntries, completedAt),
  };
  await atomicWriteJson(sourcesPath, sources);

  const metadata = {
    schema: "gc.kie-pricing-pull.v1",
    endpoint: collection.endpoint,
    method: collection.method,
    pulledAt: { startedAt, completedAt },
    request: { pageSize: collection.requestedPageSize },
    snapshot: {
      path: path.relative(process.cwd(), snapshotPath),
      sha256: snapshotSha256,
    },
    sourceCaptures: {
      root: path.relative(process.cwd(), captureRoot),
      sourcesPath: path.relative(process.cwd(), sourcesPath),
      files: captureEntries,
    },
    pages: collection.pages.map((page) => page.meta),
    reportedTotal: collection.reportedTotal,
    capturedTotal: collection.capturedTotal,
    rawUniqueCount: collection.rawUniqueCount,
    semanticUniqueCount: collection.semanticUniqueCount,
    duplicateAnalysis: collection.duplicateAnalysis,
    responseCompleteness: collection.responseCompleteness,
    comparison: baseline
      ? {
          baselinePath: baseline.path,
          baselineAsOf: baseline.asOf,
          baselineRows: baseline.rows.length,
          currentRows: collection.rows.length,
          added: baseline.comparison.added.length,
          removed: baseline.comparison.removed.length,
          changed: baseline.comparison.changed.length,
          addedRows: baseline.comparison.added,
          removedRows: baseline.comparison.removed,
          changedRows: baseline.comparison.changed,
        }
      : null,
  };
  await atomicWriteJson(metadataPath, metadata);

  return {
    stamp,
    snapshotPath,
    metadataPath,
    captureRoot,
    sourcesPath,
    snapshotSha256,
    metadata,
    snapshot,
    sources,
  };
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function validateSnapshotMetadata(snapshot, metadata, snapshotBytes) {
  if (snapshot.schema !== "gc.kie-pricing-snapshot.v1") {
    throw new KiePricingPullError(
      "invalid-snapshot",
      "unsupported snapshot schema"
    );
  }
  if (metadata.schema !== "gc.kie-pricing-pull.v1") {
    throw new KiePricingPullError(
      "invalid-metadata",
      "unsupported metadata schema"
    );
  }
  const actualHash = sha256Bytes(snapshotBytes);
  if (metadata.snapshot?.sha256 !== actualHash) {
    throw new KiePricingPullError(
      "snapshot-checksum-mismatch",
      `metadata hash ${metadata.snapshot?.sha256} does not match ${actualHash}`
    );
  }
  if (!Array.isArray(snapshot.pages) || !Array.isArray(snapshot.records)) {
    throw new KiePricingPullError(
      "invalid-snapshot",
      "pages and records are required"
    );
  }
  if (snapshot.records.length !== metadata.capturedTotal) {
    throw new KiePricingPullError(
      "metadata-count-mismatch",
      "metadata capturedTotal does not match snapshot records"
    );
  }
  if (snapshot.records.length !== metadata.reportedTotal) {
    throw new KiePricingPullError(
      "snapshot-count-mismatch",
      "snapshot records do not match the API-reported total"
    );
  }
  const ids = new Set(snapshot.records.map((record) => record.occurrenceId));
  if (ids.size !== snapshot.records.length) {
    throw new KiePricingPullError(
      "duplicate-occurrence-id",
      "snapshot occurrence IDs are not unique"
    );
  }
  return {
    actualHash,
    capturedTotal: snapshot.records.length,
    pageCount: snapshot.pages.length,
  };
}

/**
 * Verify the page stream and the annotated identity stream are the same
 * ordered evidence. Counts alone are insufficient: a swapped or substituted
 * row must invalidate the offline check even when its replacement is hashed.
 */
export function validateSnapshotRecordAlignment(snapshot) {
  if (!Array.isArray(snapshot.pages) || !Array.isArray(snapshot.records)) {
    throw new KiePricingPullError(
      "invalid-snapshot",
      "pages and records are required for alignment"
    );
  }

  let recordIndex = 0;
  for (const [pageIndex, page] of snapshot.pages.entries()) {
    const pageRows = page.response?.data?.records;
    if (!Array.isArray(pageRows)) {
      throw new KiePricingPullError(
        "invalid-snapshot-page",
        `pages[${pageIndex}] has no data.records array`
      );
    }
    for (const [rowIndex, pageRow] of pageRows.entries()) {
      const annotated = snapshot.records[recordIndex];
      if (
        !annotated ||
        canonicalJson(pageRow) !== canonicalJson(annotated.raw)
      ) {
        throw new KiePricingPullError(
          "snapshot-record-divergence",
          `page ${page.pageNum} row ${rowIndex} diverges from records[${recordIndex}]`,
          { pageIndex, rowIndex, recordIndex }
        );
      }
      if (annotated.rowHash !== sha256Json(annotated.raw)) {
        throw new KiePricingPullError(
          "row-checksum-mismatch",
          `records[${recordIndex}] rowHash does not reproduce from raw data`,
          { recordIndex }
        );
      }
      recordIndex += 1;
    }
  }

  if (recordIndex !== snapshot.records.length) {
    throw new KiePricingPullError(
      "snapshot-record-count-mismatch",
      `pages contain ${recordIndex} rows but records contains ${snapshot.records.length}`,
      { pageRows: recordIndex, annotatedRows: snapshot.records.length }
    );
  }
  return { recordCount: recordIndex };
}

/**
 * Validate the manifest-like source index before reading its capture files.
 * File bytes are checked by the CLI; this pure part proves coverage and
 * references cannot silently drift from the snapshot or metadata.
 */
export function validateSourceIndex({ snapshot, metadata, sources }) {
  validateSnapshotRecordAlignment(snapshot);
  const metadataCaptures = metadata.sourceCaptures?.files;
  if (!Array.isArray(metadataCaptures)) {
    throw new KiePricingPullError(
      "invalid-source-index",
      "metadata source capture files are required"
    );
  }
  if (metadataCaptures.length !== snapshot.pages.length) {
    throw new KiePricingPullError(
      "source-capture-count-mismatch",
      `metadata lists ${metadataCaptures.length} captures for ${snapshot.pages.length} pages`
    );
  }
  for (const [index, entry] of metadataCaptures.entries()) {
    if (entry.pageNum !== snapshot.pages[index].pageNum) {
      throw new KiePricingPullError(
        "source-capture-page-mismatch",
        `capture ${index} does not identify its snapshot page`
      );
    }
  }

  if (!sources || sources.schema !== "gc.kie-pricing-sources.v1") {
    throw new KiePricingPullError(
      "invalid-source-index",
      "sources index is missing or has an unsupported schema"
    );
  }
  if (
    !Array.isArray(sources.captures) ||
    sources.captures.length !== snapshot.pages.length
  ) {
    throw new KiePricingPullError(
      "source-index-capture-count-mismatch",
      "sources captures must contain exactly one entry per snapshot page"
    );
  }

  const metadataByPath = new Map(
    metadataCaptures.map((capture) => [capture.path, capture])
  );
  for (const capture of sources.captures) {
    const metadataCapture = metadataByPath.get(capture.path);
    if (!metadataCapture || metadataCapture.sha256 !== capture.sha256) {
      throw new KiePricingPullError(
        "source-index-capture-reference-mismatch",
        `sources capture ${capture.path} is not backed by metadata checksum`
      );
    }
  }

  if (
    !Array.isArray(sources.facts) ||
    sources.facts.length !== snapshot.records.length
  ) {
    throw new KiePricingPullError(
      "source-fact-count-mismatch",
      "sources facts must cover every annotated record exactly once"
    );
  }
  const recordsByOccurrence = new Map(
    snapshot.records.map((record) => [record.occurrenceId, record])
  );
  const positionByOccurrence = new Map();
  let positionIndex = 0;
  for (const [pageIndex, page] of snapshot.pages.entries()) {
    const pageRows = page.response.data.records;
    for (const [rowIndex] of pageRows.entries()) {
      const record = snapshot.records[positionIndex++];
      positionByOccurrence.set(record.occurrenceId, {
        pageNum: page.pageNum,
        capturePath: metadataCaptures[pageIndex].path,
        jsonPointer: `/data/records/${rowIndex}`,
      });
    }
  }
  const seenOccurrences = new Set();
  const captureChecksums = new Map(
    sources.captures.map((capture) => [capture.path, capture.sha256])
  );
  for (const fact of sources.facts) {
    const record = recordsByOccurrence.get(fact.occurrenceId);
    if (!record || seenOccurrences.has(fact.occurrenceId)) {
      throw new KiePricingPullError(
        "source-fact-occurrence-mismatch",
        `source fact occurrence ${fact.occurrenceId} is missing or duplicated`
      );
    }
    if (
      fact.rowHash !== record.rowHash ||
      fact.semanticKey !== record.semanticKey ||
      canonicalJson(fact.officialFields) !== canonicalJson(record.raw)
    ) {
      throw new KiePricingPullError(
        "source-fact-row-mismatch",
        `source fact ${fact.occurrenceId} does not match snapshot raw fields`
      );
    }
    const expectedPosition = positionByOccurrence.get(fact.occurrenceId);
    if (
      fact.evidence?.pageNum !== expectedPosition.pageNum ||
      fact.evidence?.capturePath !== expectedPosition.capturePath ||
      fact.evidence?.jsonPointer !== expectedPosition.jsonPointer
    ) {
      throw new KiePricingPullError(
        "source-fact-position-mismatch",
        `source fact ${fact.occurrenceId} points at the wrong page or record position`
      );
    }
    const capturePath = fact.evidence?.capturePath;
    if (
      !captureChecksums.has(capturePath) ||
      fact.evidence?.captureSha256 !== captureChecksums.get(capturePath)
    ) {
      throw new KiePricingPullError(
        "source-fact-capture-reference-mismatch",
        `source fact ${fact.occurrenceId} has no verified capture reference`
      );
    }
    seenOccurrences.add(fact.occurrenceId);
  }
  return { occurrenceCount: seenOccurrences.size };
}
