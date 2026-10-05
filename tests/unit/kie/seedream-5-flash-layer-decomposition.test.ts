import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  SeedreamFlashLayerDecompositionRequestSchema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const model = "seedream/5-flash-layer-decomposition" as const;
const image_url = "https://example.com/source.png";
const schema = SeedreamFlashLayerDecompositionRequestSchema;

describe("Seedream 5 Flash layer decomposition", () => {
  it("defaults to auto and jpeg without requiring a prompt", () => {
    expect(
      CreateTaskRequestSchema.parse({ model, input: { image_url } }).input
    ).toEqual({ image_url, size: "auto", output_format: "jpeg" });
  });

  it.each([3, 5000])("accepts a %i-character selection prompt", (length) => {
    expect(
      schema.safeParse({
        model,
        input: { image_url, prompt: "p".repeat(length) },
      }).success
    ).toBe(true);
  });

  it.each([0, 2, 5001])("rejects a %i-character selection prompt", (length) => {
    expect(
      schema.safeParse({
        model,
        input: { image_url, prompt: "p".repeat(length) },
      }).success
    ).toBe(false);
  });

  it.each([undefined, "not a URL"])(
    "rejects an invalid source image %j",
    (image_url) => {
      expect(schema.safeParse({ model, input: { image_url } }).success).toBe(
        false
      );
    }
  );

  it("preserves bbox markup and the product-page safety option", () => {
    const input = {
      image_url,
      prompt: "Separate the subject <bbox>100 120 900 950</bbox>",
      nsfw_checker: true,
      size: "1K",
      output_format: "png",
    };
    expect(schema.parse({ model, input }).input).toEqual(input);
  });

  it.each(["1K", "1.5K", "2K"])("prices published size %s", (size) => {
    const payload = { model, input: { image_url, size } };
    expect(schema.safeParse(payload).success).toBe(true);
    const estimate = computeEstimate({
      provider: "kie",
      payload,
      costHints: { outputImages: 1 },
    });
    expect(estimate.usd).toBe(0.0162);
    expect(estimate.warnings).toEqual([]);
  });

  it("does not invent a published price for auto", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input: { image_url } },
      costHints: { outputImages: 1 },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it("matches the live two-image charge", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input: { image_url, size: "1K" } },
      costHints: { outputImages: 2 },
    });
    expect(estimate.usd).toBe(0.0324);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([undefined, 0, -1, 1.5, NaN, Infinity])(
    "requires a valid output-image count: %s",
    (outputImages) => {
      const estimate = computeEstimate({
        provider: "kie",
        payload: { model, input: { image_url, size: "1K" } },
        costHints: { outputImages },
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.length).toBeGreaterThan(0);
    }
  );

  it("rejects an unsupported size before transport", async () => {
    let calls = 0;
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      fetch: async () => {
        calls++;
        throw new Error("Must reject before transport");
      },
    });
    const request = { model, input: { image_url, size: "4K" } };
    await expect(
      provider.post.api.v1.jobs.createTask(
        request as Parameters<typeof provider.post.api.v1.jobs.createTask>[0],
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
