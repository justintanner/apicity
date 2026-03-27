/**
 * Generates a visual Markdown summary of changed HAR recordings for PR comments.
 * Extracts prompts, input media, and output media/text from each recording.
 * Used in CI via: npx tsx tests/harness-summary.ts
 * Writes harness-summary.md and sets GitHub Actions outputs.
 */

import fs from "node:fs";
import path from "node:path";
import {
  type ChangedRecording,
  type HarEntry,
  getBaseBranch,
  getChangedRecordings,
} from "./har-data.js";

const MAX_PROMPT_LEN = 300;
const MAX_TEXT_LEN = 500;
const MAX_JSON_LEN = 500;
const MAX_COMMENT_LEN = 60_000;
const ASSETS_DIR = "tests/harness-assets";

const VISIBLE_REQUEST_HEADERS = new Set([
  "content-type",
  "authorization",
  "accept",
]);

const BINARY_MIME_PREFIXES = [
  "audio/",
  "image/",
  "video/",
  "application/octet",
];

interface MediaItem {
  type: "image" | "video" | "audio";
  url: string;
  label?: string;
}

interface OutputResult {
  type: "image" | "video" | "text" | "async" | "metadata";
  url?: string;
  text?: string;
  duration?: number;
  b64AssetPath?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

function parseBody(entry: HarEntry): Record<string, unknown> | null {
  const raw = entry.request.postData?.text;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseResponseBody(entry: HarEntry): Record<string, unknown> | null {
  const raw = entry.response.content?.text;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildRepoUrl(filePath: string): string {
  const repo = process.env.GITHUB_REPOSITORY ?? "owner/repo";
  const ref = process.env.GITHUB_HEAD_REF ?? "main";
  return `https://raw.githubusercontent.com/${repo}/${ref}/${filePath}`;
}

function mimeToExt(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function inferMimeFromB64(b64: string): string {
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("R0lGOD")) return "image/gif";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

// ---------------------------------------------------------------------------
// Prompt extraction
// ---------------------------------------------------------------------------

function extractPrompt(entries: HarEntry[]): string {
  const body = parseBody(entries[0]);
  if (!body) return "";

  // Direct prompt field (image/video generation)
  if (typeof body.prompt === "string") {
    return truncate(body.prompt, MAX_PROMPT_LEN);
  }

  // KIE input.prompt
  const input = body.input as Record<string, unknown> | undefined;
  if (input && typeof input.prompt === "string") {
    return truncate(input.prompt, MAX_PROMPT_LEN);
  }

  // Messages array (chat, vision)
  const messages = body.messages as Array<Record<string, unknown>> | undefined;
  if (messages && messages.length > 0) {
    const last = messages[messages.length - 1];
    if (typeof last.content === "string") {
      return truncate(last.content, MAX_PROMPT_LEN);
    }
    // Array content (vision: [{type:"text",text:"..."}, {type:"image_url",...}])
    if (Array.isArray(last.content)) {
      const textParts = (last.content as Array<Record<string, unknown>>)
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string);
      if (textParts.length > 0) {
        return truncate(textParts.join(" "), MAX_PROMPT_LEN);
      }
    }
  }

  return "";
}

// ---------------------------------------------------------------------------
// Input media extraction
// ---------------------------------------------------------------------------

/** Map recording name patterns to known repo source files. */
const SOURCE_FILE_MAP: Array<[RegExp, string | null]> = [
  [/^xai\/image-edit/, "public/cat1.jpg"],
  [/^xai\/video-cat-image/, "public/cat1.jpg"],
  [/^xai\/video-image-to-video/, "public/cat1.jpg"],
  [/^xai\/video-reference-images/, "public/cat1.jpg"],
  [/^openai\/vision/, "tests/fixtures/red.png"],
  [/^kimicoding\/.*image-base64/, null], // 1px test pixel, skip
  [/^kie\/e2e-motion-control/, null], // uses external URLs
  [/^kie\/kling-motion-control/, null], // uses external URLs
];

function inferSourceFile(recordingName: string): string | null {
  for (const [pattern, file] of SOURCE_FILE_MAP) {
    if (pattern.test(recordingName)) return file ?? null;
  }
  return null;
}

function extractInputMedia(
  entries: HarEntry[],
  recordingName: string
): MediaItem[] {
  const items: MediaItem[] = [];
  const body = parseBody(entries[0]);
  if (!body) return items;

  // Check for known repo source file first
  const sourceFile = inferSourceFile(recordingName);
  if (sourceFile) {
    items.push({
      type: "image",
      url: buildRepoUrl(sourceFile),
      label: sourceFile,
    });
    return items;
  }

  // xAI image edit: body.image.url
  const image = body.image as Record<string, unknown> | undefined;
  if (image && typeof image.url === "string") {
    const url = image.url as string;
    if (url.startsWith("http")) {
      items.push({ type: "image", url });
    }
  }

  // xAI video edit: body.video.url
  const video = body.video as Record<string, unknown> | undefined;
  if (video && typeof video.url === "string") {
    items.push({ type: "video", url: video.url as string });
  }

  // KIE motion control: body.input.input_urls / video_urls
  const input = body.input as Record<string, unknown> | undefined;
  if (input) {
    const inputUrls = input.input_urls as string[] | undefined;
    if (Array.isArray(inputUrls)) {
      for (const url of inputUrls) {
        items.push({ type: "image", url });
      }
    }
    const videoUrls = input.video_urls as string[] | undefined;
    if (Array.isArray(videoUrls)) {
      for (const url of videoUrls) {
        items.push({ type: "video", url });
      }
    }
  }

  // xAI video reference images: body.reference_images[].url
  const refImages = body.reference_images as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(refImages)) {
    for (const ref of refImages) {
      if (typeof ref.url === "string") {
        const url = ref.url as string;
        if (url.startsWith("http")) {
          items.push({ type: "image", url });
        }
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Output extraction
// ---------------------------------------------------------------------------

function isPollingResponse(body: Record<string, unknown>): boolean {
  return (
    typeof body.status === "string" &&
    (body.status === "pending" || body.status === "queuing") &&
    !body.video
  );
}

function saveBase64Asset(
  b64: string,
  recordingName: string
): string | undefined {
  const mime = inferMimeFromB64(b64);
  const ext = mimeToExt(mime);
  const safeName = recordingName.replace(/[^a-z0-9-]/gi, "-");
  const assetPath = path.join(ASSETS_DIR, `${safeName}.${ext}`);

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.writeFileSync(assetPath, Buffer.from(b64, "base64"));
  return assetPath;
}

function reassembleSSE(text: string): string {
  const parts: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const data = JSON.parse(line.slice(5)) as Record<string, unknown>;
      if (data.type === "content_block_delta") {
        const delta = data.delta as Record<string, unknown> | undefined;
        if (delta && typeof delta.text === "string") {
          parts.push(delta.text as string);
        }
      }
    } catch {
      // skip
    }
  }
  return parts.join("");
}

function extractOutput(
  entries: HarEntry[],
  recordingName: string
): OutputResult {
  // Walk from the end to find the last meaningful response
  for (let i = entries.length - 1; i >= 0; i--) {
    const resBody = parseResponseBody(entries[i]);
    if (!resBody) continue;
    if (isPollingResponse(resBody)) continue;

    // Image URL: data[].url
    const data = resBody.data as
      | Array<Record<string, unknown>>
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (typeof first.url === "string") {
        return { type: "image", url: first.url as string };
      }
      // Base64 image: data[].b64_json
      if (typeof first.b64_json === "string") {
        const assetPath = saveBase64Asset(
          first.b64_json as string,
          recordingName
        );
        if (assetPath) {
          return { type: "image", b64AssetPath: assetPath };
        }
      }
    }

    // Completed video poll: status=done with video.url
    if (resBody.status === "done") {
      const video = resBody.video as Record<string, unknown> | undefined;
      if (video && typeof video.url === "string" && video.url) {
        return {
          type: "video",
          url: video.url as string,
          duration:
            typeof video.duration === "number"
              ? (video.duration as number)
              : undefined,
        };
      }
    }

    // Failed video poll: status=failed
    if (resBody.status === "failed") {
      const error = resBody.error as Record<string, unknown> | undefined;
      const msg = error?.message ?? "generation failed";
      return { type: "text", text: `Failed: ${msg}` };
    }

    // Chat completion: choices[].message.content
    const choices = resBody.choices as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(choices) && choices.length > 0) {
      const msg = choices[0].message as Record<string, unknown> | undefined;
      if (msg && typeof msg.content === "string") {
        return { type: "text", text: msg.content as string };
      }
    }

    // Anthropic format: content[].text
    const content = resBody.content as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(content) && content.length > 0) {
      const textParts = content
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text as string);
      if (textParts.length > 0) {
        return { type: "text", text: textParts.join("") };
      }
    }

    // Transcription: { text: "..." }
    if (typeof resBody.text === "string" && resBody.text) {
      return { type: "text", text: resBody.text as string };
    }

    // Async task: { data: { taskId: "..." } }
    if (
      data &&
      !Array.isArray(data) &&
      typeof (data as Record<string, unknown>).taskId === "string"
    ) {
      return { type: "async" };
    }

    // Video generation: { request_id: "..." } (async, no result yet)
    if (typeof resBody.request_id === "string") {
      // Keep looking — a later entry might have the completed poll
      continue;
    }

    // Metadata / other JSON
    return { type: "metadata" };
  }

