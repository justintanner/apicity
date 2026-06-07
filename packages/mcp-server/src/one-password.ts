import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PROVIDERS } from "./providers.js";

const execFileAsync = promisify(execFile);

export type OpRead = (ref: string) => Promise<string>;

export interface OnePasswordEnvOptions {
  vault: string;
  enabledProviders?: string[];
  env?: NodeJS.ProcessEnv;
  readSecret?: OpRead;
}

export async function fillOnePasswordEnv(
  opts: OnePasswordEnvOptions
): Promise<void> {
  const env = opts.env ?? process.env;
  const readSecret = opts.readSecret ?? readOnePasswordSecret;
  const providerEnvVars = getProviderEnvVars(opts.enabledProviders);
  const required = opts.enabledProviders !== undefined;

  for (const envVar of providerEnvVars) {
    if (hasResolvedEnvValue(env[envVar])) continue;

    const ref = onePasswordRef(opts.vault, envVar);
    try {
      env[envVar] = await readSecret(ref);
    } catch (err) {
      if (!required && isMissingOnePasswordItem(err)) continue;
      throw new Error(
        `Missing 1Password secret for ${envVar}. Expected ${ref}. ` +
          `${errorMessage(err)}`
      );
    }
  }
}

export function getProviderEnvVars(enabledProviders?: string[]): string[] {
  const envVars: string[] = [];
  const providers = enabledProviders ?? Object.keys(PROVIDERS);

  for (const provider of providers) {
    const spec = PROVIDERS[provider];
    if (!spec) {
      throw new Error(`Unknown provider in --providers: ${provider}`);
    }
    if (spec.envVar && !envVars.includes(spec.envVar)) {
      envVars.push(spec.envVar);
    }
  }

  return envVars;
}

export function onePasswordRef(vault: string, envVar: string): string {
  return `op://${vault}/${envVar}/password`;
}

export async function readOnePasswordSecret(ref: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("op", ["read", "--no-newline", ref]);
    return stdout.trim();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("1Password CLI `op` was not found in PATH.");
    }
    throw err;
  }
}

function hasResolvedEnvValue(value: string | undefined): boolean {
  return value !== undefined && value !== "" && !value.startsWith("op://");
}

function isMissingOnePasswordItem(err: unknown): boolean {
  const msg = errorMessage(err).toLowerCase();
  return (
    msg.includes("isn't an item") ||
    msg.includes("is not an item") ||
    msg.includes("could not be found") ||
    msg.includes("not found") ||
    msg.includes("does not exist")
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    const stderr = (err as Error & { stderr?: unknown }).stderr;
    if (typeof stderr === "string" && stderr.trim()) return stderr.trim();
    return err.message;
  }
  return String(err);
}
