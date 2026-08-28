import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CROSS_CUTTING_COST_SECONDS,
  CROSS_CUTTING_TESTS,
  crossCuttingCostNote,
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

// Registry-parity suite (compares cross-provider registries for key parity).
const REGISTRY_PARITY_TESTS = [
  "tests/unit/cost-slugs.test.ts",
  "tests/unit/cost-pricing.test.ts",
] as const;

// Doc-inventory suite (pins agent-facing prose to the repository itself).
const DOC_INVENTORY_TESTS = [
  "tests/unit/provider-inventory-docs.test.ts",
] as const;

// Credential-wiring suite (recording host must match the test's credential).
const CREDENTIAL_WIRING_TESTS = [
  "tests/unit/recording-credential-hosts.test.ts",
] as const;

// Export-surface suite (declared public types must be re-exported).
const EXPORT_SURFACE_TESTS = [
  "tests/unit/provider-export-surface.test.ts",
] as const;

const CATEGORIZED_TESTS: readonly string[] = [
  ...RECORDING_ENUMERATION_TESTS,
  ...SURFACE_INVENTORY_TESTS,
  ...SOURCE_PIN_TESTS,
  ...REGISTRY_PARITY_TESTS,
  ...DOC_INVENTORY_TESTS,
  ...CREDENTIAL_WIRING_TESTS,
  ...EXPORT_SURFACE_TESTS,
];

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("cross-cutting repo-wide guard tests", () => {
  it("lists recording-enumeration, surface-inventory, source-pin, registry-parity, doc-inventory, credential-wiring, and export-surface tests", () => {
    for (const path of RECORDING_ENUMERATION_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of SURFACE_INVENTORY_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of SOURCE_PIN_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of REGISTRY_PARITY_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of DOC_INVENTORY_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of CREDENTIAL_WIRING_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
    for (const path of EXPORT_SURFACE_TESTS) {
      expect(CROSS_CUTTING_TESTS).toContain(path);
    }
  });

  it("categorizes every listed cross-cutting test", () => {
    const categorized = new Set<string>(CATEGORIZED_TESTS);
    const listed = new Set<string>(CROSS_CUTTING_TESTS);
    expect(
      CATEGORIZED_TESTS.length,
      "a path appears in two category lists"
    ).toBe(categorized.size);
    expect(
      CROSS_CUTTING_TESTS.filter((entry) => !categorized.has(entry)),
      "cross-cutting tests with no category list in this file"
    ).toEqual([]);
    expect(
      CATEGORIZED_TESTS.filter((entry) => !listed.has(entry)),
      "categorized paths absent from CROSS_CUTTING_TESTS"
    ).toEqual([]);
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

  it("registry-parity tests compare two cross-provider registries", () => {
    for (const relativePath of REGISTRY_PARITY_TESTS) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source, relativePath).toContain("MODEL_SLUGS");
      expect(source, relativePath).toContain("PRICING");
    }
  });

  it("doc-inventory tests derive their inventory from the repository", () => {
    // A doc-inventory guard must read the provider tree rather than restate it,
    // which is the whole point of registering it here (ac-gk1mlr).
    for (const relativePath of DOC_INVENTORY_TESTS) {
      const source = readRepoFile(relativePath);
      expect(source, relativePath).toContain("readProviderNames");
      expect(source, relativePath).toContain("provider-inventory.mjs");
    }
  });

  it("credential-wiring tests pin a host-to-credential mapping", () => {
    for (const relativePath of CREDENTIAL_WIRING_TESTS) {
      const source = readRepoFile(relativePath);
      expect(source, relativePath).toContain("FAL_ADMIN_API_KEY");
      expect(source, relativePath).toContain("api.fal.ai");
    }
  });

  it("export-surface tests check declared namespaces against re-exports", () => {
    // The guard must drive the shared checker rather than restate the rule, so
    // the `*Namespace` contract has exactly one definition (ac-gvqa18).
    for (const relativePath of EXPORT_SURFACE_TESTS) {
      const source = readRepoFile(relativePath);
      expect(source, relativePath).toContain("export-surface.mjs");
      expect(source, relativePath).toContain("Namespace");
    }
  });

  // The measured cost of the block was restated by hand in three files with
  // nothing keeping them in agreement (ac-vsx186). It now lives in one export;
  // these two cases are what keep the remaining prose copy honest.
  it("builds its cost sentence from the single source", () => {
    expect(crossCuttingCostNote()).toContain(`${CROSS_CUTTING_COST_SECONDS}s`);
  });

  it("pins the CLAUDE.md cost figure and member list to this module", () => {
    const claude = readRepoFile("CLAUDE.md");

    const cost = claude.match(
      /<!-- cross-cutting-cost:start -->([\s\S]*?)<!-- cross-cutting-cost:end -->/
    );
    expect(cost, "CLAUDE.md has no cross-cutting-cost region").not.toBeNull();
    expect(Number(cost?.[1])).toBe(CROSS_CUTTING_COST_SECONDS);

    const region = claude.match(
      /<!-- cross-cutting-tests:start -->([\s\S]*?)<!-- cross-cutting-tests:end -->/
    );
    expect(
      region,
      "CLAUDE.md has no cross-cutting-tests region"
    ).not.toBeNull();
    const prose = region?.[1] ?? "";
    for (const relativePath of CROSS_CUTTING_TESTS) {
      expect(prose, `CLAUDE.md does not name ${relativePath}`).toContain(
        relativePath
      );
    }
    // The other direction: prose naming a guard the registry no longer runs.
    const named = [...prose.matchAll(/`(tests\/[^`]+\.test\.ts)`/g)].map(
      (match) => match[1]
    );
    expect(
      named.filter((entry) => !CROSS_CUTTING_TESTS.includes(entry))
    ).toEqual([]);
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
