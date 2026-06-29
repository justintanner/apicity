#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(here, "../dist/src/paygate-cli.js");

if (!existsSync(cliPath)) {
  console.error(
    "[apicity-paygate] missing build output. Run `pnpm --filter @apicity/cost run build` first."
  );
  process.exit(1);
}

const cli = await import(pathToFileURL(cliPath).href);
if (typeof cli.main !== "function") {
  console.error("[apicity-paygate] built CLI does not export main().");
  process.exit(1);
}

await cli.main();
