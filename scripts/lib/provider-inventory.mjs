import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  listProviderNames,
  providerRoot,
  repoRoot,
} from "./provider-scope.mjs";

/**
 * One machine-readable source for a documented provider inventory.
 *
 * @typedef {object} ProviderInventorySource
 * @property {() => string[]} resolve
 */

/**
 * One marker-bounded provider inventory in an agent-facing prose surface.
 *
 * @typedef {object} ProviderInventoryRegion
 * @property {string} id
 * @property {string} surface
 * @property {string} source
 * @property {string} pattern
 * @property {string} flags
 */

function listProviderPackages() {
  return readdirSync(providerRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function listBuildScripts() {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8")
  );

  return Object.keys(packageJson.scripts ?? {})
    .map((name) => name.match(/^build:([a-z0-9-]+)$/)?.[1])
    .filter(Boolean);
}

/**
 * The derived sources each guarded prose region actually documents.
 *
 * The collection-level type is load-bearing for TypeScript consumers. Tests
 * index it with a region's string-valued `source`; without the `Record`
 * contract, strict tests-project typechecking sees only literal object keys and
 * reports TS7053.
 *
 * @type {Readonly<Record<string, ProviderInventorySource>>}
 */
export const PROVIDER_INVENTORY_SOURCES = Object.freeze({
  "provider-packages": Object.freeze({ resolve: listProviderPackages }),
  "provider-scopes": Object.freeze({ resolve: listProviderNames }),
  "build-scripts": Object.freeze({ resolve: listBuildScripts }),
});

/**
 * The marker-bounded inventories checked in agent-facing documentation.
 * Patterns and flags are strings so every check constructs a fresh RegExp;
 * sharing a global RegExp would leak `lastIndex` between calls.
 *
 * @type {ReadonlyArray<ProviderInventoryRegion>}
 */
export const PROVIDER_INVENTORY_REGIONS = Object.freeze([
  Object.freeze({
    id: "claude-package-list",
    surface: "CLAUDE.md",
    source: "provider-packages",
    pattern: "@apicity/([a-z0-9-]+)",
    flags: "g",
  }),
  Object.freeze({
    id: "claude-build-scripts",
    surface: "CLAUDE.md",
    source: "build-scripts",
    pattern: "\\bbuild:([a-z0-9-]+)",
    flags: "g",
  }),
  Object.freeze({
    id: "claude-provider-bullets",
    surface: "CLAUDE.md",
    source: "provider-scopes",
    pattern: "^\\*\\*([a-z0-9-]+)\\*\\*",
    flags: "gm",
  }),
  Object.freeze({
    id: "agents-package-list",
    surface: "AGENTS.md",
    source: "provider-packages",
    pattern: "@apicity/([a-z0-9-]+)",
    flags: "g",
  }),
  Object.freeze({
    id: "readme-package-table",
    surface: "README.md",
    source: "provider-scopes",
    pattern: "@apicity/([a-z0-9-]+)",
    flags: "g",
  }),
]);

/**
 * Resolve one inventory source to a sorted list of provider names.
 *
 * This is the module's filesystem boundary. `checkProviderInventory` remains
 * pure because callers inject the resolved names.
 *
 * @param {string} sourceId
 * @returns {string[]}
 */
export function resolveInventorySource(sourceId) {
  const source = PROVIDER_INVENTORY_SOURCES[sourceId];
  if (!source) {
    throw new Error(`Unknown provider inventory source "${sourceId}"`);
  }

  return [...source.resolve()].sort();
}

function markerIndexes(text, marker) {
  const indexes = [];
  let offset = 0;

  while (offset < text.length) {
    const index = text.indexOf(marker, offset);
    if (index === -1) break;
    indexes.push(index);
    offset = index + marker.length;
  }

  return indexes;
}

/**
 * Check one documented inventory against its injected source names.
 *
 * Pure: no filesystem, network, or process access. Every problem identifies
 * the prose surface, region, and source; name-specific problems also identify
 * the offending provider package.
 *
 * @param {ProviderInventoryRegion} region
 * @param {string} text
 * @param {ReadonlyArray<string>} expectedNames
 * @returns {string[]}
 */
export function checkProviderInventory(region, text, expectedNames) {
  const problems = [];
  const startMarker = `<!-- provider-inventory:start:${region.id} -->`;
  const endMarker = `<!-- provider-inventory:end:${region.id} -->`;
  const starts = markerIndexes(text, startMarker);
  const ends = markerIndexes(text, endMarker);

  if (starts.length !== 1) {
    problems.push(
      `${region.surface} [${region.id}]: expected exactly one ${startMarker} marker, found ${starts.length} (source: ${region.source})`
    );
  }
  if (ends.length !== 1) {
    problems.push(
      `${region.surface} [${region.id}]: expected exactly one ${endMarker} marker, found ${ends.length} (source: ${region.source})`
    );
  }
  if (problems.length > 0) return problems;

  const regionStart = starts[0] + startMarker.length;
  const regionEnd = ends[0];
  if (regionEnd < regionStart) {
    return [
      `${region.surface} [${region.id}]: the ${endMarker} marker appears before ${startMarker} (source: ${region.source})`,
    ];
  }

  const matcher = new RegExp(region.pattern, region.flags);
  const names = [...text.slice(regionStart, regionEnd).matchAll(matcher)].map(
    (match) => match[1]
  );

  if (names.length === 0) {
    return [
      `${region.surface} [${region.id}]: region contains no provider names matching its pattern (source: ${region.source})`,
    ];
  }

  const documentedNames = new Set(names);
  const sourceNames = new Set(expectedNames);

  for (const name of expectedNames) {
    if (!documentedNames.has(name)) {
      problems.push(
        `${region.surface} [${region.id}]: provider package '${name}' is missing from this region (source: ${region.source})`
      );
    }
  }
  for (const name of documentedNames) {
    if (!sourceNames.has(name)) {
      problems.push(
        `${region.surface} [${region.id}]: documented name '${name}' has no match in source '${region.source}'`
      );
    }
  }

  return problems;
}
