import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const transport = new StdioClientTransport({
  command: fileURLToPath(
    new URL("./launch-with-1password.sh", import.meta.url)
  ),
});
// Pin the 2026-07-28 era: the server rejects a legacy opening, and the v2
// client's default mode is `'legacy'`. See scripts/smoke.mjs for why not
// `'auto'`.
const client = new Client(
  { name: "smoke", version: "0.0.1" },
  {
    capabilities: {},
    versionNegotiation: { mode: { pin: "2026-07-28" } },
  }
);
await client.connect(transport);
const tools = await client.listTools();
console.log(`✓ ${tools.tools.length} tools registered`);
const r = await client.callTool({
  name: "xai_post_v1_tokenizeText",
  arguments: { model: "grok-3", text: "Hello, world!" },
});
console.log("✓ tokenizeText:", r.content[0].text.slice(0, 80), "...");
await client.close();
process.exit(0);
