import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  SeedreamFlashImageToImageRequestSchema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { zodToJsonSchema } from "../../../packages/cli/src/schema";
import { modelInputSchemas } from "../../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const model = "seedream/5-flash-image-to-image" as const;
const image = "https://example.com/reference.png";
const schema = SeedreamFlashImageToImageRequestSchema;
const input = {
  prompt: "Restyle the scene as watercolor",
  image_urls: [image],
};

describe("Seedream 5 Flash image-to-image", () => {
  it.each([1, 10])("accepts %i reference images", (count) => {
    expect(
      schema.safeParse({
        model,
        input: {
          ...input,
          image_urls: Array.from({ length: count }, () => image),
        },
      }).success
    ).toBe(true);
  });

  it.each([
    undefined,
    [],
    Array.from({ length: 11 }, () => image),
    ["not a URL"],
  ])("rejects invalid references %j", (image_urls) => {
    expect(
      schema.safeParse({ model, input: { ...input, image_urls } }).success
    ).toBe(false);
  });

  it.each([3, 5000])("accepts %i prompt characters", (length) => {
    expect(
      schema.safeParse({
        model,
        input: { ...input, prompt: "p".repeat(length) },
      }).success
    ).toBe(true);
  });

  it.each([2, 5001])("rejects %i prompt characters", (length) => {
    expect(
      schema.safeParse({
        model,
        input: { ...input, prompt: "p".repeat(length) },
      }).success
    ).toBe(false);
  });

  it("exposes the edit schema and defaults through createTask", () => {
    expect(CreateTaskRequestSchema.parse({ model, input }).input).toEqual({
      ...input,
      aspect_ratio: "1:1",
      size: "1K",
      output_format: "png",
    });
    expect(JSON.stringify(zodToJsonSchema(schema))).toContain('"maxItems":10');
    expect(modelInputSchemas[model].fields.image_urls).toMatchObject({
      required: true,
      minItems: 1,
      maxItems: 10,
    });
  });

  it.each(["1K", "1.5K", "2K"])("prices the documented %s tier", (size) => {
    const payload = { model, input: { ...input, size, aspect_ratio: "21:9" } };
    expect(schema.safeParse(payload).success).toBe(true);
    const estimate = computeEstimate({ provider: "kie", payload });
    expect(estimate.usd).toBe(0.0162);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([
    { size: "4K" },
    { aspect_ratio: "auto" },
    { output_format: "webp" },
  ])("rejects unsupported options %j", (options) => {
    expect(
      schema.safeParse({ model, input: { ...input, ...options } }).success
    ).toBe(false);
  });

  it("rejects empty references before transport", async () => {
    let calls = 0;
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      fetch: async () => {
        calls++;
        throw new Error("Must reject before transport");
      },
    });
    const request = { model, input: { ...input, image_urls: [] } };
    await expect(
      provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
