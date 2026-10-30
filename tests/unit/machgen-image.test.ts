import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MACHGEN_IMAGE_MODELS,
  MachGenGenerateRequestSchema,
} from "@apicity/machgen";
import { computeEstimate } from "@apicity/cost";

const payload = {
  model: "GPT-Image-2",
  task_type: "T2I",
  prompt: "A red circle.",
  image_config: { width: 1280, height: 544 },
  optimization_level: "EXPRESS",
};
const parse = (overrides: Record<string, unknown>) =>
  MachGenGenerateRequestSchema.safeParse({ ...payload, ...overrides });
const estimate = (overrides: Record<string, unknown> = {}) =>
  computeEstimate({
    provider: "machgen",
    payload: { ...payload, ...overrides },
  });

describe("MachGen image tasks", () => {
  it.each(MACHGEN_IMAGE_MODELS)(
    "accepts T2I and I2I for %s without video config",
    (model) => {
      expect(parse({ model }).success).toBe(true);
      expect(
        parse({
          model,
          task_type: "I2I",
          src_image_urls: ["https://example.com/cat.jpg"],
        }).success
      ).toBe(true);
      expect(
        parse({ model, task_type: "I2I", src_task_ids: ["previous-image"] })
          .success
      ).toBe(true);
      expect(
        parse({
          model,
          task_type: "T2V",
          video_config: { height: 720, duration_secs: 3 },
        }).success
      ).toBe(false);
    }
  );
  it("requires the appropriate config and a source for edits", () => {
    expect(parse({ image_config: undefined }).success).toBe(false);
    expect(parse({ image_config: { width: 1280 } }).success).toBe(false);
    expect(parse({ image_config: { height: 0 } }).success).toBe(false);
    expect(parse({ task_type: "I2I" }).success).toBe(false);
    expect(
      parse({
        task_type: "I2I",
        src_image_urls: ["data:image/png;base64,AA=="],
      }).success
    ).toBe(false);
    expect(parse({ model: "MiniMax-H3" }).success).toBe(false);
    expect(parse({ model: "MiniMax-H3", task_type: "T2V" }).success).toBe(
      false
    );
    expect(
      parse({
        model: "MiniMax-H3",
        task_type: "T2V",
        video_config: { height: 480, duration_secs: 1 },
      }).success
    ).toBe(true);
  });
  it("retains the model alias escape hatch for image tasks", () => {
    expect(parse({ model: "Future-Image-Model" }).success).toBe(true);
  });
  it("matches every captured image pricebook row for both task types", () => {
    const evidence = JSON.parse(
      readFileSync(
        "tests/fixtures/machgen-evidence/machgen-image-pricebook-2026-10-30.json",
        "utf8"
      )
    ) as {
      prices: {
        model: string;
        width: number | null;
        height: number;
        optimization_level: string | null;
        unit_price_micros: number;
      }[];
    };
    expect(new Set(evidence.prices.map((row) => row.model))).toEqual(
      new Set(MACHGEN_IMAGE_MODELS)
    );
    for (const row of evidence.prices) {
      for (const task_type of ["T2I", "I2I"]) {
        const result = estimate({
          model: row.model,
          task_type,
          image_config: {
            height: row.height,
            ...(row.width ? { width: row.width } : {}),
          },
          optimization_level: row.optimization_level ?? undefined,
        });
        expect(result.usd).toBeCloseTo(row.unit_price_micros / 1e6, 8);
        expect(result.warnings).toEqual([]);
      }
    }
  });
  it("defaults GPT Image 2 to high quality and declines unknown prices", () => {
    expect(estimate().usd).toBe(0.001385);
    expect(estimate({ optimization_level: undefined }).usd).toBe(0.048);
    for (const overrides of [
      { optimization_level: "FAST" },
      { image_config: { height: 544 } },
      { image_config: { width: 1, height: 1 } },
      { task_type: "T2V" },
    ]) {
      expect(estimate(overrides).warnings.length).toBeGreaterThan(0);
    }
  });
});
