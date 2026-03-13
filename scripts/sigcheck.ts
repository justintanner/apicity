import { readFileSync } from "node:fs";
import { join } from "node:path";

// --- Provider config ---

interface SubProviderConfig {
  name: string;
  sourceFile: string;
}

interface ProviderConfig {
  name: string;
  sourceFile: string;
  defaultBaseURL: string;
  subProviders?: SubProviderConfig[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "fal",
    sourceFile: "packages/provider/fal/src/fal.ts",
    defaultBaseURL: "https://api.fal.ai/v1",
  },
  {
    name: "xai",
    sourceFile: "packages/provider/xai/src/xai.ts",
    defaultBaseURL: "https://api.x.ai/v1",
  },
  {
    name: "kie",
    sourceFile: "packages/provider/kie/src/kie.ts",
    defaultBaseURL: "https://api.kie.ai",
    subProviders: [
      { name: "veo", sourceFile: "packages/provider/kie/src/veo.ts" },
      { name: "suno", sourceFile: "packages/provider/kie/src/suno.ts" },
      { name: "chat", sourceFile: "packages/provider/kie/src/chat.ts" },
    ],
  },
  {
    name: "kimicoding",
    sourceFile: "packages/provider/kimicoding/src/kimicoding.ts",
    defaultBaseURL: "https://api.kimi.com/coding/",
  },
  {
    name: "openai",
    sourceFile: "packages/provider/openai/src/openai.ts",
    defaultBaseURL: "https://api.openai.com/v1",
  },
];

