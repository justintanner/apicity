/**
 * Sends one Telegram message per changed endpoint recording.
 *
 * Each recording becomes a glanceable HTML message: a summary header
 * (status, apicity path, endpoint) followed by the full request/response
 * headers and bodies inside collapsed <blockquote expandable> sections.
 * Content that exceeds Telegram's 4096-char message limit spills into
 * numbered follow-up messages. Media found in the recording (base64
 * response bodies or recorded media URLs) is uploaded inline via
 * sendPhoto/sendVideo/sendAudio after the text.
 *
 * Default mode posts only recordings changed vs --base; pass --all
 * [pattern...] to post any recording on demand.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type ChangedRecording,
  type HarEntry,
  extractProvider,
  getBaseBranch,
  getChangedRecordings,
  getRequestBodyText,
  parseHarDir,
} from "./har-data.js";
import {
  isSensitiveRequestHeaderName,
  isSensitiveResponseHeaderName,
  scrubSensitiveRecording,
} from "./har-scrub.js";

const ENDPOINT_DOCS_PATH = "scripts/endpoint-docs.tsv";
const DEFAULT_OUT_PATH = "harness-telegram-messages.json";
const RECORDINGS_DIR = "tests/recordings";
const MAX_MESSAGE_LEN = 4096;
const MAX_CHUNKS_PER_RECORDING = 6;
const MAX_CAPTION_LEN = 1024;
const MAX_MEDIA_ITEMS = 5;
const MAX_MEDIA_BYTES = 45 * 1024 * 1024;
const MEDIA_DOWNLOAD_TIMEOUT_MS = 30_000;
// Telegram allows ~1 message/second per chat.
const SEND_SPACING_MS = 1100;

const CREDIT_URL_PATTERNS = [
  /\/credit/i,
  /\/billing/i,
  /\/usage/i,
  /\/analytics/i,
  /\/balance/i,
];

const MEDIA_URL_EXT =
  /\.(mp4|webm|mov|png|jpe?g|gif|webp|wav|mp3|ogg|flac|m4a)(?:\?|$)/i;
const REDACTED_QUERY_VALUE = "***";
const SIGNED_MEDIA_QUERY_PARAMS = new Set([
  "ossaccesskeyid",
  "signature",
  "x-oss-signature",
  "x-amz-credential",
  "x-amz-signature",
]);

const RESPONSE_HEADER_PREVIEW_EXCLUDES = new Set([
  "connection",
  "content-length",
  "date",
  "server",
  // set-cookie carries real session values that Polly does not redact.
  "set-cookie",
  "transfer-encoding",
  "via",
  "x-amz-id-2",
  "x-amz-request-id",
  "x-cache",
]);

const REQUEST_HEADER_PREVIEW_EXCLUDES = new Set([
  "connection",
  "content-length",
  "cookie",
]);

// Belt and braces on top of Polly's recording-time redaction: never post a
// header value that looks credential-shaped, even if a new recording path
// misses the redaction hook.
const SENSITIVE_HEADER_PATTERN =
  /authorization|api-key|apikey|token|secret|cookie|signature|credential/i;

export interface EndpointDocRow {
  provider: string;
  dotPath: string;
  method: string;
  fullUrl: string;
  docsUrl: string;
}

interface CliOptions {
  dryRun: boolean;
  outPath: string;
  baseBranch: string;
  all: boolean;
  filters: string[];
}

export type TelegramMediaSource =
  | { type: "base64"; data: string }
  | { type: "url"; url: string };

export interface TelegramMediaItem {
  kind: "photo" | "video" | "audio" | "document";
  mime: string;
  filename: string;
  caption: string;
  source: TelegramMediaSource;
}

export interface TelegramHarnessMessage {
  provider: string;
  recordingName: string;
  recordingPath: string;
  endpoint: string;
  apicityPath: string;
  status: string;
  /** HTML messages, each within Telegram's 4096-char limit, sent in order. */
  chunks: string[];
  /** First chunk; kept so dry-run JSON consumers can preview one field. */
  text: string;
  media: TelegramMediaItem[];
  parse_mode: "HTML";
}

interface Section {
  title: string;
  body: string;
}

interface GenerationReview {
  entry: HarEntry;
  requestEntry: HarEntry;
  responseEntry: HarEntry;
  statusSummary: string;
}

interface GenerationStatus {
  label: string;
  terminal: "success" | "failure" | "pending";
  detail: string | null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, "&quot;");
}

function stripQueryMarker(url: string): string {
  return url.replace(/\{query\}/g, "");
}

function stripQuery(url: string): string {
  return stripQueryMarker(url).split("?")[0];
}

