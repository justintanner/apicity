/**
 * Send the full harness report to Telegram.
 *
 * Usage:
 *   op run --env-file=.env.tpl -- npx tsx tests/harness-telegram.ts \
 *     --report harness-summary-full.md
 */

import fs from "node:fs";
import path from "node:path";

const MESSAGE_LIMIT = 3900;
const CAPTION_LIMIT = 1000;
const SEND_DELAY_MS = 250;
const DEFAULT_ASSETS_DIR = "tests/fixtures/harness-generated";

type MediaKind = "photo" | "video" | "audio";

interface CliOptions {
  reportPath: string;
  assetsDir: string;
  dryRun: boolean;
}

interface MediaRef {
  kind: MediaKind;
  source: string;
  label: string;
  local: boolean;
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

type JsonPayload = Record<string, string | number | boolean>;

function readFlagValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function parseCliOptions(): CliOptions {
  const reportPath =
    readFlagValue("--report") ??
    (fs.existsSync("harness-summary-full.md")
      ? "harness-summary-full.md"
      : "harness-summary.md");
  const assetsDir = readFlagValue("--assets-dir") ?? DEFAULT_ASSETS_DIR;

  if (!reportPath || !assetsDir) {
    console.error(
      "Usage: npx tsx tests/harness-telegram.ts [--report <path>] [--assets-dir <path>] [--dry-run]"
    );
    process.exit(1);
  }

  return {
    reportPath,
    assetsDir,
    dryRun: process.argv.includes("--dry-run"),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required. Run through op run --env-file=.env.tpl.`
    );
  }
  return value;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function telegramUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function parseTelegramResponse(
  response: Response
): Promise<TelegramApiResponse> {
  const text = await response.text();
  try {
    return JSON.parse(text) as TelegramApiResponse;
  } catch {
    return {
      ok: false,
      description: text || response.statusText,
    };
  }
}

async function postJson(
  token: string,
  method: string,
  payload: JsonPayload
): Promise<void> {
  const response = await fetch(telegramUrl(token, method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseTelegramResponse(response);
  if (!response.ok || !body.ok) {
    throw new Error(
      `${method} failed: ${body.description ?? response.statusText}`
    );
  }
}

async function postForm(
  token: string,
  method: string,
  form: FormData
): Promise<void> {
  const response = await fetch(telegramUrl(token, method), {
    method: "POST",
    body: form,
  });
  const body = await parseTelegramResponse(response);
  if (!response.ok || !body.ok) {
    throw new Error(
      `${method} failed: ${body.description ?? response.statusText}`
    );
  }
}

async function sendMessage(
  token: string,
  chatId: string,
  text: string
): Promise<void> {
  const markdownPayload: JsonPayload = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    disable_web_page_preview: false,
  };

  try {
    await postJson(token, "sendMessage", markdownPayload);
  } catch {
    await postJson(token, "sendMessage", {
      chat_id: chatId,
      text,
      disable_web_page_preview: false,
    });
  }
}

function chunkMarkdown(markdown: string): string[] {
  if (!markdown) return ["Harness report is empty: no changed recordings."];

  const chunks: string[] = [];
  let current = "";
  let inFence = false;

  for (const line of markdown.split("\n")) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > MESSAGE_LIMIT && current) {
      chunks.push(inFence ? `${current}\n\`\`\`` : current);
      current = inFence ? "```" : "";
    }

    let remaining = line;
    while (
      remaining.length > 0 &&
      (current ? `${current}\n${remaining}` : remaining).length > MESSAGE_LIMIT
    ) {
      const prefix = current ? `${current}\n` : "";
      const capacity = MESSAGE_LIMIT - prefix.length;
      const part = remaining.slice(0, Math.max(capacity, 1));
      current = `${prefix}${part}`;
      remaining = remaining.slice(part.length);
      chunks.push(inFence ? `${current}\n\`\`\`` : current);
      current = inFence ? "```" : "";
    }

    if (remaining.length > 0 || line.length === 0) {
      current = current ? `${current}\n${remaining}` : remaining;
    }

