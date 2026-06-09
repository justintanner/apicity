#!/usr/bin/env node

import { readFileSync } from "node:fs";

const envTemplate = readFileSync(".env.tpl", "utf8");
const names = envTemplate
  .split(/\r?\n/)
  .map((line) => line.match(/^([A-Z_][A-Z0-9_]*)=op:\/\//)?.[1])
  .filter(Boolean);

const unresolved = names.filter((name) => {
  const value = process.env[name];
  return !value || value.startsWith("op://");
});

if (unresolved.length > 0) {
  console.error(`1Password did not resolve: ${unresolved.join(", ")}`);
  process.exit(1);
}

console.log("1Password OK - all .env.tpl secret references resolved");