function stripHost(url: string): string {
  if (url.startsWith("/")) return url;
  const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  return match ? (match[1] ?? "/") : url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonValue(raw: string | null | undefined): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function responseJson(entry: HarEntry): unknown | null {
  return parseJsonValue(entry.response.content?.text);
}

function nestedValue(value: unknown, path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function nestedString(value: unknown, path: string[]): string | null {
  const found = nestedValue(value, path);
  return typeof found === "string" && found ? found : null;
}

function firstNestedString(value: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    const found = nestedString(value, path);
    if (found) return found;
  }
  return null;
}

function pathSegments(url: string): string[] {
  const pathOnly = stripQueryMarker(stripHost(url)).split("?")[0].split("#")[0];
  return pathOnly.split("/").filter((segment) => segment.length > 0);
}

function isPlaceholder(segment: string): boolean {
  return segment.startsWith("{") && segment.endsWith("}");
}

function isContiguousSubsequence(
  needle: string[],
  haystack: string[]
): boolean {
  if (needle.length === 0) return true;
  if (needle.length > haystack.length) return false;

  outer: for (
    let start = 0;
    start <= haystack.length - needle.length;
    start++
  ) {
    for (let i = 0; i < needle.length; i++) {
      if (haystack[start + i] !== needle[i]) continue outer;
    }
    return true;
  }

  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileTsvUrlPattern(fullUrl: string): RegExp {
  const stripped = stripQuery(fullUrl);
  const escaped = escapeRegExp(stripped).replace(/\\\{[^}]+\\\}/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

function matchStrict(entry: HarEntry, row: EndpointDocRow): boolean {
  if (entry.request.method.toUpperCase() !== row.method.toUpperCase()) {
    return false;
  }
  return compileTsvUrlPattern(row.fullUrl).test(stripQuery(entry.request.url));
}

function matchLenient(entry: HarEntry, row: EndpointDocRow): boolean {
  if (entry.request.method.toUpperCase() !== row.method.toUpperCase()) {
    return false;
  }

  const harSegments = pathSegments(entry.request.url);
  const rowSegments = pathSegments(row.fullUrl).filter(
    (segment) => !isPlaceholder(segment)
  );
  if (rowSegments.length === 0) return harSegments.length === 0;

  return (
    isContiguousSubsequence(rowSegments, harSegments) ||
    isContiguousSubsequence(harSegments, rowSegments)
  );
}

function requestHeader(entry: HarEntry, name: string): string | undefined {
  const lowerName = name.toLowerCase();
  return entry.request.headers.find(
    (header) => header.name.toLowerCase() === lowerName
  )?.value;
}

function s3PathSegments(entry: HarEntry): string[] {
  try {
    return new URL(entry.request.url).pathname
      .split("/")
      .filter((segment) => segment.length > 0);
  } catch {
    return pathSegments(entry.request.url);
  }
}

function isS3PathStyleHost(hostname: string): boolean {
  return hostname === "s3.amazonaws.com" || /^s3[.-]/.test(hostname);
}

function isS3CompatibleProvider(provider: string): boolean {
  return provider === "s3" || provider === "b2";
}

function isS3ExpressControlHost(hostname: string): boolean {
  return /^s3express-control[.-]/.test(hostname);
}

function isS3ObjectRequest(entry: HarEntry): boolean {
  try {
    const url = new URL(entry.request.url);
    const segments = s3PathSegments(entry);
    return isS3PathStyleHost(url.hostname)
      ? segments.length >= 2
      : segments.length >= 1;
  } catch {
    return false;
  }
}

function hasS3Subresource(entry: HarEntry, name: string): boolean {
  try {
    return new URL(entry.request.url).searchParams.has(name);
  } catch {
    return false;
  }
}

function matchS3Endpoint(entry: HarEntry, row: EndpointDocRow): boolean {
  if (!isS3CompatibleProvider(row.provider)) return false;
  if (entry.request.method.toUpperCase() !== row.method.toUpperCase()) {
    return false;
  }

  const objectRequest = isS3ObjectRequest(entry);
  const tagging = hasS3Subresource(entry, "tagging");
  const listType = hasS3Subresource(entry, "list-type");
  const multipartCreate = hasS3Subresource(entry, "uploads");
  const multipartUpload = hasS3Subresource(entry, "uploadId");
  const multipartPart = hasS3Subresource(entry, "partNumber");
  const bulkDelete = hasS3Subresource(entry, "delete");
  const versioning = hasS3Subresource(entry, "versioning");
  const versions = hasS3Subresource(entry, "versions");
  const configId = hasS3Subresource(entry, "id");
  const abac = hasS3Subresource(entry, "abac");
  const accelerate = hasS3Subresource(entry, "accelerate");
  const acl = hasS3Subresource(entry, "acl");
  const attributes = hasS3Subresource(entry, "attributes");
  const legalHold = hasS3Subresource(entry, "legal-hold");
  const metadataConfiguration = hasS3Subresource(
    entry,
    "metadataConfiguration"
  );
  const metadataTable = hasS3Subresource(entry, "metadataTable");
  const metadataInventoryTable = hasS3Subresource(
    entry,
    "metadataInventoryTable"
  );
  const metadataJournalTable = hasS3Subresource(entry, "metadataJournalTable");
  const intelligentTiering = hasS3Subresource(entry, "intelligent-tiering");
  const objectLock = hasS3Subresource(entry, "object-lock");
  const policyStatus = hasS3Subresource(entry, "policyStatus");
  const renameObject = hasS3Subresource(entry, "renameObject");
  const restore = hasS3Subresource(entry, "restore");
  const retention = hasS3Subresource(entry, "retention");
  const select = hasS3Subresource(entry, "select");
  const torrent = hasS3Subresource(entry, "torrent");
  const encryption = hasS3Subresource(entry, "encryption");
  const bucketConfigSubresources = new Map<string, string>([
    ["analytics", "Analytics"],
    ["abac", "Abac"],
    ["accelerate", "AccelerateConfiguration"],
    ["acl", "Acl"],
    ["cors", "Cors"],
    ["encryption", "Encryption"],
    ["inventory", "Inventory"],
    ["lifecycle", "Lifecycle"],
    ["logging", "Logging"],
    ["metrics", "Metrics"],
    ["notification", "Notification"],
    ["ownershipControls", "OwnershipControls"],
    ["policy", "Policy"],
    ["policyStatus", "PolicyStatus"],
    ["publicAccessBlock", "PublicAccessBlock"],
    ["replication", "Replication"],
    ["requestPayment", "RequestPayment"],
    ["tagging", "Tagging"],
    ["website", "Website"],
  ]);

  switch (row.dotPath) {
    case "buckets.list":
      return (
        row.method === "GET" &&
        !objectRequest &&
        !entry.request.url.includes("?") &&
        !isS3ExpressControlHost(new URL(entry.request.url).hostname)
      );
    case "buckets.listDirectory":
      return isS3ExpressControlHost(new URL(entry.request.url).hostname);
    case "buckets.create":
    case "buckets.del":
    case "buckets.head":
      return !objectRequest && !entry.request.url.includes("?");
    case "buckets.createSession":
      return !objectRequest && hasS3Subresource(entry, "session");
    case "buckets.location":
      return !objectRequest && hasS3Subresource(entry, "location");
    case "buckets.getVersioning":
    case "buckets.putVersioning":
      return !objectRequest && versioning;
    case "buckets.getLifecycleLegacy":
    case "buckets.putLifecycleLegacy":
      return !objectRequest && hasS3Subresource(entry, "lifecycle");
    case "buckets.getNotificationLegacy":
    case "buckets.putNotificationLegacy":
      return !objectRequest && hasS3Subresource(entry, "notification");
    case "buckets.getObjectLockConfiguration":
    case "buckets.putObjectLockConfiguration":
      return !objectRequest && objectLock;
    case "buckets.createMetadataConfiguration":
    case "buckets.getMetadataConfiguration":
    case "buckets.delMetadataConfiguration":
      return !objectRequest && metadataConfiguration;
    case "buckets.createMetadataTableConfiguration":
    case "buckets.getMetadataTableConfiguration":
    case "buckets.delMetadataTableConfiguration":
      return !objectRequest && metadataTable;
    case "buckets.updateMetadataInventoryTable":
      return !objectRequest && metadataInventoryTable;
    case "buckets.updateMetadataJournalTable":
      return !objectRequest && metadataJournalTable;
    case "buckets.listIntelligentTiering":
      return !objectRequest && !configId && intelligentTiering;
    case "buckets.getIntelligentTiering":
    case "buckets.putIntelligentTiering":
    case "buckets.delIntelligentTiering":
      return !objectRequest && configId && intelligentTiering;
    case "buckets.listAnalytics":
      return (
        !objectRequest && !configId && hasS3Subresource(entry, "analytics")
      );
    case "buckets.listInventory":
      return (
        !objectRequest && !configId && hasS3Subresource(entry, "inventory")
      );
    case "buckets.listMetrics":
      return !objectRequest && !configId && hasS3Subresource(entry, "metrics");
    case "buckets.getAnalytics":
    case "buckets.putAnalytics":
    case "buckets.delAnalytics":
      return !objectRequest && configId && hasS3Subresource(entry, "analytics");
    case "buckets.getInventory":
    case "buckets.putInventory":
    case "buckets.delInventory":
      return !objectRequest && configId && hasS3Subresource(entry, "inventory");
    case "buckets.getMetrics":
    case "buckets.putMetrics":
    case "buckets.delMetrics":
      return !objectRequest && configId && hasS3Subresource(entry, "metrics");
    default:
      if (row.dotPath.startsWith("buckets.")) {
        for (const [subresource, suffix] of bucketConfigSubresources) {
          if (
            row.dotPath.endsWith(suffix) &&
            !objectRequest &&
            hasS3Subresource(entry, subresource)
          ) {
            return true;
          }
        }
      }
      break;
  }

  switch (row.dotPath) {
    case "objects.list":
      return listType;
    case "objects.listLegacy":
      return (
        !objectRequest &&
        !listType &&
        !versions &&
        !multipartCreate &&
        !bulkDelete &&
        !abac &&
        !accelerate &&
        !acl &&
        !intelligentTiering &&
        !metadataConfiguration &&
        !metadataTable &&
        !objectLock &&
        !policyStatus &&
        !versioning
      );
    case "objects.listVersions":
      return !objectRequest && versions;
    case "objects.delMany":
      return !objectRequest && bulkDelete;
    case "objects.copy":
      return (
        objectRequest &&
        !multipartUpload &&
        !!requestHeader(entry, "x-amz-copy-source")
      );
    case "objects.createMultipartUpload":
      return objectRequest && multipartCreate;
    case "objects.uploadPart":
      return (
        objectRequest &&
        multipartUpload &&
        multipartPart &&
        !requestHeader(entry, "x-amz-copy-source")
      );
    case "objects.uploadPartCopy":
      return (
        objectRequest &&
        multipartUpload &&
        multipartPart &&
        !!requestHeader(entry, "x-amz-copy-source")
      );
    case "objects.completeMultipartUpload":
      return objectRequest && multipartUpload;
    case "objects.abortMultipartUpload":
      return objectRequest && multipartUpload;
    case "objects.listParts":
      return objectRequest && multipartUpload;
    case "objects.listMultipartUploads":
      return !objectRequest && multipartCreate;
    case "objects.put":
      return (
        objectRequest &&
        !tagging &&
        !multipartCreate &&
        !multipartUpload &&
        !bulkDelete &&
        !acl &&
        !encryption &&
        !legalHold &&
        !renameObject &&
        !retention &&
        !requestHeader(entry, "x-amz-copy-source")
      );
    case "objects.get":
    case "objects.head":
    case "objects.del":
      return (
        objectRequest &&
        !tagging &&
        !multipartUpload &&
        !acl &&
        !attributes &&
        !encryption &&
        !legalHold &&
        !renameObject &&
        !retention &&
        !select &&
        !torrent
      );
    case "objects.getTagging":
    case "objects.putTagging":
    case "objects.delTagging":
      return objectRequest && tagging;
    case "objects.getAcl":
    case "objects.putAcl":
      return objectRequest && acl;
    case "objects.getAttributes":
      return objectRequest && attributes;
    case "objects.restore":
      return objectRequest && restore;
    case "objects.getLegalHold":
    case "objects.putLegalHold":
      return objectRequest && legalHold;
    case "objects.getRetention":
    case "objects.putRetention":
      return objectRequest && retention;
    case "objects.getTorrent":
      return objectRequest && torrent;
    case "objects.selectContent":
      return objectRequest && select;
    case "objects.rename":
      return objectRequest && renameObject;
    case "objects.updateEncryption":
      return objectRequest && encryption;
    case "objectLambda.writeGetObjectResponse":
      return stripQuery(entry.request.url).endsWith("/WriteGetObjectResponse");
    default:
      return false;
  }
}

function findMatchingEndpointDoc(
  entry: HarEntry,
  rows: EndpointDocRow[],
  provider: string
): EndpointDocRow | null {
  if (isS3CompatibleProvider(provider)) {
    for (const row of rows) {
      if (matchS3Endpoint(entry, row)) return row;
    }
  }

  for (const row of rows) {
    if (matchStrict(entry, row)) return row;
  }

  let best: EndpointDocRow | null = null;
  let bestLength = -1;
  for (const row of rows) {
    if (row.provider !== provider) continue;
    if (!matchLenient(entry, row)) continue;

    const rowLength = pathSegments(row.fullUrl).filter(
      (segment) => !isPlaceholder(segment)
    ).length;
    if (rowLength > bestLength) {
      best = row;
      bestLength = rowLength;
    }
  }

  return best;
}

function kebabDotPath(dotPath: string): string {
  return dotPath
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\./g, "-")
    .toLowerCase();
}

function recordingDotPathHints(dotPath: string): string[] {
  const kebab = kebabDotPath(dotPath);
  const parts = dotPath.split(".");
  const suffixes = parts
    .slice(1)
    .map((_, index) => kebabDotPath(parts.slice(index + 1).join(".")));
  return [
    kebab,
    kebab.replace(/^buckets-/, "bucket-"),
    kebab.replace(/^objects-/, "object-"),
    ...suffixes,
  ];
}

function findHintedEndpointDocMatch(
  recording: ChangedRecording,
  entry: HarEntry,
  rows: EndpointDocRow[]
): { length: number; row: EndpointDocRow } | null {
  const recordingName = recording.recordingName.toLowerCase();
  let best: { length: number; row: EndpointDocRow } | null = null;

  for (const row of rows) {
    if (row.provider !== recording.provider) continue;
    if (
      isS3CompatibleProvider(recording.provider) &&
      !matchS3Endpoint(entry, row)
    ) {
      continue;
    }
    if (
      !isS3CompatibleProvider(recording.provider) &&
      !matchStrict(entry, row)
    ) {
      continue;
    }

    const hint = recordingDotPathHints(row.dotPath)
      .filter((candidate) => recordingName.includes(candidate))
      .sort((a, b) => b.length - a.length)[0];
    if (!hint) continue;
    if (!best || hint.length > best.length) {
      best = { length: hint.length, row };
    }
  }

  return best;
}

function findHintedEndpointDoc(
  recording: ChangedRecording,
  entry: HarEntry,
  rows: EndpointDocRow[]
): EndpointDocRow | null {
  return findHintedEndpointDocMatch(recording, entry, rows)?.row ?? null;
}

function parseEndpointDocs(tsvPath = ENDPOINT_DOCS_PATH): EndpointDocRow[] {
  if (!fs.existsSync(tsvPath)) return [];

  const lines = fs.readFileSync(tsvPath, "utf-8").trim().split("\n");
  return lines.slice(1).flatMap((line) => {
    const [provider, dotPath, method, fullUrl, docsUrl = ""] = line.split("\t");
    if (!provider || !dotPath || !method || !fullUrl) return [];
    return [{ provider, dotPath, method, fullUrl, docsUrl }];
  });
}

function isCreditEntry(entry: HarEntry): boolean {
  const pathOnly = stripHost(entry.request.url);
  return CREDIT_URL_PATTERNS.some((pattern) => pattern.test(pathOnly));
}

function findEndpointEntry(
  recording: ChangedRecording,
  endpointDocs: EndpointDocRow[]
): HarEntry {
  const operations = recording.entries.filter((entry) => !isCreditEntry(entry));
  let hinted: { entry: HarEntry; length: number } | null = null;
  for (const entry of operations) {
    if (
      entry.response.status >= 400 ||
      (!responseBody(entry) && !responsePreview(entry))
    ) {
      continue;
    }
    const match = findHintedEndpointDocMatch(recording, entry, endpointDocs);
    if (!match) continue;
    if (!hinted || match.length > hinted.length) {
      hinted = { entry, length: match.length };
    }
  }
  if (hinted) return hinted.entry;

  return (
    operations.find(
      (entry) => entry.response.status < 400 && responseBody(entry)
    ) ??
    operations.find(
      (entry) => entry.response.status < 400 && responsePreview(entry)
    ) ??
    operations.find((entry) => responsePreview(entry)) ??
    operations[0] ??
    recording.entries[0]
  );
}

const DATA_URI_PATTERN = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([\s\S]+)$/i;
// Strings longer than this that look like raw base64 get summarized — a
// payload dump of encoded bytes is unreadable and floods the chat.
const LONG_BASE64_CHARS = 1024;
const BASE64ISH_PATTERN = /^[A-Za-z0-9+/=\r\n]+$/;

function base64ByteSize(base64: string): number {
  return Math.floor((base64.replace(/[\r\n=]/g, "").length * 3) / 4);
}

function summarizeEncodedString(value: string): string {
  const dataUri = value.match(DATA_URI_PATTERN);
  if (dataUri) {
    const size = formatByteSize(base64ByteSize(dataUri[2]));
    const uploaded = kindFromMime(dataUri[1]) ? " — sent below as media" : "";
    return `(data:${dataUri[1]} base64, ${size}${uploaded})`;
  }
  if (value.length > LONG_BASE64_CHARS && BASE64ISH_PATTERN.test(value)) {
    return `(base64, ${formatByteSize(base64ByteSize(value))})`;
  }
  return value;
}

function summarizeEncodedStrings(value: unknown): unknown {
  if (typeof value === "string") return summarizeEncodedString(value);
  if (Array.isArray(value)) return value.map(summarizeEncodedStrings);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        summarizeEncodedStrings(item),
      ])
    );
  }
  return value;
}

