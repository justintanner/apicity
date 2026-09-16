#!/usr/bin/env node
import { runMain } from "./main.js";

runMain(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error("[apicity] fatal:", err);
    process.exit(7);
  }
);
