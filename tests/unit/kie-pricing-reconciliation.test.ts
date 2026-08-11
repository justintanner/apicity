import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildReconciliationManifest,
  checkReconciliation,
  collectApiCityInventories,
  renderReconciliationMarkdown,
} from "../../scripts/lib/kie-pricing-reconciliation.mjs";

const root = process.cwd();
const evidenceRoot = path.join(root, "tests/fixtures/kie-pricing-evidence");
const snapshotPath = path.join(
  evidenceRoot,
  "kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json"
);
const metadataPath = path.join(
  evidenceRoot,
  "kie-pricing-pull-2026-08-11T09-18-45-401Z.json"
);
const manifestPath = path.join(
  evidenceRoot,
  "kie-pricing-reconciliation-2026-08-11T09-18-45-401Z.json"
);

interface TestRow {
  occurrenceId: string;
  disposition: string;
  mappedApiCityKeys: string[];
  official: Record<string, unknown>;
  selectorValues: Record<string, unknown>;
  rateBasis: { usdPrice: string };
  evidenceConflict?: { kind: string };
  canonicalKey?: string;
}

interface TestManifest {
  rows: TestRow[];
  apiCity: {
    models: Array<{ id: string }>;
    schemaWithoutPricing: Array<{ id: string }>;
    pricingOnly: Array<{ key: string }>;
  };
  snapshot: { sha256: string; metadataSha256: string };
  summary: {
    rows: { evidenceConflicts: { count: number; occurrenceIds: string[] } };
  };
}

interface TestInventory {
  models: string[];
  descriptors: string[];
  guards: string[];
  pricingKeys: string[];
  slugKeys: string[];
  displayKeys: string[];
  endpoints: Array<{ method: string }>;
}

type CheckOptions = {
  root: string;
  manifest?: TestManifest;
  manifestPath?: string;
  snapshotPath?: string;
  metadataPath?: string;
};

const runCheck = checkReconciliation as unknown as (
  options: CheckOptions
) => Promise<Record<string, unknown>>;

async function readManifest(): Promise<TestManifest> {
  return JSON.parse(await readFile(manifestPath, "utf8")) as TestManifest;
}

