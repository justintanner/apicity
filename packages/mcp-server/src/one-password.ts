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
  concurrency?: number;
}

const DEFAULT_OP_READ_CONCURRENCY = 6;

export async function fillOnePasswordEnv(
  opts: OnePasswordEnvOptions
): Promise<void> {
  const env = opts.env ?? process.env;
  const readSecret = opts.readSecret ?? readOnePasswordSecret;
  const providerEnvVars = getProviderEnvVars(opts.enabledProviders);
  const required = opts.enabledProviders !== undefined;
  const missingEnvVars = providerEnvVars.filter(
    (envVar) => !hasResolvedEnvValue(env[envVar])
  );
  const concurrency = normalizeConcurrency(
    opts.concurrency ?? DEFAULT_OP_READ_CONCURRENCY,
    missingEnvVars.length
  );
  let next = 0;
  let firstError: Error | undefined;

  async function worker(): Promise<void> {
    while (next < missingEnvVars.length) {
      const envVar = missingEnvVars[next++];
      try {
        env[envVar] = await readSecret(onePasswordRef(opts.vault, envVar));
      } catch (err) {
        const wrapped = wrapReadError(err, opts.vault, envVar, required);
        if (wrapped && !firstError) firstError = wrapped;
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      await worker();
    })
  );

  if (firstError) throw firstError;
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

function normalizeConcurrency(concurrency: number, jobCount: number): number {
  if (jobCount === 0) return 0;
  if (!Number.isFinite(concurrency) || concurrency < 1) return 1;
  return Math.min(Math.floor(concurrency), jobCount);
}

function wrapReadError(
  err: unknown,
  vault: string,
  envVar: string,
  required: boolean
): Error | undefined {
  if (!required && isMissingOnePasswordItem(err)) return undefined;
  const ref = onePasswordRef(vault, envVar);
  return new Error(
    `Missing 1Password secret for ${envVar}. Expected ${ref}. ` +
      `${errorMessage(err)}`
  );
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
