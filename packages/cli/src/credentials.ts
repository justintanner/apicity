import { PROVIDERS, type ProviderSpec } from "./providers.js";

/**
 * Providers whose factory answers without a credential even though
 * `ProviderSpec.envVar` names one: their keyless endpoints keep working and
 * the rest fail at call time with the provider's own error.
 * `instantiateProvider` exempts exactly these three.
 */
const CREDENTIAL_OPTIONAL = new Set([
  "youtube",
  "simplefunctions",
  "thesportsdb",
]);

function isSet(env: NodeJS.ProcessEnv, name: string): boolean {
  const value = env[name];
  return typeof value === "string" && value.length > 0;
}

/**
 * Every env var this provider reads, credential first. Names only — a caller
 * that prints these must never print their values.
 */
export function providerEnvVars(
  name: string,
  spec: ProviderSpec | undefined = PROVIDERS[name]
): string[] {
  if (!spec) return [];
  return [spec.envVar, ...(spec.extraEnvVars ?? [])].filter(
    (envVar) => envVar.length > 0
  );
}

/**
 * Would `instantiateProvider` answer a provider object for this name?
 *
 * This mirrors that function's null conditions exactly, without importing a
 * provider package: `apicity commands` and `apicity providers` report which
 * providers are usable, and loading 28 factories to find out would cost more
 * than the whole command is allowed to take.
 *
 * `envVar: ""` means the provider needs no credential at all — binance,
 * openligadb, openf1, free-media-upload, and polymarket, whose public market
 * data works unauthenticated and whose trading bundle is optional on top.
 */
export function isProviderConfigured(
  name: string,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const spec = PROVIDERS[name];
  if (!spec) return false;
  if (spec.envVar === "") return true;
  if (CREDENTIAL_OPTIONAL.has(name)) return true;
  // s3 and b2 are the multi-var cases: the factory returns null unless every
  // one of their vars is set, which is exactly this list.
  return providerEnvVars(name, spec).every((envVar) => isSet(env, envVar));
}

/** Every provider name the CLI knows, in `PROVIDERS` order. */
export function providerNames(): string[] {
  return Object.keys(PROVIDERS);
}
