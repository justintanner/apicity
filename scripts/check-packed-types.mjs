#!/usr/bin/env node

/**
 * Type-check the packed providers the way a node16 consumer sees them.
 *
 * Every provider is packed with `pnpm pack`, the tarballs are unpacked into a
 * scratch `node_modules/@apicity/`, and one consumer file imports every
 * `exports` subpath under `moduleResolution: node16` with `skipLibCheck: false`
 * and `@types/node`. Any declaration a consumer cannot resolve fails the check.
 *
 * `scripts/dist.mjs` appends `.js` to relative specifiers in emitted `.js` and
 * `.d.ts` files. It once rewrote only `from "./x"`, so 126 inline
 * `import("./x")` types and two `from "../types"` clauses shipped without an
 * extension, and a node16 consumer that checks library declarations failed
 * with 127 TS2835 errors (ac-0su9ax). The build, the tests-project typecheck
 * and the replay suite all read source, not packed declarations, so none of
 * them saw it.
 *
 * Run it after `pnpm run build`; it packs the built `dist/`. Runtime
 * dependencies and `@types/node` resolve through symlinks into the
 * repository's own `node_modules`, so no network is needed. Pass `--keep` to
 * leave the scratch directory in place for inspection.
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { REPO_ROOT, readProviderNames } from "./lib/provider-inventory.mjs";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const PACK_CONCURRENCY = 6;
const MAX_ERROR_LINES = 40;

class CheckFailure extends Error {}

// Throw rather than exit so the scratch directory is still removed.
function fail(message) {
  throw new CheckFailure(message);
}

/** Every `exports` key as an import specifier (`"."` is the bare name). */
function exportSpecifiers(manifest) {
  const keys = manifest.exports ? Object.keys(manifest.exports) : ["."];
  return keys.map((key) =>
    key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`
  );
}

async function packAll(providers, destination) {
  const queue = [...providers];
  const workers = Array.from({ length: PACK_CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const name = queue.shift();
      await execFileAsync("pnpm", ["pack", "--pack-destination", destination], {
        cwd: path.join(REPO_ROOT, "packages", "provider", name),
      });
    }
  });
  await Promise.all(workers);
}

function linkDependency(nodeModules, name) {
  const source = path.join(REPO_ROOT, "node_modules", name);
  if (!fs.existsSync(source)) {
    fail(`dependency ${name} is not installed at the repository root`);
  }
  const target = path.join(nodeModules, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.symlinkSync(source, target, "dir");
}

async function main() {
  const keep = process.argv.includes("--keep");
  const providers = readProviderNames();
  const unbuilt = providers.filter(
    (name) =>
      !fs.existsSync(
        path.join(REPO_ROOT, "packages", "provider", name, "dist", "src")
      )
  );
  if (unbuilt.length > 0) {
    fail(`no dist/ for ${unbuilt.join(", ")}; run pnpm run build first`);
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "apicity-packed-types-"));
  try {
    const tarballs = path.join(work, "tarballs");
    const nodeModules = path.join(work, "node_modules");
    fs.mkdirSync(tarballs);
    await packAll(providers, tarballs);
    const packed = fs.readdirSync(tarballs).filter((f) => f.endsWith(".tgz"));
    if (packed.length !== providers.length) {
      fail(
        `packed ${packed.length} tarballs for ${providers.length} providers`
      );
    }

    const specifiers = [];
    const dependencies = new Set(["@types/node"]);
    for (const [index, tarball] of packed.entries()) {
      const stage = path.join(work, "stage", String(index));
      fs.mkdirSync(stage, { recursive: true });
      await execFileAsync("tar", [
        "-xzf",
        path.join(tarballs, tarball),
        "-C",
        stage,
        "--strip-components=1",
      ]);
      const manifest = JSON.parse(
        fs.readFileSync(path.join(stage, "package.json"), "utf8")
      );
      const target = path.join(nodeModules, manifest.name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.renameSync(stage, target);
      specifiers.push(...exportSpecifiers(manifest));
      for (const name of Object.keys(manifest.dependencies ?? {})) {
        dependencies.add(name);
      }
    }
    for (const name of dependencies) linkDependency(nodeModules, name);

    const consumer = specifiers
      .map((spec, i) => `import * as m${i} from "${spec}";\nvoid m${i};`)
      .concat("export {};", "")
      .join("\n");
    fs.writeFileSync(path.join(work, "consumer.ts"), consumer);
    fs.writeFileSync(
      path.join(work, "package.json"),
      JSON.stringify({ name: "packed-types-consumer", type: "module" }) + "\n"
    );
    fs.writeFileSync(
      path.join(work, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "node16",
            moduleResolution: "node16",
            strict: true,
            noEmit: true,
            skipLibCheck: false,
            types: ["node"],
          },
          files: ["consumer.ts"],
        },
        null,
        2
      ) + "\n"
    );

    const tsc = require.resolve("typescript/bin/tsc");
    let output = "";
    let code = 0;
    try {
      await execFileAsync(process.execPath, [tsc, "-p", "tsconfig.json"], {
        cwd: work,
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (error) {
      code = error.code ?? 1;
      output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    }
    if (code !== 0) {
      const lines = output.trim().split("\n");
      console.error(lines.slice(0, MAX_ERROR_LINES).join("\n"));
      if (lines.length > MAX_ERROR_LINES) {
        console.error(`... ${lines.length - MAX_ERROR_LINES} more lines`);
      }
      fail(
        `${(output.match(/error TS\d+/g) ?? []).length} type errors across ` +
          `${packed.length} packed providers (node16, skipLibCheck false)`
      );
    }
    console.log(
      `check:packed-types: ${packed.length} packed providers, ` +
        `${specifiers.length} entry points type-check under node16 ` +
        `(skipLibCheck false)`
    );
  } finally {
    if (keep) console.log(`check:packed-types: kept ${work}`);
    else fs.rmSync(work, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const detail =
    error instanceof CheckFailure ? error.message : (error?.stack ?? error);
  console.error(`check:packed-types: ${detail}`);
  process.exitCode = 1;
});
