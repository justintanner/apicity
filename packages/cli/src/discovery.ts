import {
  findEntries,
  loadCatalog,
  selectEntry,
  type CatalogEntry,
} from "./catalog.js";
import { CALL_SHAPES, callShapeKey, type CallShape } from "./call-shapes.js";
import type { CliWriter } from "./envelope.js";
import { isProviderConfigured, providerEnvVars } from "./credentials.js";
import { CliError } from "./errors.js";
import { errorMessage } from "./internal.js";
import {
  PROVIDERS,
  type InstantiatedProvider,
  type ProviderSpec,
} from "./providers.js";
import { resolveEndpointFn, type EndpointFn } from "./registry.js";
import { zodToJsonSchema, type JsonSchema } from "./schema.js";

/**
 * How `describe` reaches a provider's endpoint functions.
 *
 * It is a parameter rather than a direct import so the seam is observable:
 * `commands` and `providers` must answer without loading a single provider
 * package, and a test can prove that by counting calls to this.
 */
export type ProviderLoader = (name: string) => Promise<InstantiatedProvider>;

/**
 * A stand-in credential for `describe`. The factory needs *a* key to build its
 * endpoint tree; the resulting provider is read for `.schema` and `.example`
 * and never used to make a request.
 */
const PLACEHOLDER_CREDENTIAL = "describe-placeholder";

/**
 * Build a provider purely to read its endpoint metadata.
 *
 * Deliberately not `instantiateProvider`: that one answers null when a
 * credential is missing, which would make `apicity describe` depend on the
 * caller's environment. Describing an endpoint is a documentation lookup and
 * must work with nothing configured.
 */
export async function instantiateForIntrospection(
  name: string,
  spec: ProviderSpec | undefined = PROVIDERS[name]
): Promise<InstantiatedProvider> {
  if (!spec) {
    throw new CliError("not_found", `unknown provider: ${name}`, {
      hint: "run: apicity providers",
    });
  }

  // A provider package that is not installed (or not built, in a workspace
  // checkout) is a setup problem, not a crash: say which package and how to
  // get it rather than letting ERR_MODULE_NOT_FOUND reach the top level.
  let mod: Record<string, unknown>;
  try {
    mod = (await import(spec.importPath)) as Record<string, unknown>;
  } catch (cause) {
    throw new CliError(
      "setup_incomplete",
      `could not load ${spec.importPath}`,
      {
        hint: `install ${spec.importPath}, or run: pnpm run build`,
        cause,
      }
    );
  }
  const factory = mod[spec.factoryName];
  if (typeof factory !== "function") {
    throw new CliError(
      "setup_incomplete",
      `${spec.importPath} does not export ${spec.factoryName}`
    );
  }
  const build = factory as (
    opts?: Record<string, unknown>
  ) => InstantiatedProvider;

  // A factory that throws while building — validating a credential bundle it
  // was handed a placeholder for, say — is a describe failure to report, not
  // a crash: `runMain` converts only `CliError`, so anything else would reach
  // `bin.ts` as `[apicity] fatal:` with a stack. Every build call sits inside
  // this one `try`, so the robustness comes from the wrapper rather than from
  // the special-case list below staying complete as providers are added.
  try {
    if (name === "free-media-upload") return build();
    // Polymarket validates its credential bundle on construction and needs
    // none of it to expose the tree, so it is built bare.
    if (name === "polymarket") return build({});
    if (name === "s3" || name === "b2") {
      return build({
        accessKeyId: PLACEHOLDER_CREDENTIAL,
        secretAccessKey: PLACEHOLDER_CREDENTIAL,
        region: "us-east-1",
      });
    }
    if (spec.envVar === "") return build({});
    return build({ [spec.optionKey]: PLACEHOLDER_CREDENTIAL });
  } catch (cause) {
    if (cause instanceof CliError) throw cause;
    throw new CliError(
      "api",
      `${spec.factoryName} from ${spec.importPath} threw while building ` +
        `${name} for introspection: ${errorMessage(cause)}`,
      {
        hint:
          "the factory rejected describe's placeholder credential; " +
          "report this against @apicity/cli",
        cause,
      }
    );
  }
}

const defaultLoader: ProviderLoader = (name) =>
  instantiateForIntrospection(name);

