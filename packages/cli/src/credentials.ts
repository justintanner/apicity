import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  applyEnvFileEntries,
  envFileReferences,
  isOpReference,
  parseEnvFile,
} from "./env-file.js";
import { CliError } from "./errors.js";
import { errorMessage } from "./internal.js";
import {
  fillOnePasswordEnv,
  resolveOnePasswordReferences,
  type OpInject,
  type OpListItemTitles,
  type OpRead,
} from "./one-password.js";
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
 * Is this provider configured?
 *
 * Without `sources`, the question is the one `instantiateProvider` answers:
 * would it build a provider object from this environment? This mirrors that
 * function's null conditions exactly, without importing a provider package,
 * and it is what the call path checks once credentials have resolved.
 *
 * With `sources`, the question is the one discovery and doctor answer:
 * does the CLI know where each credential comes from? A process value, an
 * env-file literal, an `op://` reference in either, or the vault convention
 * when a vault and a token are both configured, all count. Answering it reads
 * `sources` alone — no `op` is spawned and no provider is imported — so
 * `providers`, `commands` and `describe` stay offline, and whether the vault
 * really holds an item surfaces at call time and in `apicity doctor`.
 *
 * `envVar: ""` means the provider needs no credential at all — binance,
 * openligadb, openf1, free-media-upload, and polymarket, whose public market
 * data works unauthenticated and whose trading bundle is optional on top.
 */
export function isProviderConfigured(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
  sources?: CredentialSources
): boolean {
  const spec = PROVIDERS[name];
  if (!spec) return false;
  if (spec.envVar === "") return true;
  if (CREDENTIAL_OPTIONAL.has(name)) return true;
  // s3 and b2 are the multi-var cases: the factory returns null unless every
  // one of their vars is set, which is exactly this list.
  const envVars = providerEnvVars(name, spec);
  if (sources === undefined) {
    return envVars.every((envVar) => isSet(env, envVar));
  }
  if (sources.vault !== undefined && sources.token !== undefined) return true;
  return envVars.every(
    (envVar) =>
      isSet(sources.env, envVar) ||
      Object.prototype.hasOwnProperty.call(sources.references, envVar)
  );
}

/** Every provider name the CLI knows, in `PROVIDERS` order. */
export function providerNames(): string[] {
  return Object.keys(PROVIDERS);
}

/**
 * The credential flags, as `parseGlobalFlags` reads them off the line.
 */
export interface CredentialFlags {
  envFile?: string;
  opVault?: string;
  opToken?: string;
}

export interface ResolveCredentialsOptions {
  /** The provider this invocation addresses; only its variables are read. */
  provider: string;
  flags?: CredentialFlags;
  env?: NodeJS.ProcessEnv;
  /** Seam: the per-variable 1Password read, so a test never spawns `op`. */
  readSecret?: OpRead;
  /** Seam: the vault listing of the convention batch. */
  listItemTitles?: OpListItemTitles;
  /** Seam: the one `op inject` of a reference or convention batch. */
  injectSecrets?: OpInject;
}

/** The env file a call falls back to when no flag or variable names one. */
export function defaultEnvFilePath(
  env: NodeJS.ProcessEnv = process.env
): string {
  return join(env.HOME ?? homedir(), ".config", "apicity", ".env");
}

/** Where a command finds its env file. */
export interface EnvFileLocation {
  path: string;
  /**
   * True when `--env-file` or `APICITY_ENV_FILE` named it, so a call that
   * cannot read it fails; false for the default path, read only if present.
   */
  named: boolean;
}

/**
 * The env file a call loads, `setup 1password` writes and discovery reads:
 * `--env-file`, else a non-empty `APICITY_ENV_FILE`, else
 * `~/.config/apicity/.env`.
 */