function prettyBody(raw: string | undefined): string {
  if (!raw) return "";

  try {
    return JSON.stringify(summarizeEncodedStrings(JSON.parse(raw)), null, 2);
  } catch {
    return summarizeEncodedString(raw);
  }
}

function isBinaryContent(entry: HarEntry): boolean {
  const mime = entry.response.content?.mimeType ?? "";
  return (
    entry.response.content?.encoding === "base64" ||
    /^(audio|image|video)\//i.test(mime)
  );
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function decodedByteLength(content: {
  text?: string;
  encoding?: string;
}): number {
  const text = content.text ?? "";
  return content.encoding === "base64"
    ? Buffer.from(text, "base64").length
    : Buffer.byteLength(text);
}

function responseBody(entry: HarEntry): string {
  const content = entry.response.content;
  if (!content) return "";

  if (isBinaryContent(entry)) {
    const mime = content.mimeType ?? "application/octet-stream";
    const size = formatByteSize(decodedByteLength(content));
    const isMedia = /^(audio|image|video)\//i.test(mime);
    return isMedia
      ? `(binary ${mime}, ${size} — sent below as media)`
      : `(binary ${mime}, ${size})`;
  }

  return prettyBody(content.text);
}

function headerLines(
  headers: Array<{ name: string; value: string }>,
  excludes: Set<string>,
  excludeSensitiveResponseHeaders = false
): string {
  return headers
    .filter((header) => {
      const name = header.name.toLowerCase();
      return (
        !excludes.has(name) &&
        !name.startsWith("x-amz-cf-") &&
        (!excludeSensitiveResponseHeaders ||
          !isSensitiveResponseHeaderName(name))
      );
    })
    .map((header) => {
      const value =
        isSensitiveRequestHeaderName(header.name) ||
        SENSITIVE_HEADER_PATTERN.test(header.name)
          ? "***"
          : header.value;
      return `${header.name}: ${value}`;
    })
    .join("\n");
}

function responseHeaders(entry: HarEntry): string {
  return headerLines(
    entry.response.headers,
    RESPONSE_HEADER_PREVIEW_EXCLUDES,
    true
  );
}

function responsePreview(entry: HarEntry): string {
  return responseBody(entry) || responseHeaders(entry);
}

function isExpiredUnixTimestamp(value: string | null): boolean {
  if (!value) return false;
  const expires = Number(value);
  if (!Number.isFinite(expires) || expires <= 0) return false;
  const expiresMs = expires > 10_000_000_000 ? expires : expires * 1000;
  return expiresMs <= Date.now();
}

function shouldSkipMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const params: Array<[string, string]> = [
      ...parsed.searchParams.entries(),
    ].map(([name, value]) => [name.toLowerCase(), value]);
    const hasSignedParam = params.some(([name]) =>
      SIGNED_MEDIA_QUERY_PARAMS.has(name)
    );
    if (!hasSignedParam) return false;

    const hasRedactedCredential = params.some(
      ([name, value]) =>
        SIGNED_MEDIA_QUERY_PARAMS.has(name) && value === REDACTED_QUERY_VALUE
    );
    const expires = params.find(([name]) => name === "expires")?.[1] ?? null;
    return hasRedactedCredential || isExpiredUnixTimestamp(expires);
  } catch {
    return false;
  }
}

