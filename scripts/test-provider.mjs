#!/usr/bin/env node
/**
 * Run the integration tests for a SINGLE provider in replay mode.
 *
 * The full Vitest suite replays every provider's recordings, which is slow when
 * you are iterating on one provider. This wrapper resolves only the test files
 * for the named provider and hands them to vitest. CI still runs the full suite
 * (`pnpm run test:run`) — this is a local-loop convenience, not a CI gate.
 *
 *   pnpm test:provider simplefunctions
 *   pnpm test:provider free-media-upload
 *   pnpm test:provider openai -- --reporter=verbose   # extra vitest args after --
 *
 * Tests alias `@apicity/*` to package source (tests/vitest.integration.ts), so
 * no build is required first. POLLY_MODE defaults to replay — this never
 * records and needs no API keys.
 */

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const INTEGRATION_DIR = "tests/integration";

const red = (s) => `[31m${s}[0m`;
const cyan = (s) => `[36m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;

const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const provider = rawArgs.find((arg) => !arg.startsWith("-"));
const passthrough = rawArgs.filter((arg) => arg !== provider);

if (!provider) {
  console.error(
    "\n" +
      red("Usage: pnpm test:provider <provider> [-- <vitest args>]") +
      "\n\n  e.g. " +
      cyan("pnpm test:provider simplefunctions") +
      "\n"
  );
  process.exit(1);
}

const allTests = readdirSync(INTEGRATION_DIR).filter((name) =>
  name.endsWith(".test.ts")
);
// `startsWith(provider + "-")` keeps `x` distinct from `xai`; the exact match
// catches single-file providers like `fal.test.ts`.
const matches = allTests
  .filter(
    (name) => name === `${provider}.test.ts` || name.startsWith(`${provider}-`)
  )
  .map((name) => path.join(INTEGRATION_DIR, name));

if (matches.length === 0) {
  const providers = [
    ...new Set(
      allTests.map((name) => name.replace(/\.test\.ts$/, "").split("-")[0])
    ),
  ].sort();
  console.error(
    "\n" +
      red(`No integration tests found for provider "${provider}".`) +
      `\n\n  Looked in ${INTEGRATION_DIR}/ for ${provider}.test.ts and ${provider}-*.test.ts\n` +
      "  Known prefixes: " +
      cyan(providers.join(", ")) +
      "\n"
  );
  process.exit(1);
}

console.error(dim(`test:provider ${provider} — ${matches.length} file(s)`));

const result = spawnSync(
  "npx",
  [
    "vitest",
    "run",
    "--config",
    "tests/vitest.integration.ts",
    ...matches,
    ...passthrough,
  ],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);
