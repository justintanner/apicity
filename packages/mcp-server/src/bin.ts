#!/usr/bin/env node
import { runCli } from "./cli.js";

runCli().catch((err) => {
  console.error("[apicity-mcp] fatal:", err);
  process.exit(1);
});
