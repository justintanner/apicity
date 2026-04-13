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
  const headerCode = method
    ? `<code>${method}</code> `
    : "";
  const summary = `${headerCode}<b><code>${providerName}${ep.dotPath ? "." + ep.dotPath : ""}</code></b>`;

  const urlLine = ep.fullUrl
    ? `<code>${method ? method + " " : ""}${ep.fullUrl}</code>`
    : "";
  const docsLine =
    docsUrl && docsUrl.length > 0
      ? `[Upstream docs ↗](${docsUrl})`
      : "";

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
    sections.push(
      "_No endpoints discovered for this provider yet._",
      ""
    );
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

async function generateReadme(providerDir, providerName, endpoints) {
  const { pkg } = await extractProviderMetadata(providerDir);
  const pkgName = pkg.name || `@apicity/${providerName}`;
  const factory = `create${capitalize(providerName)}`;
  const envKey = `${providerName.toUpperCase()}_API_KEY`;

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
  sections.push(
    `import { ${providerName} as ${factory} } from "${pkgName}";`
  );
  sections.push("");
  sections.push(
    `const ${providerName} = ${factory}({ apiKey: process.env.${envKey}! });`
  );
  sections.push("```");
  sections.push("");

  sections.push(renderApiReference(providerName, endpoints));

  sections.push("## Middleware");
  sections.push("");
  sections.push("```typescript");
  sections.push(
    `import { ${providerName} as ${factory}, withRetry } from "${pkgName}";`
  );
  sections.push("");
  sections.push(
    `const ${providerName} = ${factory}({ apiKey: process.env.${envKey}! });`
  );
  sections.push(
    `const models = withRetry(${providerName}.get.v1.models, { retries: 3 });`
  );
  sections.push("```");
  sections.push("");

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
  const providerDir = path.join(REPO_ROOT, "packages", "provider", providerName);
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
