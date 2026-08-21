import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CROSS_CUTTING_TESTS,
  listCrossCuttingTests,
} from "../../scripts/lib/cross-cutting-tests.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// Recording-enumeration suite (walks the whole tests/recordings tree).
const RECORDING_ENUMERATION_TESTS = [
  "tests/integration/upload-recordings.test.ts",
  "tests/integration/multipart-recordings.test.ts",
] as const;

// Surface-inventory suite (compares committed TSVs to the live endpoint map).
const SURFACE_INVENTORY_TESTS = [
  "tests/unit/endpoint-cost-tiers.test.ts",
] as const;

// Source-pin suite (re-hashes cross-provider files against a frozen manifest).
const SOURCE_PIN_TESTS = [
  "tests/unit/kie-pricing-reconciliation.test.ts",
] as const;

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("cross-cutting repo-wide guard tests", () => {
  it("lists recording-enumeration, surface-inventory, and source-pin tests", () => {
    for (const path of RECORDING_ENUMERATION_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of SURFACE_INVENTORY_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of SOURCE_PIN_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
  });

  it("every listed test exists on disk", () => {
    for (const relativePath of listCrossCuttingTests()) {
      expect(
        fs.existsSync(path.join(repoRoot, relativePath)),
        relativePath
      ).toBe(true);
    }
  });

  it("recording-enumeration tests walk the whole recordings tree", () => {
    // Each recording-enumeration entry recursively walks the entire
    // tests/recordings corpus rather than a fixed provider subset.
    for (const relativePath of RECORDING_ENUMERATION_TESTS) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source, relativePath).toContain("../recordings");
      expect(source, relativePath).toContain("readdirSync");
    }
  });

  it("surface-inventory tests pin a committed endpoint-surface artifact", () => {
    // Inventory tests must reference the cost-tiers TSV so a missing row after
    // an endpoint landing fails the fast gate (ac-t2gfln).
    for (const relativePath of SURFACE_INVENTORY_TESTS) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source, relativePath).toContain("endpoint-cost-tiers.tsv");
    }
  });

  it("source-pin tests assert checksum-mismatch detection", () => {
    for (const relativePath of SOURCE_PIN_TESTS) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source, relativePath).toContain("source-checksum-mismatch");
    }
  });

  it("filters tests already selected by a provider scope", () => {
    const [alreadySelected, ...remaining] = CROSS_CUTTING_TESTS;
    expect(
      listCrossCuttingTests({ alreadySelected: [alreadySelected] })
    ).toEqual(remaining);
  });

  it("never returns an empty selection when a scope covers every entry", () => {
    expect(
      listCrossCuttingTests({ alreadySelected: [...CROSS_CUTTING_TESTS] })
    ).toEqual(CROSS_CUTTING_TESTS);
  });

  it("returns a fresh copy so callers cannot mutate the source list", () => {
    const first = listCrossCuttingTests();
    first.push("tests/integration/should-not-persist.test.ts");
    expect(listCrossCuttingTests()).not.toContain(
      "tests/integration/should-not-persist.test.ts"
    );
  });

  it("keeps provider filters off both cross-cutting test runs", () => {
    const preflightSource = readRepoFile("scripts/preflight-provider.mjs");
    const preflightRun = preflightSource.match(
      /run\("cross-cutting repo-wide guard tests", "pnpm", \[[\s\S]*?\n\]\);/
    )?.[0];

    expect(preflightRun).toBeDefined();
    expect(preflightRun).toContain("...crossCuttingTests");
    expect(preflightRun).not.toContain("...passthrough");
    expect(preflightSource).toMatch(
      /run\(`test:provider \$\{provider\}`[\s\S]*?\.\.\.passthrough/
    );

    const affectedSource = readRepoFile("scripts/test-affected.mjs");
    const affectedRun = affectedSource.match(
      /run\("pnpm", \["run", "test:run", \.\.\.crossCutting[^\n]*\]\);/
    )?.[0];

    expect(affectedRun).toBeDefined();
    expect(affectedRun).not.toContain("...options.passthrough");
    expect(affectedSource).toContain(
      '["run", "test:provider", provider, ...options.passthrough]'
    );
  });
});
