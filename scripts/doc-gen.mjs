#!/usr/bin/env node
/**
 * Documentation Generator for Apicity Providers
 *
 * Generates README.md files with a collapsible API Reference section
 * sourced from the endpoint walker + endpoint-docs.tsv.
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
} from "./lib/endpoint-walk.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const TSV_PATH = path.join(__dirname, "endpoint-docs.tsv");

function loadDocsTsv() {
  const docs = new Map();
  if (!fsSync.existsSync(TSV_PATH)) return docs;
  const text = fsSync.readFileSync(TSV_PATH, "utf8");
  const lines = text.split("\n").filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const [provider, dotPath, method, , docsUrl] = lines[i].split("\t");
    docs.set(`${provider}\t${dotPath}\t${method}`, docsUrl ?? "");
  }
  return docs;
}

async function collectEndpointsByProvider() {
  const project = loadProject();
  const byProvider = new Map();
  for await (const ep of walkAllEndpoints(project)) {
    const list = byProvider.get(ep.provider) ?? [];
    list.push(ep);
    byProvider.set(ep.provider, list);
  }
  return byProvider;
}

function sectionKey(dotPath) {
  if (!dotPath) return "general";
  const segments = dotPath.split(".");
  for (const seg of segments) {
    if (/^v\d+$/i.test(seg)) continue;
    if (seg === "api") continue;
    return seg;
  }
  return "general";
}

function formatUsageSnippet(providerName, dotPath) {
  const call = dotPath ? `${providerName}.${dotPath}` : providerName;
  return `const res = await ${call}({ /* ... */ });`;
}

function displayDotPath(providerName, ep) {
  if (providerName !== "kie") return ep.dotPath;

  if (ep.file.endsWith("/suno.ts")) return `suno.${ep.fullDotPath}`;
  if (ep.file.endsWith("/veo.ts")) return `veo.${ep.fullDotPath}`;
  if (ep.file.endsWith("/chat.ts")) return `chat.${ep.fullDotPath}`;
  if (ep.file.endsWith("/claude.ts")) return ep.fullDotPath;
  return ep.fullDotPath ?? ep.dotPath;
}

function renderEndpointDetails(ep, providerName, docsUrl) {
  const method = ep.method ?? "";
  const dotPath = displayDotPath(providerName, ep);
  const headerCode = method ? `<code>${method}</code> ` : "";
  const summary = `${headerCode}<b><code>${providerName}${dotPath ? "." + dotPath : ""}</code></b>`;

  const urlLine = ep.fullUrl
    ? `<code>${method ? method + " " : ""}${ep.fullUrl}</code>`
    : "";
  const docsLine =
    docsUrl && docsUrl.length > 0 ? `[Upstream docs ↗](${docsUrl})` : "";

  const usage = formatUsageSnippet(providerName, dotPath);
  const relSrc = ep.file.replace(
    new RegExp(`^packages/provider/${providerName}/`),
    ""
  );
  const sourceLine = `Source: [\`${ep.file}\`](${relSrc})`;

  const lines = ["<details>", `<summary>${summary}</summary>`, ""];
  if (urlLine) lines.push(urlLine, "");
  if (docsLine) lines.push(docsLine, "");
  lines.push("```typescript", usage, "```", "");
  lines.push(sourceLine, "", "</details>", "");
  return lines.join("\n");
}

function groupEndpoints(endpoints) {
  const groups = new Map();
  for (const ep of endpoints) {
    const key = sectionKey(ep.dotPath);
    const list = groups.get(key) ?? [];
    list.push(ep);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const aPath = a.fullDotPath ?? a.dotPath ?? "";
      const bPath = b.fullDotPath ?? b.dotPath ?? "";
      if (aPath !== bPath) return aPath < bPath ? -1 : 1;
      return (a.method ?? "").localeCompare(b.method ?? "");
    });
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function renderApiReference(providerName, endpoints) {
  const sections = ["## API Reference", ""];
  if (endpoints.length === 0) {
    sections.push("_No endpoints discovered for this provider yet._", "");
    return sections.join("\n");
  }

  const groups = groupEndpoints(endpoints);
  sections.push(
    `${endpoints.length} endpoint${endpoints.length === 1 ? "" : "s"} across ${groups.size} group${groups.size === 1 ? "" : "s"}. Each method mirrors an upstream URL path.`,
    ""
  );

  const docs = loadDocsTsv();
  for (const [group, list] of groups) {
    sections.push(`### ${group}`, "");
    for (const ep of list) {
      const key = `${ep.provider}\t${ep.dotPath}\t${ep.method ?? "?"}`;
      const docsUrl = docs.get(key) ?? "";
      sections.push(renderEndpointDetails(ep, providerName, docsUrl));
    }
  }
  return sections.join("\n");
}

async function extractProviderMetadata(providerDir) {
  const pkgPath = path.join(providerDir, "package.json");
  let pkg = {};
  try {
    pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  } catch {
    // Ignore
  }
  return { pkg };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderXaiRateLimiting() {
  return [
    "## Rate Limiting",
    "",
    "Client-side rate limiting that queues requests to stay within xAI API limits.",
    "",
    "```typescript",
    "import {",
    "  xai as createXai,",
    "  withRateLimit,",
    "  withRetry,",
    "  createRateLimiter,",
    "  XAI_RATE_LIMITS,",
    '} from "@apicity/xai";',
    "",
    "const xai = createXai({ apiKey: process.env.XAI_API_KEY! });",
    "```",
    "",
    "### Using xAI tier presets",
    "",
    "```typescript",
    "// Use built-in tier presets (free, tier1, tier2, tier3, tier4)",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);",
    "// => { rpm: 60, concurrent: 10 }",
    "",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "```",
    "",
    "### Custom limits",
    "",
    "```typescript",
    "const limiter = createRateLimiter({ rpm: 30, concurrent: 5 });",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "```",
    "",
    "### Shared limiter across endpoints",
    "",
    "RPM limits apply globally, so share a single limiter across all endpoints:",
    "",
    "```typescript",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier2);",
    "",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "const responses = withRateLimit(xai.post.v1.responses, limiter);",
    "const images = withRateLimit(xai.post.v1.images.generations, limiter);",
    "```",
    "",
    "### Composing with retry",
    "",
    "Place `withRateLimit` innermost so retries count against the limit:",
    "",
    "```typescript",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);",
    "",
    "const chat = withRetry(",
    "  withRateLimit(xai.post.v1.chat.completions, limiter),",
    "  { retries: 2 }",
    ");",
    "```",
    "",
    "### Batch processing",
    "",
    "Fire requests in parallel — the limiter handles pacing automatically:",
    "",
    "```typescript",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "",
    "const results = await Promise.all(",
    "  prompts.map((p) =>",
    "    chat({",
    '      model: "grok-3",',
    '      messages: [{ role: "user", content: p }],',
    "    })",
    "  )",
    ");",
    "```",
    "",
    "### xAI rate limit tiers",
    "",
    "| Preset | RPM | Concurrent | Spend threshold |",
    "|--------|-----|------------|-----------------|",
    "| `free` | 5 | 2 | $0 |",
    "| `tier1` | 60 | 10 | $0+ |",
    "| `tier2` | 200 | 25 | $100+ |",
    "| `tier3` | 500 | 50 | $500+ |",
    "| `tier4` | 1000 | 100 | $1,000+ |",
    "",
  ].join("\n");
}

