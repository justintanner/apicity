import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { classifyEndpoint, shouldRunEndpointByDefault } from "@apicity/cost";

/**
 * Cost-tier gating of generated examples.
 *
 * `pnpm run gen:examples` annotates every provider `example.json` entry with
 * the canonical cost `tier` and a fail-closed `runByDefault` flag. This test
 * enforces the gating contract downstream tooling relies on:
 *
 *  - each example's tier matches the canonical classifier;
 *  - `runByDefault` is true only for `cheap` endpoints;
 *  - no expensive/prohibitive example is ever run by default.
 *
 * With `gen:examples:check` (which keeps the files in sync with the generator)
 * this guarantees an example runner that honors `runByDefault` never executes a
 * non-cheap endpoint without an explicit opt-in.
 */

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");
const PROVIDERS_DIR = path.join(REPO_ROOT, "packages", "provider");

interface ExampleRow {
  provider: string;
  method: string;
  dotPath: string;
  tier: unknown;
  runByDefault: unknown;
}

function loadAllExamples(): ExampleRow[] {
  const out: ExampleRow[] = [];
  for (const name of readdirSync(PROVIDERS_DIR)) {
    const p = path.join(PROVIDERS_DIR, name, "src", "example.json");
    if (!existsSync(p)) continue;
    const json = JSON.parse(readFileSync(p, "utf8")) as Record<
      string,
      { tier?: unknown; runByDefault?: unknown }
    >;
    for (const [key, entry] of Object.entries(json)) {
      const sp = key.indexOf(" ");
      const method = sp < 0 ? "" : key.slice(0, sp);
      const dotPath = sp < 0 ? key : key.slice(sp + 1);
      out.push({
        provider: name,
        method,
        dotPath,
        tier: entry.tier,
        runByDefault: entry.runByDefault,
      });
    }
  }
  return out;
}

const EXAMPLES = loadAllExamples();

describe("example cost-tier gating", () => {
  it("finds generated examples to check", () => {
    expect(EXAMPLES.length).toBeGreaterThan(0);
  });

  it("annotates every example with a tier and runByDefault flag", () => {
    const missing = EXAMPLES.filter(
      (e) => e.tier === undefined || e.runByDefault === undefined
    ).map((e) => `${e.provider} ${e.method} ${e.dotPath}`);
    expect(missing).toEqual([]);
  });

  it("every example carries the canonical tier for its endpoint", () => {
    const wrong = EXAMPLES.filter(
      (e) => e.tier !== classifyEndpoint(e.provider, e.method, e.dotPath)
    ).map((e) => `${e.provider} ${e.method} ${e.dotPath}: ${e.tier}`);
    expect(wrong, `examples with a stale tier: ${wrong.slice(0, 10)}`).toEqual(
      []
    );
  });

  it("marks runByDefault true only for cheap endpoints", () => {
    const wrong = EXAMPLES.filter(
      (e) => e.runByDefault !== (e.tier === "cheap")
    ).map((e) => `${e.provider} ${e.method} ${e.dotPath}`);
    expect(wrong).toEqual([]);
  });

  it("never runs an expensive/prohibitive example by default", () => {
    const leaked = EXAMPLES.filter(
      (e) => e.runByDefault === true && e.tier !== "cheap"
    ).map((e) => `${e.provider} ${e.method} ${e.dotPath}`);
    expect(leaked).toEqual([]);
  });

  it("shouldRunEndpointByDefault agrees with each example's gate", () => {
    for (const e of EXAMPLES) {
      expect(shouldRunEndpointByDefault(e.provider, e.method, e.dotPath)).toBe(
        e.runByDefault
      );
    }
  });
});