    if (line.trim().startsWith("```")) {
      inFence = !inFence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function inferMediaKind(source: string): MediaKind | null {
  const pathname = (() => {
    try {
      return new URL(source).pathname;
    } catch {
      return source;
    }
  })().toLowerCase();

  if (/\.(png|jpe?g|gif|webp)(?:$|\?)/.test(pathname)) return "photo";
  if (/\.(mp4|webm|mov)(?:$|\?)/.test(pathname)) return "video";
  if (/\.(mp3|wav|ogg|flac|m4a)(?:$|\?)/.test(pathname)) return "audio";
  return null;
}

function labelForSource(source: string): string {
  try {
    const url = new URL(source);
    return path.basename(url.pathname) || url.hostname;
  } catch {
    return path.basename(source);
  }
}

function addMediaRef(
  refs: Map<string, MediaRef>,
  source: string,
  local: boolean
): void {
  const cleanSource = source.replace(/&amp;/g, "&");
  const kind = inferMediaKind(cleanSource);
  if (!kind || refs.has(cleanSource)) return;

  refs.set(cleanSource, {
    kind,
    source: cleanSource,
    label: labelForSource(cleanSource),
    local,
  });
}

function collectMarkdownMedia(markdown: string): MediaRef[] {
  const refs = new Map<string, MediaRef>();
  const patterns = [
    /<img\s+[^>]*src="(https?:\/\/[^"]+)"/g,
    /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g,
    /\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g,
    /(https?:\/\/[^\s<>"')]+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      if (match[1]) addMediaRef(refs, match[1], false);
    }
  }

  return [...refs.values()];
}

function collectLocalMedia(dir: string): MediaRef[] {
  const refs = new Map<string, MediaRef>();
  if (!fs.existsSync(dir)) return [];

  function walk(currentDir: string): void {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        addMediaRef(refs, fullPath, true);
      }
    }
  }

  walk(dir);
  return [...refs.values()].sort((a, b) => a.source.localeCompare(b.source));
}

function mimeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".m4a") return "audio/mp4";
  return "application/octet-stream";
}

function mediaMethod(kind: MediaKind): string {
  if (kind === "photo") return "sendPhoto";
  if (kind === "video") return "sendVideo";
  return "sendAudio";
}

function mediaField(kind: MediaKind): string {
  if (kind === "photo") return "photo";
  if (kind === "video") return "video";
  return "audio";
}

async function sendReportDocument(
  token: string,
  chatId: string,
  reportPath: string
): Promise<void> {
  const bytes = fs.readFileSync(reportPath);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append(
    "document",
    new Blob([new Uint8Array(bytes)], { type: "text/markdown" }),
    path.basename(reportPath)
  );
  form.append("caption", "Full harness report Markdown");
  await postForm(token, "sendDocument", form);
}

async function sendLocalMedia(
  token: string,
  chatId: string,
  ref: MediaRef
): Promise<void> {
  const bytes = fs.readFileSync(ref.source);
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append(
    mediaField(ref.kind),
    new Blob([new Uint8Array(bytes)], { type: mimeForFile(ref.source) }),
    path.basename(ref.source)
  );
  form.append(
    "caption",
    truncate(`Harness media: ${ref.label}`, CAPTION_LIMIT)
  );
  await postForm(token, mediaMethod(ref.kind), form);
}

async function sendRemoteMedia(
  token: string,
  chatId: string,
  ref: MediaRef
): Promise<void> {
  const payload: JsonPayload = {
    chat_id: chatId,
    [mediaField(ref.kind)]: ref.source,
    caption: truncate(`Harness media: ${ref.label}`, CAPTION_LIMIT),
  };

  try {
    await postJson(token, mediaMethod(ref.kind), payload);
  } catch {
    await sendMessage(token, chatId, `Harness media: ${ref.source}`);
  }
}

async function main(): Promise<void> {
  const options = parseCliOptions();
  const markdown = fs.existsSync(options.reportPath)
    ? fs.readFileSync(options.reportPath, "utf-8")
    : "";
  const chunks = chunkMarkdown(markdown);
  const localMedia = collectLocalMedia(options.assetsDir);
  const remoteMedia = collectMarkdownMedia(markdown);

  if (options.dryRun) {
    console.log(`Report: ${options.reportPath} (${markdown.length} chars)`);
    console.log(`Text messages: ${chunks.length}`);
    console.log(`Local media: ${localMedia.length}`);
    console.log(`Remote media URLs: ${remoteMedia.length}`);
    return;
  }

  const token = requireEnv("TELEGRAM_BOT_KEY");
  const chatId = requireEnv("TELEGRAM_CHAT_ID");

  await sendMessage(
    token,
    chatId,
    `Apicity harness report: ${chunks.length} text message(s), ${localMedia.length} local media file(s), ${remoteMedia.length} media URL(s).`
  );
  await sleep(SEND_DELAY_MS);

  if (fs.existsSync(options.reportPath)) {
    await sendReportDocument(token, chatId, options.reportPath);
    await sleep(SEND_DELAY_MS);
  }

  for (let i = 0; i < chunks.length; i++) {
    await sendMessage(
      token,
      chatId,
      `Part ${i + 1}/${chunks.length}\n\n${chunks[i]}`
    );
    await sleep(SEND_DELAY_MS);
  }

  for (const ref of localMedia) {
    await sendLocalMedia(token, chatId, ref);
    await sleep(SEND_DELAY_MS);
  }

  for (const ref of remoteMedia) {
    await sendRemoteMedia(token, chatId, ref);
    await sleep(SEND_DELAY_MS);
  }
}

await main();
