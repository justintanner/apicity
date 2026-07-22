import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as zodModule from "@apicity/fal/zod";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

// Every `jsonBody` registration in fal.ts declares its endpoint path and the
// zod schema attached to it. queue.submit sends the same path (minus the
// leading slash) as `endpoint_id`, so FAL_ENDPOINT_REQUEST_SCHEMAS must stay
// in lockstep with the factory: same key set, identical schema objects.
const JSON_BODY_PATTERN =
  /jsonBody<\s*(\w+),\s*(\w+)\s*>\(\s*"(POST|DELETE|PUT)",\s*"([^"]+)",\s*(\w+)/g;

function extractRegistrations(): Array<{
  endpointId: string;
  schemaExportName: string;
}> {
  const source = fs.readFileSync(
    path.join(repoRoot, "packages/provider/fal/src/fal.ts"),
    "utf8"
  );
  const registrations: Array<{ endpointId: string; schemaExportName: string }> =
    [];
  for (const match of source.matchAll(JSON_BODY_PATTERN)) {
    registrations.push({
      endpointId: match[4].replace(/^\//, ""),
      schemaExportName: match[5],
    });
  }
  return registrations;
}

describe("fal endpoint request-schema registry", () => {
  const registrations = extractRegistrations();
  const registry = zodModule.FAL_ENDPOINT_REQUEST_SCHEMAS as Record<
    string,
    unknown
  >;

  it("extracts every jsonBody registration from the factory source", () => {
    // Guard: a refactor away from jsonBody must not let the walk pass
    // vacuously with zero (or too few) extracted call sites.
    expect(registrations.length).toBeGreaterThanOrEqual(48);
  });

  it("registry keys equal the set of jsonBody endpoint paths", () => {
    const extractedPaths = [
      ...new Set(registrations.map((r) => r.endpointId)),
    ].sort();
    expect(Object.keys(registry).sort()).toEqual(extractedPaths);
  });

  it("maps every endpoint path to the identical schema object", () => {
    const zodExports = zodModule as unknown as Record<string, unknown>;
    for (const { endpointId, schemaExportName } of registrations) {
      expect(
        zodExports[schemaExportName],
        `${endpointId} should map to ${schemaExportName}`
      ).toBeDefined();
      expect(
        registry[endpointId],
        `${endpointId} should map to ${schemaExportName} by identity`
      ).toBe(zodExports[schemaExportName]);
    }
  });
});
