#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { validateOpEnv } from "./lib/check-op.mjs";

const envFile = readFileSync(".env", "utf8");
const result = validateOpEnv(envFile);

if (!result.ok) {
  console.error(result.message);
  process.exit(1);
}

console.log(result.message);
