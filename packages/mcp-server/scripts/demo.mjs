// Live demo: spawn apicity-mcp under `op run` (1Password-resolved env), call
// one zero-cost endpoint per available provider, print the result.
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

// Run me via:
//   op run --env-file=.env -- node packages/mcp-server/scripts/demo.mjs
// `op run` resolves the secrets into THIS process's env, then we pass them
// into the spawned MCP server's env. We deliberately don't wrap the spawn in
// `op run` because op buffers stdio and breaks the MCP framing.
const serverBin = fileURLToPath(new URL("../dist/src/bin.js", import.meta.url));

const transport = new StdioClientTransport({
  command: "node",
  args: [serverBin],
  env: { ...process.env },
});

// Pin the 2026-07-28 era: the server rejects a legacy opening, and the v2
// client's default mode is `'legacy'`. See scripts/smoke.mjs for why not
// `'auto'`.
const client = new Client(
  { name: "demo", version: "0.0.1" },
  {
    capabilities: {},
    versionNegotiation: { mode: { pin: "2026-07-28" } },
  }
);
await client.connect(transport);

const tools = await client.listTools();
console.log(`✓ Connected — ${tools.tools.length} tools available\n`);

// xai-only demo. All free: model listings, tokenizer.
const calls = [
  { name: "xai_get_v1_languageModels", args: {} },
  { name: "xai_get_v1_imageGenerationModels", args: {} },
  {
    name: "xai_post_v1_tokenizeText",
    args: { model: "grok-3", text: "Hello, world!" },
  },
];

for (const { name, args } of calls) {
  if (!tools.tools.find((t) => t.name === name)) {
    console.log(`— ${name}: not registered (likely missing API key), skipping`);
    continue;
  }
  console.log(`→ Calling ${name}`);
  try {
    const res = await client.callTool({ name, arguments: args });
    const txt = res.content?.[0]?.text ?? "(no text)";
    const parsed = safeParse(txt);
    if (parsed && Array.isArray(parsed.models)) {
      console.log(`  ✓ ${parsed.models.length} models`);
      console.log(
        "  first 3:",
        parsed.models
          .slice(0, 3)
          .map((m) => m.id ?? m.display_name ?? m.name ?? "?")
      );
    } else if (parsed && Array.isArray(parsed.data)) {
      console.log(`  ✓ ${parsed.data.length} entries`);
      console.log(
        "  first 3:",
        parsed.data.slice(0, 3).map((m) => m.id ?? m.name ?? "?")
      );
    } else if (parsed && Array.isArray(parsed.token_ids)) {
      console.log(`  ✓ ${parsed.token_ids.length} tokens`);
      console.log("  token_ids:", parsed.token_ids);
      if (parsed.tokens) console.log("  tokens:", parsed.tokens);
    } else {
      console.log("  ↳", txt.slice(0, 300));
    }
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
  }
  console.log();
}

await client.close();
process.exit(0);

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
