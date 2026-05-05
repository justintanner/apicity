import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  PROVIDERS,
  instantiateProvider,
  type InstantiatedProvider,
} from "./providers.js";

export interface EndpointTsvRow {
  provider: string;
  dotPath: string;
  method: string; // GET | POST | PUT | DELETE | PATCH | HEAD
  fullUrl: string;
  docsUrl: string;
}

export interface EndpointFn {
  (...args: unknown[]): Promise<unknown> | unknown;
  schema?: unknown;
}

export interface Endpoint extends EndpointTsvRow {
  toolName: string;
  fn: EndpointFn;
  schema: unknown;
  pathParams: string[];
}

const PATH_PARAM_RE = /\{(\w+)\}/g;

export async function loadTsv(): Promise<EndpointTsvRow[]> {
  const tsv = await findAndRead([
    join(process.cwd(), "scripts/endpoint-docs.tsv"),
    join(packageDistDir(), "endpoint-docs.tsv"),
    join(packageDistDir(), "../../scripts/endpoint-docs.tsv"),
  ]);
  const lines = tsv.split("\n").filter((l) => l.trim().length > 0);
  const [header, ...rows] = lines;
  const cols = header.split("\t");
  return rows.map((line) => {
    const fields = line.split("\t");
    const obj: Record<string, string> = {};
    for (let i = 0; i < cols.length; i++) obj[cols[i]] = fields[i] ?? "";
    return obj as unknown as EndpointTsvRow;
  });
}

function packageDistDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return here;
}

async function findAndRead(candidates: string[]): Promise<string> {
  for (const path of candidates) {
    try {
      return await readFile(path, "utf8");
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Could not locate endpoint-docs.tsv. Tried: ${candidates.join(", ")}`
  );
}

export interface BuildRegistryOptions {
  /** If set, only these provider names are loaded. Defaults to all with env vars. */
  enabledProviders?: string[];
}

export async function buildRegistry(
  opts: BuildRegistryOptions = {}
): Promise<Endpoint[]> {
  const rows = await loadTsv();
  const wanted = new Set(opts.enabledProviders ?? Object.keys(PROVIDERS));
  const instances = new Map<string, InstantiatedProvider>();

  for (const [name, spec] of Object.entries(PROVIDERS)) {
    if (!wanted.has(name)) continue;
    try {
      const inst = await instantiateProvider(name, spec);
      if (inst) instances.set(name, inst);
    } catch (err) {
      console.error(
        `[apicity-mcp] failed to load provider "${name}":`,
        (err as Error).message
      );
    }
  }

  const endpoints: Endpoint[] = [];
  for (const row of rows) {
    const inst = instances.get(row.provider);
    if (!inst) continue;
    const resolved = resolveEndpointFn(inst, row.method, row.dotPath);
    if (!resolved) continue;
    const pathParams = extractPathParams(row.fullUrl);
    endpoints.push({
      ...row,
      toolName: makeToolName(row.provider, row.method, row.dotPath),
      fn: resolved,
      schema: (resolved as EndpointFn).schema,
      pathParams,
    });
  }
  return endpoints;
}

// Walk a dotPath through a provider tree. Each segment must land on either an
// object or a callable namespace (functions can carry sub-properties via
// `Object.assign`). Returns the function at the end of the path, or null.
function walkPath(root: unknown, segments: string[]): EndpointFn | null {
  let cur: unknown = root;
  for (const segment of segments) {
    if (cur === null || cur === undefined) return null;
    const t = typeof cur;
    if (t !== "object" && t !== "function") return null;
    cur = (cur as Record<string, unknown>)[segment];
  }
  return typeof cur === "function" ? (cur as EndpointFn) : null;
}

// Providers don't all share the same shape: most expose a `post`/`get`/...
// namespace at the root, but `fal` nests POSTs under `.run.*` as well, `free`
// has no method namespace at all, and `kie` re-exports endpoints under
// per-sub-provider roots (`claude`, `veo`, `suno`, `chat`).
function resolveEndpointFn(
  provider: InstantiatedProvider,
  method: string,
  dotPath: string
): EndpointFn | null {
  const m = method.toLowerCase();
  const segs = dotPath.split(".");
  const root = provider as Record<string, unknown>;
  const candidates: Array<unknown> = [
    root[m], // standard: provider.post.<dotPath>
    (root[m] as Record<string, unknown> | undefined)?.run, // fal: provider.post.run.<dotPath>
    root, // free: provider.<dotPath>
  ];
  // kie style A: first segment of dotPath is a sub-provider ("claude", "veo",
  // ...) that has its own method namespace. Try provider.<sub>.<method>.<rest>.
  if (segs.length > 1) {
    const sub = root[segs[0]];
    if (sub && typeof sub === "object") {
      const subMethod = (sub as Record<string, unknown>)[m];
      if (subMethod) {
        const fn = walkPath(subMethod, segs.slice(1));
        if (fn) return fn;
      }
    }
  }
  for (const c of candidates) {
    const fn = walkPath(c, segs);
    if (fn) return fn;
  }
  // kie style B: sub-provider key is one of the URL path segments rather than
  // the leading segment (e.g. dotPath `api.v1.veo.generate` lives at
  // `provider.veo.post.api.v1.veo.generate`). Try every top-level non-method
  // key as a candidate sub-provider root.
  const HTTP_KEYS = new Set(["post", "get", "put", "delete", "patch", "head"]);
  for (const key of Object.keys(root)) {
    if (HTTP_KEYS.has(key)) continue;
    if (!segs.includes(key)) continue;
    const sub = root[key];
    if (!sub || typeof sub !== "object") continue;
    const subMethod = (sub as Record<string, unknown>)[m];
    if (!subMethod) continue;
    const fn = walkPath(subMethod, segs);
    if (fn) return fn;
  }
  return null;
}

function extractPathParams(url: string): string[] {
  const out: string[] = [];
  for (const match of url.matchAll(PATH_PARAM_RE)) out.push(match[1]);
  return out;
}

export function makeToolName(
  provider: string,
  method: string,
  dotPath: string
): string {
  return `${provider}_${method.toLowerCase()}_${dotPath.replace(/\./g, "_")}`;
}