describe("Kie pricing reconciliation", () => {
  it("derives the authoritative source inventory counts", async () => {
    const inventory = (await collectApiCityInventories(root)) as TestInventory;

    expect(inventory.models).toHaveLength(127);
    expect(inventory.descriptors).toHaveLength(127);
    expect(inventory.guards).toHaveLength(127);
    expect(inventory.pricingKeys).toHaveLength(135);
    expect(inventory.slugKeys).toHaveLength(137);
    expect(inventory.displayKeys).toHaveLength(137);
    expect(inventory.endpoints).toHaveLength(71);
    expect(
      inventory.endpoints.filter((entry) => entry.method === "POST")
    ).toHaveLength(53);
    expect(
      inventory.endpoints.filter((entry) => entry.method === "GET")
    ).toHaveLength(18);
  });

  it("passes the committed zero-unclassified manifest", async () => {
    const result = await runCheck({ root, manifestPath });

    expect(result).toMatchObject({
      status: "ok",
      rows: 408,
      models: 127,
      endpoints: 71,
      pricingKeys: 135,
      slugs: 137,
      displays: 137,
      zeroUnclassifiedRows: true,
      zeroUnclassifiedApiCityKeys: true,
    });
  });

  it("emits explicit memberships and one canonical key per implemented row", async () => {
    const manifest = await readManifest();
    const implemented = manifest.rows.filter(
      (row) =>
        row.disposition === "implemented" ||
        row.disposition === "canonical-alias"
    );

    expect(manifest.apiCity.schemaWithoutPricing).toHaveLength(23);
    expect(manifest.apiCity.pricingOnly).toHaveLength(31);
    expect(implemented.length).toBeGreaterThan(0);
    expect(implemented.every((row) => row.mappedApiCityKeys.length === 1)).toBe(
      true
    );
    expect(
      manifest.rows.some((row) => row.disposition === "canonical-alias")
    ).toBe(true);
    expect(manifest.snapshot.metadataSha256).not.toBe(manifest.snapshot.sha256);
  });

  it("builds the mandatory Seedance 2.5 matrix from official cells", async () => {
    const manifest = (await buildReconciliationManifest({
      root,
      snapshotPath,
      metadataPath,
      generatedAt: "2026-08-11T09:18:45.401Z",
    })) as unknown as TestManifest;
    const seedance = manifest.rows.filter((row) =>
      row.mappedApiCityKeys.includes("bytedance/seedance-2-5")
    );

    expect(seedance).toHaveLength(4);
    expect(
      seedance.map((row) => [row.selectorValues, row.rateBasis.usdPrice])
    ).toEqual([
      [{ resolution: "720p", generate_audio: true }, "0.190"],
      [{ resolution: "720p", generate_audio: false }, "0.315"],
      [{ resolution: "480p", generate_audio: true }, "0.085"],
      [{ resolution: "480p", generate_audio: false }, "0.140"],
    ]);
  });

  it("uses explicit operation mappings before family names and rejects query conflicts", async () => {
    const manifest = await readManifest();
    const expected = [
      ["Google veo 3.1, Extend, Lite", "veo/extend"],
      ["Google veo 3.1, Extend, Quality", "veo/extend"],
      ["Google veo 3.1, Extend, Fast", "veo/extend"],
      ["Google veo 3.1, Get 1080P Video", "veo/get-1080p-video"],
      ["google imagen4, text-to-image, Fast", "google/imagen4-fast"],
      ["google imagen4, text-to-image, Ultra", "google/imagen4-ultra"],
      ["Suno, Generate Persona", "suno/persona-generate"],
      ["Suno, Generate Midi From Audio", "suno/midi-generate"],
      ["Suno, Generate sounds", "suno/sounds-generate"],
    ] as const;

    for (const [description, key] of expected) {
      const row = manifest.rows.find(
        (candidate) => candidate.official.modelDescription === description
      );
      expect(row?.mappedApiCityKeys, description).toEqual([key]);
    }

    const conflicts = manifest.rows.filter(
      (row) =>
        row.evidenceConflict?.kind === "query-description-operation-conflict"
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts.map((row) => row.official.modelDescription)).toEqual([
      "grok-imagine, text-to-image",
    ]);
    expect(manifest.summary.rows.evidenceConflicts).toEqual({
      count: 1,
      occurrenceIds: [conflicts[0].occurrenceId],
    });
    const conflict = conflicts[0];
    expect(conflict).toMatchObject({
      disposition: "upstream-unmappable",
      mappedApiCityKeys: [],
      evidenceConflict: {
        kind: "query-description-operation-conflict",
      },
    });
  });

  it("rejects mutated operation mappings and pending WI-3 membership output", async () => {
    const mutations = [
      ["Google veo 3.1, Extend, Quality", "veo3"],
      ["Google veo 3.1, Get 1080P Video", "veo3"],
      ["google imagen4, text-to-image, Fast", "google/imagen4"],
      ["Suno, Generate Persona", "suno/generate"],
    ] as const;
    for (const [description, wrongKey] of mutations) {
      const manifest = await readManifest();
      const row = manifest.rows.find(
        (candidate) => candidate.official.modelDescription === description
      );
      if (!row) throw new Error(`missing operation row: ${description}`);
      row.mappedApiCityKeys = [wrongKey];
      row.canonicalKey = wrongKey;
      await expect(runCheck({ root, manifest })).rejects.toThrow();
    }

    const conflictManifest = await readManifest();
    const conflict = conflictManifest.rows.find(
      (row) => row.official.modelDescription === "grok-imagine, text-to-image"
    );
    if (!conflict) throw new Error("missing grok conflict row");
    conflict.mappedApiCityKeys = ["grok-imagine/text-to-image"];
    await expect(
      runCheck({ root, manifest: conflictManifest })
    ).rejects.toMatchObject({
      code: "invalid-evidence-conflict",
    });

    const wi6Manifest = await readManifest();
    const wi6TraceManifest = wi6Manifest as TestManifest & {
      trace: Record<string, unknown>;
    };
    wi6TraceManifest.trace = {
      ...wi6TraceManifest.trace,
      workItem: "WI-6",
    };
    const pendingMembership = wi6Manifest.apiCity.schemaWithoutPricing.find(
      (entry) => "followUpBead" in entry
    );
    if (!pendingMembership) throw new Error("missing pending membership");
    await expect(
      runCheck({ root, manifest: wi6Manifest })
    ).rejects.toMatchObject({
      code: "final-output-pending-wi3",
    });
  });

  it("rejects an orphaned or substituted raw occurrence", async () => {
    const manifest = await readManifest();
    manifest.rows[0].official.modelDescription = "substituted";

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "manifest-row-drift",
    });
  });

  it("rejects a newly added source model without a manifest disposition", async () => {
    const manifest = await readManifest();
    manifest.apiCity.models.pop();

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "stale-inventory",
    });
  });

  it("rejects a changed source snapshot checksum", async () => {
    const manifest = await readManifest();
    manifest.snapshot.sha256 = "sha256:changed";

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "snapshot-checksum-mismatch",
    });
  });

  it("rejects metadata hashes that do not hash metadata bytes", async () => {
    const manifest = await readManifest();
    manifest.snapshot.metadataSha256 = "sha256:changed";

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "metadata-bytes-checksum-mismatch",
    });
  });

  it("rejects selector fields outside the declared schema", async () => {
    const manifest = await readManifest();
    const row = manifest.rows.find(
      (candidate) => candidate.disposition === "implemented"
    );
    if (!row) throw new Error("expected an implemented row");
    row.selectorValues.unknown_selector = "invalid";

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "selector-field-unmapped",
    });
  });

  it("renders human-readable coverage and audit-queue sections", async () => {
    const manifest = await readManifest();
    const markdown = renderReconciliationMarkdown(manifest);

    expect(markdown).toContain("## Seedance 2.5");
    expect(markdown).toContain("## Explicit Audit Queue");
    expect(markdown).toContain("| Schema model IDs | 127 |");
    expect(markdown).toContain("| Documented endpoints | 71 |");
    expect(markdown).toContain("| Schema-without-pricing inventory | 23 |");
    expect(markdown).toContain("| Pricing-only inventory | 31 |");
    expect(markdown).toContain("Zero unclassified raw rows");
    expect(markdown).toContain("Zero unclassified ApiCity keys");
  });
});