function collectMediaUrls(value: unknown, urls: Set<string>): void {
  if (typeof value === "string") {
    if (
      value.startsWith("http") &&
      MEDIA_URL_EXT.test(value) &&
      !shouldSkipMediaUrl(value)
    ) {
      urls.add(value);
    }
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        collectMediaUrls(JSON.parse(trimmed), urls);
      } catch {
        // Plain strings can look JSON-ish without being valid JSON.
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectMediaUrls(item, urls);
    }
    return;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectMediaUrls(item, urls);
    }
  }
}

function extractMediaUrls(entries: HarEntry[]): string[] {
  const urls = new Set<string>();

  for (const entry of entries) {
    const raws = [getRequestBodyText(entry), entry.response.content?.text];

    for (const raw of raws) {
      if (!raw) continue;

      try {
        collectMediaUrls(JSON.parse(raw), urls);
      } catch {
        for (const match of raw.matchAll(/https?:\/\/[^\s"<>\\]+/g)) {
          const url = match[0];
          if (MEDIA_URL_EXT.test(url) && !shouldSkipMediaUrl(url)) {
            urls.add(url);
          }
        }
      }
    }
  }

  return [...urls];
}

const GENERATION_REQUEST_PATTERN =
  /image|video|i2v|t2v|text-to-image|image-to-image|image-to-video|text-to-video|video-generation|image-generation|grok-imagine|kling|wan|seedance|veo|sora|qwen/i;

const SUCCESS_GENERATION_STATES = new Set([
  "complete",
  "completed",
  "done",
  "success",
  "succeed",
  "succeeded",
]);

const FAILED_GENERATION_STATES = new Set([
  "cancelled",
  "canceled",
  "error",
  "expired",
  "failed",
  "failure",
  "rejected",
  "timeout",
  "timed_out",
]);

function isMediaGenerationRequest(entry: HarEntry): boolean {
  const haystack = `${entry.request.url}\n${getRequestBodyText(entry) ?? ""}`;
  return GENERATION_REQUEST_PATTERN.test(haystack);
}

function addTaskId(ids: Set<string>, value: unknown): void {
  if (typeof value !== "string" && typeof value !== "number") return;
  const id = String(value).trim();
  if (id) ids.add(id);
}

function taskIdsFromJson(value: unknown): Set<string> {
  const ids = new Set<string>();
  for (const path of [
    ["output", "task_id"],
    ["output", "taskId"],
    ["data", "taskId"],
    ["data", "task_id"],
    ["data", "recordId"],
    ["request_id"],
    ["id"],
  ]) {
    addTaskId(ids, nestedValue(value, path));
  }
  return ids;
}

function taskIdsFromRequest(entry: HarEntry): Set<string> {
  const ids = new Set<string>();
  try {
    const url = new URL(entry.request.url);
    for (const key of ["taskId", "task_id", "requestId", "request_id", "id"]) {
      addTaskId(ids, url.searchParams.get(key));
    }
    for (const segment of url.pathname.split("/").filter(Boolean)) {
      if (/^[a-z0-9][a-z0-9_-]{7,}$/i.test(segment)) {
        addTaskId(ids, segment);
      }
    }
  } catch {
    // Relative or malformed URLs are not expected for these API calls.
  }
  return ids;
}

function responseTaskIds(entry: HarEntry): Set<string> {
  return taskIdsFromJson(responseJson(entry));
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}

function normalizeGenerationState(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function generationStatus(entry: HarEntry): GenerationStatus | null {
  const json = responseJson(entry);
  const label = firstNestedString(json, [
    ["data", "state"],
    ["data", "status"],
    ["data", "task_status"],
    ["output", "task_status"],
    ["output", "status"],
    ["state"],
    ["status"],
    ["task_status"],
  ]);
  if (!label) return null;

  const normalized = normalizeGenerationState(label);
  const detail = firstNestedString(json, [
    ["data", "failMsg"],
    ["data", "error"],
    ["data", "message"],
    ["output", "message"],
    ["error", "message"],
    ["message"],
  ]);

  if (SUCCESS_GENERATION_STATES.has(normalized)) {
    return { label, terminal: "success", detail };
  }
  if (FAILED_GENERATION_STATES.has(normalized)) {
    return { label, terminal: "failure", detail };
  }
  return { label, terminal: "pending", detail };
}

function generationStatusSummary(
  status: GenerationStatus,
  pollCount: number
): string {
  const suffix = status.detail ? `: ${status.detail}` : "";
  if (status.terminal === "success") {
    return `Generation completed with status ${status.label} after ${pollCount} poll response(s).`;
  }
  if (status.terminal === "failure") {
    return `Generation failed with status ${status.label}${suffix}.`;
  }
  return (
    `Generation did not reach terminal success; latest recorded status is ` +
    `${status.label}${suffix}.`
  );
}

function findGenerationReviewForEntry(
  recording: ChangedRecording,
  requestEntry: HarEntry
): GenerationReview | null {
  if (!isMediaGenerationRequest(requestEntry)) return null;

  const taskIds = responseTaskIds(requestEntry);
  if (taskIds.size === 0) return null;

  const requestIndex = recording.entries.indexOf(requestEntry);
  if (requestIndex < 0) return null;

  const polls = recording.entries.slice(requestIndex + 1).filter((entry) => {
    const ids = new Set([
      ...taskIdsFromRequest(entry),
      ...responseTaskIds(entry),
    ]);
    return intersects(taskIds, ids) && generationStatus(entry) !== null;
  });
  if (polls.length === 0) return null;

  const statusByEntry = new Map<HarEntry, GenerationStatus>();
  for (const poll of polls) {
    const status = generationStatus(poll);
    if (status) statusByEntry.set(poll, status);
  }

  const successful = [...polls]
    .reverse()
    .find((entry) => statusByEntry.get(entry)?.terminal === "success");
  const failed = [...polls]
    .reverse()
    .find((entry) => statusByEntry.get(entry)?.terminal === "failure");
  const responseEntry = successful ?? failed ?? polls[polls.length - 1];
  const status = statusByEntry.get(responseEntry);
  if (!status) return null;

  return {
    entry: {
      request: requestEntry.request,
      response: responseEntry.response,
    },
    requestEntry,
    responseEntry,
    statusSummary: generationStatusSummary(status, polls.length),
  };
}

function findGenerationReview(
  recording: ChangedRecording,
  preferredEntry?: HarEntry
): GenerationReview | null {
  if (preferredEntry) {
    const review = findGenerationReviewForEntry(recording, preferredEntry);
    if (review) return review;
  }

  for (const entry of recording.entries) {
    if (isCreditEntry(entry)) continue;
    const review = findGenerationReviewForEntry(recording, entry);
    if (review) return review;
  }

  return null;
}

function kindFromMime(mime: string): TelegramMediaItem["kind"] | null {
  const lower = mime.toLowerCase();
  // sendPhoto rejects animated gifs; send them as documents instead.
  if (lower === "image/gif") return "document";
  if (lower.startsWith("image/")) return "photo";
  if (lower.startsWith("video/")) return "video";
  if (lower.startsWith("audio/")) return "audio";
  return null;
}

function kindFromUrl(url: string): TelegramMediaItem["kind"] {
  if (/\.gif(?:\?|$)/i.test(url)) return "document";
  if (/\.(mp4|webm|mov)(?:\?|$)/i.test(url)) return "video";
  if (/\.(wav|mp3|ogg|flac|m4a)(?:\?|$)/i.test(url)) return "audio";
  return "photo";
}

const MIME_BY_EXT: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  wav: "audio/wav",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
};

const EXT_BY_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_BY_EXT).map(([ext, mime]) => [mime, ext])
);

