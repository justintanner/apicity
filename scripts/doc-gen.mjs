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

function renderEndpointDetails(ep, providerName, docsUrl) {
  const method = ep.method ?? "";
  const headerCode = method ? `<code>${method}</code> ` : "";
  const summary = `${headerCode}<b><code>${providerName}${ep.dotPath ? "." + ep.dotPath : ""}</code></b>`;

  const urlLine = ep.fullUrl
    ? `<code>${method ? method + " " : ""}${ep.fullUrl}</code>`
    : "";
  const docsLine =
    docsUrl && docsUrl.length > 0 ? `[Upstream docs ↗](${docsUrl})` : "";

  const usage = formatUsageSnippet(providerName, ep.dotPath);
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
};

async function generateReadme(providerDir, providerName, endpoints) {
  const { pkg } = await extractProviderMetadata(providerDir);
  const pkgName = pkg.name || `@apicity/${providerName}`;
  const factory = `create${capitalize(providerName)}`;
  const auth = PROVIDER_AUTH[providerName] ?? {};
  const authField = auth.field ?? "apiKey";
  const envKey = auth.env ?? `${providerName.toUpperCase()}_API_KEY`;
  const showMiddleware = auth.showMiddleware ?? true;

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
  sections.push(
    `const ${providerName} = ${factory}({ ${authField}: process.env.${envKey}! });`
  );
  sections.push("```");
  sections.push("");

  if (providerName === "x") {
    sections.push(renderXSetup());
  }

  if (providerName === "ig") {
    sections.push(renderIgSetup());
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
