// Smoke-test: spawn apicity-mcp over stdio, list tools, summarize.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["/Users/jwt/apicity/packages/mcp-server/dist/src/bin.js"],
  env: {
    ...process.env,
    OPENAI_API_KEY: "smoke-fake",
    ANTHROPIC_API_KEY: "smoke-fake",
    XAI_API_KEY: "smoke-fake",
    FIREWORKS_API_KEY: "smoke-fake",
    FAL_API_KEY: "smoke-fake",
    KIE_API_KEY: "smoke-fake",
    KIMI_CODING_API_KEY: "smoke-fake",
    DASHSCOPE_API_KEY: "smoke-fake",
    ELEVENLABS_API_KEY: "smoke-fake",
    X_ACCESS_TOKEN: "smoke-fake",
    IG_ACCESS_TOKEN: "smoke-fake",
  },
});

const client = new Client(
  { name: "smoke", version: "0.0.1" },
  { capabilities: {} }
);
await client.connect(transport);

const tools = await client.listTools();
console.log(`✓ Registered ${tools.tools.length} tools`);

const byProvider = new Map();
for (const t of tools.tools) {
  const p = t.name.split("_")[0];
  byProvider.set(p, (byProvider.get(p) ?? 0) + 1);
}
console.log("By provider:");
for (const [p, n] of [...byProvider.entries()].sort()) {
  console.log(`  ${p}: ${n}`);
}

for (const name of [
  "openai_post_v1_chat_completions",
  "openai_post_v1_audio_speech",
  "anthropic_post_v1_messages",
  "fal_post_bytedance_seedance2p0_textToVideo",
  "free_post_tmpfiles_api_v1_upload",
  "kie_post_claude_v1_messages",
]) {
  const t = tools.tools.find((x) => x.name === name);
  if (!t) {
    console.log(`\nMISSING: ${name}`);
    continue;
  }
  console.log(`\n${name}`);
  console.log("  description:", t.description.split("\n")[0]);
  console.log(
    "  inputSchema keys:",
    Object.keys(t.inputSchema?.properties ?? {})
      .slice(0, 6)
      .join(", ") || "(none)"
  );
}

await client.close();
process.exit(0);