export interface DiscoveryOptions {
  env?: NodeJS.ProcessEnv;
  loadProvider?: ProviderLoader;
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

export interface CommandsOptions extends DiscoveryOptions {
  provider?: string;
  json?: boolean;
}

export async function runCommands(
  writer: CliWriter,
  options: CommandsOptions = {}
): Promise<number> {
  const catalog = await loadCatalog({ env: options.env });
  const entries =
    options.provider === undefined
      ? catalog
      : catalog.filter((entry) => entry.provider === options.provider);

  if (options.provider !== undefined && entries.length === 0) {
    throw new CliError(
      "not_found",
      `no endpoints for provider: ${options.provider}`,
      { hint: "run: apicity providers" }
    );
  }

  writer.out(
    options.json ? JSON.stringify(entries, null, 2) : commandsTable(entries)
  );
  return 0;
}

function commandsTable(entries: CatalogEntry[]): string {
  const rows = entries.map((entry) => [
    entry.provider,
    entry.method,
    entry.dotPath,
    formatParams(entry),
    entry.paid ? "yes" : "no",
    entry.configured ? "yes" : "no",
  ]);
  const header = [
    "provider",
    "method",
    "dotPath",
    "params",
    "paid",
    "configured",
  ];
  return renderTable([header, ...rows]);
}

/** Positional arguments as `<name>`, request properties as bare names. */
function formatParams(entry: CatalogEntry): string {
  return [
    ...entry.pathParams.map((name) => `<${name}>`),
    ...entry.requestParams,
  ].join(" ");
}

function renderTable(rows: string[][]): string {
  const widths: number[] = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      widths[i] = Math.max(widths[i] ?? 0, cell.length);
    });
  }
  return rows
    .map((row) =>
      row
        .map((cell, i) =>
          i === row.length - 1 ? cell : cell.padEnd(widths[i])
        )
        .join("  ")
        .trimEnd()
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

export interface DescribeOptions extends DiscoveryOptions {
  method?: string;
  json?: boolean;
}

export interface EndpointDescription extends CatalogEntry {
  callShape?: CallShape;
  schema?: JsonSchema;
  example?: unknown;
}

export async function describeEndpoint(
  provider: string,
  dotPath: string,
  options: DescribeOptions = {}
): Promise<EndpointDescription> {
  const catalog = await loadCatalog({ env: options.env });
  const entry = selectEntry(
    findEntries(catalog, provider, dotPath),
    options.method
  );

  const loadProvider = options.loadProvider ?? defaultLoader;
  const instance = await loadProvider(provider);
  const fn = resolveEndpointFn(instance, entry.method, entry.dotPath);

  const description: EndpointDescription = {
    ...entry,
    callShape: CALL_SHAPES[callShapeKey(provider, entry.method, dotPath)],
  };
  if (fn) {
    const endpoint = fn as EndpointFn;
    if (endpoint.schema !== undefined) {
      description.schema = zodToJsonSchema(endpoint.schema);
    }
    if (endpoint.example !== undefined) description.example = endpoint.example;
  }
  return description;
}

export async function runDescribe(
  writer: CliWriter,
  provider: string,
  dotPath: string,
  options: DescribeOptions = {}
): Promise<number> {
  const description = await describeEndpoint(provider, dotPath, options);
  writer.out(
    options.json
      ? JSON.stringify(description, null, 2)
      : describeText(description)
  );
  return 0;
}

function describeText(description: EndpointDescription): string {
  const lines = [
    `${description.provider} ${description.dotPath}`,
    "",
    `method:        ${description.method}`,
    `url:           ${description.fullUrl}`,
    `docs:          ${description.docsUrl}`,
    `pathParams:    ${description.pathParams.join(", ") || "(none)"}`,
    `requestParams: ${description.requestParams.join(", ") || "(none)"}`,
    `paid:          ${description.paid ? "yes" : "no"}`,
  ];
  if (description.schema !== undefined) {
    lines.push("", "schema:", JSON.stringify(description.schema, null, 2));
  }
  if (description.example !== undefined) {
    lines.push("", "example:", JSON.stringify(description.example, null, 2));
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// providers
// ---------------------------------------------------------------------------

export interface ProviderSummary {
  provider: string;
  /** Env var names only, never a value. */
  envVars: string[];
  configured: boolean;
  endpoints: number;
}

export async function listProviders(
  options: DiscoveryOptions = {}
): Promise<ProviderSummary[]> {
  const env = options.env ?? process.env;
  const catalog = await loadCatalog({ env });
  const counts = new Map<string, number>();
  for (const entry of catalog) {
    counts.set(entry.provider, (counts.get(entry.provider) ?? 0) + 1);
  }

  return Object.keys(PROVIDERS).map((provider) => ({
    provider,
    envVars: providerEnvVars(provider),
    configured: isProviderConfigured(provider, env),
    endpoints: counts.get(provider) ?? 0,
  }));
}

export async function runProviders(
  writer: CliWriter,
  options: DiscoveryOptions & { json?: boolean } = {}
): Promise<number> {
  const summaries = await listProviders(options);
  if (options.json) {
    writer.out(JSON.stringify(summaries, null, 2));
    return 0;
  }
  const rows = summaries.map((summary) => [
    summary.provider,
    String(summary.endpoints),
    summary.configured ? "yes" : "no",
    summary.envVars.join(" ") || "(none)",
  ]);
  writer.out(
    renderTable([["provider", "endpoints", "configured", "env"], ...rows])
  );
  return 0;
}
