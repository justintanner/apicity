/**
 * Sends one Telegram message per changed endpoint recording.
 *
 * The PR harness summary is GitHub-flavored Markdown. Telegram renders that
 * poorly, so this script emits compact HTML messages with escaped request and
 * response previews.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type ChangedRecording,
  type HarEntry,
  getBaseBranch,
  getChangedRecordings,
  getRequestBodyText,
} from "./har-data.js";

const ENDPOINT_DOCS_PATH = "scripts/endpoint-docs.tsv";
const DEFAULT_OUT_PATH = "harness-telegram-messages.json";
const MAX_MESSAGE_LEN = 4096;
const MAX_BLOCK_LEN = 900;

const CREDIT_URL_PATTERNS = [
  /\/credit/i,
  /\/billing/i,
  /\/usage/i,
  /\/analytics/i,
  /\/balance/i,
];

const MEDIA_URL_EXT =
  /\.(mp4|webm|mov|png|jpe?g|gif|webp|wav|mp3|ogg|flac|m4a)(?:\?|$)/i;

const RESPONSE_HEADER_PREVIEW_EXCLUDES = new Set([
  "connection",
  "content-length",
  "date",
  "server",
  "transfer-encoding",
  "via",
  "x-amz-id-2",
  "x-amz-request-id",
  "x-cache",
]);

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
}

export interface TelegramHarnessMessage {
  provider: string;
  recordingName: string;
  recordingPath: string;
  endpoint: string;
  apicityPath: string;
  status: string;
  text: string;
  parse_mode: "HTML";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 15)) + "\n...(truncated)";
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
  if (row.provider !== "s3") return false;
  if (entry.request.method.toUpperCase() !== row.method.toUpperCase()) {
    return false;
  }

  const objectRequest = isS3ObjectRequest(entry);
  const tagging = hasS3Subresource(entry, "tagging");
  const multipartCreate = hasS3Subresource(entry, "uploads");
  const multipartUpload = hasS3Subresource(entry, "uploadId");
  const multipartPart = hasS3Subresource(entry, "partNumber");
  const bulkDelete = hasS3Subresource(entry, "delete");
  const versioning = hasS3Subresource(entry, "versioning");
  const versions = hasS3Subresource(entry, "versions");
  const configId = hasS3Subresource(entry, "id");
  const bucketConfigSubresources = new Map<string, string>([
    ["analytics", "Analytics"],
    ["cors", "Cors"],
    ["encryption", "Encryption"],
    ["inventory", "Inventory"],
    ["lifecycle", "Lifecycle"],
    ["logging", "Logging"],
    ["metrics", "Metrics"],
    ["notification", "Notification"],
    ["ownershipControls", "OwnershipControls"],
    ["policy", "Policy"],
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
        !entry.request.url.includes("?")
      );
    case "buckets.create":
    case "buckets.del":
    case "buckets.head":
      return !objectRequest && !entry.request.url.includes("?");
    case "buckets.location":
      return !objectRequest && hasS3Subresource(entry, "location");
    case "buckets.getVersioning":
    case "buckets.putVersioning":
      return !objectRequest && versioning;
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
      return hasS3Subresource(entry, "list-type");
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
        !requestHeader(entry, "x-amz-copy-source")
      );
    case "objects.get":
    case "objects.head":
    case "objects.del":
      return objectRequest && !tagging && !multipartUpload;
    case "objects.getTagging":
    case "objects.putTagging":
    case "objects.delTagging":
      return objectRequest && tagging;
    default:
      return false;
  }
}

function findMatchingEndpointDoc(
  entry: HarEntry,
  rows: EndpointDocRow[],
  provider: string
): EndpointDocRow | null {
  if (provider === "s3") {
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

function findEndpointEntry(recording: ChangedRecording): HarEntry {
  const operations = recording.entries.filter((entry) => !isCreditEntry(entry));
  return (
    operations.find(
      (entry) => entry.response.status < 400 && responsePreview(entry)
    ) ??
    operations.find((entry) => responsePreview(entry)) ??
    operations[0] ??
    recording.entries[0]
  );
}

function prettyBody(raw: string | undefined): string {
  if (!raw) return "";

  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function responseBody(entry: HarEntry): string {
  const mime = entry.response.content?.mimeType ?? "";
  if (/^(audio|image|video)\//i.test(mime)) {
    return `(binary ${mime})`;
  }

  return prettyBody(entry.response.content?.text);
}

function responseHeaders(entry: HarEntry): string {
  const headers: Record<string, string> = {};

  for (const header of entry.response.headers) {
    const name = header.name.toLowerCase();
    if (RESPONSE_HEADER_PREVIEW_EXCLUDES.has(name)) continue;
    if (name.startsWith("x-amz-cf-")) continue;
    headers[name] = header.value;
  }

  return Object.keys(headers).length > 0
    ? JSON.stringify({ headers }, null, 2)
    : "";
}

function responsePreview(entry: HarEntry): string {
  return responseBody(entry) || responseHeaders(entry);
}

function collectMediaUrls(value: unknown, urls: Set<string>): void {
  if (typeof value === "string") {
    if (value.startsWith("http") && MEDIA_URL_EXT.test(value)) {
      urls.add(value);
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
    const raw = entry.response.content?.text;
    if (!raw) continue;

    try {
      collectMediaUrls(JSON.parse(raw), urls);
    } catch {
      for (const match of raw.matchAll(/https?:\/\/[^\s"<>\\]+/g)) {
        const url = match[0];
        if (MEDIA_URL_EXT.test(url)) urls.add(url);
      }
    }
  }

  return [...urls];
}

function mediaLabel(url: string): string {
  if (/\.(mp4|webm|mov)(?:\?|$)/i.test(url)) return "video";
  if (/\.(wav|mp3|ogg|flac|m4a)(?:\?|$)/i.test(url)) return "audio";
  return "image";
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

function compactMessage(lines: string[]): string {
  const text = lines.join("\n");
  if (text.length <= MAX_MESSAGE_LEN) return text;

  return lines
    .filter((line) => !line.startsWith("<pre>"))
    .concat("", "<i>Request/response previews omitted for Telegram size.</i>")
    .join("\n");
}

export function formatTelegramEndpointMessage(
  recording: ChangedRecording,
  endpointDocs: EndpointDocRow[] = parseEndpointDocs()
): TelegramHarnessMessage {
  const entry = findEndpointEntry(recording);
  const doc = findMatchingEndpointDoc(entry, endpointDocs, recording.provider);
  const endpoint = `${entry.request.method} ${stripQuery(entry.request.url)}`;
  const status = `${entry.response.status} ${entry.response.statusText}`.trim();
  const apicityPath = apicityPathFor(recording, entry, doc);
  const mediaUrls = extractMediaUrls(recording.entries);

  const request = prettyBody(getRequestBodyText(entry) ?? undefined);
  const response = responsePreview(entry);

  const lines: string[] = [
    "<b>Apicity endpoint</b>",
    `<b>${escapeHtml(recordingHeading(recording))}</b>`,
    "",
    `<b>Endpoint</b>: <code>${escapeHtml(endpoint)}</code>`,
    `<b>Apicity path</b>: <code>${escapeHtml(apicityPath)}</code>`,
    `<b>Status</b>: <code>${escapeHtml(status)}</code>`,
    `<b>Recording</b>: <code>${escapeHtml(recording.filePath)}</code>`,
  ];

  if (doc?.docsUrl) {
    lines.push(
      `<b>Docs</b>: <a href="${escapeHtmlAttr(doc.docsUrl)}">upstream</a>`
    );
  }

  if (recording.entries.length > 1) {
    lines.push(
      `<i>${recording.entries.length} API calls in this recording.</i>`
    );
  }

  if (request) {
    lines.push(
      "",
      "<b>Request</b>",
      `<pre>${escapeHtml(truncate(request, MAX_BLOCK_LEN))}</pre>`
    );
  }

  if (response) {
    lines.push(
      "",
      "<b>Response</b>",
      `<pre>${escapeHtml(truncate(response, MAX_BLOCK_LEN))}</pre>`
    );
  }

  if (mediaUrls.length > 0) {
    const links = mediaUrls.slice(0, 3).map((url) => {
      const label = mediaLabel(url);
      return `<a href="${escapeHtmlAttr(url)}">${label}</a>`;
    });
    lines.push("", `<b>Output</b>: ${links.join(" | ")}`);
  }

  return {
    provider: recording.provider,
    recordingName: recording.recordingName,
    recordingPath: recording.filePath,
    endpoint,
    apicityPath,
    status,
    text: compactMessage(lines),
    parse_mode: "HTML",
  };
}

export function buildTelegramHarnessMessages(
  recordings: ChangedRecording[],
  endpointDocs: EndpointDocRow[] = parseEndpointDocs()
): TelegramHarnessMessage[] {
  return recordings
    .filter((recording) => recording.entries.length > 0)
    .map((recording) => formatTelegramEndpointMessage(recording, endpointDocs));
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: TelegramHarnessMessage
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.text,
        parse_mode: message.parse_mode,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Telegram send failed for ${message.recordingName}: ` +
        `${response.status} ${body}`
    );
  }
}

export async function sendTelegramHarnessMessages(
  botToken: string,
  chatId: string,
  messages: TelegramHarnessMessage[]
): Promise<void> {
  for (const message of messages) {
    await sendTelegramMessage(botToken, chatId, message);
  }
}

function parseCliOptions(args: string[]): CliOptions {
  let dryRun = false;
  let outPath = DEFAULT_OUT_PATH;
  let baseBranch = getBaseBranch();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--out") {
      outPath = args[++i] ?? outPath;
    } else if (arg.startsWith("--out=")) {
      outPath = arg.slice("--out=".length);
    } else if (arg === "--base") {
      baseBranch = args[++i] ?? baseBranch;
    } else if (arg.startsWith("--base=")) {
      baseBranch = arg.slice("--base=".length);
    }
  }

  return { dryRun, outPath, baseBranch };
}

async function main(): Promise<void> {
  const opts = parseCliOptions(process.argv.slice(2));
  const recordings = getChangedRecordings(opts.baseBranch);
  const messages = buildTelegramHarnessMessages(recordings);

  fs.writeFileSync(opts.outPath, JSON.stringify(messages, null, 2), "utf-8");

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
