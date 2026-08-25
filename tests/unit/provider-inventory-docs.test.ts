import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  aliasNames,
  checkAliasCoverage,
  checkProviderInventoryDocs,
  checkRegionNames,
  DOC_GEN_EXEMPT,
  expectedBuildAliases,
  expectedDocGenAliases,
  NON_PROVIDER_PACKAGES,
  PROVIDER_DOC_SURFACES,
  readProviderNames,
  readRegion,
  readRootScripts,
  REPO_ROOT,
} from "../../scripts/lib/provider-inventory.mjs";

// The provider list, the `build:*` aliases, and the `doc-gen:*` aliases were
// each restated by hand in prose with nothing tying them to the repository.
// All three drifted (ac-gk1mlr, ac-qclky0, ac-e1h1yj).
// `scripts/lib/provider-inventory.mjs` derives them from disk, and this file is
// what makes a stale restatement fail a gate instead of a code review.

const readSurface = (surface: string): string =>
  fs.readFileSync(path.join(REPO_ROOT, surface), "utf8");

const providers = readProviderNames();
const scripts = readRootScripts();

describe("provider inventory", () => {
  it("finds every provider directory on disk", () => {
    expect(providers.length).toBeGreaterThan(0);
    // Sorted and unique — every downstream comparison assumes both.
    expect(providers).toEqual([...new Set(providers)].sort());
    // A spot-check that the reader is looking at the real tree rather than an
    // empty or mis-rooted directory.
    expect(providers).toContain("fal");
    expect(providers).toContain("kie");
  });

  it("has a build alias for every package", () => {
    expect(
      checkAliasCoverage(
        aliasNames(scripts, "build"),
        expectedBuildAliases(providers),
        "build"
      )
    ).toEqual([]);
  });

  it("has a doc-gen alias for every provider with a generated README", () => {
    expect(
      checkAliasCoverage(
        aliasNames(scripts, "doc-gen"),
        expectedDocGenAliases(providers),
        "doc-gen"
      )
    ).toEqual([]);
  });

  it("does not read doc-gen:check as a package alias", () => {
    expect(scripts["doc-gen:check"]).toBeDefined();
    expect(aliasNames(scripts, "doc-gen")).not.toContain("check");
  });

  it("exempts only packages that genuinely have no generated README", () => {
    for (const name of Object.keys(DOC_GEN_EXEMPT)) {
      expect(providers, `${name} is exempt but not a provider`).toContain(name);
      expect(aliasNames(scripts, "doc-gen")).not.toContain(name);
    }
  });

  it("keeps non-provider packages out of the provider list", () => {
    for (const name of NON_PROVIDER_PACKAGES) {
      expect(providers).not.toContain(name);
      expect(expectedBuildAliases(providers)).toContain(name);
    }
  });
});

describe("provider inventory documentation", () => {
  const inventories = {
    providers,
    buildAliases: expectedBuildAliases(providers),
    docGenAliases: expectedDocGenAliases(providers),
  };

  for (const surface of PROVIDER_DOC_SURFACES) {
    it(`${surface} names every provider and alias`, () => {
      const problems = checkProviderInventoryDocs(
        surface,
        readSurface(surface),
        inventories
      );
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }

  it("fails a surface that gains a provider it does not name", () => {
    const problems = checkProviderInventoryDocs(
      "CLAUDE.md",
      readSurface("CLAUDE.md"),
      {
        ...inventories,
        providers: [...providers, "notarealprovider"],
      }
    );
    expect(problems.join("\n")).toContain("notarealprovider");
    expect(problems.join("\n")).toContain("missing from the providers region");
  });

  it("fails a surface that gains a build alias it does not name", () => {
    const problems = checkProviderInventoryDocs(
      "CLAUDE.md",
      readSurface("CLAUDE.md"),
      {
        ...inventories,
        buildAliases: [...inventories.buildAliases, "notarealpackage"],
      }
    );
    expect(problems.join("\n")).toContain("build:notarealpackage");
  });

  it("fails a surface that gains a doc-gen alias it does not name", () => {
    const problems = checkProviderInventoryDocs(
      "CLAUDE.md",
      readSurface("CLAUDE.md"),
      {
        ...inventories,
        docGenAliases: [...inventories.docGenAliases, "notarealpackage"],
      }
    );
    expect(problems.join("\n")).toContain("doc-gen:notarealpackage");
  });

  it("skips alias regions on surfaces that do not carry them", () => {
    // README.md and AGENTS.md document the providers but not the script
    // aliases; an absent alias region there is not drift.
    for (const surface of ["README.md", "AGENTS.md"]) {
      const { problems } = readRegion(
        surface,
        readSurface(surface),
        "claude-build-scripts"
      );
      expect(problems?.join("\n")).toContain("found 0");
      expect(
        checkProviderInventoryDocs(surface, readSurface(surface), inventories)
      ).toEqual([]);
    }
  });
});

describe("region reading", () => {
  it("reports a missing anchor rather than checking nothing", () => {
    const { problems } = readRegion("x.md", "no markers here", "providers");
    expect(problems?.join("\n")).toContain("found 0");
  });

  it("reports a duplicated anchor", () => {
    const text =
      "<!-- provider-inventory:providers:start --><!-- provider-inventory:providers:start -->" +
      "<!-- provider-inventory:providers:end -->";
    const { problems } = readRegion("x.md", text, "providers");
    expect(problems?.join("\n")).toContain("found 2");
  });

  it("reports an inverted region", () => {
    const text =
      "<!-- provider-inventory:providers:end --><!-- provider-inventory:providers:start -->";
    const { problems } = readRegion("x.md", text, "providers");
    expect(problems?.join("\n")).toContain("appears before its :start marker");
  });

  it("only reads names inside the region", () => {
    // `@apicity/outside` sits before the region, so it must not satisfy it.
    const text =
      "@apicity/outside <!-- provider-inventory:providers:start -->@apicity/inside<!-- provider-inventory:providers:end -->";
    expect(
      checkRegionNames(
        "x.md",
        text,
        "providers",
        ["inside"],
        (n) => `@apicity/${n}`
      )
    ).toEqual([]);
    expect(
      checkRegionNames(
        "x.md",
        text,
        "providers",
        ["outside"],
        (n) => `@apicity/${n}`
      )
    ).toHaveLength(1);
  });
});
