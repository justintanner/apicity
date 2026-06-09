#!/usr/bin/env node

import { readFileSync } from "node:fs";

const envFile = readFileSync(".env", "utf8");
const assignments = envFile
  .split(/\r?\n/)
  .map((line) => line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/))
  .filter(Boolean)
  .map((match) => ({
    name: match[1],
    rawValue: match[2],
  }));

const literalAssignments = assignments.filter(
  ({ rawValue }) => !/^op:\/\/Apicity\/[^/]+\/password$/.test(rawValue)
);

if (literalAssignments.length > 0) {
  console.error(
    "Non-1Password .env assignments: " +
      literalAssignments.map(({ name }) => name).join(", ")
  );
  process.exit(1);
}

const names = assignments.map(({ name }) => name);

const unresolved = names.filter((name) => {
  const value = process.env[name];
  return !value || value.startsWith("op://");
});

if (unresolved.length > 0) {
  console.error(`1Password did not resolve: ${unresolved.join(", ")}`);
  process.exit(1);
}

console.log("1Password OK - all .env secret references resolved");
