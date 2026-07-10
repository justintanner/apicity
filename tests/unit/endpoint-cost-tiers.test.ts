import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  classifyEndpoint,
  resolveEndpointCostPolicy,
  isEndpointExplicitlyClassified,
  ENDPOINT_COST_POLICIES,
  PAID_ENDPOINTS,
  PRICING,
  COST_TIERS,
  type EndpointCostTier,
} from "@apicity/cost";

/**
 * Canonical cost-tier classification of the ENTIRE provider/endpoint surface.
 *
 * This test is the sync check required by the P1 classification work: it keeps
 * the cost-tier classification in lockstep with the endpoint surface
 * (`scripts/endpoint-docs.tsv`), the paid-endpoint registry, and the pricing
 * tables, and it (re)generates the machine-readable artifact
 * `scripts/endpoint-cost-tiers.tsv` that tooling (example gating, docs) consumes.
 *
 * It fails when:
 *  - any endpoint on the surface lacks an EXPLICIT cost policy (would fall
 *    through to the fail-closed `prohibitive` default) — so an unlisted endpoint
 *    can never silently default to free/cheap;
 *  - a paid endpoint classifies as `cheap`;
 *  - a priced provider classifies as `cheap`;
 *  - a policy references a provider/endpoint that no longer exists;
 *  - the checked-in artifact drifts from the classification.
 *
 * Regenerate the artifact after intentional changes:
 *   UPDATE_ENDPOINT_COST_TIERS=1 pnpm test:run tests/unit/endpoint-cost-tiers.test.ts
 */

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");
const SURFACE_PATH = path.join(REPO_ROOT, "scripts", "endpoint-docs.tsv");
const ARTIFACT_PATH = path.join(REPO_ROOT, "scripts", "endpoint-cost-tiers.tsv");

interface SurfaceEndpoint {
  provider: string;
  dotPath: string;
  method: string;
}

function loadSurface(): SurfaceEndpoint[] {
  const text = readFileSync(SURFACE_PATH, "utf8");
  const lines = text.split("\n").filter((l) => l.length > 0);
  const rows: SurfaceEndpoint[] = [];
  // Skip the header row.
  for (let i = 1; i < lines.length; i++) {
    const [provider, dotPath, method] = lines[i].split("\t");
    rows.push({ provider, dotPath, method: method ?? "?" });
  }
  return rows;
}

const SURFACE = loadSurface();

function endpointKey(e: { provider: string; dotPath: string; method: string }) {
  return `${e.provider}\t${e.dotPath}\t${e.method}`;
}

interface ClassifiedRow extends SurfaceEndpoint {
  tier: EndpointCostTier;
  rationale: string;
}

function classifySurface(): ClassifiedRow[] {
  return SURFACE.map((e) => {
    const policy = resolveEndpointCostPolicy(e.provider, e.method, e.dotPath);
    return {
      ...e,
      tier: classifyEndpoint(e.provider, e.method, e.dotPath),
      rationale: policy?.rationale ?? "(no explicit policy — fail-closed)",
    };
  });
}

function renderArtifact(rows: ClassifiedRow[]): string {
  const sorted = [...rows].sort((a, b) => {
    if (a.provider !== b.provider) return a.provider < b.provider ? -1 : 1;
    if (a.dotPath !== b.dotPath) return a.dotPath < b.dotPath ? -1 : 1;
    if (a.method !== b.method) return a.method < b.method ? -1 : 1;
    return 0;
  });
  const header = ["provider", "dotPath", "method", "tier", "rationale"].join(
    "\t"
  );
  const body = sorted
    .map((r) => [r.provider, r.dotPath, r.method, r.tier, r.rationale].join("\t"))
    .join("\n");
  return header + "\n" + body + "\n";
}

describe("endpoint cost-tier classification — completeness", () => {
  it("has at least the full known surface to classify", () => {
    // Guardrail: a truncated/empty surface must not vacuously pass.
    expect(SURFACE.length).toBeGreaterThan(1000);
  });

  it("assigns an EXPLICIT tier to every endpoint (never a silent free/cheap default)", () => {
    const unclassified = SURFACE.filter(
      (e) => !isEndpointExplicitlyClassified(e.provider, e.method, e.dotPath)
    );
    // Report the offending providers/endpoints so a new endpoint is obvious.
    const detail = unclassified
      .slice(0, 20)
      .map((e) => `  ${e.provider}.${e.dotPath} [${e.method}]`)
      .join("\n");
    expect(
      unclassified,
      unclassified.length
        ? `\n${unclassified.length} endpoint(s) lack an explicit cost policy ` +
            `(they would fail closed to 'prohibitive'). Add a policy in ` +
            `packages/provider/cost/src/endpoint-cost-policy.ts:\n${detail}`
        : ""
    ).toEqual([]);
  });

  it("classifies every endpoint into one of the canonical tiers", () => {
    for (const e of SURFACE) {
      const tier = classifyEndpoint(e.provider, e.method, e.dotPath);
      expect(COST_TIERS).toContain(tier);
    }
  });

  it("every provider on the surface carries a policy", () => {
    const providers = [...new Set(SURFACE.map((e) => e.provider))].sort();
    const missing = providers.filter(
      (p) => !ENDPOINT_COST_POLICIES.some((pol) => pol.match.provider === p)
    );
    expect(missing, `providers without any cost policy: ${missing.join(", ")}`).toEqual(
      []
    );
  });
});

