import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { loadEnvFile } from "./env-file.js";
import { CliError } from "./errors.js";
import { errorMessage } from "./internal.js";
import { fillOnePasswordEnv, type OpRead } from "./one-password.js";
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
  /** Seam: the 1Password read, so a test never spawns `op`. */
  readSecret?: OpRead;
}

/** The env file a call falls back to when no flag or variable names one. */
export function defaultEnvFilePath(
  env: NodeJS.ProcessEnv = process.env
): string {
  return join(env.HOME ?? homedir(), ".config", "apicity", ".env");
}

/**
 * Fill the environment with whatever the addressed provider needs, in the
 * precedence REQ-006 fixes: variables already set in the process win, an env
 * file fills the rest, and 1Password fills what is still missing — but only
 * when a vault and a token were configured.
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

  const named = flags.envFile ?? env.APICITY_ENV_FILE;
  if (named !== undefined && named !== "") {
    try {
      loadEnvFile(named, env);
    } catch (cause) {
      throw new CliError("usage", errorMessage(cause), {
        hint: "check the --env-file path, or unset APICITY_ENV_FILE",
        cause,
      });
    }
  } else {
    const fallback = defaultEnvFilePath(env);
    if (existsSync(fallback)) loadEnvFile(fallback, env);
  }

  const vault = flags.opVault ?? env.APICITY_OP_VAULT;
  const token = resolveServiceToken(
    flags.opToken ?? env.APICITY_OP_SERVICE_TOKEN,
    env
  );
  if (!vault && !token) return;
  if (!vault) {
    throw new CliError(
      "usage",
      "--op-vault is required when --op-token is set."
    );
  }
  if (!token) {
    throw new CliError(
      "usage",
      "--op-token is required when --op-vault is set."
    );
  }

  try {
    await fillOnePasswordEnv({
      vault,
      serviceAccountToken: token,
      // A call reads one provider's variables. Reading all 28 would cost a
      // subprocess per variable for endpoints that need none of them.
      enabledProviders: [options.provider],
      env,
      readSecret: options.readSecret,
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
