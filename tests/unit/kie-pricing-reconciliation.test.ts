import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "../../packages/provider/cost/src";
import type {
  CostEstimate,
  CostHints,
  ModelPricing,
} from "../../packages/provider/cost/src";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import {
  buildReconciliationManifest,
  checkReconciliation,
  collectApiCityInventories,
  RUNTIME_VARIANT_EXCEPTIONS,
  renderReconciliationMarkdown,
} from "../../scripts/lib/kie-pricing-reconciliation.mjs";
import { MODEL_FAMILY_REGISTRATIONS } from "../../scripts/lib/kie-pricing-reconciliation-rules.mjs";

const root = process.cwd();
const evidenceRoot = path.join(root, "tests/fixtures/kie-pricing-evidence");
const snapshotPath = path.join(
  evidenceRoot,
  "kie-pricing-snapshot-2026-08-22T08-03-40-316Z.json"
);
const metadataPath = path.join(
  evidenceRoot,
  "kie-pricing-pull-2026-08-22T08-03-40-316Z.json"
);
const manifestPath = path.join(
  evidenceRoot,
  "kie-pricing-reconciliation-2026-08-22T08-03-40-316Z.json"
);

interface TestRow {
  occurrenceId: string;
  disposition: string;
  mappedApiCityKeys: string[];
  official: Record<string, unknown>;
  selectorValues?: Record<string, unknown>;
  rateBasis?: { usdPrice: string; creditUnit?: string };
  unit?: string;
  officialUnit?: string;
  officialUnitQuantity?: number;
  unitAudit?: string;
  billingBasis?: string;
  billingComponent?: string;
  representativePayload?: Record<string, unknown>;
  representativeCases?: Array<Record<string, unknown>>;
  representativePricingMetadata?: Record<string, unknown>;
  rationale?: string;
  evidenceConflict?: {
    kind: string;
    queryModel?: string;
    officialUsd?: string;
    runtimeUsd?: string;
    runtimeKey?: string;
    runtimeVariant?: string;
  };
  canonicalKey?: string;
  technicalBlocker?: string;
  followUpBead?: string;
}