describe("endpoint cost-tier classification — fail-closed invariants", () => {
  it("classifies unknown/unlisted endpoints as prohibitive", () => {
    expect(classifyEndpoint("brand-new-provider", "POST", "v9.do.thing")).toBe(
      "prohibitive"
    );
    expect(classifyEndpoint("openai", "POST", "v99.made.up.endpoint")).toBe(
      "expensive"
    ); // inherits the provider default, still never cheap
  });

  it("never classifies a paid endpoint as cheap", () => {
    const offenders = PAID_ENDPOINTS.filter((entry) => {
      const tier = classifyEndpoint(
        entry.key.provider,
        entry.key.method,
        entry.key.dotPath
      );
      return tier === "cheap";
    }).map((e) => `${e.key.provider}.${e.key.dotPath} [${e.key.method}]`);
    expect(offenders, `paid endpoints misclassified as cheap: ${offenders}`).toEqual(
      []
    );
  });

  it("every paid endpoint is present on the surface (registry not stale)", () => {
    const surfaceKeys = new Set(SURFACE.map(endpointKey));
    const missing = PAID_ENDPOINTS.filter(
      (entry) => !surfaceKeys.has(endpointKey(entry.key))
    ).map((e) => `${e.key.provider}.${e.key.dotPath} [${e.key.method}]`);
    expect(missing, `paid endpoints absent from the surface: ${missing}`).toEqual(
      []
    );
  });

  it("never classifies a priced provider as cheap", () => {
    const pricedProviders = Object.keys(PRICING);
    const offenders: string[] = [];
    for (const e of SURFACE) {
      if (!pricedProviders.includes(e.provider)) continue;
      if (classifyEndpoint(e.provider, e.method, e.dotPath) === "cheap") {
        offenders.push(`${e.provider}.${e.dotPath} [${e.method}]`);
      }
    }
    expect(
      offenders,
      `priced-provider endpoints misclassified as cheap: ${offenders.slice(0, 10)}`
    ).toEqual([]);
  });
});

describe("endpoint cost-tier classification — no stale policies", () => {
  it("every policy matches at least one endpoint on the surface", () => {
    const stale = ENDPOINT_COST_POLICIES.filter((policy) => {
      const { match } = policy;
      return !SURFACE.some(
        (e) =>
          e.provider === match.provider &&
          (match.method === undefined || match.method === e.method) &&
          (match.dotPath === undefined || match.dotPath === e.dotPath)
      );
    }).map(
      (p) =>
        `${p.match.provider}` +
        `${p.match.dotPath ? "." + p.match.dotPath : ""}` +
        `${p.match.method ? " [" + p.match.method + "]" : ""}`
    );
    expect(stale, `policies matching no live endpoint: ${stale}`).toEqual([]);
  });
});

describe("endpoint cost-tier classification — machine-readable artifact", () => {
  it("scripts/endpoint-cost-tiers.tsv is in sync with the classification", () => {
    const expected = renderArtifact(classifySurface());

    if (process.env.UPDATE_ENDPOINT_COST_TIERS) {
      writeFileSync(ARTIFACT_PATH, expected);
      return;
    }

    expect(
      existsSync(ARTIFACT_PATH),
      "scripts/endpoint-cost-tiers.tsv is missing — regenerate with " +
        "UPDATE_ENDPOINT_COST_TIERS=1"
    ).toBe(true);

    const actual = readFileSync(ARTIFACT_PATH, "utf8");
    expect(
      actual === expected,
      "scripts/endpoint-cost-tiers.tsv is stale — regenerate with " +
        "UPDATE_ENDPOINT_COST_TIERS=1 pnpm test:run tests/unit/endpoint-cost-tiers.test.ts"
    ).toBe(true);
  });

  it("the artifact row count matches the endpoint surface exactly", () => {
    if (!existsSync(ARTIFACT_PATH)) return;
    const lines = readFileSync(ARTIFACT_PATH, "utf8")
      .split("\n")
      .filter((l) => l.length > 0);
    // minus the header row
    expect(lines.length - 1).toBe(SURFACE.length);
  });
});
