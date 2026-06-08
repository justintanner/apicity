import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { PROVIDERS } from "./providers.js";

const execFileAsync = promisify(execFile);

export type OpRead = (ref: string) => Promise<string>;
export type OpListItemTitles = (vault: string) => Promise<string[]>;
export type OpInject = (template: string) => Promise<string>;

export interface OnePasswordEnvOptions {
  vault: string;
  serviceAccountToken: string;
  enabledProviders?: string[];
  env?: NodeJS.ProcessEnv;
  readSecret?: OpRead;
  listItemTitles?: OpListItemTitles;
  injectSecrets?: OpInject;
  concurrency?: number;
  timeoutMs?: number;
}

const DEFAULT_OP_READ_CONCURRENCY = 6;
const DEFAULT_OP_TIMEOUT_MS = 10_000;

export async function fillOnePasswordEnv(
  opts: OnePasswordEnvOptions
): Promise<void> {
  const env = opts.env ?? process.env;
  const providerEnvVars = getProviderEnvVars(opts.enabledProviders);
  const required = opts.enabledProviders !== undefined;
  const missingEnvVars = providerEnvVars.filter(
    (envVar) => !hasResolvedEnvValue(env[envVar])
  );

  if (missingEnvVars.length === 0) return;

  if (!opts.readSecret) {
    await fillOnePasswordEnvBatch(opts, env, missingEnvVars, required);
    return;
  }

  const readSecret = opts.readSecret;
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

export async function readOnePasswordSecret(
  ref: string,
  timeoutMs = DEFAULT_OP_TIMEOUT_MS,
  serviceAccountToken?: string
): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "op",
      ["read", "--no-newline", ref],
      { timeout: timeoutMs, env: opEnv(serviceAccountToken) }
    );
    return stdout.trim();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("1Password CLI `op` was not found in PATH.");
    }
    throw err;
  }
}

export async function listOnePasswordItemTitles(
  vault: string,
  timeoutMs = DEFAULT_OP_TIMEOUT_MS,
  serviceAccountToken?: string
): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync(
      "op",
      ["item", "list", "--vault", vault, "--format", "json"],
      {
        timeout: timeoutMs,
        maxBuffer: 2 * 1024 * 1024,
        env: opEnv(serviceAccountToken),
      }
    );
    const parsed = JSON.parse(stdout) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error(
        "Expected `op item list --format json` to return an array."
      );
    }
    return parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) return undefined;
        const title = (item as Record<string, unknown>).title;
        return typeof title === "string" ? title : undefined;
      })
      .filter((title): title is string => title !== undefined);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("1Password CLI `op` was not found in PATH.");
    }
    throw err;
  }
}

export async function injectOnePasswordSecrets(
  template: string,
  timeoutMs = DEFAULT_OP_TIMEOUT_MS,
  serviceAccountToken?: string
): Promise<string> {
  return await runOpWithInput(
    ["inject", "--in-file", "/dev/stdin"],
    template,
    timeoutMs,
    serviceAccountToken
  );
}

async function fillOnePasswordEnvBatch(
  opts: OnePasswordEnvOptions,
  env: NodeJS.ProcessEnv,
  missingEnvVars: string[],
  required: boolean
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_OP_TIMEOUT_MS;
  const listItemTitles =
    opts.listItemTitles ??
    ((vault: string) =>
      listOnePasswordItemTitles(vault, timeoutMs, opts.serviceAccountToken));
  const injectSecrets =
    opts.injectSecrets ??
    ((template: string) =>
      injectOnePasswordSecrets(template, timeoutMs, opts.serviceAccountToken));
  const itemTitles = new Set(await listItemTitles(opts.vault));
  const availableEnvVars = missingEnvVars.filter((envVar) =>
    itemTitles.has(envVar)
  );
  const missingItems = missingEnvVars.filter(
    (envVar) => !itemTitles.has(envVar)
  );

  if (required && missingItems.length > 0) {
    throw new Error(
      `Missing 1Password secret for ${missingItems[0]}. Expected ` +
        `${onePasswordRef(opts.vault, missingItems[0])}.`
    );
  }
  if (availableEnvVars.length === 0) return;

  const injected = await injectSecrets(
    availableEnvVars
      .map((envVar) => `${envVar}={{ ${onePasswordRef(opts.vault, envVar)} }}`)
      .join("\n")
  );
  const values = parseInjectedEnv(injected);
  for (const envVar of availableEnvVars) {
    const value = values[envVar];
    if (hasResolvedEnvValue(value)) env[envVar] = value;
    else if (required) {
      throw new Error(
        `Missing 1Password secret for ${envVar}. Expected ` +
          `${onePasswordRef(opts.vault, envVar)}.`
      );
    }
  }
}

function parseInjectedEnv(injected: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of injected.split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    values[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return values;
}

async function runOpWithInput(
  args: string[],
  input: string,
  timeoutMs: number,
  serviceAccountToken?: string
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn("op", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: opEnv(serviceAccountToken),
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("1Password CLI `op` was not found in PATH."));
        return;
      }
      reject(err);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(
          new Error(
            `1Password CLI \`op ${args.join(" ")}\` timed out after ` +
              `${timeoutMs}ms.`
          )
        );
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() ||
              `1Password CLI \`op ${args.join(" ")}\` exited with ` +
                `${signal ?? code}.`
          )
        );
        return;
      }
      resolve(stdout);
    });
    child.stdin.end(input);
  });
}

function opEnv(serviceAccountToken: string | undefined): NodeJS.ProcessEnv {
  if (!serviceAccountToken) return process.env;
  return {
    ...process.env,
    OP_SERVICE_ACCOUNT_TOKEN: serviceAccountToken,
  };
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
