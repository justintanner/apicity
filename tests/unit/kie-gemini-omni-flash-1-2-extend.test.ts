import { describe, expect, it } from "vitest";
import { computeEstimate, PRICING } from "@apicity/cost";
import {
  GoogleGeminiOmniFlash12ExtendRequestSchema,
  KIE_MEDIA_MODELS,
  MediaGenerationRequestSchema,
} from "../../packages/provider/kie/src/zod";
import { CREATE_TASK_GUARDS } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import evidence from "../fixtures/kie-pricing-evidence/google-gemini-omni-flash-1-2-extend-2026-11-19.json";

// Gemini Omni Flash 1.2 Extend, from
// https://docs.kie.ai/market/google/gemini-omni-flash-1-2-extend as read on
// 2026-11-19 (ac-20k2yx).
const model = "google/gemini-omni-flash-1-2-extend";
const CREDIT = 0.005;
const base = { task_id: "task-source", prompt: "The robot waves", duration: 3 };

const parse = (input: Record<string, unknown>) =>
  GoogleGeminiOmniFlash12ExtendRequestSchema.safeParse({ model, input });

const estimate = (input: Record<string, unknown>, inputResolution?: string) =>
  computeEstimate({
    provider: "kie",
    payload: { model, input },
    ...(inputResolution ? { costHints: { inputResolution } } : {}),
  });

describe("Gemini Omni Flash 1.2 Extend request schema", () => {
  it("is listed, guarded and reachable through the aggregate", () => {
    expect(KIE_MEDIA_MODELS).toContain(model);
    expect(CREATE_TASK_GUARDS[model]).toBe(
      GoogleGeminiOmniFlash12ExtendRequestSchema
    );
    expect(
      MediaGenerationRequestSchema.safeParse({ model, input: base }).success
    ).toBe(true);
  });

  it("requires task_id, prompt and duration", () => {
    expect(parse(base).success).toBe(true);
    for (const field of ["task_id", "prompt", "duration"] as const) {
      const input: Record<string, unknown> = { ...base };
      delete input[field];
      expect(parse(input).success, field).toBe(false);
    }
    expect(parse({ ...base, task_id: "" }).success).toBe(false);
    expect(parse({ ...base, prompt: "" }).success).toBe(false);
    expect(parse({ ...base, prompt: "x".repeat(20001) }).success).toBe(false);
  });

  it("takes an integer duration of 3-10 added seconds", () => {
    for (const duration of [3, 10]) {
      expect(parse({ ...base, duration }).success, String(duration)).toBe(true);
    }
    for (const duration of [2, 11, 4.5, "5"]) {
      expect(parse({ ...base, duration }).success, String(duration)).toBe(
        false
      );
    }
  });

  it("takes up to 3 reference image URLs", () => {
    const url = "https://example.com/ref.png";
    expect(parse({ ...base, image_urls: [url, url, url] }).success).toBe(true);
    expect(parse({ ...base, image_urls: [url, url, url, url] }).success).toBe(
      false
    );
    expect(parse({ ...base, image_urls: ["not a url"] }).success).toBe(false);
  });

  it("describes the same fields it parses", () => {
    const descriptor = modelInputSchemas[model];
    expect(descriptor.type).toBe("video");
    expect(Object.keys(descriptor.fields).sort()).toEqual(
      Object.keys(
        GoogleGeminiOmniFlash12ExtendRequestSchema.shape.input.shape
      ).sort()
    );
    expect(descriptor.fields.duration).toMatchObject({
      type: "integer",
      required: true,
      minimum: 3,
      maximum: 10,
    });
  });
});

describe("Gemini Omni Flash 1.2 Extend pricing", () => {
  it("holds the two feed rows", () => {
    expect(
      evidence.feed.rows.map((row) => row.modelDescription).sort()
    ).toEqual([
      "google/gemini-omni-flash-1-2-extend, video, 360p",
      "google/gemini-omni-flash-1-2-extend, video, 720p",
    ]);
  });

  it.each(evidence.feed.rows)(
    "prices $modelDescription per added second",
    (row) => {
      const resolution = row.modelDescription.slice(-4);
      const result = estimate({ ...base, duration: 5 }, resolution);
      expect(result.usd).toBeCloseTo(5 * Number(row.creditPrice) * CREDIT, 12);
      expect(result.usd).toBeCloseTo(5 * Number(row.usdPrice), 12);
      expect(result.breakdown).toMatchObject({ units: 5, unit: "seconds" });
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe("2026-11-19");
    }
  );

  it.each([undefined, "1080p", "480p"])(
    "fails closed when the source resolution is %s",
    (resolution) => {
      const result = estimate(base, resolution);
      expect(result.usd).toBe(0);
      expect(result.warnings.join(" ")).toContain("costHints.inputResolution");
    }
  );

  it.each([2, 11, 4.5])("fails duration %s closed", (duration) => {
    expect(estimate({ ...base, duration }, "360p").usd).toBe(0);
  });

  it("matches the recorded 3 s extend of a 360p source: 12 credits", () => {
    const extend = evidence.recordings.find((r) => r.role === "extend")!;
    expect(extend.creditsConsumed).toBe(12);
    expect(estimate(extend.request, extend.sourceResolution).usd).toBeCloseTo(
      extend.creditsConsumed * CREDIT,
      12
    );
  });

  it("points at the extend tab of the 1.2 page", () => {
    expect(PRICING.kie[model].source).toEqual({
      url: "https://kie.ai/gemini-omni-1-2-flash?model=google%2Fgemini-omni-flash-1-2-extend",
      asOf: "2026-11-19",
    });
  });
});
