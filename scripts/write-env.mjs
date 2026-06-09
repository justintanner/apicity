#!/usr/bin/env node

import { chmodSync, readFileSync, writeFileSync } from "node:fs";

const envTemplate = readFileSync(".env.tpl", "utf8");
const lines = envTemplate.split(/\r?\n/);

const quoteDotenvValue = (value) =>
  `"${value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"')}"`;

const output = lines
  .map((line) => {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);

    if (!match) {
      return line;
    }

    const [, name, rawValue] = match;
    const value = rawValue.startsWith("op://") ? process.env[name] : rawValue;

    if (value === undefined) {
      throw new Error(`Missing resolved value for ${name}`);
    }

    return `${name}=${quoteDotenvValue(value)}`;
  })
  .join("\n");

writeFileSync(".env", output);
chmodSync(".env", 0o600);
console.log("Wrote .env from .env.tpl");
