import { readFileSync } from "node:fs";
import { startServer } from "./server.js";
import { fillOnePasswordEnv } from "./one-password.js";

export interface ParsedArgs {
  outputDir?: string;
  enabledProviders?: string[];
  paygateSecretFile?: string;
  opVault?: string;
  help: boolean;
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
    } else {
      console.error(`[apicity-mcp] unknown arg: ${a}`);
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

export function printHelp(): void {
  console.error(
    [
      "apicity-mcp — MCP server exposing every @apicity provider endpoint as a tool.",
      "",
      "Usage:",
      "  apicity-mcp [--op-vault <vault>] [--output-dir <path>] [--providers <csv>]",
      "",
      "Options:",
      "  --op-vault <vault>   Resolve missing provider credentials from 1Password.",
      "                       Looks for op://<vault>/<ENV_VAR>/password.",
      "                       Can also be set with APICITY_OP_VAULT.",
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

  const opVault = resolveOpVault(args.opVault);
  if (opVault) {
    await fillOnePasswordEnv({
      vault: opVault,
      enabledProviders: args.enabledProviders,
    });
  }

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
