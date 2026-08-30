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

// One canonical phrase per category, matched against the `cross-cutting`
// enumeration in scripts/preflight-provider.mjs. This table is the single
// place a category rename has to touch: the docblock is prose, so nothing
// else keeps it in agreement with the taxonomy above (ac-j82r26).
const CATEGORY_DOC_KEYWORDS = [
  {
    name: "RECORDING_ENUMERATION_TESTS",
    tests: RECORDING_ENUMERATION_TESTS,
    keyword: "recording-corpus allowlists",
  },
  {
    name: "SURFACE_INVENTORY_TESTS",
    tests: SURFACE_INVENTORY_TESTS,
    keyword: "endpoint-surface inventory",
  },
  {
    name: "SOURCE_PIN_TESTS",
    tests: SOURCE_PIN_TESTS,
    keyword: "cross-provider source pins",
  },
  {
    name: "REGISTRY_PARITY_TESTS",
    tests: REGISTRY_PARITY_TESTS,
    keyword: "cross-provider registry parity",
  },
  {
    name: "DOC_INVENTORY_TESTS",
    tests: DOC_INVENTORY_TESTS,
    keyword: "documentation inventories",
  },
  {
    name: "CREDENTIAL_WIRING_TESTS",
    tests: CREDENTIAL_WIRING_TESTS,
    keyword: "fal credential wiring",
  },
] as const;

const CATEGORIZED_TESTS: readonly string[] = CATEGORY_DOC_KEYWORDS.flatMap(
  (category) => [...category.tests]
);

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readCrossCuttingEnumeration(): string {
  const source = readRepoFile("scripts/preflight-provider.mjs");
  const paragraph =
    source.match(/^ \* Step `cross-cutting` runs[\s\S]*?(?=\n \*\n)/m)?.[0] ??
    "";
  // Strip the ` * ` prefix and collapse the hand-wrapping so a keyword split
  // across two comment lines still matches.
  return paragraph.replace(/^\s*\*\s?/gm, "").replace(/\s+/g, " ");
}

function backtickedTestPaths(prose: string): string[] {
  return [...prose.matchAll(/`(tests\/[^`]+\.test\.ts)`/g)].map(
    (match) => match[1]
  );
}

describe("cross-cutting repo-wide guard tests", () => {
  it("lists every categorized test, per category", () => {
    for (const { name, tests } of CATEGORY_DOC_KEYWORDS) {
      for (const relativePath of tests) {
        expect(CROSS_CUTTING_TESTS, name).toContain(relativePath);
      }
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
    const named = backtickedTestPaths(prose);
    expect(
      named.filter((entry) => !CROSS_CUTTING_TESTS.includes(entry))
    ).toEqual([]);
  });

  it("names every cross-cutting category in the preflight docblock", () => {
    const prose = readCrossCuttingEnumeration();
    const listed = prose.match(/do not select consistently:([^.]*)\./)?.[1];
    expect(
      listed,
      "preflight docblock has no category enumeration"
    ).toBeDefined();

    const named = (listed ?? "")
      .split(/,|\band\b/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    for (const { name, keyword } of CATEGORY_DOC_KEYWORDS) {
      expect(named, `preflight docblock does not name ${name}`).toContain(
        keyword
      );
    }
    expect(
      named.filter(
        (entry) => !CATEGORY_DOC_KEYWORDS.some((c) => c.keyword === entry)
      ),
      "enumeration names a category with no keyword-table row"
    ).toEqual([]);

    // The other direction: a backticked guard path the registry no longer
    // runs. A backtick marks block MEMBERSHIP, so a pointer to a module that
    // is not itself a cross-cutting test — the guard file this case lives in,
    // for one — is named without backticks.
    const members = backtickedTestPaths(prose);
    expect(
      members.filter((entry) => !CROSS_CUTTING_TESTS.includes(entry)),
      "backticked test paths in the docblock must be CROSS_CUTTING_TESTS " +
        "members; name non-member modules unbackticked"
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
