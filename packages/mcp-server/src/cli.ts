import { readFileSync } from "node:fs";
import { startServer } from "./server.js";
import { fillOnePasswordEnv } from "./one-password.js";

export interface ParsedArgs {
  outputDir?: string;
  enabledProviders?: string[];
  paygateSecretFile?: string;
  opVault?: string;
  opServiceToken?: string;
  help: boolean;
}

export interface ResolvedOnePasswordOptions {
  vault: string;
  serviceAccountToken: string;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--output-dir") out.outputDir = argv[++i];
    else if (a.startsWith("--output-dir=")) out.outputDir = a.slice(13);
    else if (a === "--providers") {
      out.enabledProviders = parseProviderCsv(argv[++i]);
    } else if (a.startsWith("--providers=")) {
      out.enabledProviders = parseProviderCsv(a.slice(12));
    } else if (a === "--paygate-secret-file") {
      out.paygateSecretFile = argv[++i];
    } else if (a.startsWith("--paygate-secret-file=")) {
      out.paygateSecretFile = a.slice(22);
    } else if (a === "--op-vault") {
      out.opVault = argv[++i];
    } else if (a.startsWith("--op-vault=")) {
      out.opVault = a.slice(11);
    } else if (a === "--op-service-token") {
      out.opServiceToken = argv[++i];
    } else if (a.startsWith("--op-service-token=")) {
      out.opServiceToken = a.slice(19);
    } else {
      throw new Error(`unknown arg: ${a}`);
    }
  }
  return out;
}

export function resolveOutputDir(
  explicitOutputDir?: string,
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd()
): string {
  return explicitOutputDir ?? env.CLAUDE_PROJECT_DIR ?? cwd;
}

export function resolveOpVault(
  explicitOpVault?: string,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  return explicitOpVault ?? env.APICITY_OP_VAULT;
}

export function resolveOpServiceToken(
  explicitOpServiceToken?: string,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  const tokenOrRef = explicitOpServiceToken ?? env.APICITY_OP_SERVICE_TOKEN;
  if (!tokenOrRef) return undefined;

  if (tokenOrRef.startsWith("env:")) {
    return resolveRequiredEnv(tokenOrRef.slice(4), "--op-service-token", env);
  }
  if (tokenOrRef.startsWith("$")) {
    return resolveRequiredEnv(tokenOrRef.slice(1), "--op-service-token", env);
  }
  return env[tokenOrRef] ?? tokenOrRef;
}

export function resolveRequiredOnePasswordOptions(
  args: Pick<ParsedArgs, "opVault" | "opServiceToken">,
  env: NodeJS.ProcessEnv = process.env
): ResolvedOnePasswordOptions {
  const vault = resolveOpVault(args.opVault, env);
  if (!vault) {
    throw new Error("--op-vault is required.");
  }
  const serviceAccountToken = resolveOpServiceToken(args.opServiceToken, env);
  if (!serviceAccountToken) {
    throw new Error("--op-service-token is required.");
  }
  return { vault, serviceAccountToken };
}

export function printHelp(): void {
  console.error(
    [
      "apicity-mcp — MCP server exposing every @apicity provider endpoint as a tool.",
      "",
      "Usage:",
      "  apicity-mcp --op-vault <vault> --op-service-token <token|env:VAR>",
      "              [--output-dir <path>] [--providers <csv>]",
      "",
      "Options:",
      "  --op-vault <vault>   Required. Resolve missing provider credentials from 1Password.",
      "                       Looks for op://<vault>/<ENV_VAR>/password.",
      "                       Can also be set with APICITY_OP_VAULT.",
      "  --op-service-token <token|env:VAR>",
      "                       Required. Use a 1Password service-account token for",
      "                       non-interactive credential reads. Literal tokens, env:VAR,",
      "                       $VAR, or an existing env var name are accepted.",
      "                       Can also be set with",
      "                       APICITY_OP_SERVICE_TOKEN.",
      "  --output-dir <path>  Directory to write binary results and downloaded media URLs.",
      "                       Defaults to CLAUDE_PROJECT_DIR, then the current directory.",
      "  --providers <csv>    Comma-separated provider allow-list (e.g. openai,xai,anthropic).",
      "                       Defaults to every provider with its env var set.",
      "  --paygate-secret-file <path>  File holding the shared HMAC secret used to verify",
      "                       OTPs for paid endpoints (e.g. kie createTask). The server only",
      "                       verifies OTPs; operators mint them out-of-band with apicity-paygate.",
      "",
      "Credentials are read from env vars: OPENAI_API_KEY, XAI_API_KEY, ANTHROPIC_API_KEY,",
      "FIREWORKS_API_KEY, FAL_API_KEY, GOOGLE_API_KEY, KIE_API_KEY,",
      "KIMI_CODING_API_KEY, DASHSCOPE_API_KEY, ELEVENLABS_API_KEY,",
      "X_ACCESS_TOKEN, IG_ACCESS_TOKEN, YOUTUBE_ACCESS_TOKEN, TELEGRAM_BOT_KEY.",
      "The 'free-media-upload' provider needs none.",
    ].join("\n")
  );
}

export async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }

  const onePassword = resolveRequiredOnePasswordOptions(args);
  await fillOnePasswordEnv({
    vault: onePassword.vault,
    enabledProviders: args.enabledProviders,
    serviceAccountToken: onePassword.serviceAccountToken,
  });

  const paygateSecret = args.paygateSecretFile
    ? readFileSync(args.paygateSecretFile, "utf8").trim()
    : undefined;

  await startServer({
    outputDir: resolveOutputDir(args.outputDir),
    enabledProviders: args.enabledProviders,
    paygateSecret,
  });
}

function parseProviderCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean);
}

function resolveRequiredEnv(
  name: string,
  source: string,
  env: NodeJS.ProcessEnv
): string {
  if (!name) {
    throw new Error(`${source} env reference is empty.`);
  }
  const value = env[name];
  if (!value) {
    throw new Error(`${source} env reference ${name} is not set.`);
  }
  return value;
}
