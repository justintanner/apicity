import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command:
    "/Users/jwt/apicity/packages/mcp-server/scripts/launch-with-1password.sh",
});
const client = new Client(
  { name: "smoke", version: "0.0.1" },
  { capabilities: {} }
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
