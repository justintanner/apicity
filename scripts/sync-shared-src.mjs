#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  SCHEMA_FRAGMENT_EXCLUDED,
  sharedSrcEntries,
} from "./lib/shared-src-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const check = process.argv.includes("--check");

function toRepoPath(relPath) {
  return path.join(REPO_ROOT, relPath);
}

function providerNameFromTarget(target) {
  const parts = target.split("/");
  return parts[2] ?? "";
}

function validateManifest() {
  const seenTargets = new Map();
  const errors = [];

  for (const entry of sharedSrcEntries) {
    if (!entry.id) {
      errors.push("entry is missing id");
    }
    if (!entry.source) {
      errors.push(`${entry.id}: missing source`);
    }
    if (entry.class !== "helper" && entry.class !== "schema-fragment") {
      errors.push(`${entry.id}: invalid class ${entry.class}`);
    }
    if (!Array.isArray(entry.targets) || entry.targets.length === 0) {
      errors.push(`${entry.id}: missing targets`);
    }
    if (entry.class === "schema-fragment") {
      for (const target of entry.targets ?? []) {
        const providerName = providerNameFromTarget(target);
        if (SCHEMA_FRAGMENT_EXCLUDED.includes(providerName)) {
          errors.push(
            `${entry.id}: schema fragment target is excluded: ${target}`
          );
        }
      }
    }

    for (const target of entry.targets ?? []) {
      const previous = seenTargets.get(target);
      if (previous) {
        errors.push(`${entry.id}: duplicate target ${target} in ${previous}`);
      } else {
        seenTargets.set(target, entry.id);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

function applyTransforms(source, transforms = []) {
  let result = source;
  for (const transform of transforms) {
    if (typeof transform.find !== "string") {
      throw new Error("transform find must be a string");
    }
    if (typeof transform.replace !== "string") {
      throw new Error("transform replace must be a string");
    }
    result = result.split(transform.find).join(transform.replace);
  }
  return result;
}

function generatedHeader(source) {
  return [
    `// AUTO-GENERATED from ${source}; do not edit.`,
    "// Edit the canonical file and run `pnpm run gen:shared`.",
    "",
  ].join("\n");
}

async function readUtf8(relPath) {
  return await fs.readFile(toRepoPath(relPath), "utf8");
}

async function main() {
  validateManifest();

  const stale = [];
  let written = 0;

  for (const entry of sharedSrcEntries) {
    let source;
    try {
      source = await readUtf8(entry.source);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        throw new Error(`${entry.id}: missing source ${entry.source}`);
      }
      throw err;
    }

    const transformed = applyTransforms(source, entry.transforms);
    const expected = generatedHeader(entry.source) + transformed;

    for (const target of entry.targets) {
      let current = "";
      try {
        current = await readUtf8(target);
      } catch (err) {
        if (!err || err.code !== "ENOENT") {
          throw err;
        }
      }

      if (current === expected) {
        continue;
      }

      stale.push(target);
      if (!check) {
        await fs.mkdir(path.dirname(toRepoPath(target)), { recursive: true });
        await fs.writeFile(toRepoPath(target), expected);
        written += 1;
      }
    }
  }

  if (check && stale.length > 0) {
    for (const target of stale) {
      console.error(`stale: ${target}`);
    }
    process.exitCode = 1;
    return;
  }

  if (check) {
    console.log("Shared provider source is up to date.");
  } else if (written === 0) {
    console.log("Shared provider source already up to date.");
  } else {
    console.log(`Updated ${written} shared provider source file(s).`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