  // SSE streaming response
  for (const entry of entries) {
    if (entry.response.content?.text?.startsWith("event:")) {
      const text = reassembleSSE(entry.response.content.text!);
      if (text) return { type: "text", text };
    }
  }

  // All entries were request_id or pending polls — treat as async
  return { type: "async" };
}

// ---------------------------------------------------------------------------
// HTTP detail helpers
// ---------------------------------------------------------------------------

function extractUrlPath(fullUrl: string): string {
  try {
    return new URL(fullUrl).pathname;
  } catch {
    return fullUrl;
  }
}

function findHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  const match = headers.find((h) => h.name.toLowerCase() === lower);
  return match?.value;
}

function isBinaryContentType(contentType: string): boolean {
  const lower = contentType.toLowerCase();
  return BINARY_MIME_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function isMultipartRequest(entry: HarEntry): boolean {
  const ct = findHeader(entry.request.headers, "content-type") ?? "";
  return ct.toLowerCase().startsWith("multipart/form-data");
}

function renderRequestSection(entry: HarEntry): string[] {
  const lines: string[] = [];
  const method = entry.request.method;
  const urlPath = extractUrlPath(entry.request.url);

  // HTTP method + path + filtered headers
  const httpLines: string[] = [`${method} ${urlPath}`];
  for (const header of entry.request.headers) {
    if (VISIBLE_REQUEST_HEADERS.has(header.name.toLowerCase())) {
      httpLines.push(`${header.name.toLowerCase()}: ${header.value}`);
    }
  }

  lines.push("#### Request", "", "```http", ...httpLines, "```");

  // Request body
  if (isMultipartRequest(entry)) {
    lines.push("```", "(multipart/form-data)", "```");
  } else if (entry.request.postData?.text) {
    let bodyText: string;
    try {
      const parsed = JSON.parse(entry.request.postData.text);
      bodyText = JSON.stringify(parsed, null, 2);
    } catch {
      bodyText = entry.request.postData.text;
    }
    lines.push("```json", truncate(bodyText, MAX_JSON_LEN), "```");
  }

  lines.push("");
  return lines;
}

function renderResponseSection(entry: HarEntry): string[] {
  const lines: string[] = [];
  const status = entry.response.status;
  const statusText = entry.response.statusText;
  const contentType = findHeader(entry.response.headers, "content-type") ?? "";

  // HTTP status + content-type header
  const httpLines: string[] = [`HTTP ${status} ${statusText}`];
  if (contentType) {
    httpLines.push(`content-type: ${contentType}`);
  }

  lines.push("#### Response", "", "```http", ...httpLines, "```");

  // Response body
  const rawBody = entry.response.content?.text;
  if (isBinaryContentType(contentType)) {
    const size = rawBody ? Buffer.byteLength(rawBody, "utf-8") : 0;
    lines.push("```", `(binary: ${contentType}, ${size} bytes)`, "```");
  } else if (rawBody) {
    let bodyText: string;
    try {
      const parsed = JSON.parse(rawBody);
      bodyText = JSON.stringify(parsed, null, 2);
    } catch {
      bodyText = rawBody;
    }
    lines.push("```json", truncate(bodyText, MAX_JSON_LEN), "```");
  }

  lines.push("");
  return lines;
}

// ---------------------------------------------------------------------------
// Card rendering
// ---------------------------------------------------------------------------

function renderCard(recording: ChangedRecording): string {
  const name = recording.recordingName;
  const badge = recording.changeType === "new" ? " (new)" : " (modified)";
  // recordingName already includes provider prefix (e.g. "xai/chat-hello")
  const heading = name.startsWith(`${recording.provider}/`)
    ? name
    : `${recording.provider}/${name}`;
  const lines: string[] = [`### ${heading}${badge}`, ""];

  // Prompt
  const prompt = extractPrompt(recording.entries);
  if (prompt) {
    lines.push(`> **Prompt**: ${prompt}`, "");
  }

  // HTTP request/response details (first entry is the primary request)
  const primaryEntry = recording.entries[0];
  if (primaryEntry) {
    lines.push(...renderRequestSection(primaryEntry));

    // Find the last meaningful response entry for the response section
    let responseEntry: HarEntry = primaryEntry;
    for (let i = recording.entries.length - 1; i >= 0; i--) {
      const resBody = parseResponseBody(recording.entries[i]);
      if (resBody && !isPollingResponse(resBody)) {
        responseEntry = recording.entries[i];
        break;
      }
    }
    lines.push(...renderResponseSection(responseEntry));
  }

  // Input media
  const inputMedia = extractInputMedia(recording.entries, name);
  for (const item of inputMedia) {
    if (item.type === "image") {
      const label = item.label ?? "input";
      lines.push(
        `**Input** (${label}):`,
        "",
        `<img src="${item.url}" alt="input" width="300">`,
        ""
      );
    } else if (item.type === "video") {
      lines.push(`**Input video**: [${item.url}](${item.url})`, "");
    }
  }

  // Output
  const output = extractOutput(recording.entries, name);
  switch (output.type) {
    case "image":
      if (output.b64AssetPath) {
        const repoUrl = buildRepoUrl(output.b64AssetPath);
        lines.push("**Output**:", "", `![output](${repoUrl})`, "");
      } else if (output.url) {
        lines.push("**Output**:", "", `![output](${output.url})`, "");
      }
      break;
    case "video": {
      const dur = output.duration ? ` (${output.duration}s)` : "";
      lines.push(`**Output**: [Watch video](${output.url})${dur}`, "");
      break;
    }
    case "text":
      lines.push(
        "**Response**:",
        "",
        `> ${truncate(output.text ?? "", MAX_TEXT_LEN)}`,
        ""
      );
      break;
    case "async":
      lines.push("*Task submitted (async, no final result in recording)*", "");
      break;
    case "metadata":
      lines.push("*API metadata response*", "");
      break;
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Summary generation
// ---------------------------------------------------------------------------

function generateSummary(recordings: ChangedRecording[]): string {
  const newCount = recordings.filter((r) => r.changeType === "new").length;
  const modCount = recordings.filter((r) => r.changeType === "modified").length;

  const providers = [...new Set(recordings.map((r) => r.provider))];
  const providerList = providers.map((p) => `\`${p}\``).join(", ");

  const parts: string[] = [];
  if (newCount > 0) {
    parts.push(`**${newCount} new** recording${newCount === 1 ? "" : "s"}`);
  }
  if (modCount > 0) {
    parts.push(
      `**${modCount} modified** recording${modCount === 1 ? "" : "s"}`
    );
  }

  const lines: string[] = [
    "<!-- harness-report -->",
    "## Harness Report",
    "",
    `${parts.join(", ")} for ${providerList}`,
    "",
  ];

  for (const recording of recordings) {
    lines.push(renderCard(recording));
  }

  lines.push("---");
  lines.push(
    "*Image/video URLs may expire. Full interactive viewer available as workflow artifact.*"
  );

  let md = lines.join("\n");
  if (md.length > MAX_COMMENT_LEN) {
    md = md.slice(0, MAX_COMMENT_LEN) + "\n\n*(truncated — see full artifact)*";
  }

  return md;
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

function setOutput(name: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

const baseBranch = getBaseBranch();
const recordings = getChangedRecordings(baseBranch);

if (recordings.length === 0) {
  setOutput("has_changes", "false");
  setOutput("has_assets", "false");
  fs.writeFileSync("harness-summary.md", "");
} else {
  setOutput("has_changes", "true");
  const md = generateSummary(recordings);
  fs.writeFileSync("harness-summary.md", md);

  const hasAssets =
    fs.existsSync(ASSETS_DIR) && fs.readdirSync(ASSETS_DIR).length > 0;
  setOutput("has_assets", hasAssets ? "true" : "false");
}