function renderXSetup() {
  return [
    "## Setup",
    "",
    "X requires an **OAuth 2.0 user-context access token** to post or upload",
    "media. App-only Bearer tokens are read-only and rejected by the upload",
    "and tweets endpoints.",
    "",
    "### 1. Configure your X app",
    "",
    "Open [console.x.com](https://console.x.com) and make sure your app lives",
    "in a **Pay Per Use** project — the legacy *Free* project is deprecated",
    "and v2 endpoints reject its tokens with `client-not-enrolled`. Move the",
    "app from the Apps list if needed.",
    "",
    "Then open the app and click **User authentication settings → Set up**:",
    "",
    "- Type of App: **Web App, Automated App or Bot** (this yields a Client Secret)",
    "- App permissions: **Read and write**",
    "- Callback URI: `http://127.0.0.1:8765/callback`",
    "- Website URL: any valid URL",
    "",
    "Save and copy the **OAuth 2.0 Client ID** and **Client Secret**.",
    "",
    "### 2. Load credits",
    "",
    "Pay-per-use bills per write (~$0.015 / post). Open **Billing → Credits**",
    "and load the minimum (typically $5). Without credits, write endpoints",
    "return `402 Your enrolled account does not have any credits to fulfill",
    "this request` — even though authentication itself succeeds.",
    "",
    "### 3. Mint an access token",
    "",
    "Save the script below as `mint-x-token.mjs` and run it:",
    "",
    "```bash",
    "X_CLIENT_ID=<your-client-id> \\",
    "X_CLIENT_SECRET=<your-client-secret> \\",
    "  node mint-x-token.mjs",
    "```",
    "",
    "It prints an authorize URL — open it, click **Authorize app**, and the",
    "helper captures the redirect on `127.0.0.1:8765` and prints the access",
    "token + refresh token. Access tokens last 2 hours; the refresh token",
    "(via `offline.access` scope) lets you mint a new one without",
    "re-authorizing.",
    "",
    "<details>",
    "<summary><code>mint-x-token.mjs</code> — zero-dep OAuth 2.0 PKCE helper</summary>",
    "",
    "```javascript",
    'import http from "node:http";',
    'import crypto from "node:crypto";',
    "",
    "const CLIENT_ID = process.env.X_CLIENT_ID;",
    "const CLIENT_SECRET = process.env.X_CLIENT_SECRET;",
    'const REDIRECT = "http://127.0.0.1:8765/callback";',
    "const SCOPES = [",
    '  "tweet.read",',
    '  "tweet.write",',
    '  "media.write",',
    '  "users.read",',
    '  "offline.access",',
    '].join(" ");',
    "",
    "if (!CLIENT_ID || !CLIENT_SECRET) {",
    '  console.error("Set X_CLIENT_ID and X_CLIENT_SECRET");',
    "  process.exit(1);",
    "}",
    "",
    'const verifier = crypto.randomBytes(32).toString("base64url");',
    "const challenge = crypto",
    '  .createHash("sha256")',
    "  .update(verifier)",
    '  .digest("base64url");',
    'const state = crypto.randomBytes(16).toString("hex");',
    "",
    'const authURL = new URL("https://x.com/i/oauth2/authorize");',
    'authURL.searchParams.set("response_type", "code");',
    'authURL.searchParams.set("client_id", CLIENT_ID);',
    'authURL.searchParams.set("redirect_uri", REDIRECT);',
    'authURL.searchParams.set("scope", SCOPES);',
    'authURL.searchParams.set("state", state);',
    'authURL.searchParams.set("code_challenge", challenge);',
    'authURL.searchParams.set("code_challenge_method", "S256");',
    "",
    'console.log("Open this URL and click \\"Authorize app\\":\\n" + authURL.toString());',
    "",
    "const server = http.createServer(async (req, res) => {",
    "  const url = new URL(req.url, REDIRECT);",
    '  if (!url.pathname.startsWith("/callback")) {',
    "    res.writeHead(404).end();",
    "    return;",
    "  }",
    '  const code = url.searchParams.get("code");',
    '  if (!code || url.searchParams.get("state") !== state) {',
    '    res.writeHead(400).end("bad state");',
    "    server.close();",
    "    process.exit(1);",
    "  }",
    "  const basic = Buffer.from(",
    "    `${CLIENT_ID}:${CLIENT_SECRET}`",
    '  ).toString("base64");',
    '  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {',
    '    method: "POST",',
    "    headers: {",
    "      Authorization: `Basic ${basic}`,",
    '      "Content-Type": "application/x-www-form-urlencoded",',
    "    },",
    "    body: new URLSearchParams({",
    '      grant_type: "authorization_code",',
    "      code,",
    "      redirect_uri: REDIRECT,",
    "      code_verifier: verifier,",
    "    }),",
    "  });",
    "  const tok = await tokenRes.json();",
    "  console.log(JSON.stringify(tok, null, 2));",
    '  res.writeHead(200).end("Authorized — check your terminal.");',
    "  server.close();",
    "});",
    "",
    'server.listen(8765, "127.0.0.1");',
    "```",
    "",
    "</details>",
    "",
    "### 4. Use the token",
    "",
    "```typescript",
    'import { x as createX } from "@apicity/x";',
    "",
    "const x = createX({ accessToken: process.env.X_ACCESS_TOKEN });",
    "",
    "await x.post.v2.tweets({",
    '  text: "hello from @apicity/x",',
    "});",
    "```",
    "",
  ].join("\n");
}

