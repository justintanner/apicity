#!/usr/bin/env node
import { runMcp } from "./mcp/cli.js";

console.error('apicity-mcp is deprecated; use "apicity mcp"');
runMcp(process.argv.slice(2)).catch((err) => {
  console.error("[apicity-mcp] fatal:", err);
  process.exit(1);
});
