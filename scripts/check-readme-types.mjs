#!/usr/bin/env node

/**
 * Type-check every TypeScript block in the generated provider READMEs and in
 * `docs/middleware.md` against the provider sources.
 *
 *   node scripts/check-readme-types.mjs                # every covered document
 *   node scripts/check-readme-types.mjs <path> [...]   # only these documents
 *
 * Exits 1 when any block fails to compile, printing each diagnostic against
 * its README line. The rules that turn README blocks into modules live in
 * `scripts/lib/readme-types.mjs`. It reads source, not `dist/`, so it runs
 * before the build, next to `doc-gen:check` (`ac-1d2qnp`).
 */

import fs from "node:fs";
import path from "node:path";
import {
  checkReadmeTypes,
  formatProblem,
  readReadmeTypeDocuments,
} from "./lib/readme-types.mjs";
import { REPO_ROOT } from "./lib/provider-inventory.mjs";

function readDocuments(args) {
  if (args.length === 0) return readReadmeTypeDocuments();
  return args.map((arg) => {
    const absolute = path.resolve(arg);
    return {
      path: path.relative(REPO_ROOT, absolute),
      text: fs.readFileSync(absolute, "utf8"),
    };
  });
}

function count(n, noun) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

const started = Date.now();
const documents = readDocuments(process.argv.slice(2));
const { blocks, problems } = checkReadmeTypes({ documents });
const seconds = ((Date.now() - started) / 1000).toFixed(1);
const scope =
  `${count(blocks, "TypeScript block")} across ` +
  `${count(documents.length, "document")}`;

if (problems.length > 0) {
  for (const problem of problems) console.error(formatProblem(problem));
  console.error(
    `check:readme-types: ${count(problems.length, "type error")} in ` +
      `${scope} (${seconds}s)`
  );
  process.exitCode = 1;
} else {
  console.log(`check:readme-types: ${scope} type-check (${seconds}s)`);
}