// Mined from tests/recordings/x_*/post-video_*/recording.har — the same
// flow that tests/integration/x-post-video.test.ts replays end-to-end.
function renderXExample() {
  return [
    "## Real-world example: post a video",
    "",
    "Posting a video on X is a four-call dance — initialize a chunked",
    "media upload, append the bytes, finalize to kick off transcoding,",
    "poll until the media is ready, then attach the resulting `media_id`",
    "to the tweet. The flow below is taken verbatim from",
    "[`tests/integration/x-post-video.test.ts`](../../../tests/integration/x-post-video.test.ts)",
    "and replays against",
    "[`tests/recordings/x_*/post-video_*/recording.har`](../../../tests/recordings/),",
    "so the response shapes match what X actually returns.",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { x as createX } from "@apicity/x";',
    "",
    "const x = createX({ accessToken: process.env.X_ACCESS_TOKEN! });",
    "",
    "// 1. Initialize a chunked upload — declare the media type, total",
    "//    byte length, and category up-front. X reserves a media_id we'll",
    "//    thread through every later call.",
    'const bytes = readFileSync("./jump.mp4"); // 1,318,021 bytes in the recording',
    "const init = await x.post.v2.media.upload.initialize({",
    '  media_type: "video/mp4",',
    "  total_bytes: bytes.length,",
    '  media_category: "tweet_video",',
    "});",
    "const mediaId = init.data.id;",
    '// → "2050123807214718976"',
    "",
    "// 2. Append the bytes. For files >5MB slice the buffer into",
    "//    segments and call append once per chunk with segment_index 0..n.",
    "await x.post.v2.media.upload.append(mediaId, {",
    '  media: new Blob([bytes], { type: "video/mp4" }),',
    "  segment_index: 0,",
    "});",
    "",
    "// 3. Finalize. X queues server-side transcoding and returns",
    '//    processing_info.state = "pending" while the worker is busy.',
    "const fin = await x.post.v2.media.upload.finalize(mediaId);",
    '// fin.data.processing_info → { state: "pending", check_after_secs: 1 }',
    "",
    "// 4. Poll status until the media is ready. Honor",
    "//    `check_after_secs` so the loop respects X's pacing hint.",
    'let state = fin.data.processing_info?.state ?? "succeeded";',
    "let wait = fin.data.processing_info?.check_after_secs ?? 1;",
    'while (state === "pending" || state === "in_progress") {',
    "  await new Promise((r) => setTimeout(r, wait * 1000));",
    "  const status = await x.get.v2.media.upload(mediaId);",
    '  state = status.data.processing_info?.state ?? "succeeded";',
    "  wait = status.data.processing_info?.check_after_secs ?? 1;",
    "}",
    '// status.data.processing_info → { state: "succeeded", progress_percent: 100 }',
    "",
    "// 5. Post the tweet, attaching the now-ready media id.",
    "const tweet = await x.post.v2.tweets({",
    '  text: "jump",',
    "  media: { media_ids: [mediaId] },",
    "});",
    "",
    "console.log(tweet.data.id);",
    '// → "2050123819986378933"',
    "console.log(tweet.data.text);",
    '// → "jump https://t.co/X8cTIpcy3s"',
    "//   X auto-appends the attached media's t.co URL to the returned",
    '//   text — the literal request body just had "jump".',
    "```",
    "",
    "**Notes**",
    "",
    "- `media_category` must match the asset: `tweet_video`, `tweet_image`,",
    "  `tweet_gif`, or `amplify_video` for long-form. Mismatches are rejected",
    "  at finalize, not initialize.",
    "- Uploads expire after `data.expires_after_secs` (24h). If you finalize",
    "  but never reference the `media_id` in a tweet, it is garbage-collected.",
    "- Errors from any step throw `XError` with `status` and the parsed body",
    "  attached, so `try { ... } catch (e) { if (e instanceof XError) ... }`",
    "  gives you the upstream `errors[0].message` or `detail` directly.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/xai_3613880225/vision-analysis-json_243984103/
// recording.har — the same call that tests/integration/xai-vision-json.test.ts
// replays end-to-end.
function renderXaiExample() {
  return [
    "## Real-world example: structured vision analysis with Grok-4",
    "",
    "Hand Grok-4 a portrait, a system prompt that nails down the output schema,",
    'and `text.format.type: "json_object"` — get back a reproduction-ready',
    "JSON description with deterministic shot/pose vocabulary. The flow below",
    "is taken verbatim from",
    "[`tests/integration/xai-vision-json.test.ts`](../../../tests/integration/xai-vision-json.test.ts)",
    "and replays against",
    "[`tests/recordings/xai_3613880225/vision-analysis-json_243984103/recording.har`](../../../tests/recordings/xai_3613880225/vision-analysis-json_243984103/recording.har),",
    "so the response shapes match what xAI actually returns.",
    "",
    "```typescript",
    'import { readFile } from "node:fs/promises";',
    'import { xai as createXai } from "@apicity/xai";',
    "",
    "const xai = createXai({ apiKey: process.env.XAI_API_KEY! });",
    "",
    "// 1. Load the image and inline it as a data URL. xAI also accepts",
    "//    https:// URLs, but inlining keeps the call self-contained and",
    "//    works against private hosts.",
    'const image = await readFile("./portrait.jpg");',
    'const base64 = image.toString("base64");',
    "",
    "// 2. The system prompt enumerates the legal vocabulary for `shot` and",
    "//    constrains `pose` to body geometry only. Combined with",
    '//    `text.format.type: "json_object"` this gives Grok no room to drift',
    "//    off-schema — temperature 0 keeps the result reproducible.",
    "const SYSTEM_PROMPT = [",
    '  "You are an expert image-to-prompt analyst.",',
    '  "Return only a JSON object with keys prompt, shot, and pose.",',
    '  "prompt: a single-paragraph reproduction-ready image prompt, 1900 characters or fewer, with no line breaks.",',
    "  'shot: exactly \"<size>, <angle>\" where size is one of extreme close-up, close-up, medium close-up, medium shot, medium long shot, long shot, or extreme long shot, and angle is one of eye-level, low-angle, high-angle, overhead, or dutch.',",
    '  "pose: only body geometry for human figures, with no clothing, hair, background, or lighting details.",',
    '].join(" ");',
    "",
    "// 3. Multimodal Responses request: system turn + a user turn whose",
    "//    content is an array of `input_image` + `input_text` parts.",
    "const result = await xai.post.v1.responses({",
    '  model: "grok-4",',
    "  input: [",
    '    { role: "system", content: SYSTEM_PROMPT },',
    "    {",
    '      role: "user",',
    "      content: [",
    "        {",
    '          type: "input_image",',
    "          image_url: `data:image/jpeg;base64,${base64}`,",
    '          detail: "high",',
    "        },",
    "        {",
    '          type: "input_text",',
    '          text: \'Analyze this image and produce a reproduction-ready JSON description with keys "prompt", "shot", and "pose".\',',
    "        },",
    "      ],",
    "    },",
    "  ],",
    '  text: { format: { type: "json_object" } },',
    "  store: false,",
    "  temperature: 0,",
    "  max_output_tokens: 300,",
    "});",
    "",
    "// 4. The Responses API wraps output in a typed item array. Find the",
    "//    assistant message, then the first `output_text` part inside it.",
    '//    Discriminated unions narrow `item.type === "message"` so',
    "//    `item.content` is statically typed.",
    'const message = result.output.find((item) => item.type === "message");',
    "const outputText =",
    '  message?.type === "message"',
    '    ? message.content.find((part) => part.type === "output_text")?.text',
    "    : undefined;",
    "",
    'if (!outputText) throw new Error("Grok did not return output_text");',
    "",
    "const analysis = JSON.parse(outputText) as {",
    "  prompt: string;",
    "  shot: string;",
    "  pose: string;",
    "};",
    "",
    "console.log(analysis.shot);",
    '// → "medium close-up, eye-level"',
    "",
    "console.log(analysis.pose);",
    '// → "upright torso facing forward, head straight and centered, shoulders squared, arms relaxed downward (implied)"',
    "",
    "// 5. Reasoning-token accounting. Grok-4 spent 623 of its 728 output",
    "//    tokens reasoning before emitting the 105-token JSON answer —",
    "//    surfaced in `usage.output_tokens_details.reasoning_tokens`.",
    "console.log(result.usage);",
    "// → {",
    "//     input_tokens: 2684,",
    "//     input_tokens_details: { cached_tokens: 679 },",
    "//     output_tokens: 728,",
    "//     output_tokens_details: { reasoning_tokens: 623 },",
    "//     total_tokens: 3412,",
    "//   }",
    "```",
    "",
    "**Notes**",
    "",
    "- `store: false` keeps the response off xAI's history surface. Flip to",
    "  `true` to chain follow-ups via `previous_response_id` — useful for",
    '  multi-turn refinement ("now describe the wardrobe") without re-uploading',
    "  the image each time.",
    "- The Responses output array also carries reasoning items and tool calls",
    "  when present. Always discriminate on `item.type` before reading content;",
    "  TypeScript's narrowing keeps you honest.",
    "- For raw chat-style usage without the Responses wrapping, use",
    "  `xai.post.v1.chat.completions` instead — same auth, same model catalog,",
    "  just OpenAI-compatible request/response shapes.",
    "- Errors surface as `XaiError` with `status` and the parsed body attached,",
    "  so `try { ... } catch (e) { if (e instanceof XaiError) ... }` gives you",
    "  the upstream error directly.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/
// recording.har — the same flow that
// tests/integration/kie-kling-30-reference-bakeoff.test.ts replays end-to-end.
function renderKieExample() {
  return [
    "## Real-world example: Kling 3.0 video with named element references",
    "",
    "Kling 3.0/video has a feature most upstream video models lack — **named",
    "element references**. You upload reference images for each subject, give",
    "the subject a `name` and `description`, and refer back to it from the",
    "prompt with `[name]` placeholders. The result preserves identity across",
    "frames without prompt-engineering gymnastics.",
    "",
    "The flow below is taken verbatim from",
    "[`tests/integration/kie-kling-30-reference-bakeoff.test.ts`](../../../tests/integration/kie-kling-30-reference-bakeoff.test.ts)",
    "and replays against",
    "[`tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/recording.har`](../../../tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/recording.har),",
    "so the response shapes match what Kie actually returns.",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { kie as createKie } from "@apicity/kie";',
    "",
    "const kie = createKie({ apiKey: process.env.KIE_API_KEY! });",
    "",
    "// 1. Upload each reference image. Kie returns a CDN-hosted",
    "//    `downloadUrl` you'll thread through the job request — the bytes",
    "//    themselves never live in the createTask payload.",
    "async function upload(filename: string, mimeType: string): Promise<string> {",
    "  const blob = new Blob([readFileSync(filename)], { type: mimeType });",
    "  const res = await kie.post.api.fileStreamUpload({",
    "    file: blob,",
    "    filename,",
    '    uploadPath: "images/test-uploads",',
    "  });",
    '  if (!res.data?.downloadUrl) throw new Error("upload failed");',
    "  return res.data.downloadUrl;",
    "}",
    "",
    '// Two angles of the cat satisfy Kling\'s "2-4 images per element"',
    "// minimum. The man only has one fixture, so we pass it twice.",
    'const cat1  = await upload("cat1.jpg",  "image/jpeg");',
    'const cat2  = await upload("cat2.jpg",  "image/jpeg");',
    'const man   = await upload("man.jpg",   "image/jpeg");',
    'const beach = await upload("beach.png", "image/png");',
    "",
    "// 2. Submit the job. Each `kling_elements` entry binds a `name` to a",
    "//    set of reference images; the prompt then refers to that subject",
    "//    via `[name]`. `image_urls` carries general/setting references —",
    "//    the beach plate here — that aren't tied to a named subject.",
    "const task = await kie.post.api.v1.jobs.createTask({",
    '  model: "kling-3.0/video",',
    "  input: {",
    "    prompt:",
    '      "On a sandy beach with the ocean behind, [blue_suit_man] sits " +',
    '      "cross-legged on the sand. [white_cat] climbs onto his lap, " +',
    '      "purrs, and lifts a paw to bat playfully at his blue tie. " +',
    '      "[blue_suit_man] smiles and waves at the camera with his free hand.",',
    "    image_urls: [beach],",
    "    kling_elements: [",
    "      {",
    '        name: "white_cat",',
    '        description: "A white cat with mismatched yellow and blue eyes",',
    "        element_input_urls: [cat1, cat2],",
    "      },",
    "      {",
    '        name: "blue_suit_man",',
    '        description: "A man wearing a blue suit and a blue tie",',
    "        element_input_urls: [man, man],",
    "      },",
    "    ],",
    "    sound: false,",
    '    duration: "5",',
    '    aspect_ratio: "16:9",',
    '    mode: "std",',
    "    multi_shots: false,",
    "  },",
    "});",
    "",
    'if (!task.data?.taskId) throw new Error("createTask returned no taskId");',
    "const taskId = task.data.taskId;",
    '// → "56074f12319c68b246e5a03e05608f31"',
    "",
    "// 3. Poll recordInfo until the job leaves the `generating` state.",
    "//    Kie's terminal states are `success` and `fail` — anything else",
    "//    (`waiting`, `queuing`, `generating`) means keep waiting.",
    'let state: string = "waiting";',
    "let resultJson: string | undefined;",
    "for (let i = 0; i < 200; i++) {",
    "  const info = await kie.get.api.v1.jobs.recordInfo(taskId);",
    '  state = info.data?.state ?? "waiting";',
    '  if (state === "success" || state === "fail") {',
    "    resultJson = info.data?.resultJson;",
    "    break;",
    "  }",
    "  await new Promise((r) => setTimeout(r, 10_000));",
    "}",
    'if (state !== "success" || !resultJson) throw new Error(`job ${state}`);',
    "",
    "// 4. `resultJson` is a JSON-encoded string — parse it to get the",
    "//    delivered media URLs. The shape is consistent across every kie",
    "//    media model (single `resultUrls: string[]`).",
    "const result = JSON.parse(resultJson) as { resultUrls: string[] };",
    "console.log(result.resultUrls[0]);",
    '// → "https://tempfile.aiquickdraw.com/k/56074f12319c68b246e5a03e05608f31_1_1777540551_7969.mp4"',
    "```",
    "",
    "**Notes**",
    "",
    "- `kling_elements` accepts at most 3 named subjects, and each",
    "  `element_input_urls` array must hold **2–4 images**. If you only have",
    "  one reference per subject, repeat it (as the example does for `man`)",
    "  to satisfy the minimum.",
    "- The poll loop watches for the terminal states `success` and `fail` —",
    "  anything else (`waiting`, `queuing`, `generating`) means keep going.",
    "  There's no `check_after_secs` hint as on some other providers, so a",
    "  10s cadence is conservative; in the recorded fixture the job",
    "  completed after ~127s of generating (14 polls).",
    "- `kie.post.api.v1.jobs.createTask` is the unified entry point for every",
    "  media model in this provider — Kling, Wan, Seedance, Grok Imagine,",
    "  GPT-Image-2, Qwen2, and others. Swap the `model` and `input` block;",
    "  the rest of the flow (upload → createTask → poll → parse `resultJson`)",
    "  is identical.",
    "- For convenience, `submitMediaJob(provider, request)` and",
    "  `uploadFile(provider, blob, filename, uploadPath)` re-export the same",
    "  calls but throw `KieError` directly when the upstream envelope is",
    "  missing the expected fields.",
    "- Errors surface as `KieError` with `status`, `body`, and an upstream",
    "  `code` attached, so",
    "  `try { ... } catch (e) { if (e instanceof KieError) ... }` gives you",
    "  the upstream error directly.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/elevenlabs_2379486140/sound-generation_*/ and
// tests/recordings/elevenlabs_2379486140/speech-to-text_*/ — the same calls
// that elevenlabs-sound-generation.test.ts and elevenlabs-speech-to-text.test.ts
// replay end-to-end.
function renderElevenlabsExample() {
  return [
    "## Real-world example: generate a sound effect, then run it through Scribe v2",
    "",
    "ElevenLabs' two flagship audio surfaces fit together cleanly: text-to-",
    "sound-effects spits out raw MP3 bytes, and Scribe v2 hands back a typed",
    "transcript with word-level timestamps plus tagged audio events. The",
    "round-trip below — generate a UI click, then transcribe a separate clip",
    "with `tag_audio_events: true` — mirrors what",
    "[`tests/integration/elevenlabs-sound-generation.test.ts`](../../../tests/integration/elevenlabs-sound-generation.test.ts)",
    "and",
    "[`tests/integration/elevenlabs-speech-to-text.test.ts`](../../../tests/integration/elevenlabs-speech-to-text.test.ts)",
    "replay against",
    "[`tests/recordings/elevenlabs_2379486140/`](../../../tests/recordings/elevenlabs_2379486140/),",
    "so every payload, response field, and byte count below comes straight",
    "from the recorded HARs.",
    "",
    "```typescript",
    'import { readFileSync, writeFileSync } from "node:fs";',
    'import { elevenlabs as createElevenlabs } from "@apicity/elevenlabs";',
    'import type { ElevenLabsTranscript } from "@apicity/elevenlabs";',
    "",
    "const elevenlabs = createElevenlabs({ apiKey: process.env.ELEVENLABS_API_KEY! });",
    "",
    "// 1. Generate a 0.5s UI click. soundGeneration returns the raw MP3 as",
    "//    an ArrayBuffer — there's no JSON wrapper, the response body is",
    "//    audio/mpeg straight off the wire. duration_seconds (0.5–30) caps",
    "//    the clip length and prompt_influence (0–1) trades prompt-fidelity",
    "//    for creative variation. The factory also accepts `output_format`",
    "//    on the same request object and silently moves it to the URL query.",
    "const audio = await elevenlabs.v1.soundGeneration({",
    '  text: "soft ui click",',
    "  duration_seconds: 0.5,",
    "  prompt_influence: 0.3,",
    "});",
    "",
    'writeFileSync("./click.mp3", new Uint8Array(audio));',
    "console.log(`Generated ${audio.byteLength} bytes of audio/mpeg`);",
    '// → "Generated 11764 bytes of audio/mpeg"',
    "//   ElevenLabs charged 10 characters for this call (visible in the",
    "//   `character-cost` response header on the original request).",
    "",
    "// 2. Transcribe a separate audio clip with Scribe v2. The request goes",
    "//    up as multipart/form-data — pass a Blob and the rest as ergonomic",
    "//    fields; the factory packs the form, sets xi-api-key, and parses",
    "//    the JSON response. tag_audio_events: true tells Scribe to surface",
    "//    non-speech events ([phone beeping], [laughter], [applause]) inline",
    "//    with words instead of dropping them.",
    'const phoneBeep = readFileSync("./phone-beeping.mp3"); // 2,528 bytes',
    'const file = new Blob([phoneBeep], { type: "audio/mp3" });',
    "",
    "const result = (await elevenlabs.v1.speechToText({",
    "  file,",
    '  model_id: "scribe_v2",',
    '  language_code: "eng",',
    "  tag_audio_events: true,",
    "})) as ElevenLabsTranscript;",
    "",
    "// 3. The transcript is rich. `text` is the human-readable form;",
    "//    `words` is the per-token breakdown with absolute timestamps and a",
    '//    `type` discriminator ("word" | "spacing" | "audio_event") plus a',
    "//    `logprob` confidence. `transcription_id` is durable — you can",
    "//    retrieve the same transcript later through the history API.",
    "console.log(",
    "  `${result.language_code} · ${(result.language_probability * 100).toFixed(0)}% confident`,",
    ");",
    '// → "eng · 100% confident"',
    "console.log(",
    "  `${result.audio_duration_secs}s · transcription_id=${result.transcription_id}`,",
    ");",
    '// → "0.5s · transcription_id=CeeidI2QJ8kkN1mcq8HX"',
    "console.log(result.text);",
    '// → "[phone beeping]"',
    "",
    "// 4. Walk the words array, splitting audio events from spoken words",
    "//    via the `type` discriminator. On a clip with no speech every",
    '//    entry is an audio_event; on real speech you\'ll see "word" and',
    '//    "spacing" entries interleaved with bracketed events.',
    "for (const w of result.words) {",
    "  const tag =",
    '    w.type === "audio_event"',
    '      ? "event"',
    '      : w.type === "word"',
    '        ? "word "',
    '        : "space";',
    "  console.log(",
    "    `  ${tag}  [${w.start.toFixed(2)}–${w.end.toFixed(2)}s]  ${w.text}` +",
    '      (w.logprob !== undefined ? ` (logprob ${w.logprob.toFixed(3)})` : ""),',
    "  );",
    "}",
    '// → "  event  [0.00–0.44s]  [phone beeping] (logprob -0.335)"',
    "```",
    "",
    "**Notes**",
    "",
    "- `soundGeneration` returns binary, not JSON — the provider already",
    "  reads it as `arrayBuffer()` and hands you an `ArrayBuffer`. Pass",
    '  `output_format: "mp3_44100_128"` (or any other ElevenLabs codec',
    "  string) on the request object and the factory will strip it from",
    "  the body and move it to the `?output_format=` URL query.",
    "- `speechToText` accepts either a `file` Blob or a `cloud_storage_url`",
    "  (S3/GCS/HTTP). For long-form audio set `webhook: true` — the call",
    "  returns a small `ElevenLabsWebhookAcknowledgement` instead of the",
    "  transcript, and the finished result is delivered to your registered",
    '  webhook. Type-narrow the union with `"text" in result` before',
    "  reading transcript fields.",
    "- Set `diarize: true` and `num_speakers` to label words by speaker;",
    "  the per-word `speaker_id` field gets populated in that mode. Combine",
    "  with `use_multi_channel: true` for stereo audio and the response",
    "  switches to `ElevenLabsMultichannelTranscript` (one transcript per",
    "  channel under `transcripts[]`).",
    "- Errors throw `ElevenLabsError` with `status`, `code`, and the parsed",
    "  body attached. ElevenLabs returns either FastAPI's",
    "  `{ detail: [{msg, ...}] }` shape or `{ detail: { status, message } }`;",
    "  the client normalises both into `error.message`.",
    "",
  ].join("\n");
}

// Mirrors tests/integration/ig-post-video.test.ts — the same flow that
// will record into tests/recordings/ig_*/post-video_*/recording.har once
// an IG_ACCESS_TOKEN + IG_USER_ID land in 1Password. The catbox upload
// step IS already recorded under tests/recordings/free_2578706139/, so
// the public-URL handoff between @apicity/free and @apicity/ig is real.
// IG container/post ids below use Meta's 17-digit format as illustrative
// values — the exact ids vary per call.
function renderIgExample() {
  return [
    "## Real-world example: publish a Reel via the public-URL flow",
    "",
    "Instagram's Graph API doesn't take video bytes directly — Meta needs a",
    "publicly reachable URL it can `GET` and transcode asynchronously. The",
    "snippet below chains `@apicity/free` (catbox public hosting, free + zero",
    "auth) into `@apicity/ig` to land an `mp4` on disk as a published Reel,",
    "mirroring",
    "[`tests/integration/ig-post-video.test.ts`](../../../tests/integration/ig-post-video.test.ts)",
    "step-for-step. The catbox upload replays against",
    "[`tests/recordings/free_2578706139/`](../../../tests/recordings/free_2578706139/);",
    "the IG calls land in `tests/recordings/ig_*/post-video_*/recording.har`",
    "once a Business/Creator account's `IG_ACCESS_TOKEN` is recorded.",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { ig as createIg } from "@apicity/ig";',
    'import { free as createFree } from "@apicity/free";',
    "",
    "const ig = createIg({ accessToken: process.env.IG_ACCESS_TOKEN! });",
    'const igUserId = process.env.IG_USER_ID!; // 17-digit numeric, e.g. "17841471234567890"',
    "",
    "// 1. Host the mp4 publicly. catbox.moe is auth-free and persistent —",
    "//    Meta's transcode worker will fetch this URL once during step 2,",
    "//    so any host that returns the bytes within ~30s works (S3 presigned",
    "//    URL, R2, your own CDN). @apicity/free wraps the multipart upload",
    "//    and returns the resolved file URL as a string.",
    'const bytes = readFileSync("./jump.mp4");',
    'const blob = new Blob([bytes], { type: "video/mp4" });',
    "",
    "const free = createFree({});",
    "const videoUrl = await free.catbox.upload({",
    "  file: blob,",
    '  filename: "jump.mp4",',
    "});",
    "console.log(videoUrl);",
    '// → "https://files.catbox.moe/nn9sei.mp4"',
    "//   catbox returns a permanent public URL of the form",
    "//   `https://files.catbox.moe/<6char>.<ext>` — that's what Meta will GET.",
    "",
    "// 2. Create a media container. For Reels you must pass `media_type:",
    '//    "REELS"` (NOT "VIDEO" — that\'s the legacy IGTV path Meta',
    "//    deprecated in 2024). The container is a server-side handle: Meta",
    "//    queues the transcode against `video_url` and returns its id",
    "//    immediately. Containers expire 24h after creation if you don't",
    "//    publish them.",
    "const container = await ig.post.v25.media(igUserId, {",
    '  media_type: "REELS",',
    "  video_url: videoUrl,",
    '  caption: "jump #reels",',
    "});",
    "console.log(container.id);",
    '// → "17889012345678901" (17-digit container id)',
    "",
    "// 3. Poll the container's status_code until it leaves IN_PROGRESS.",
    "//    The state machine is IN_PROGRESS → FINISHED on success;",
    "//    FINISHED is the only state media_publish accepts. ERROR and",
    "//    EXPIRED are terminal failure states; PUBLISHED is what you'll",
    "//    see if you re-poll AFTER calling media_publish. The `fields`",
    "//    query param is required — by default the GET only returns `id`.",
    'let statusCode: string = "IN_PROGRESS";',
    'while (statusCode === "IN_PROGRESS") {',
    "  await new Promise((r) => setTimeout(r, 5000));",
    "  const s = await ig.get.v25.container(container.id, {",
    '    fields: "status_code,status",',
    "  });",
    '  statusCode = s.status_code ?? "FINISHED";',
    '  if (statusCode === "ERROR" || statusCode === "EXPIRED") {',
    "    throw new Error(`container ${container.id} ${statusCode}: ${s.status}`);",
    "  }",
    "}",
    '// statusCode → "FINISHED"',
    '// s.status   → "Finished: Media is ready to be published."',
    "",
    "// 4. Publish. media_publish takes the container id (NOT the media url)",
    "//    and returns the new post's id — that's the permanent ig_id you'd",
    "//    use to construct an https://www.instagram.com/reel/<shortcode>/",
    "//    URL or to query insights later via Graph API.",
    "const post = await ig.post.v25.mediaPublish(igUserId, {",
    "  creation_id: container.id,",
    "});",
    "console.log(post.id);",
    '// → "17912345678901234" (17-digit post id, distinct from container id)',
    "```",
    "",
    "**Notes**",
    "",
    "- Meta requires a **Business** or **Creator** Instagram account plus a",
    "  Meta App approved for `instagram_business_content_publish`. Personal",
    '  accounts get `190` ("Invalid OAuth access token") even with a',
    "  syntactically valid token.",
    "- `video_url` must be reachable from Meta's IPs and serve `Content-Type:",
    "  video/mp4`. Common gotchas: presigned S3 URLs that expire before the",
    "  transcoder pulls, hosts that require a `User-Agent`, and CDNs that",
    "  redirect to a different origin. catbox.moe sidesteps all three.",
    "- The Reel itself must satisfy Meta's Reel constraints — 9:16 aspect,",
    "  3–90s duration, ≤ 1GB, H.264 video, AAC audio. Mismatches surface as",
    '  `status_code: "ERROR"` during the poll, with the human-readable',
    '  reason in `status` (e.g. `"Error: The video is too short."`).',
    "- Containers and posts use **distinct** 17-digit ids. The container id",
    "  is throwaway — you only need it for the GET poll and the subsequent",
    "  `media_publish` `creation_id`. The post id is permanent and survives",
    "  user deletion of the post.",
    "- Errors throw `IgError` with `status` (HTTP code), `body` (the parsed",
    "  Meta error envelope), and an optional `code`. Meta's two error shapes",
    "  — `error.error_user_msg` for user-facing validation and `error.message`",
    "  for everything else — are both surfaced in `IgError.message`, so a",
    "  single `try/catch` reads naturally.",
    "",
  ].join("\n");
}

function renderIgSetup() {
  return [
    "## Setup",
    "",
    "Instagram requires a **long-lived (60-day) user access token** from the",
    "Instagram Login OAuth flow. The token is bound to a specific Instagram",
    "Business or Creator account; personal accounts have no programmatic",
    "publishing access.",
    "",
    "### 1. Configure your Meta App",
    "",
    "Open [developers.facebook.com](https://developers.facebook.com), create a",
    "new app (type: **Business**), then add the **Instagram** product.",
    "Choose **API setup with Instagram login** and configure:",
    "",
    "- Valid OAuth Redirect URI: `http://127.0.0.1:8765/callback`",
    "- Permissions: `instagram_business_basic` + `instagram_business_content_publish`",
    "- Save the **Instagram App ID** and **Instagram App Secret**",
    "",
    "### 2. Verify Instagram account type",
    "",
    "The Instagram account you're publishing to must be **Business** or",
    "**Creator** (not Personal). Switch in the Instagram mobile app under",
    "Settings → Account type and tools. No Facebook Page link is required",
    "for the Instagram Login flow.",
    "",
    "### 3. Mint a long-lived access token",
    "",
    "Save the script below as `mint-ig-token.mjs` and run it:",
    "",
    "```bash",
    "IG_CLIENT_ID=<your-instagram-app-id> \\",
    "IG_CLIENT_SECRET=<your-instagram-app-secret> \\",
    "  node mint-ig-token.mjs",
    "```",
    "",
    "It prints an authorize URL — open it, click **Allow**, and the helper",
    "captures the redirect on `127.0.0.1:8765`, exchanges the code for a",
    "short-lived token, then upgrades it to a long-lived (60-day) token and",
    "prints `{ access_token, user_id, expires_in }`. Save both `access_token`",
    "and `user_id` — you need both to call the API.",
    "",
    "<details>",
    "<summary><code>mint-ig-token.mjs</code> — zero-dep OAuth 2.0 helper</summary>",
    "",
    "```javascript",
    'import http from "node:http";',
    'import crypto from "node:crypto";',
    "",
    "const CLIENT_ID = process.env.IG_CLIENT_ID;",
    "const CLIENT_SECRET = process.env.IG_CLIENT_SECRET;",
    'const REDIRECT = "http://127.0.0.1:8765/callback";',
    "const SCOPES = [",
    '  "instagram_business_basic",',
    '  "instagram_business_content_publish",',
    '].join(",");',
    "",
    "if (!CLIENT_ID || !CLIENT_SECRET) {",
    '  console.error("Set IG_CLIENT_ID and IG_CLIENT_SECRET");',
    "  process.exit(1);",
    "}",
    "",
    'const state = crypto.randomBytes(16).toString("hex");',
    'const authURL = new URL("https://www.instagram.com/oauth/authorize");',
    'authURL.searchParams.set("client_id", CLIENT_ID);',
    'authURL.searchParams.set("redirect_uri", REDIRECT);',
    'authURL.searchParams.set("response_type", "code");',
    'authURL.searchParams.set("scope", SCOPES);',
    'authURL.searchParams.set("state", state);',
    "",
    'console.log("Open this URL and click Allow:\\n" + authURL.toString());',
    "",
    "const server = http.createServer(async (req, res) => {",
    "  const url = new URL(req.url, REDIRECT);",
    '  if (!url.pathname.startsWith("/callback")) {',
    "    res.writeHead(404).end();",
    "    return;",
    "  }",
    '  const code = url.searchParams.get("code");',
    '  if (!code || url.searchParams.get("state") !== state) {',
    '    res.writeHead(400).end("bad state");',
    "    server.close();",
    "    process.exit(1);",
    "  }",
    "",
    "  // 1. short-lived",
    "  const shortRes = await fetch(",
    '    "https://api.instagram.com/oauth/access_token",',
    "    {",
    '      method: "POST",',
    '      headers: { "Content-Type": "application/x-www-form-urlencoded" },',
    "      body: new URLSearchParams({",
    "        client_id: CLIENT_ID,",
    "        client_secret: CLIENT_SECRET,",
    '        grant_type: "authorization_code",',
    "        redirect_uri: REDIRECT,",
    "        code,",
    "      }),",
    "    }",
    "  );",
    "  const short = await shortRes.json();",
    "",
    "  // 2. long-lived (60-day)",
    '  const longURL = new URL("https://graph.instagram.com/access_token");',
    '  longURL.searchParams.set("grant_type", "ig_exchange_token");',
    '  longURL.searchParams.set("client_secret", CLIENT_SECRET);',
    '  longURL.searchParams.set("access_token", short.access_token);',
    "  const longRes = await fetch(longURL);",
    "  const long = await longRes.json();",
    "",
    "  console.log(JSON.stringify({",
    "    access_token: long.access_token,",
    "    expires_in: long.expires_in,",
    "    user_id: short.user_id,",
    "  }, null, 2));",
    '  res.writeHead(200).end("Authorized — check your terminal.");',
    "  server.close();",
    "});",
    "",
    'server.listen(8765, "127.0.0.1");',
    "```",
    "",
    "</details>",
    "",
    "### 4. Use the token",
    "",
    "```typescript",
    'import { ig as createIg } from "@apicity/ig";',
    "",
    "const ig = createIg({ accessToken: process.env.IG_ACCESS_TOKEN });",
    "const igUserId = process.env.IG_USER_ID;",
    "",
    "// Public-URL flow: host the mp4 somewhere (e.g. via @apicity/free) and",
    "// pass its URL. Meta GETs the video and processes it asynchronously.",
    "const container = await ig.post.v25.media(igUserId, {",
    '  media_type: "REELS",',
    '  video_url: "https://example.com/clip.mp4",',
    '  caption: "hello from @apicity/ig",',
    "});",
    "",
    "// Poll until the container is ready.",
    'let status = "IN_PROGRESS";',
    'while (status === "IN_PROGRESS") {',
    "  await new Promise((r) => setTimeout(r, 5000));",
    "  const s = await ig.get.v25.container(container.id, {",
    '    fields: "status_code,status",',
    "  });",
    '  status = s.status_code ?? "FINISHED";',
    "}",
    "",
    "// Publish.",
    "const post = await ig.post.v25.mediaPublish(igUserId, {",
    "  creation_id: container.id,",
    "});",
    "console.log(post.id);",
    "```",
    "",
  ].join("\n");
}

// Providers whose options object uses a non-default auth field/env-var or
// who don't re-export the shared middleware helpers. Anything not listed here
// gets the default `apiKey` / `<PROVIDER>_API_KEY` / middleware-section.
const PROVIDER_AUTH = {
  x: {
    field: "accessToken",
    env: "X_ACCESS_TOKEN",
    showMiddleware: false,
  },
  ig: {
    field: "accessToken",
    env: "IG_ACCESS_TOKEN",
    showMiddleware: false,
  },
  polymarket: {
    noAuth: true,
    showMiddleware: false,
  },
};

async function generateReadme(providerDir, providerName, endpoints) {
  const { pkg } = await extractProviderMetadata(providerDir);
  const pkgName = pkg.name || `@apicity/${providerName}`;
  const factory = `create${capitalize(providerName)}`;
  const auth = PROVIDER_AUTH[providerName] ?? {};
  const authField = auth.field ?? "apiKey";
  const envKey = auth.env ?? `${providerName.toUpperCase()}_API_KEY`;
  const showMiddleware = auth.showMiddleware ?? true;
  const noAuth = auth.noAuth ?? false;

  const sections = [];

  sections.push(`# ${pkgName}`);
  sections.push("");
  sections.push(
    `[![npm](https://img.shields.io/npm/v/${pkgName}?color=cb0000)](https://www.npmjs.com/package/${pkgName})`
  );
  sections.push(
    "[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)"
  );
  sections.push(
    "[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)"
  );
  sections.push("");
  sections.push(pkg.description || `${providerName} provider for apicity.`);
  sections.push("");

  sections.push("## Installation");
  sections.push("");
  sections.push("```bash");
  sections.push(`npm install ${pkgName}`);
  sections.push("# or");
  sections.push(`pnpm add ${pkgName}`);
  sections.push("```");
  sections.push("");

  sections.push("## Quick Start");
  sections.push("");
  sections.push("```typescript");
  sections.push(`import { ${providerName} as ${factory} } from "${pkgName}";`);
  sections.push("");
  if (noAuth) {
    sections.push(`const ${providerName} = ${factory}();`);
  } else {
    sections.push(
      `const ${providerName} = ${factory}({ ${authField}: process.env.${envKey}! });`
    );
  }
  sections.push("```");
  sections.push("");

  if (providerName === "x") {
    sections.push(renderXSetup());
    sections.push(renderXExample());
  }

  if (providerName === "xai") {
    sections.push(renderXaiExample());
  }

  if (providerName === "elevenlabs") {
    sections.push(renderElevenlabsExample());
  }

  if (providerName === "kie") {
    sections.push(renderKieExample());
  }

  if (providerName === "ig") {
    sections.push(renderIgSetup());
    sections.push(renderIgExample());
  }

  sections.push(renderApiReference(providerName, endpoints));

  if (showMiddleware) {
    sections.push("## Middleware");
    sections.push("");
    sections.push("```typescript");
    sections.push(
      `import { ${providerName} as ${factory}, withRetry } from "${pkgName}";`
    );
    sections.push("");
    sections.push(
      `const ${providerName} = ${factory}({ ${authField}: process.env.${envKey}! });`
    );
    sections.push(
      `const models = withRetry(${providerName}.get.v1.models, { retries: 3 });`
    );
    sections.push("```");
    sections.push("");
  }

  if (providerName === "xai") {
    sections.push(renderXaiRateLimiting());
  }

  sections.push("## License");
  sections.push("");
  sections.push(pkg.license || "MIT");
  sections.push("");

  return sections.join("\n");
}

async function regenerate(providerName, endpointsByProvider) {
  const providerDir = path.join(
    REPO_ROOT,
    "packages",
    "provider",
    providerName
  );
  const readmePath = path.join(providerDir, "README.md");
  const endpoints = endpointsByProvider.get(providerName) ?? [];
  const readme = await generateReadme(providerDir, providerName, endpoints);
  await fs.writeFile(readmePath, readme, "utf8");
  console.log(
    `✅ Generated ${path.relative(REPO_ROOT, readmePath)} (${endpoints.length} endpoints)`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const endpointsByProvider = await collectEndpointsByProvider();

  let providers;
  if (args.length === 0) {
    providers = PROVIDERS.map((p) => p.name);
  } else {
    const raw = args[0];
    const providerName = raw.startsWith("packages/")
      ? path.basename(path.resolve(raw))
      : raw;
    providers = [providerName];
  }

  for (const name of providers) {
    try {
      await regenerate(name, endpointsByProvider);
    } catch (error) {
      console.error(`❌ Error generating docs for ${name}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

main();