export function locateEnvFile(
  env: NodeJS.ProcessEnv = process.env,
  flags: CredentialFlags = {}
): EnvFileLocation {
  const named = flags.envFile ?? env.APICITY_ENV_FILE;
  if (named !== undefined && named !== "") return { path: named, named: true };
  return { path: defaultEnvFilePath(env), named: false };
}

/** One 1Password setting, and where it was found. */
export interface CredentialSetting {
  /** As written: a token is never resolved when it is read here. */
  value: string;
  source: "flag" | "environment" | "env file";
}

/** Everything the CLI knows, offline, about where credentials come from. */
export interface CredentialSources {
  /** The env file a call would load, whether or not it could be read. */
  envFile: EnvFileLocation;
  /**
   * A copy of the environment with the env file's literals applied exactly
   * as a call applies them. The process environment is never touched.
   */
  env: NodeJS.ProcessEnv;
  /** The env file's `op://` references, first occurrence per variable. */
  references: Record<string, string>;
  vault?: CredentialSetting;
  token?: CredentialSetting;
}

/**
 * Read what a call would read, without doing anything a call does.
 *
 * It never throws, never exports into the environment, never spawns `op` and
 * imports no provider: an env file that is absent or unreadable contributes
 * nothing, and doctor's Env File row is where an unreadable one is reported.
 * `providers`, `commands`, `describe` and doctor all answer "configured" from
 * this, so the persisted setup counts everywhere it counts for a call.
 */
export function readCredentialSources(
  env: NodeJS.ProcessEnv = process.env,
  flags: CredentialFlags = {}
): CredentialSources {
  const envFile = locateEnvFile(env, flags);
  const entries = readEnvFileEntries(envFile.path);
  const merged: NodeJS.ProcessEnv = { ...env };
  applyEnvFileEntries(entries, merged);

  return {
    envFile,
    env: merged,
    references: envFileReferences(entries),
    vault: credentialSetting(flags.opVault, "APICITY_OP_VAULT", env, merged),
    token: credentialSetting(
      flags.opToken,
      "APICITY_OP_SERVICE_TOKEN",
      env,
      merged
    ),
  };
}

function readEnvFileEntries(path: string): Array<[string, string]> {
  try {
    return parseEnvFile(readFileSync(path, "utf8"));
  } catch {
    return [];
  }
}

/**
 * A setting the way a call picks it — the flag when one was given, else the
 * environment with the env file applied — labelled with where it came from.
 */
function credentialSetting(
  flag: string | undefined,
  name: string,
  env: NodeJS.ProcessEnv,
  merged: NodeJS.ProcessEnv
): CredentialSetting | undefined {
  const value = flag ?? merged[name];
  if (!value) return undefined;
  if (flag !== undefined) return { value, source: "flag" };
  return { value, source: env[name] === value ? "environment" : "env file" };
}

/**
 * Fill the environment with whatever the addressed provider needs. For each
 * of its variables the first source that has one wins:
 *
 * 1. a literal already set in the process;
 * 2. a literal in the env file;
 * 3. an `op://` reference, the process environment's before the env file's,
 *    all of them resolved in one `op inject` — with the configured token, or
 *    with `op`'s own sign-in when there is none;
 * 4. the vault convention `op://<vault>/<VAR>/password`, only when a vault
 *    and a token are both configured.
 *
 * References outside the addressed provider's variables are neither resolved
 * nor exported (ac-w7vzap OQ-003): no variable ever ends up holding a raw
 * reference the CLI read from a file.
 *
 * This is deliberately not a startup-time check that throws when neither an
 * env file nor op values are given: a call must work with nothing configured
 * at all (`apicity binance api.v3.time`, D-6, EX-06). Nothing is returned —
 * the environment is the result.
 */