function urlExtension(url: string): string {
  const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "";
}

function urlFilename(url: string): string {
  try {
    const base = path.basename(new URL(url).pathname);
    if (base) return base;
  } catch {
    // fall through to the generic name below
  }
  return `media.${urlExtension(url) || "bin"}`;
}

function mediaCaption(
  recording: ChangedRecording,
  apicityPath: string
): string {
  const caption = `${recordingHeading(recording)} — ${apicityPath}`;
  return caption.length <= MAX_CAPTION_LEN
    ? caption
    : caption.slice(0, MAX_CAPTION_LEN - 1) + "…";
}

function collectDataUris(
  value: unknown,
  found: Array<{ mime: string; data: string }>
): void {
  if (typeof value === "string") {
    const match = value.match(DATA_URI_PATTERN);
    if (match) found.push({ mime: match[1].toLowerCase(), data: match[2] });
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectDataUris(item, found);
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) collectDataUris(item, found);
  }
}

function entryDataUris(entry: HarEntry): Array<{ mime: string; data: string }> {
  const found: Array<{ mime: string; data: string }> = [];
  const texts = [getRequestBodyText(entry)];
  if (entry.response.content?.encoding !== "base64") {
    texts.push(entry.response.content?.text ?? null);
  }

  for (const text of texts) {
    if (!text) continue;
    try {
      collectDataUris(JSON.parse(text), found);
    } catch {
      collectDataUris(text, found);
    }
  }
  return found;
}

