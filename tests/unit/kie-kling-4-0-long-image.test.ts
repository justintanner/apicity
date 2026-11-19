import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import {
  Kling40LongImageRequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import evidence from "../fixtures/kie-pricing-evidence/kling-4-0-long-image-2026-11-19.json";

// Kling 4.0 Long Image, from https://docs.kie.ai/market/kling-4-0/long-image
// as read on 2026-11-19 (ac-zakqnf).
const model = "kling-4-0/long-image";
const CREDIT = 0.005;
const IMAGE = "https://example.com/product.png";
const ecommerce = {
  prompt: "A detail page for @image_1",
  skill: "ecommerce",
  image_urls: [IMAGE],
};
const webpage = { prompt: "A landing page", skill: "webpage" };

const messages = (input: Record<string, unknown>) => {
  const result = Kling40LongImageRequestSchema.safeParse({ model, input });
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

const estimate = (input: Record<string, unknown>) =>
  computeEstimate({ provider: "kie", payload: { model, input } });

describe("Kling 4.0 Long Image request schema", () => {
  it("is listed, guarded and reachable through the aggregate", () => {
    expect(KIE_MEDIA_MODELS).toContain(model);
    expect(CREATE_TASK_GUARDS[model]).toBe(Kling40LongImageRequestSchema);
    expect(
      MediaGenerationRequestSchema.safeParse({ model, input: ecommerce })
        .success
    ).toBe(true);
  });

  it("accepts each skill and leaves length unset", () => {
    expect(messages(ecommerce)).toEqual([]);
    expect(
      messages({ ...ecommerce, length: "long", resolution: "1k" })
    ).toEqual([]);
    expect(
      messages({ ...webpage, style_image: IMAGE, subject_image: IMAGE })
    ).toEqual([]);
    const parsed = Kling40LongImageRequestSchema.parse({
      model,
      input: webpage,
    });
    expect(parsed.input).toEqual({ ...webpage, resolution: "2k" });
  });

  it("requires skill and prompt", () => {
    expect(
      messages({ prompt: "x", image_urls: [IMAGE] }).length
    ).toBeGreaterThan(0);
    expect(messages({ skill: "webpage" }).length).toBeGreaterThan(0);
    expect(
      messages({ ...webpage, prompt: "x".repeat(20001) }).length
    ).toBeGreaterThan(0);
  });

  it("keeps each skill's fields to that skill", () => {
    expect(messages({ prompt: "x", skill: "ecommerce" })).toEqual([
      "ecommerce requires image_urls (1-3 product images)",
    ]);
    expect(messages({ ...ecommerce, style_image: IMAGE })).toEqual([
      "style_image is webpage only",
    ]);
    expect(
      messages({ ...webpage, image_urls: [IMAGE], length: "short" })
    ).toEqual(["image_urls is ecommerce only", "length is ecommerce only"]);
  });

  it("takes 1-3 public product images and the documented enums", () => {
    expect(messages({ ...ecommerce, image_urls: [] }).length).toBeGreaterThan(
      0
    );
    expect(
      messages({ ...ecommerce, image_urls: [IMAGE, IMAGE, IMAGE, IMAGE] })
        .length
    ).toBeGreaterThan(0);
    expect(
      messages({ ...ecommerce, image_urls: ["ftp://x/y.png"] }).length
    ).toBeGreaterThan(0);
    for (const bad of [
      { ...ecommerce, length: "huge" },
      { ...ecommerce, resolution: "4k" },
      { ...webpage, skill: "poster" },
      { ...webpage, images: [IMAGE] },
    ]) {
      expect(messages(bad).length, JSON.stringify(bad)).toBeGreaterThan(0);
    }
  });

  it("describes the same fields it parses", () => {
    const descriptor = modelInputSchemas[model];
    expect(descriptor.type).toBe("image");
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(Kling40LongImageRequestSchema.shape.input.shape).sort()
    );
    expect(descriptor.fields.length).not.toHaveProperty("default");
  });
});

describe("Kling 4.0 Long Image pricing", () => {
  const tierRows = evidence.feed.rows.filter(
    (row) => !/input image/.test(row.modelDescription)
  );

  it("holds the nine feed rows", () => {
    expect(evidence.feed.rows).toHaveLength(9);
    expect(tierRows).toHaveLength(8);
  });

  it.each(tierRows)("prices $modelDescription", (row) => {
    const text = row.modelDescription;
    const resolution = /1K$/.test(text) ? "1k" : "2k";
    const length = text.match(/E-commerce (Short|Medium|Long)/)?.[1];
    const input = length
      ? { ...ecommerce, length: length.toLowerCase(), resolution }
      : { ...webpage, resolution };
    // An ecommerce page always carries one product image here.
    const images = length ? 1 : 0;
    const result = estimate(input);
    expect(result.usd).toBeCloseTo(
      (Number(row.creditPrice) + 0.5 * images) * CREDIT,
      12
    );
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-19");
  });

  it("charges each input image and defaults ecommerce to medium 2k", () => {
    expect(
      estimate({ ...ecommerce, image_urls: [IMAGE, IMAGE, IMAGE] }).usd
    ).toBeCloseTo((99 + 1.5) * CREDIT, 12);
    expect(
      estimate({ ...webpage, style_image: IMAGE, subject_image: IMAGE }).usd
    ).toBeCloseTo((107.5 + 1) * CREDIT, 12);
  });

  it("fails a missing skill or a non-array image_urls closed", () => {
    expect(estimate({ prompt: "x", image_urls: [IMAGE] }).usd).toBe(0);
    expect(estimate({ ...ecommerce, image_urls: IMAGE }).usd).toBe(0);
  });

  it("matches the recorded ecommerce Short 1K bill of 43 credits", () => {
    const [recording] = evidence.recordings as Array<{
      request: Record<string, unknown>;
      creditsConsumed: number;
    }>;
    expect(recording.creditsConsumed).toBe(43);
    expect(estimate(recording.request).usd).toBeCloseTo(
      recording.creditsConsumed * CREDIT,
      12
    );
  });

  it("dates the entry to the feed anchor", () => {
    expect(PRICING.kie[model].source).toEqual({
      url: "https://kie.ai/kling-image-4-0?model=kling-4-0%2Flong-image",
      asOf: "2026-11-19",
    });
  });
});
