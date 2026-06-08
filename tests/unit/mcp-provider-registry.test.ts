import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import mcpPackage from "../../packages/mcp-server/package.json";
import { buildRegistry } from "../../packages/mcp-server/src/registry";
import { PROVIDERS } from "../../packages/mcp-server/src/providers";

function endpointProviders(): string[] {
  const tsv = readFileSync("scripts/endpoint-docs.tsv", "utf8");
  return [
    ...new Set(
      tsv
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => line.split("\t")[0])
    ),
  ].sort();
}

describe("apicity-mcp provider registry", () => {
  it("registers every endpoint-doc provider", () => {
    expect(Object.keys(PROVIDERS).sort()).toEqual(endpointProviders());
  });

  it("declares each registered provider package as a dependency", () => {
    const deps = mcpPackage.dependencies as Record<string, string>;
    const missing = endpointProviders().filter(
      (provider) => !deps[`@apicity/${provider}`]
    );

    expect(missing).toEqual([]);
  });

  it("resolves all Polymarket endpoint rows", async () => {
    const endpoints = await buildRegistry({ enabledProviders: ["polymarket"] });

    expect(endpoints).toHaveLength(providerEndpointCount("polymarket"));
  });

  it("resolves all DoltHub endpoint rows", async () => {
    const previous = process.env.DOLTHUB_API_KEY;
    process.env.DOLTHUB_API_KEY = "dummy";
    try {
      const endpoints = await buildRegistry({ enabledProviders: ["dolthub"] });

      expect(endpoints).toHaveLength(providerEndpointCount("dolthub"));
    } finally {
      if (previous === undefined) delete process.env.DOLTHUB_API_KEY;
      else process.env.DOLTHUB_API_KEY = previous;
    }
  });
});

function providerEndpointCount(provider: string): number {
  return endpointProvidersFromRows().filter((name) => name === provider).length;
}

function endpointProvidersFromRows(): string[] {
  const tsv = readFileSync("scripts/endpoint-docs.tsv", "utf8");
  return tsv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split("\t")[0]);
}