export function collectMedia(
  recording: ChangedRecording,
  apicityPath: string,
  generationReview = findGenerationReview(recording)
): TelegramMediaItem[] {
  const caption = mediaCaption(recording, apicityPath);
  const items: TelegramMediaItem[] = [];
  const seenSources = new Set<string>();
  const slug = recording.recordingName.split("/").pop() ?? "recording";
  let base64Count = 0;

  const pushItem = (item: TelegramMediaItem): void => {
    const sourceKey =
      item.source.type === "url"
        ? `url:${item.source.url}`
        : `base64:${item.mime}:${item.source.data}`;
    if (seenSources.has(sourceKey)) return;
    seenSources.add(sourceKey);
    items.push(item);
  };

  const pushBase64 = (mime: string, data: string): void => {
    const kind = kindFromMime(mime);
    if (!kind) return;
    base64Count += 1;
    pushItem({
      kind,
      mime,
      filename: `${slug}-${base64Count}.${EXT_BY_MIME[mime.toLowerCase()] ?? "bin"}`,
      caption,
      source: { type: "base64", data },
    });
  };

  const base64Entries = generationReview
    ? [generationReview.responseEntry, generationReview.requestEntry]
    : recording.entries;
  const requestDataUris = generationReview
    ? entryDataUris(generationReview.requestEntry)
    : [];
  const requestDataKeys = new Set(
    requestDataUris.map((dataUri) => `${dataUri.mime}:${dataUri.data}`)
  );

  for (const entry of base64Entries) {
    // Binary response bodies (Polly stores them base64-encoded in the HAR).
    const content = entry.response.content;
    if (content?.encoding === "base64" && content.text) {
      pushBase64(content.mimeType ?? "", content.text);
    }
    // data: URIs embedded in request/response JSON (e.g. image-edit inputs).
    for (const dataUri of entryDataUris(entry)) {
      if (
        generationReview &&
        entry === generationReview.responseEntry &&
        requestDataKeys.has(`${dataUri.mime}:${dataUri.data}`)
      ) {
        continue;
      }
      pushBase64(dataUri.mime, dataUri.data);
    }
  }

  const urls = generationReview
    ? generationMediaUrls(generationReview)
    : extractMediaUrls(recording.entries);
  for (const url of urls) {
    pushItem({
      kind: kindFromUrl(url),
      mime: MIME_BY_EXT[urlExtension(url)] ?? "application/octet-stream",
      filename: urlFilename(url),
      caption,
      source: { type: "url", url },
    });
  }

  return items.slice(0, MAX_MEDIA_ITEMS);
}

function generationMediaUrls(review: GenerationReview): string[] {
  const requestUrls = extractMediaUrls([review.requestEntry]);
  const requestUrlSet = new Set(requestUrls);
  const responseUrls = extractMediaUrls([review.responseEntry]).filter(
    (url) => !requestUrlSet.has(url)
  );
  return [...responseUrls, ...requestUrls];
}

function recordingHeading(recording: ChangedRecording): string {
  return recording.recordingName.startsWith(`${recording.provider}/`)
    ? recording.recordingName
    : `${recording.provider}/${recording.recordingName}`;
}

function apicityPathFor(
  recording: ChangedRecording,
  entry: HarEntry,
  row: EndpointDocRow | null
): string {
  if (!row) return recording.provider;

  try {
    const url = new URL(entry.request.url);
    if (recording.provider === "fal" && url.hostname === "fal.run") {
      return `${recording.provider}.run.${row.dotPath}`;
    }
  } catch {
    // Fall back to provider + dotPath below.
  }

  return `${recording.provider}.${row.dotPath}`;
}

function headerCount(
  headers: Array<{ name: string; value: string }>,
  excludes: Set<string>,
  excludeSensitiveResponseHeaders = false
): number {
  return headers.filter((header) => {
    const name = header.name.toLowerCase();
    return (
      !excludes.has(name) &&
      !name.startsWith("x-amz-cf-") &&
      (!excludeSensitiveResponseHeaders || !isSensitiveResponseHeaderName(name))
    );
  }).length;
}

export function buildSections(
  entry: HarEntry,
  generationReview: GenerationReview | null = null
): Section[] {
  const sections: Section[] = [];

  const requestHeaders = headerLines(
    entry.request.headers,
    REQUEST_HEADER_PREVIEW_EXCLUDES
  );
  if (requestHeaders) {
    const count = headerCount(
      entry.request.headers,
      REQUEST_HEADER_PREVIEW_EXCLUDES
    );
    sections.push({
      title: `Request headers (${count})`,
      body: requestHeaders,
    });
  }

  const requestBody = prettyBody(getRequestBodyText(entry) ?? undefined);
  if (requestBody) {
    sections.push({
      title: `Request body (${formatByteSize(Buffer.byteLength(requestBody))})`,
      body: requestBody,
    });
  }

  if (generationReview) {
    sections.push({
      title: "Generation status",
      body: generationReview.statusSummary,
    });
  }

  const respHeaders = responseHeaders(entry);
  if (respHeaders) {
    const count = headerCount(
      entry.response.headers,
      RESPONSE_HEADER_PREVIEW_EXCLUDES,
      true
    );
    sections.push({
      title: `Response headers (${count})`,
      body: respHeaders,
    });
  }

  const respBody = responseBody(entry);
  if (respBody) {
    const label = isBinaryContent(entry)
      ? `Response body`
      : `Response body (${formatByteSize(Buffer.byteLength(respBody))})`;
    sections.push({ title: label, body: respBody });
  }

  return sections;
}

