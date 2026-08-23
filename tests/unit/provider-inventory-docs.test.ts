import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PROVIDER_INVENTORY_REGIONS,
  PROVIDER_INVENTORY_SOURCES,
  checkProviderInventory,
  resolveInventorySource,
} from "../../scripts/lib/provider-inventory.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// This filesystem-only guard pins the documented inventory to
// packages/provider in both directions. It never spawns, uses Polly, or reads
// the network.

const SYNTHETIC_MENTIONS: Readonly<Record<string, string>> = {
  "claude-package-list": "@apicity/retired",
  "claude-build-scripts": "build:retired",
  "claude-provider-bullets": "**retired**",
  "agents-package-list": "@apicity/retired",
  "readme-package-table": "@apicity/retired",
};

function readSurface(surface: string): string {
  return fs.readFileSync(path.join(repoRoot, surface), "utf8");
}

function startMarker(id: string): string {
  return `<!-- provider-inventory:start:${id} -->`;
}

function endMarker(id: string): string {
  return `<!-- provider-inventory:end:${id} -->`;
}

describe("provider inventory definitions", () => {
  it("uses unique marker-safe region ids and known sources", () => {
    const ids = PROVIDER_INVENTORY_REGIONS.map((region) => region.id);
    for (const region of PROVIDER_INVENTORY_REGIONS) {
      expect(region.id).toMatch(/^[a-z0-9-]+$/);
      expect(
        Object.hasOwn(PROVIDER_INVENTORY_SOURCES, region.source),
        `${region.id} / ${region.source}`
      ).toBe(true);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves every source to a non-empty sorted inventory", () => {
    for (const source of Object.keys(PROVIDER_INVENTORY_SOURCES)) {
      const names = resolveInventorySource(source);
      expect(names.length, source).toBeGreaterThan(0);
      expect(names, source).toEqual([...names].sort());
    }
  });
});

describe.each([...PROVIDER_INVENTORY_REGIONS])("$surface [$id]", (region) => {
  it("matches its machine-readable source in both directions", () => {
    const problems = checkProviderInventory(
      region,
      readSurface(region.surface),
      resolveInventorySource(region.source)
    );
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("fails when a provider package is missing from the surface", () => {
    const expected = resolveInventorySource(region.source);
    const problems = checkProviderInventory(
      region,
      readSurface(region.surface),
      [...expected, "ghostprovider"]
    );
    expect(problems).toContain(
      `${region.surface} [${region.id}]: provider package 'ghostprovider' is missing from this region (source: ${region.source})`
    );
  });

  it("fails when the surface names a package absent from its source", () => {
    const marker = startMarker(region.id);
    const text = readSurface(region.surface);
    const perturbed = text.replace(
      marker,
      `${marker}\n${SYNTHETIC_MENTIONS[region.id]}`
    );
    expect(perturbed).not.toBe(text);

    expect(
      checkProviderInventory(
        region,
        perturbed,
        resolveInventorySource(region.source)
      )
    ).toContain(
      `${region.surface} [${region.id}]: documented name 'retired' has no match in source '${region.source}'`
    );
  });

  it("fails on missing anchors rather than checking nothing", () => {
    const withoutMarkers = readSurface(region.surface)
      .replace(startMarker(region.id), "")
      .replace(endMarker(region.id), "");

    expect(
      checkProviderInventory(
        region,
        withoutMarkers,
        resolveInventorySource(region.source)
      )
    ).toEqual([
      `${region.surface} [${region.id}]: expected exactly one ${startMarker(region.id)} marker, found 0 (source: ${region.source})`,
      `${region.surface} [${region.id}]: expected exactly one ${endMarker(region.id)} marker, found 0 (source: ${region.source})`,
    ]);
  });

  it("fails when the end anchor precedes the start anchor", () => {
    const placeholder = `<!-- provider-inventory:swapped:${region.id} -->`;
    const swapped = readSurface(region.surface)
      .replace(startMarker(region.id), placeholder)
      .replace(endMarker(region.id), startMarker(region.id))
      .replace(placeholder, endMarker(region.id));

    expect(
      checkProviderInventory(
        region,
        swapped,
        resolveInventorySource(region.source)
      )
    ).toEqual([
      `${region.surface} [${region.id}]: the ${endMarker(region.id)} marker appears before ${startMarker(region.id)} (source: ${region.source})`,
    ]);
  });
});
