#!/usr/bin/env node
import { startServer } from "./server.js";

interface ParsedArgs {
  outputDir?: string;
  enabledProviders?: string[];
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--output-dir") out.outputDir = argv[++i];
    else if (a.startsWith("--output-dir=")) out.outputDir = a.slice(13);
    else if (a === "--providers") {
      out.enabledProviders = (argv[++i] ?? "").split(",").filter(Boolean);
    } else if (a.startsWith("--providers=")) {
      out.enabledProviders = a.slice(12).split(",").filter(Boolean);
    } else {
      console.error(`[apicity-mcp] unknown arg: ${a}`);
    }
  }
  return out;
}

function printHelp(): void {
  console.error(
    [
      "apicity-mcp — MCP server exposing every @apicity provider endpoint as a tool.",
      "",
      "Usage:",
      "  apicity-mcp [--output-dir <path>] [--providers <csv>]",
      "",
      "Options:",
      "  --output-dir <path>   Directory to write binary results and downloaded media URLs.",
      "                        If omitted, binaries are summarized and URLs are returned as-is.",
      "  --providers <csv>     Comma-separated provider allow-list (e.g. openai,xai,anthropic).",
      "                        Defaults to every provider with its env var set.",
      "",
      "Credentials are read from env vars: OPENAI_API_KEY, XAI_API_KEY, ANTHROPIC_API_KEY,",
      "FIREWORKS_API_KEY, FAL_API_KEY, KIE_API_KEY, KIMI_CODING_API_KEY, DASHSCOPE_API_KEY,",
      "ELEVENLABS_API_KEY, X_ACCESS_TOKEN, IG_ACCESS_TOKEN. The 'free' provider needs none.",
    ].join("\n")
  );
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printHelp();
  process.exit(0);
}

startServer({
  outputDir: args.outputDir,
  enabledProviders: args.enabledProviders,
}).catch((err) => {
  console.error("[apicity-mcp] fatal:", err);
  process.exit(1);
});