function renderSectionBlock(title: string, escapedBody: string): string {
  return `<b>${escapeHtml(title)}</b>\n<blockquote expandable>${escapedBody}</blockquote>`;
}

// Split a single escaped line that exceeds `size`, never cutting through an
// HTML entity (escaped text only contains entities of the form &…; within a
// few chars of the ampersand).
function entitySafeSlices(line: string, size: number): string[] {
  const slices: string[] = [];
  let rest = line;
  while (rest.length > size) {
    let cut = size;
    const amp = rest.lastIndexOf("&", cut - 1);
    if (amp > 0 && rest.indexOf(";", amp) >= cut) cut = amp;
    slices.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  slices.push(rest);
  return slices;
}

// Render one section into one or more self-contained HTML blocks, splitting
// the (already escaped) body at newline boundaries when it can't fit a
// single chunk. Tags always open and close within a block, so chunks built
// from whole blocks can never split a tag, entity, or blockquote.
function sectionBlocks(section: Section, budget: number): string[] {
  const escaped = escapeHtml(section.body);
  const whole = renderSectionBlock(section.title, escaped);
  if (whole.length <= budget) return [whole];

  const overhead = renderSectionBlock(
    `${section.title} — part 99/99`,
    ""
  ).length;
  const capacity = Math.max(256, budget - overhead);

  const bodies: string[] = [];
  let part = "";
  for (const line of escaped.split("\n")) {
    for (const piece of entitySafeSlices(line, capacity)) {
      if (part && part.length + 1 + piece.length > capacity) {
        bodies.push(part);
        part = piece;
      } else {
        part = part ? `${part}\n${piece}` : piece;
      }
    }
  }
  if (part) bodies.push(part);

  return bodies.map((body, index) =>
    renderSectionBlock(
      `${section.title} — part ${index + 1}/${bodies.length}`,
      body
    )
  );
}

// Pack the header and section blocks into HTML messages of at most maxLen
// chars. Follow-up chunks get a "(part i/N)" heading so they stay
// attributable when other recordings' messages interleave in the chat.
export function chunkMessage(
  header: string,
  heading: string,
  sections: Section[],
  maxLen = MAX_MESSAGE_LEN
): string[] {
  const continuation = `<b>${escapeHtml(heading)}</b> <i>(part 99/99)</i>\n\n`;
  const budget = maxLen - continuation.length;

  const blocks = sections.flatMap((section) => sectionBlocks(section, budget));

  let chunks: string[] = [];
  let current = header;
  for (const block of blocks) {
    if (current.length + 2 + block.length <= budget) {
      current = `${current}\n\n${block}`;
    } else {
      chunks.push(current);
      current = block;
    }
  }
  chunks.push(current);

  // Even with base64 payloads summarized, a recording can carry more text
  // than is readable in a chat. Cap the spill and say what was dropped.
  if (chunks.length > MAX_CHUNKS_PER_RECORDING) {
    const omitted = chunks.length - (MAX_CHUNKS_PER_RECORDING - 1);
    chunks = chunks.slice(0, MAX_CHUNKS_PER_RECORDING - 1);
    chunks.push(
      `<i>${omitted} more part(s) omitted — too long for Telegram. ` +
        `Open the recording in the harness viewer for the full content.</i>`
    );
  }

  if (chunks.length === 1) return chunks;
  return chunks.map((chunk, index) =>
    index === 0
      ? chunk
      : `<b>${escapeHtml(heading)}</b> <i>(part ${index + 1}/${chunks.length})</i>\n\n${chunk}`
  );
}

function renderHeader(
  recording: ChangedRecording,
  entry: HarEntry,
  doc: EndpointDocRow | null,
  endpoint: string,
  apicityPath: string,
  status: string
): string {
  const ok = entry.response.status < 400;
  const lines: string[] = [
    `${ok ? "✅" : "❌"} <b>${escapeHtml(recordingHeading(recording))}</b>`,
    `<code>${escapeHtml(apicityPath)}</code>`,
    "",
    `<code>${escapeHtml(endpoint)}</code> → <code>${escapeHtml(status)}</code>`,
    `<b>Recording</b>: <code>${escapeHtml(recording.filePath)}</code>`,
  ];

  if (doc?.docsUrl) {
    lines.push(
      `<b>Docs</b>: <a href="${escapeHtmlAttr(doc.docsUrl)}">upstream</a>`
    );
  }

  if (recording.entries.length > 1) {
    lines.push(
      `<i>${recording.entries.length} API calls in this recording; showing the primary one.</i>`
    );
  }

  return lines.join("\n");
}

export function formatTelegramEndpointMessage(
  recording: ChangedRecording,
  endpointDocs: EndpointDocRow[] = parseEndpointDocs()
): TelegramHarnessMessage {
  const sanitizedRecording = sanitizeRecordingForPreview(recording);
  const endpointEntry = findEndpointEntry(sanitizedRecording, endpointDocs);
  const generationReview = findGenerationReview(
    sanitizedRecording,
    endpointEntry
  );
  const entry = generationReview?.entry ?? endpointEntry;
  const doc =
    findHintedEndpointDoc(sanitizedRecording, endpointEntry, endpointDocs) ??
    findMatchingEndpointDoc(
      endpointEntry,
      endpointDocs,
      sanitizedRecording.provider
    );
  const endpoint = `${endpointEntry.request.method} ${stripQuery(endpointEntry.request.url)}`;
  const status = `${entry.response.status} ${entry.response.statusText}`.trim();
  const apicityPath = apicityPathFor(sanitizedRecording, endpointEntry, doc);

  const header = renderHeader(
    sanitizedRecording,
    endpointEntry,
    doc,
    endpoint,
    apicityPath,
    status
  );
  const chunks = chunkMessage(
    header,
    recordingHeading(sanitizedRecording),
    buildSections(entry, generationReview)
  );

  return {
    provider: sanitizedRecording.provider,
    recordingName: sanitizedRecording.recordingName,
    recordingPath: sanitizedRecording.filePath,
    endpoint,
    apicityPath,
    status,
    chunks,
    text: chunks[0],
    media: collectMedia(sanitizedRecording, apicityPath, generationReview),
    parse_mode: "HTML",
  };
}

function sanitizeRecordingForPreview(
  recording: ChangedRecording
): ChangedRecording {
  const sanitized: ChangedRecording = {
    ...recording,
    entries: recording.entries.map((entry) => structuredClone(entry)),
  };
  for (const entry of sanitized.entries) {
    scrubSensitiveRecording(entry);
  }
  return sanitized;
}

export function buildTelegramHarnessMessages(
  recordings: ChangedRecording[],
  endpointDocs: EndpointDocRow[] = parseEndpointDocs()
): TelegramHarnessMessage[] {
  return recordings
    .filter((recording) => recording.entries.length > 0)
    .map((recording) => formatTelegramEndpointMessage(recording, endpointDocs));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function telegramApi(
  botToken: string,
  method: string,
  payload: FormData | Record<string, unknown>,
  attempt = 0
): Promise<Response> {
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  const init: RequestInit =
    payload instanceof FormData
      ? { method: "POST", body: payload }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        };

  const response = await fetch(url, init);

  if (response.status === 429 && attempt < 2) {
    const body = (await response.json().catch(() => null)) as {
      parameters?: { retry_after?: number };
    } | null;
    const retryAfter = body?.parameters?.retry_after ?? 5;
    await sleep((retryAfter + 1) * 1000);
    return telegramApi(botToken, method, payload, attempt + 1);
  }

  return response;
}

async function sendChunk(
  botToken: string,
  chatId: string,
  recordingName: string,
  chunk: string
): Promise<void> {
  const response = await telegramApi(botToken, "sendMessage", {
    chat_id: chatId,
    text: chunk,
    parse_mode: "HTML",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Telegram send failed for ${recordingName}: ${response.status} ${body}`
    );
  }
}

async function resolveMediaBuffer(item: TelegramMediaItem): Promise<Buffer> {
  if (item.source.type === "base64") {
    return Buffer.from(item.source.data, "base64");
  }

  const response = await fetch(item.source.url, {
    signal: AbortSignal.timeout(MEDIA_DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`download failed: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_MEDIA_BYTES) {
    throw new Error(
      `media too large for Telegram upload (${formatByteSize(bytes.length)})`
    );
  }
  return bytes;
}

const SEND_METHOD_BY_KIND: Record<TelegramMediaItem["kind"], string> = {
  photo: "sendPhoto",
  video: "sendVideo",
  audio: "sendAudio",
  document: "sendDocument",
};

async function sendMediaItem(
  botToken: string,
  chatId: string,
  item: TelegramMediaItem
): Promise<void> {
  const bytes = await resolveMediaBuffer(item);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", item.caption);
  form.append(
    item.kind,
    new Blob([new Uint8Array(bytes)], { type: item.mime }),
    item.filename
  );

  const response = await telegramApi(
    botToken,
    SEND_METHOD_BY_KIND[item.kind],
    form
  );
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
}

// Media must never fail the run: recorded URLs expire (fal.media, kie) and a
// dead link is not a reason to go red in CI. Fall back to a plain message.
async function sendMediaWithFallback(
  botToken: string,
  chatId: string,
  recordingName: string,
  item: TelegramMediaItem
): Promise<void> {
  try {
    await sendMediaItem(botToken, chatId, item);
    return;
  } catch (error) {
    console.warn(
      `Media upload failed for ${recordingName} (${item.filename}): ` +
        `${error instanceof Error ? error.message : String(error)}`
    );
  }

  const fallback =
    item.source.type === "url"
      ? `${escapeHtml(item.caption)}\n<a href="${escapeHtmlAttr(item.source.url)}">${escapeHtml(item.kind)}</a> <i>(upload failed; original URL)</i>`
      : `${escapeHtml(item.caption)}\n<i>(${escapeHtml(item.mime)} attachment could not be uploaded)</i>`;

  try {
    await sendChunk(botToken, chatId, recordingName, fallback);
  } catch (error) {
    console.warn(
      `Media fallback message failed for ${recordingName}: ` +
        `${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function sendTelegramHarnessMessages(
  botToken: string,
  chatId: string,
  messages: TelegramHarnessMessage[]
): Promise<void> {
  let first = true;
  for (const message of messages) {
    for (const chunk of message.chunks) {
      if (!first) await sleep(SEND_SPACING_MS);
      first = false;
      await sendChunk(botToken, chatId, message.recordingName, chunk);
    }
    for (const item of message.media) {
      await sleep(SEND_SPACING_MS);
      await sendMediaWithFallback(
        botToken,
        chatId,
        message.recordingName,
        item
      );
    }
  }
}

function parseCliOptions(args: string[]): CliOptions {
  let dryRun = false;
  let outPath = DEFAULT_OUT_PATH;
  let baseBranch = getBaseBranch();
  let all = false;
  const filters: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--all") {
      all = true;
    } else if (arg === "--out") {
      outPath = args[++i] ?? outPath;
    } else if (arg.startsWith("--out=")) {
      outPath = arg.slice("--out=".length);
    } else if (arg === "--base") {
      baseBranch = args[++i] ?? baseBranch;
    } else if (arg.startsWith("--base=")) {
      baseBranch = arg.slice("--base=".length);
    } else if (!arg.startsWith("-")) {
      filters.push(arg);
    }
  }

  return { dryRun, outPath, baseBranch, all, filters };
}

// --all mode: walk tests/recordings/ instead of the git diff, optionally
// narrowed by substring filters on the recording name or file path.
function allRecordings(filters: string[]): ChangedRecording[] {
  const recordings = parseHarDir(RECORDINGS_DIR).map(
    (rec): ChangedRecording => ({
      filePath: path.relative(process.cwd(), rec.source),
      changeType: "modified",
      provider: extractProvider(rec.source),
      recordingName: rec.name,
      entries: rec.entries,
    })
  );

  if (filters.length === 0) return recordings;
  return recordings.filter((rec) =>
    filters.some(
      (filter) =>
        rec.filePath.includes(filter) ||
        rec.recordingName.includes(filter) ||
        recordingHeading(rec).includes(filter)
    )
  );
}

// The dry-run JSON is for human inspection and the CI message-count check;
// replace base64 payloads with their byte length so the file stays small.
function jsonSafeMessages(messages: TelegramHarnessMessage[]): unknown[] {
  return messages.map((message) => ({
    ...message,
    media: message.media.map((item) =>
      item.source.type === "base64"
        ? {
            ...item,
            source: {
              type: "base64",
              byteLength: Buffer.from(item.source.data, "base64").length,
            },
          }
        : item
    ),
  }));
}

async function main(): Promise<void> {
  const opts = parseCliOptions(process.argv.slice(2));
  const recordings = opts.all
    ? allRecordings(opts.filters)
    : getChangedRecordings(opts.baseBranch);
  const messages = buildTelegramHarnessMessages(recordings);

  fs.writeFileSync(
    opts.outPath,
    JSON.stringify(jsonSafeMessages(messages), null, 2),
    "utf-8"
  );

  if (opts.dryRun || messages.length === 0) {
    console.log(
      `Wrote ${messages.length} Telegram message(s) to ${opts.outPath}`
    );
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_KEY;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    throw new Error(
      "TELEGRAM_BOT_KEY and TELEGRAM_CHAT_ID are required unless --dry-run is set"
    );
  }

  await sendTelegramHarnessMessages(botToken, chatId, messages);
  console.log(`Sent ${messages.length} Telegram endpoint message(s)`);
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";

if (import.meta.url === invokedPath) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
