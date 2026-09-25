import { CALL_SHAPES, callShapeKey, type CallShape } from "./call-shapes.js";
import { loadCostHelpers } from "./cost.js";
import {
  isProviderConfigured,
  readCredentialSources,
  type CredentialFlags,
  type CredentialSources,
} from "./credentials.js";
import { CliError } from "./errors.js";
import { loadTsv, type EndpointTsvRow } from "./registry.js";

/**
 * One callable endpoint, as `apicity commands` reports it.
 *
 * `pathParams` and `requestParams` are the two halves of the call shape, and
 * both are needed: an agent told only "this endpoint takes {bucket}" cannot
 * tell whether to pass it as an argument or inside the request body, and gets
 * it wrong for s3, b2, dolthub, openligadb, simplefunctions and thesportsdb.
 * Placeholders the factory substitutes or derives appear in neither list —
 * a caller is never asked for a credential it already configured.
 */
export interface CatalogEntry {
  provider: string;
  dotPath: string;
  method: string;
  fullUrl: string;
  docsUrl: string;
  /** Positional arguments, in URL order. */
  pathParams: string[];
  /** Request-object properties that fill a URL placeholder. */
  requestParams: string[];
  paid: boolean;
  configured: boolean;
}

export interface LoadCatalogOptions {
  env?: NodeJS.ProcessEnv;
  /**
   * The credential flags on the command line. With `env` they locate the env
   * file whose literals and references count as configured.
   */
  flags?: CredentialFlags;
  /** Already-read sources, so a caller that needs them too reads them once. */
  sources?: CredentialSources;
}

/**
 * Every endpoint in `scripts/endpoint-docs.tsv`, in tsv order.
 *
 * This function imports no provider module and spawns nothing. It reads the
 * tsv, the generated call-shape table, the cost package and the env file,
 * which is what keeps `commands` and `providers` inside their timing budget:
 * loading 28 provider factories to list endpoint names would dominate the
 * command.
 */
export async function loadCatalog(
  options: LoadCatalogOptions = {}
): Promise<CatalogEntry[]> {
  const env = options.env ?? process.env;
  const sources = options.sources ?? readCredentialSources(env, options.flags);
  const rows = await loadTsv();
  const { isPaidEndpoint } = await loadCostHelpers();
  const configuredByProvider = new Map<string, boolean>();

  return rows.map((row) => {
    let configured = configuredByProvider.get(row.provider);
    if (configured === undefined) {
      configured = isProviderConfigured(row.provider, env, sources);
      configuredByProvider.set(row.provider, configured);
    }
    const shape = callShapeFor(row);
    return {
      provider: row.provider,
      dotPath: row.dotPath,
      method: row.method,
      fullUrl: row.fullUrl,
      docsUrl: row.docsUrl,
      pathParams: shape ? shape.positional.map((p) => p.param) : [],
      requestParams: shape ? shape.fields.map((f) => f.property) : [],
      paid: isPaidEndpoint(row.provider, row.method, row.dotPath),
      configured,
    };
  });
}

/** The generated call shape for one row, or undefined when it has no placeholder. */
export function callShapeFor(row: EndpointTsvRow): CallShape | undefined {
  return CALL_SHAPES[callShapeKey(row.provider, row.method, row.dotPath)];
}

/**
 * Every entry at one `provider` + `dotPath`. Up to six methods can share a
 * dotPath (`v1.chat.completions` is GET, POST and DELETE), which is why
 * selection is two steps.
 */
export function findEntries(
  catalog: CatalogEntry[],
  provider: string,
  dotPath: string
): CatalogEntry[] {
  return catalog.filter(
    (entry) => entry.provider === provider && entry.dotPath === dotPath
  );
}

/**
 * Narrow a dotPath's entries to the one to call.
 *
 * No `(provider, dotPath, method)` triple repeats in the tsv, so `--method`
 * always resolves an ambiguity; without it, a dotPath carrying more than one
 * method is `ambiguous` rather than a silent pick.
 */
export function selectEntry(
  entries: CatalogEntry[],
  method?: string
): CatalogEntry {
  if (entries.length === 0) {
    throw new CliError("not_found", "no such endpoint", {
      hint: "run: apicity commands --provider <provider>",
    });
  }

  if (method !== undefined) {
    const wanted = method.toUpperCase();
    const match = entries.find((entry) => entry.method === wanted);
    if (!match) {
      throw new CliError(
        "not_found",
        `no ${wanted} endpoint at ${entries[0].provider} ${entries[0].dotPath}`,
        {
          hint: `available: ${entries.map((e) => e.method).join(", ")}`,
          meta: { methods: entries.map((e) => e.method) },
        }
      );
    }
    return match;
  }

  if (entries.length > 1) {
    throw new CliError(
      "ambiguous",
      `${entries[0].provider} ${entries[0].dotPath} has ${entries.length} methods`,
      {
        hint: `pass --method: ${entries.map((e) => e.method).join(", ")}`,
        meta: { methods: entries.map((e) => e.method) },
      }
    );
  }

  return entries[0];
}