// --- Helpers ---

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function extractBasePath(defaultBaseURL: string): string {
  try {
    const url = new URL(defaultBaseURL);
    return url.pathname.replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function deriveCanonical(
  provider: string,
  basePath: string,
  endpointPath: string
): string {
  const full = basePath + endpointPath;
  const segments = full
    .split("/")
    .filter((s) => s.length > 0)
    .filter((s) => !s.startsWith("$"));

  const camelSegments = segments.map(kebabToCamel);
  return `${provider}.${camelSegments.join(".")}`;
}

function extractTemplateParams(path: string): string[] {
  const params: string[] = [];
  const re = /\$\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    const raw = m[1].trim();
    const lastDot = raw.lastIndexOf(".");
    params.push(lastDot !== -1 ? raw.slice(lastDot + 1) : raw);
  }
  return params;
}

interface MethodInfo {
  name: string;
  path: string | null;
  templateParams: string[];
}

function formatParams(params: string[]): string {
  return params.length > 0 ? `(${params.join(", ")})` : "";
}

// --- Unified parser ---
// Scans source for named async functions and methods that contain
// fetch/request calls, extracts the URL path from those calls.

// URL pattern matchers for different providers
const URL_PATTERNS = [
  // makeRequest<T>("GET"|"POST"|"DELETE", "/path"|`/path/${x}`, ...)
  /makeRequest\w*(?:<[^>]+>)?\(\s*(?:"(?:GET|POST|DELETE)"\s*,\s*)?(?:`([^`]+)`|"([^"]+)")/,
  // make*Request("/path"|`/path/${x}`, ...)
  /make\w*Request\w*\(\s*(?:`([^`]+)`|"([^"]+)")/,
  // doFetch(`${baseURL}/path`) or doFetch(`${uploadBaseURL}/path`)
  /doFetch\(\s*`\$\{(?:baseURL|uploadBaseURL)\}([^`]*)`/,
  // doFetch(`${baseURL}path`) — no leading slash (kimicoding)
  /doFetch\(\s*`\$\{baseURL\}([^`]*)`/,
  // kieRequest<T>(`${baseURL}/path`, ...)
  /kieRequest\w*(?:<[^>]+>)?\(\s*`\$\{(?:baseURL|apiKey)[^}]*\}([^`]*)`/,
];

function findFunctions(source: string): Array<{ name: string; body: string }> {
  const results: Array<{ name: string; body: string }> = [];

  // Match: async function name(...) {
  const funcRe = /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
  let m: RegExpExecArray | null;
  while ((m = funcRe.exec(source)) !== null) {
    const name = m[1];
    const start = m.index;
    // Find the opening brace
    const braceStart = source.indexOf("{", start + m[0].length);
    if (braceStart === -1) continue;

    // Track braces to find the end
    let depth = 0;
    let end = braceStart;
    for (let i = braceStart; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    results.push({ name, body: source.slice(start, end) });
  }

  return results;
}

function extractPath(
  body: string,
  isKimicoding: boolean
): { path: string; templateParams: string[] } | null {
  for (const pattern of URL_PATTERNS) {
    const match = body.match(pattern);
    if (match) {
      // Find the first non-undefined capture group
      const raw = match[1] ?? match[2] ?? match[3] ?? match[4];
      if (!raw) continue;

      const pathOnly = raw.replace(/\?.*$/, "");
      const templateParams = extractTemplateParams(pathOnly);
      let cleaned = pathOnly.replace(/\$\{[^}]+\}/g, "");

      // kimicoding doesn't have a leading slash in the fetch URL
      if (isKimicoding && !cleaned.startsWith("/")) {
        cleaned = "/" + cleaned;
      }

      return { path: cleaned, templateParams };
    }
  }
  return null;
}

function parseMethods(source: string, isKimicoding: boolean): MethodInfo[] {
  const functions = findFunctions(source);
  const results: MethodInfo[] = [];

  for (const { name, body } of functions) {
    // Skip helper/utility functions
    if (
      [
        "isAnthropicErrorBody",
        "mapStopReason",
        "extractTextFromContent",
        "textBlock",
        "imageBase64",
        "imageUrl",
        "extractSystem",
        "extractTextContent",
        "buildRequestBody",
        "buildHeaders",
        "makeRequest",
        "makeImageRequest",
        "makeJsonPostRequest",
        "makeGetRequest",
        "jsonRequest",
        "parseResponse",
        "toSnakeCase",
        "convertToSnakeCase",
        "toCamelCase",
        "convertToCamelCase",
        "buildQueryString",
        "isFalApiErrorResponse",
        "inferMimeType",
        "isTransientError",
        "sleep",
        "cleanResponse",
        "retryStream",
        "fallbackStream",
      ].includes(name)
    ) {
      continue;
    }

    // Skip factory functions themselves
    if (
      [
        "openai",
        "xai",
        "fal",
        "kimicoding",
        "kie",
        "createVeoProvider",
        "createSunoProvider",
        "createChatProvider",
        "withRetry",
        "withFallback",
      ].includes(name)
    ) {
      continue;
    }

    const pathInfo = extractPath(body, isKimicoding);
    if (pathInfo) {
      results.push({ name, ...pathInfo });
    } else {
      results.push({ name, path: null, templateParams: [] });
    }
  }

  // Also find inline async methods in return objects
  // e.g., async completions(...) { ... }
  const inlineRe = /^\s+async\s+(?:\*\s*)?(\w+)\s*\([^)]*\).*?\{/gm;
  let im: RegExpExecArray | null;
  while ((im = inlineRe.exec(source)) !== null) {
    const name = im[1];
    // Skip if already found as a function
    if (results.some((r) => r.name === name)) continue;
    // Skip helpers
    if (
      [
        "makeRequest",
        "makeImageRequest",
        "makeJsonPostRequest",
        "makeGetRequest",
      ].includes(name)
    ) {
      continue;
    }

    // Find the body of this inline method
    const start = im.index;
    const braceStart = source.indexOf("{", start + im[0].length - 1);
    if (braceStart === -1) continue;
    let depth = 0;
    let end = braceStart;
    for (let i = braceStart; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    const body = source.slice(start, end);
    const pathInfo = extractPath(body, isKimicoding);
    if (pathInfo) {
      results.push({ name, ...pathInfo });
    }
  }

  return results;
}

// --- Main ---

function main(): void {
  const root = process.cwd();

  console.log("sigcheck — NakedAPI endpoint signature report");
  console.log("==============================================");

  for (const provider of PROVIDERS) {
    const filePath = join(root, provider.sourceFile);
    const source = readFileSync(filePath, "utf-8");
    const basePath = extractBasePath(provider.defaultBaseURL);
    const isKimicoding = provider.name === "kimicoding";

    console.log(`\n${provider.name} (${provider.sourceFile})`);

    const methods = parseMethods(source, isKimicoding);

    for (const m of methods) {
      const label = m.name.padEnd(20);
      if (m.path === null) {
        console.log(`  ${label}(local)`);
      } else {
        const canonical = deriveCanonical(provider.name, basePath, m.path);
        const params = formatParams(m.templateParams);
        console.log(`  ${label}${canonical}${params}`);
      }
    }

    // Sub-providers
    if (provider.subProviders) {
      for (const sub of provider.subProviders) {
        const subFilePath = join(root, sub.sourceFile);
        const subSource = readFileSync(subFilePath, "utf-8");
        const prefix = `${provider.name}.${sub.name}`;

        console.log(`\n${prefix} (${sub.sourceFile})`);

        const subMethods = parseMethods(subSource, false);
        for (const m of subMethods) {
          const label = m.name.padEnd(20);
          if (m.path === null) {
            console.log(`  ${label}(local)`);
          } else {
            const canonical = deriveCanonical(prefix, "", m.path);
            const params = formatParams(m.templateParams);
            console.log(`  ${label}${canonical}${params}`);
          }
        }
      }
    }
  }
}

main();
