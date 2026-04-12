/**
 * Generates a visual Markdown summary of changed HAR recordings for PR comments.
 * Shows the full story of every API interaction: credits checks first, then
 * every request/response in order, with polling steps rendered inline.
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
const MAX_JSON_LEN = 2000;
const MAX_COMMENT_LEN = 60_000;
const ASSETS_DIR = "tests/fixtures/harness-generated";

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

// URL patterns that indicate a credits/billing/usage check
const CREDITS_URL_PATTERNS = [
  /\/credit/i,
  /\/billing/i,
  /\/usage/i,
  /\/analytics/i,
  /\/balance/i,
];

interface MediaItem {
  type: "image" | "video" | "audio";
  url: string;
  label?: string;
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

function buildArtifactLink(): string | null {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!server || !repo || !runId) return null;
  return `${server}/${repo}/actions/runs/${runId}#artifacts`;
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

function isCreditEntry(entry: HarEntry): boolean {
  const urlPath = extractUrlPath(entry.request.url);
  return CREDITS_URL_PATTERNS.some((pattern) => pattern.test(urlPath));
}

function isPollingEntry(entry: HarEntry): boolean {
  const resBody = parseResponseBody(entry);
  if (!resBody) return false;
  // xAI polling: status pending/queuing with no final asset
  if (
    typeof resBody.status === "string" &&
    (resBody.status === "pending" || resBody.status === "queuing") &&
    !resBody.video
  ) {
    return true;
  }
  // KIE polling: recordInfo responses with state field
  if (
    typeof resBody.code === "number" &&
    resBody.data &&
    typeof (resBody.data as Record<string, unknown>).state === "string"
  ) {
    const state = (resBody.data as Record<string, unknown>).state as string;
    if (state === "waiting" || state === "queuing" || state === "generating") {
      return true;
    }
  }
  // KIE 422 polling (recordInfo null)
  if (resBody.code === 422 && resBody.msg === "recordInfo is null") {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Prompt extraction
// ---------------------------------------------------------------------------

function extractPrompt(entries: HarEntry[]): string {
  // Find the first non-credit entry for the prompt
  const entry = entries.find((e) => !isCreditEntry(e));
  if (!entry) return "";
  const body = parseBody(entry);
  if (!body) return "";

  if (typeof body.prompt === "string") {
    return truncate(body.prompt, MAX_PROMPT_LEN);
  }

  const input = body.input as Record<string, unknown> | undefined;
  if (input && typeof input.prompt === "string") {
    return truncate(input.prompt, MAX_PROMPT_LEN);
  }

  const messages = body.messages as Array<Record<string, unknown>> | undefined;
  if (messages && messages.length > 0) {
    const last = messages[messages.length - 1];
    if (typeof last.content === "string") {
      return truncate(last.content, MAX_PROMPT_LEN);
    }
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

const SOURCE_FILE_MAP: Array<[RegExp, string | null]> = [
  [/^xai\/image-edit/, "tests/fixtures/cat1.jpg"],
  [/^xai\/video-cat-image/, "tests/fixtures/cat1.jpg"],
  [/^xai\/video-image-to-video/, "tests/fixtures/cat1.jpg"],
  [/^xai\/video-reference-images/, "tests/fixtures/cat1.jpg"],
  [/^openai\/vision/, "tests/fixtures/red.png"],
  [/^fal\/nano-banana-pro-edit/, "tests/fixtures/man.jpg"],
  [/^fal\/bytedance-seedream-v5-lite-edit/, "tests/fixtures/man.jpg"],
  [/^kimicoding\/.*image-base64/, null],
  [/^kie\/e2e-motion-control/, null],
  [/^kie\/kling-motion-control/, null],
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
  const entry = entries.find((e) => !isCreditEntry(e));
  if (!entry) return items;
  const body = parseBody(entry);
  if (!body) return items;

  const sourceFile = inferSourceFile(recordingName);
  if (sourceFile) {
    items.push({
      type: "image",
      url: buildRepoUrl(sourceFile),
      label: sourceFile,
    });
    return items;
  }

  const image = body.image as Record<string, unknown> | undefined;
  if (image && typeof image.url === "string") {
    const url = image.url as string;
    if (url.startsWith("http")) {
      items.push({ type: "image", url });
    }
  }

  const video = body.video as Record<string, unknown> | undefined;
  if (video && typeof video.url === "string") {
    items.push({ type: "video", url: video.url as string });
  }

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
    const imageUrls = input.image_urls as string[] | undefined;
    if (Array.isArray(imageUrls)) {
      for (const url of imageUrls) {
        items.push({ type: "image", url });
      }
    }
    const refImage = input.reference_image as string[] | undefined;
    if (Array.isArray(refImage)) {
      for (const url of refImage) {
        items.push({ type: "image", url });
      }
    }
    const refVideo = input.reference_video as string[] | undefined;
    if (Array.isArray(refVideo)) {
      for (const url of refVideo) {
        items.push({ type: "video", url });
      }
    }
    if (typeof input.first_frame === "string") {
      items.push({ type: "image", url: input.first_frame as string });
    }
    if (typeof input.reference_voice === "string") {
      items.push({ type: "audio", url: input.reference_voice as string });
    }
  }

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
// Base64 asset saving
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SSE reassembly
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Entry rendering — full req+res for every entry
// ---------------------------------------------------------------------------

function renderEntryLabel(
  entry: HarEntry,
  index: number,
  total: number
): string {
  const method = entry.request.method;
  const urlPath = extractUrlPath(entry.request.url);

  if (isCreditEntry(entry)) return `Credits Check — ${method} ${urlPath}`;
  if (isPollingEntry(entry)) return `Poll ${method} ${urlPath}`;

  if (total === 1) return `${method} ${urlPath}`;
  return `Step ${index + 1} — ${method} ${urlPath}`;
}

function renderEntryRequest(entry: HarEntry): string[] {
  const lines: string[] = [];
  const method = entry.request.method;
  const urlPath = extractUrlPath(entry.request.url);

  const httpLines: string[] = [`${method} ${urlPath}`];
  for (const header of entry.request.headers) {
    if (VISIBLE_REQUEST_HEADERS.has(header.name.toLowerCase())) {
      httpLines.push(`${header.name.toLowerCase()}: ${header.value}`);
    }
  }

  lines.push("```http", ...httpLines, "```");

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

  return lines;
}

function renderEntryResponse(entry: HarEntry): string[] {
  const lines: string[] = [];
  const status = entry.response.status;
  const statusText = entry.response.statusText;
  const contentType = findHeader(entry.response.headers, "content-type") ?? "";

  const httpLines: string[] = [`HTTP ${status} ${statusText}`];
  if (contentType) {
    httpLines.push(`content-type: ${contentType}`);
  }

  lines.push("```http", ...httpLines, "```");

  const rawBody = entry.response.content?.text;
  if (isBinaryContentType(contentType)) {
    const size = rawBody ? Buffer.byteLength(rawBody, "utf-8") : 0;
    lines.push("```", `(binary: ${contentType}, ${size} bytes)`, "```");
  } else if (rawBody) {
    // SSE streaming — reassemble and show
    if (rawBody.startsWith("event:")) {
      const assembled = reassembleSSE(rawBody);
      if (assembled) {
        lines.push("```", truncate(assembled, MAX_JSON_LEN), "```");
      } else {
        lines.push("```", truncate(rawBody, MAX_JSON_LEN), "```");
      }
    } else {
      let bodyText: string;
      try {
        const parsed = JSON.parse(rawBody);
        bodyText = JSON.stringify(parsed, null, 2);
      } catch {
        bodyText = rawBody;
      }
      lines.push("```json", truncate(bodyText, MAX_JSON_LEN), "```");
    }
  }

  return lines;
}

function renderFullEntry(
  entry: HarEntry,
  index: number,
  total: number
): string[] {
  const lines: string[] = [];
  const label = renderEntryLabel(entry, index, total);
  const statusEmoji = entry.response.status >= 400 ? "!" : "";
  const pollEmoji = isPollingEntry(entry) ? " (polling)" : "";

  lines.push(
    `<details${index === 0 ? " open" : ""}>`,
    `<summary><strong>${label}</strong> → ${statusEmoji}${entry.response.status} ${entry.response.statusText}${pollEmoji}</summary>`,
    ""
  );

  lines.push("**Request**", "");
  lines.push(...renderEntryRequest(entry));
  lines.push("");
  lines.push("**Response**", "");
  lines.push(...renderEntryResponse(entry));
  lines.push("");
  lines.push("</details>", "");

  return lines;
}

// ---------------------------------------------------------------------------
// Output media extraction (from the final resolved entry)
// ---------------------------------------------------------------------------

function extractOutputMedia(
  entries: HarEntry[],
  recordingName: string
): string[] {
  const lines: string[] = [];

  for (let i = entries.length - 1; i >= 0; i--) {
    const resBody = parseResponseBody(entries[i]);
    if (!resBody) continue;
    if (isPollingEntry(entries[i])) continue;

    // Image URL: data[].url
    const data = resBody.data as
      | Array<Record<string, unknown>>
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (typeof first.url === "string") {
        lines.push("**Output**:", "", `![output](${first.url})`, "");
        return lines;
      }
      if (typeof first.b64_json === "string") {
        const assetPath = saveBase64Asset(
          first.b64_json as string,
          recordingName
        );
        if (assetPath) {
          const repoUrl = buildRepoUrl(assetPath);
          lines.push("**Output**:", "", `![output](${repoUrl})`, "");
          return lines;
        }
      }
    }

    // Completed video: status=done with video.url
    if (resBody.status === "done") {
      const video = resBody.video as Record<string, unknown> | undefined;
      if (video && typeof video.url === "string" && video.url) {
        const dur =
          typeof video.duration === "number" ? ` (${video.duration}s)` : "";
        lines.push(`**Output**: [Watch video](${video.url})${dur}`, "");
        return lines;
      }
    }

    // KIE completed task: state=success with works array or resultJson
    if (
      resBody.data &&
      typeof resBody.data === "object" &&
      !Array.isArray(resBody.data)
    ) {
      const taskData = resBody.data as Record<string, unknown>;
      if (taskData.state === "success") {
        // Parse resultJson (nested JSON string with output URLs)
        if (typeof taskData.resultJson === "string" && taskData.resultJson) {
          try {
            const result = JSON.parse(taskData.resultJson) as Record<
              string,
              unknown
            >;
            // Format 1: {"resultUrls":["...url..."]}
            const resultUrls = result.resultUrls as string[] | undefined;
            if (Array.isArray(resultUrls) && resultUrls.length > 0) {
              const url = resultUrls[0];
              if (url.includes(".mp4") || url.includes("video")) {
                lines.push(`**Output**: [Watch video](${url})`, "");
              } else {
                lines.push("**Output**:", "", `![output](${url})`, "");
              }
              return lines;
            }
            // Format 2: {"works":[{"resource":"...","cover":"..."}]}
            const works = result.works as
              | Array<Record<string, unknown>>
              | undefined;
            if (Array.isArray(works) && works.length > 0) {
              const work = works[0];
              if (typeof work.resource === "string") {
                const url = work.resource as string;
                if (
                  url.includes(".mp4") ||
                  url.includes("video") ||
                  (work.type as string)?.includes("video")
                ) {
                  lines.push(`**Output**: [Watch video](${url})`, "");
                } else {
                  lines.push("**Output**:", "", `![output](${url})`, "");
                }
                return lines;
              }
            }
          } catch {
            // resultJson not valid JSON, fall through
          }
        }

        // Fallback: works array directly on data (older format)
        const works = taskData.works as
          | Array<Record<string, unknown>>
          | undefined;
        if (Array.isArray(works) && works.length > 0) {
          const work = works[0];
          if (typeof work.resource === "string") {
            const url = work.resource as string;
            if (
              url.includes(".mp4") ||
              url.includes("video") ||
              (work.type as string)?.includes("video")
            ) {
              lines.push(`**Output**: [Watch video](${url})`, "");
            } else {
              lines.push("**Output**:", "", `![output](${url})`, "");
            }
            return lines;
          }
        }
      }
    }

    // Failed: status=failed
    if (resBody.status === "failed") {
      const error = resBody.error as Record<string, unknown> | undefined;
      const msg = error?.message ?? "generation failed";
      lines.push(`**Output**: Failed — ${msg}`, "");
      return lines;
    }

    // Chat completion: choices[].message.content
    const choices = resBody.choices as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(choices) && choices.length > 0) {
      const msg = choices[0].message as Record<string, unknown> | undefined;
      if (msg && typeof msg.content === "string") {
        lines.push(
          "**Response**:",
          "",
          `> ${truncate(msg.content as string, 500)}`,
          ""
        );
        return lines;
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
        lines.push(
          "**Response**:",
          "",
          `> ${truncate(textParts.join(""), 500)}`,
          ""
        );
        return lines;
      }
    }

    // Transcription: { text: "..." }
    if (typeof resBody.text === "string" && resBody.text) {
      lines.push(
        "**Response**:",
        "",
        `> ${truncate(resBody.text as string, 500)}`,
        ""
      );
      return lines;
    }

    // Async task with no final result
    if (
      data &&
      !Array.isArray(data) &&
      typeof (data as Record<string, unknown>).taskId === "string"
    ) {
      lines.push("*Task submitted (async — no final result in recording)*", "");
      return lines;
    }

    // Video generation request_id with no poll result — keep looking
    if (typeof resBody.request_id === "string") {
      continue;
    }

    // Metadata / other
    lines.push("*API metadata response*", "");
    return lines;
  }

  // SSE streaming response
  for (const entry of entries) {
    if (entry.response.content?.text?.startsWith("event:")) {
      const text = reassembleSSE(entry.response.content.text!);
      if (text) {
        lines.push("**Response**:", "", `> ${truncate(text, 500)}`, "");
        return lines;
      }
    }
  }

  lines.push("*Async task — no final result captured in recording*", "");
  return lines;
}

// ---------------------------------------------------------------------------
// Card rendering — credits first, then full req+res for every entry
// ---------------------------------------------------------------------------

function renderCard(recording: ChangedRecording): string {
  const name = recording.recordingName;
  const badge = recording.changeType === "new" ? " (new)" : " (modified)";
  const heading = name.startsWith(`${recording.provider}/`)
    ? name
    : `${recording.provider}/${name}`;
  const lines: string[] = [`### ${heading}${badge}`, ""];

  // Separate entries into credits and operations
  const creditEntries: HarEntry[] = [];
  const opEntries: HarEntry[] = [];
  for (const entry of recording.entries) {
    if (isCreditEntry(entry)) {
      creditEntries.push(entry);
    } else {
      opEntries.push(entry);
    }
  }

  // Prompt (from non-credit entries)
  const prompt = extractPrompt(recording.entries);
  if (prompt) {
    lines.push(`> **Prompt**: ${prompt}`, "");
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

  // --- Credits first ---
  if (creditEntries.length > 0) {
    lines.push("---", "", "#### Credits / Usage", "");
    for (let i = 0; i < creditEntries.length; i++) {
      lines.push(...renderFullEntry(creditEntries[i], i, creditEntries.length));
    }
  }

  // --- Full API interaction log ---
  lines.push("---", "", "#### API Interactions", "");

  const totalOps = opEntries.length;
  for (let i = 0; i < totalOps; i++) {
    lines.push(...renderFullEntry(opEntries[i], i, totalOps));
  }

  // --- Output summary ---
  lines.push(...extractOutputMedia(recording.entries, name));

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

  const totalEntries = recordings.reduce((sum, r) => sum + r.entries.length, 0);

  const lines: string[] = [
    "<!-- harness-report -->",
    "## Harness Report",
    "",
    `${parts.join(", ")} for ${providerList} (${totalEntries} total API calls)`,
    "",
  ];

  const screenshotPath = `${ASSETS_DIR}/harness-report.png`;
  const mediaScreenshotPath = `${ASSETS_DIR}/harness-report-media.png`;
  const hasScreenshot = fs.existsSync(screenshotPath);
  const hasMediaScreenshot = fs.existsSync(mediaScreenshotPath);

  if (hasScreenshot || hasMediaScreenshot) {
    lines.push("### 📸 Harness Preview", "");
    if (hasScreenshot) {
      lines.push(
        `<img src="${buildRepoUrl(screenshotPath)}" alt="harness report (full)" width="900">`,
        ""
      );
    }
    if (hasMediaScreenshot) {
      lines.push(
        "<details><summary><strong>Media-only screenshot</strong></summary>",
        "",
        `<img src="${buildRepoUrl(mediaScreenshotPath)}" alt="harness report (media-only)" width="900">`,
        "",
        "</details>",
        ""
      );
    }
    const artifactLink = buildArtifactLink();
    if (artifactLink) {
      lines.push(
        `*Interactive HAR viewer and HTML sources in the [\`harness-report\` workflow artifact](${artifactLink}).*`,
        ""
      );
    }
  }

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