interface TestManifest {
  rows: TestRow[];
  apiCity: {
    models: Array<{ id: string; disposition?: string }>;
    schemaWithoutPricing: Array<{ id: string; disposition?: string }>;
    pricingOnly: Array<{ key: string; disposition?: string }>;
  };
  snapshot: { sha256: string; metadataSha256: string };
  source: { hashes: Record<string, string> };
  inventory: {
    baseline: {
      models: number;
      pricingKeys: number;
      slugKeys: number;
      displayKeys: number;
      schemaWithoutPricing: number;
      pricingOnly: number;
      endpoints: number;
    };
    final: {
      models: number;
      pricingKeys: number;
      slugKeys: number;
      displayKeys: number;
      schemaWithoutPricing: number;
      pricingOnly: number;
      endpoints: number;
    };
  };
  summary: {
    rows: {
      evidenceConflicts: {
        count: number;
        byKind: Record<string, number>;
        occurrenceIds: string[];
      };
    };
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

interface RuntimeCase {
  row: TestRow;
  key: string;
  payload: Record<string, unknown>;
  endpoint?: string;
  hints?: CostHints;
  estimate: CostEstimate;
  variant: string;
  perUnitUsd: number;
  units: number | undefined;
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

async function buildManifest(): Promise<TestManifest> {
  return (await buildReconciliationManifest({
    root,
    snapshotPath,
    metadataPath,
    generatedAt: "2026-08-22T08:03:47.658Z",
  })) as unknown as TestManifest;
}

function perUnitEntry(key: string): Extract<ModelPricing, { kind: "perUnit" }> {
  const entry = PRICING.kie[key];
  if (!entry || entry.kind !== "perUnit") {
    throw new Error(`expected per-unit Kie entry: ${key}`);
  }
  return entry;
}

function recordValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected an object");
  }
  return value as Record<string, unknown>;
}

function rowHints(row: TestRow): CostHints | undefined {
  const metadata = row.representativePricingMetadata;
  const hints = metadata?.costHints;
  return hints ? (recordValue(hints) as CostHints) : undefined;
}

function runtimeCase(row: TestRow): RuntimeCase {
  const key = row.mappedApiCityKeys[0];
  if (!key || !row.representativePayload) {
    throw new Error(
      `${row.occurrenceId} lacks an executable representative case`
    );
  }
  const entry = perUnitEntry(key);
  const { endpoint: endpointMetadata, ...payload } = row.representativePayload;
  const endpoint =
    typeof endpointMetadata === "string" ? endpointMetadata : undefined;
  const hints = rowHints(row);
  const estimate = computeEstimate({
    provider: "kie",
    payload,
    ...(endpoint ? { endpoint } : {}),
    ...(hints ? { costHints: hints } : {}),
  });
  const values = entry.select.map((selector) => selector.pick(payload, hints));
  const variant = values
    .filter((value): value is string => Boolean(value))
    .join("|");
  return {
    row,
    key,
    payload,
    endpoint,
    hints,
    estimate,
    variant,
    perUnitUsd: entry.rates[variant],
    units: entry.units(payload, hints),
  };
}

function runtimeCases(row: TestRow): RuntimeCase[] {
  return [
    runtimeCase(row),
    ...(row.representativeCases ?? []).map((payload) =>
      runtimeCase({ ...row, representativePayload: payload })
    ),
  ];
}

function implementedRows(manifest: TestManifest): TestRow[] {
  return manifest.rows.filter(
    (row) =>
      row.disposition === "implemented" || row.disposition === "canonical-alias"
  );
}

function executableRows(manifest: TestManifest): TestRow[] {
  return manifest.rows.filter(
    (row) =>
      (row.disposition === "implemented" ||
        row.disposition === "canonical-alias" ||
        row.disposition === "free-nonbillable") &&
      row.representativePayload !== undefined
  );
}

describe("Kie pricing reconciliation", () => {
  let generatedManifest: TestManifest;

  beforeAll(async () => {
    generatedManifest = await buildManifest();
  });

  it("requires every family rule to declare its reconciliation strategies", () => {
    expect(MODEL_FAMILY_REGISTRATIONS.length).toBeGreaterThan(0);
    expect(
      MODEL_FAMILY_REGISTRATIONS.every(
        (registration) =>
          registration.mapping.length > 0 &&
          registration.payloadStrategy.length > 0 &&
          registration.exceptionDisposition.length > 0
      )
    ).toBe(true);
    expect(
      new Set(
        MODEL_FAMILY_REGISTRATIONS.map((registration) => registration.family)
      ).size
    ).toBe(MODEL_FAMILY_REGISTRATIONS.length);
  });

  it("derives the authoritative source inventory counts", async () => {
    const inventory = (await collectApiCityInventories(root)) as TestInventory;

    expect(inventory.models).toHaveLength(138);
    expect(inventory.descriptors).toHaveLength(138);
    expect(inventory.guards).toHaveLength(138);
    expect(inventory.pricingKeys).toHaveLength(144);
    expect(inventory.slugKeys).toHaveLength(146);
    expect(inventory.displayKeys).toHaveLength(146);
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
      rows: 441,
      models: 138,
      endpoints: 71,
      pricingKeys: 144,
      slugs: 146,
      displays: 146,
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

    expect(manifest.apiCity.schemaWithoutPricing).toHaveLength(25);
    expect(manifest.apiCity.pricingOnly).toHaveLength(31);
    expect(manifest.inventory.baseline).toEqual({
      models: 127,
      pricingKeys: 135,
      slugKeys: 137,
      displayKeys: 137,
      schemaWithoutPricing: 23,
      pricingOnly: 31,
      endpoints: 71,
    });
    expect(manifest.inventory.final).toEqual({
      models: 138,
      pricingKeys: 144,
      slugKeys: 146,
      displayKeys: 146,
      schemaWithoutPricing: 25,
      pricingOnly: 31,
      endpoints: 71,
    });
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
    const manifest = generatedManifest;
    const seedance = manifest.rows.filter((row) =>
      row.mappedApiCityKeys.includes("bytedance/seedance-2-5")
    );

    expect(seedance).toHaveLength(6);
    expect(
      seedance.map((row) => [row.selectorValues, row.rateBasis?.usdPrice])
    ).toEqual([
      [{ resolution: "1080p", generate_audio: true }, "0.3425"],
      [{ resolution: "1080p", generate_audio: false }, "0.570"],
      [{ resolution: "720p", generate_audio: true }, "0.190"],
      [{ resolution: "720p", generate_audio: false }, "0.315"],
      [{ resolution: "480p", generate_audio: true }, "0.085"],
      [{ resolution: "480p", generate_audio: false }, "0.140"],
    ]);
  });

  it("executes every implemented official cell against its live Kie rate", async () => {
    const manifest = generatedManifest;
    const failures: string[] = [];
    for (const row of implementedRows(manifest)) {
      try {
        const runtime = runtimeCase(row);
        const officialUsd = Number(row.rateBasis?.usdPrice);
        if (!Number.isFinite(runtime.perUnitUsd)) {
          failures.push(
            `${row.occurrenceId}: no runtime rate for ${runtime.key}|${runtime.variant}`
          );
          continue;
        }
        if (runtime.estimate.warnings.length) {
          failures.push(
            `${row.occurrenceId}: warnings ${runtime.estimate.warnings.join("; ")}`
          );
          continue;
        }
        if (row.billingComponent === "extra") {
          const input = recordValue(runtime.payload.input);
          const baseInput = { ...input };
          if (runtime.key === "minimax-h3/image-to-video") {
            delete baseInput.first_frame_url;
            delete baseInput.last_frame_url;
          } else {
            baseInput.image_urls = ["https://example.com/a.png"];
          }
          const basePayload = { ...runtime.payload, input: baseInput };
          const base = computeEstimate({
            provider: "kie",
            payload: basePayload,
            ...(runtime.endpoint ? { endpoint: runtime.endpoint } : {}),
            ...(runtime.hints ? { costHints: runtime.hints } : {}),
          });
          if (Math.abs(runtime.estimate.usd - base.usd - officialUsd) > 1e-12) {
            failures.push(
              `${row.occurrenceId}: additive delta ${runtime.estimate.usd - base.usd} != official ${officialUsd}`
            );
          }
          if (
            Math.abs((runtime.estimate.breakdown.extraUsd ?? 0) - officialUsd) >
            1e-12
          ) {
            failures.push(
              `${row.occurrenceId}: extraUsd ${runtime.estimate.breakdown.extraUsd} != official ${officialUsd}`
            );
          }
          continue;
        }
        const additiveUsd = runtime.key.startsWith("minimax-h3/")
          ? (runtime.estimate.breakdown.extraUsd ?? 0)
          : 0;
        const primaryUsd = runtime.estimate.usd - additiveUsd;
        const quantity = row.officialUnitQuantity ?? 1;
        const expectedPerUnit =
          row.billingBasis === "fixed-bundle"
            ? officialUsd
            : officialUsd / quantity;
        if (Math.abs(runtime.perUnitUsd - expectedPerUnit) > 1e-12) {
          failures.push(
            `${row.occurrenceId}: perUnitUsd ${runtime.perUnitUsd} != normalized ${expectedPerUnit}`
          );
        }
        if (runtime.units === undefined) {
          failures.push(`${row.occurrenceId}: runtime units are undefined`);
        } else if (
          Math.abs(primaryUsd - runtime.units * runtime.perUnitUsd) > 1e-12
        ) {
          failures.push(
            `${row.occurrenceId}: primary total ${primaryUsd} != units ${runtime.units} × rate ${runtime.perUnitUsd}`
          );
        }
        if (row.billingBasis === "fixed-bundle") {
          if (Math.abs(primaryUsd - officialUsd) > 1e-12) {
            failures.push(
              `${row.occurrenceId}: fixed bundle total ${runtime.estimate.usd} != official ${officialUsd}`
            );
          }
        } else if (runtime.units !== undefined) {
          const expectedTotal = runtime.units * expectedPerUnit;
          if (Math.abs(primaryUsd - expectedTotal) > 1e-12) {
            failures.push(
              `${row.occurrenceId}: exact primary total ${primaryUsd} != normalized total ${expectedTotal}`
            );
          }
          if (row.officialUnitQuantity === 1_000) {
            if (runtime.units !== 1_000) {
              failures.push(
                `${row.occurrenceId}: character representative uses ${runtime.units} units, expected 1000`
              );
            }
            if (Math.abs(primaryUsd - officialUsd) > 1e-12) {
              failures.push(
                `${row.occurrenceId}: 1000-character total ${primaryUsd} != official ${officialUsd}`
              );
            }
          }
        }
      } catch (error) {
        failures.push(
          `${row.occurrenceId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it("safe-parses every createTask representative payload and variant case", async () => {
    const manifest = generatedManifest;
    const failures: string[] = [];
    for (const row of executableRows(manifest)) {
      const key = row.mappedApiCityKeys[0];
      if (!key || !Object.hasOwn(CREATE_TASK_GUARDS, key)) continue;
      const guard = CREATE_TASK_GUARDS[key as keyof typeof CREATE_TASK_GUARDS];
      for (const [index, runtime] of runtimeCases(row).entries()) {
        const parsed = guard.safeParse(runtime.payload);
        if (!parsed.success) {
          failures.push(
            `${row.occurrenceId}[${index}] ${key}: ${parsed.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join("; ")}`
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("executes mapped free rows as evidenced zero-cost estimates", async () => {
    const manifest = generatedManifest;
    const freeRows = executableRows(manifest).filter(
      (row) => row.disposition === "free-nonbillable"
    );
    expect(freeRows.length).toBeGreaterThan(0);
    for (const row of freeRows) {
      for (const runtime of runtimeCases(row)) {
        expect(runtime.estimate.source).toBe("per-unit-table");
        expect(runtime.estimate.breakdown.perUnitUsd).toBe(0);
        expect(runtime.estimate.usd).toBe(0);
        expect(runtime.estimate.warnings).toEqual([]);
      }
    }
  });

  it("proves Wan speech duration from frames divided by frames_per_second", async () => {
    const manifest = generatedManifest;
    const rows = implementedRows(manifest).filter((row) =>
      row.mappedApiCityKeys.includes("wan/2-2-a14b-speech-to-video-turbo")
    );
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      const runtime = runtimeCase(row);
      const input = recordValue(runtime.payload.input);
      expect(input.duration).toBeUndefined();
      expect(input.num_frames).toBe(80);
      expect(input.frames_per_second).toBe(16);
      expect(runtime.units).toBe(5);
      const doubled = {
        ...runtime.payload,
        input: { ...input, num_frames: 160, frames_per_second: 32 },
      };
      const doubledEstimate = computeEstimate({
        provider: "kie",
        payload: doubled,
      });
      expect(doubledEstimate.breakdown.units).toBe(5);
      expect(doubledEstimate.usd).toBe(runtime.estimate.usd);
    }
  });

  it("covers every reachable live Kie rate variant from official evidence", async () => {
    const manifest = generatedManifest;
    const cases = executableRows(manifest).flatMap(runtimeCases);
    const covered = new Set(
      cases.map((runtime) => `${runtime.key}|${runtime.variant}`)
    );
    const missing: string[] = [];
    for (const [key, entry] of Object.entries(PRICING.kie)) {
      if (entry.kind !== "perUnit") continue;
      for (const variant of Object.keys(entry.rates)) {
        const identity = `${key}|${variant}`;
        if (!covered.has(identity)) missing.push(identity);
      }
    }
    const liveIdentities = new Set(
      Object.entries(PRICING.kie).flatMap(([key, entry]) =>
        entry.kind === "perUnit"
          ? Object.keys(entry.rates).map((variant) => `${key}|${variant}`)
          : []
      )
    );
    expect(
      [...covered].filter((identity) => !liveIdentities.has(identity))
    ).toEqual([]);
    const exceptionIdentities = RUNTIME_VARIANT_EXCEPTIONS.map(
      (exception) => `${exception.key}|${exception.variant}`
    );
    expect(new Set(exceptionIdentities).size).toBe(exceptionIdentities.length);
    expect(
      exceptionIdentities.filter((identity) => !liveIdentities.has(identity))
    ).toEqual([]);
    expect(
      exceptionIdentities.filter((identity) => covered.has(identity))
    ).toEqual([]);
    expect(new Set(missing)).toEqual(new Set(exceptionIdentities));
    expect(
      RUNTIME_VARIANT_EXCEPTIONS.every(
        (exception) =>
          ["pricing-only", "legacy", "unreachable"].includes(
            exception.status
          ) &&
          exception.provenance.length > 0 &&
          exception.rationale.length > 0
      )
    ).toBe(true);
  });

  it("audits each runtime exception against the frozen official rows", async () => {
    const manifest = generatedManifest;
    const description = (row: TestRow) =>
      String(row.official.modelDescription ?? "");
    const rowsMatching = (pattern: RegExp) =>
      manifest.rows.filter((row) => pattern.test(description(row)));
    const rowMatching = (pattern: RegExp) => {
      const matches = rowsMatching(pattern);
      expect(matches, pattern.source).toHaveLength(1);
      return matches[0];
    };

    const grok1080 = rowMatching(/^grok-imagine, image-to-video, 1080p$/i);
    expect(grok1080).toMatchObject({
      disposition: "upstream-unmappable",
      mappedApiCityKeys: [],
      official: { usdPrice: "0.004", creditUnit: "per second" },
    });

    const qwen = rowMatching(/^Qwen Image, image-to-image$/);
    expect(qwen).toMatchObject({
      disposition: "upstream-unmappable",
      mappedApiCityKeys: [],
      official: { creditUnit: "per megapixel" },
    });
    expect(qwen.representativePayload).toBeUndefined();

    const seedance = rowMatching(
      /^bytedance\/seedance-2, 480p with video input$/
    );
    expect(seedance).toMatchObject({
      disposition: "upstream-unmappable",
      mappedApiCityKeys: [],
      official: { usdPrice: "0.057" },
    });

    expect(
      rowsMatching(/^(?:grok-imagine, )?upscale/i)
        .filter((row) => description(row).startsWith("grok-imagine, upscale"))
        .every((row) => row.disposition === "upstream-unmappable")
    ).toBe(true);
    expect(rowsMatching(/^grok-imagine, upscale/i)).toHaveLength(3);
    expect(rowsMatching(/^Topaz Image Upscaler, image-upscale/i)).toHaveLength(
      3
    );
    expect(
      rowsMatching(/^Topaz Image Upscaler, image-upscale/i).every(
        (row) => row.disposition === "upstream-unmappable"
      )
    ).toBe(true);

    const nanoRows = rowsMatching(/^Google nano banana/i);
    expect(nanoRows.length).toBeGreaterThan(0);
    expect(
      nanoRows.every((row) => !row.mappedApiCityKeys.includes("nano-banana"))
    ).toBe(true);
    expect(
      RUNTIME_VARIANT_EXCEPTIONS.find(
        (exception) => exception.key === "nano-banana"
      )?.status
    ).toBe("legacy");

    expect(
      rowsMatching(/^hailuo 02, image-to-video, Standard-6\.0s-512p$/i)
    ).toHaveLength(1);
    expect(
      rowsMatching(/^hailuo 02, image-to-video, Standard-10\.0s-768p$/i)
    ).toHaveLength(1);
    expect(
      rowsMatching(/^hailuo 02, image-to-video, Standard-6\.0s-768p$/i)
    ).toHaveLength(0);
    expect(rowsMatching(/runway.*extend/i)).toHaveLength(0);
    expect(rowsMatching(/sora.*watermark/i)).toHaveLength(0);
  });

  it("pins all Ideogram V3 Reframe rows to the unsupported handoff", async () => {
    const manifest = await readManifest();
    const reframeRows = manifest.rows.filter((row) =>
      /^Ideogram V3 Reframe, image to image, /i.test(
        String(row.official.modelDescription ?? "")
      )
    );
    const expectedBlocker =
      "Kie advertises and prices Ideogram V3 Reframe, but no current official API model slug or complete request/response contract is published for a callable ApiCity mapping.";
    const expectedRows = [
      ["Turbo", "0.0175"],
      ["Balanced", "0.035"],
      ["Quality", "0.05"],
    ] as const;

    expect(reframeRows).toHaveLength(3);
    expect(
      reframeRows
        .map((row) => [
          String(row.official.modelDescription).replace(
            /^Ideogram V3 Reframe, image to image, /i,
            ""
          ),
          String(row.official.usdPrice),
        ])
        .sort(([left], [right]) => left.localeCompare(right))
    ).toEqual(
      [...expectedRows].sort(([left], [right]) => left.localeCompare(right))
    );
    for (const row of reframeRows) {
      expect(row).toMatchObject({
        disposition: "unsupported-endpoint",
        mappedApiCityKeys: [],
        official: { anchor: "https://kie.ai/ideogram-reframe" },
        evidence: {
          url: "https://kie.ai/ideogram-reframe",
          source: "frozen official Kie snapshot",
        },
        technicalBlocker: expectedBlocker,
        followUpBead: "ac-flqhcu",
      });
    }

    const missingBlocker = await readManifest();
    const missingRow = missingBlocker.rows.find(
      (row) =>
        row.official.modelDescription ===
        "Ideogram V3 Reframe, image to image, Turbo"
    );
    if (!missingRow) throw new Error("missing Reframe Turbo row");
    delete missingRow.technicalBlocker;
    await expect(
      runCheck({ root, manifest: missingBlocker })
    ).rejects.toMatchObject({ code: "unsupported-without-blocker" });

    const weakenedBlocker = await readManifest();
    const weakenedRow = weakenedBlocker.rows.find(
      (row) =>
        row.official.modelDescription ===
        "Ideogram V3 Reframe, image to image, Turbo"
    );
    if (!weakenedRow) throw new Error("missing Reframe Turbo row");
    weakenedRow.technicalBlocker = "No API mapping.";
    await expect(
      runCheck({ root, manifest: weakenedBlocker })
    ).rejects.toMatchObject({ code: "classification-drift" });
  });

  it("keeps representativeCases distinct from their primary payload", async () => {
    const manifest = generatedManifest;
    for (const row of executableRows(manifest)) {
      const primary = JSON.stringify(row.representativePayload);
      const cases = (row.representativeCases ?? []).map((payload) =>
        JSON.stringify(payload)
      );
      expect(new Set(cases).size).toBe(cases.length);
      expect(cases).not.toContain(primary);
    }
  });

  it("uses explicit operation mappings before family names and rejects query conflicts", async () => {
    const manifest = generatedManifest;
    const expected = [
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
    const veoLite = manifest.rows.find(
      (candidate) =>
        candidate.official.modelDescription === "Google veo 3.1, Extend, Lite"
    );
    expect(veoLite).toMatchObject({
      disposition: "upstream-unmappable",
      mappedApiCityKeys: [],
    });

    const conflicts = manifest.rows.filter(
      (row) =>
        row.evidenceConflict?.kind === "query-description-operation-conflict"
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts.map((row) => row.official.modelDescription)).toEqual([
      "grok-imagine, text-to-image",
    ]);
    const rateConflicts = manifest.rows.filter(
      (row) => row.evidenceConflict?.kind === "rate-conflict"
    );
    expect(rateConflicts).toHaveLength(2);
    for (const identity of [
      "bytedance/seedance-2|480p|video",
      "grok-imagine/image-to-video|1080p",
    ]) {
      expect(
        RUNTIME_VARIANT_EXCEPTIONS.find(
          (exception) => `${exception.key}|${exception.variant}` === identity
        )?.status
      ).toBe("pricing-only");
    }
    expect(rateConflicts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          official: expect.objectContaining({
            modelDescription: "bytedance/seedance-2, 480p with video input",
          }),
          evidenceConflict: expect.objectContaining({
            officialUsd: "0.057",
            runtimeUsd: "0.0575",
            runtimeKey: "bytedance/seedance-2",
            runtimeVariant: "480p|video",
          }),
        }),
        expect.objectContaining({
          official: expect.objectContaining({
            modelDescription: "grok-imagine, image-to-video, 1080p",
          }),
          evidenceConflict: expect.objectContaining({
            officialUsd: "0.004",
            runtimeUsd: "0.04",
            runtimeKey: "grok-imagine/image-to-video",
            runtimeVariant: "1080p",
          }),
        }),
      ])
    );
    expect(manifest.summary.rows.evidenceConflicts.count).toBe(3);
    expect(manifest.summary.rows.evidenceConflicts.byKind).toEqual({
      "query-description-operation-conflict": 1,
      "rate-conflict": 2,
    });
    expect(manifest.summary.rows.evidenceConflicts.occurrenceIds).toEqual(
      expect.arrayContaining([
        conflicts[0].occurrenceId,
        ...rateConflicts.map((row) => row.occurrenceId),
      ])
    );
    const conflict = conflicts[0];
    expect(conflict).toMatchObject({
      disposition: "upstream-unmappable",
      mappedApiCityKeys: [],
      evidenceConflict: {
        kind: "query-description-operation-conflict",
      },
    });
  });

  it("rejects mutated operation mappings and unsupported memberships without hand-waving", async () => {
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
    const unsupported = wi6Manifest.apiCity.models.find(
      (entry) => entry.id === "qwen/image-to-image"
    );
    if (!unsupported) throw new Error("missing unsupported membership");
    unsupported.disposition = "supported";
    await expect(runCheck({ root, manifest: wi6Manifest })).rejects.toThrow();
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

  it("rejects a changed endpoint-docs source checksum", async () => {
    const manifest = await readManifest();
    manifest.source.hashes["scripts/endpoint-docs.tsv"] = "sha256:changed";

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "source-checksum-mismatch",
    });
  });

  it("rejects a changed shared-slug source checksum", async () => {
    const manifest = await readManifest();
    manifest.source.hashes["packages/provider/cost/src/slugs.ts"] =
      "sha256:changed";

    await expect(runCheck({ root, manifest })).rejects.toMatchObject({
      code: "source-checksum-mismatch",
    });
  });

  it("rejects selector fields outside the declared schema", async () => {
    const manifest = await readManifest();
    const row = manifest.rows.find(
      (candidate) => candidate.disposition === "implemented"
    );
    if (!row) throw new Error("expected an implemented row");
    if (!row.selectorValues) throw new Error("expected selector values");
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
    expect(markdown).toContain("## Runtime Variant Coverage");
    expect(markdown).toContain("| Schema model IDs | 127 | 138 |");
    expect(markdown).toContain("| Documented endpoints | 71 | 71 |");
    expect(markdown).toContain("| Runtime pricing keys | 135 | 144 |");
    expect(markdown).toContain(
      "| Schema-without-pricing inventory | 23 | 25 |"
    );
    expect(markdown).toContain("| Pricing-only inventory | 31 | 31 |");
    expect(markdown).toContain("| Slug keys | 137 | 146 |");
    expect(markdown).toContain("| Display keys | 137 | 146 |");
    expect(markdown).toContain("Zero unclassified raw rows");
    expect(markdown).toContain("Zero unclassified ApiCity keys");
  });
});