export async function resolveCredentials(
  options: ResolveCredentialsOptions
): Promise<void> {
  const env = options.env ?? process.env;
  const flags = options.flags ?? {};

  const envFile = locateEnvFile(env, flags);
  let entries: Array<[string, string]> = [];
  if (envFile.named) {
    try {
      entries = parseEnvFile(readFileSync(envFile.path, "utf8"));
    } catch (cause) {
      throw new CliError(
        "usage",
        `--env-file ${envFile.path} could not be read: ${errorMessage(cause)}`,
        {
          hint: "check the --env-file path, or unset APICITY_ENV_FILE",
          cause,
        }
      );
    }
  } else if (existsSync(envFile.path)) {
    entries = parseEnvFile(readFileSync(envFile.path, "utf8"));
  }
  applyEnvFileEntries(entries, env);

  const vault = flags.opVault ?? env.APICITY_OP_VAULT;
  const token = resolveServiceToken(
    flags.opToken ?? env.APICITY_OP_SERVICE_TOKEN,
    env
  );
  // The vault convention needs both halves. A token alone is valid: it
  // authenticates `op://` references, which name their own vault.
  if (vault && !token) {
    throw new CliError(
      "usage",
      "--op-token is required when --op-vault is set."
    );
  }

  const fileReferences = envFileReferences(entries);
  const references: Record<string, string> = {};
  for (const envVar of providerEnvVars(options.provider)) {
    const value = env[envVar];
    if (value !== undefined && value !== "" && !isOpReference(value)) continue;
    const reference = isOpReference(value) ? value : fileReferences[envVar];
    if (reference !== undefined) references[envVar] = reference;
  }

  if (Object.keys(references).length > 0) {
    try {
      await resolveOnePasswordReferences({
        references,
        env,
        serviceAccountToken: token,
        injectSecrets: options.injectSecrets,
      });
    } catch (cause) {
      throw new CliError("auth", errorMessage(cause), {
        hint: "check the op:// reference and op's sign-in; see apicity doctor",
        cause,
      });
    }
  }

  if (!vault || !token) return;
  try {
    await fillOnePasswordEnv({
      vault,
      serviceAccountToken: token,
      // A call reads one provider's variables. Reading all 28 would cost a
      // subprocess per variable for endpoints that need none of them.
      enabledProviders: [options.provider],
      env,
      readSecret: options.readSecret,
      listItemTitles: options.listItemTitles,
      injectSecrets: options.injectSecrets,
    });
  } catch (cause) {
    throw new CliError("auth", errorMessage(cause), {
      hint: `check op://${vault}/<VAR>/password for ${options.provider}`,
      cause,
    });
  }
}

/**
 * Accept a service-account token in four forms: a literal token, `env:VAR`,
 * `$VAR`, and a bare variable name.
 *
 * This is the only implementation; `cli-credentials.test.ts` pins each form to
 * its resolved value.
 */
export function resolveServiceToken(
  tokenOrRef: string | undefined,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  if (!tokenOrRef) return undefined;
  if (tokenOrRef.startsWith("env:")) {
    return requiredEnv(tokenOrRef.slice(4), env);
  }
  if (tokenOrRef.startsWith("$")) {
    return requiredEnv(tokenOrRef.slice(1), env);
  }
  return env[tokenOrRef] ?? tokenOrRef;
}

/**
 * The variable names to name in an `auth` hint: "S3_ACCESS_KEY_ID and
 * S3_SECRET_ACCESS_KEY" reads as an instruction, "S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY" reads as a list the caller has to interpret.
 */
export function describeEnvVars(name: string): string {
  const vars = providerEnvVars(name);
  if (vars.length === 0) return "no credential";
  if (vars.length === 1) return vars[0];
  return `${vars.slice(0, -1).join(", ")} and ${vars[vars.length - 1]}`;
}

function requiredEnv(name: string, env: NodeJS.ProcessEnv): string {
  if (!name) {
    throw new CliError("usage", "--op-token env reference is empty.");
  }
  const value = env[name];
  if (!value) {
    throw new CliError("usage", `--op-token env reference ${name} is not set.`);
  }
  return value;
}
