import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  SeedreamFlashTextToImageRequestSchema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { zodToJsonSchema } from "../../../packages/cli/src/schema";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const model = "seedream/5-flash-text-to-image" as const;
const schema = SeedreamFlashTextToImageRequestSchema;

describe("Seedream 5 Flash text-to-image", () => {
  it.each([3, 5000])("accepts a %i-character prompt", (length) => {
    expect(
      schema.safeParse({ model, input: { prompt: "p".repeat(length) } }).success
    ).toBe(true);
  });

  it.each([0, 2, 5001])("rejects a %i-character prompt", (length) => {
    expect(
      schema.safeParse({ model, input: { prompt: "p".repeat(length) } }).success
    ).toBe(false);
  });

  it("exposes Flash size and defaults in the union and JSON schema", () => {
    const request = { model, input: { prompt: "A bright blue teapot" } };
    const parsed = CreateTaskRequestSchema.parse(request);
    expect(parsed.input).toEqual({
      ...request.input,
      aspect_ratio: "1:1",
      size: "1K",
      output_format: "png",
    });
    const json = zodToJsonSchema(schema);
    expect(JSON.stringify(json)).toContain('"1.5K"');
    expect(JSON.stringify(json)).not.toContain('"quality"');
  });

  it.each(["1K", "1.5K", "2K"])("accepts and prices size %s", (size) => {
    const payload = {
      model,
      input: { prompt: "A blue teapot", aspect_ratio: "21:9", size },
    };
    expect(schema.safeParse(payload).success).toBe(true);
    const estimate = computeEstimate({ provider: "kie", payload });
    expect(estimate.usd).toBe(0.0162);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([
    { size: "4K" },
    { aspect_ratio: "auto" },
    { output_format: "webp" },
    { nsfw_checker: "false" },
  ])("rejects unsupported input %j", (extra) => {
    expect(
      schema.safeParse({ model, input: { prompt: "A blue teapot", ...extra } })
        .success
    ).toBe(false);
  });

  it("rejects an unsupported size before transport", async () => {
    let calls = 0;
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      fetch: async () => {
        calls++;
        throw new Error("Transport must not run");
      },
    });
    const request = { model, input: { prompt: "A blue teapot", size: "4K" } };
    // Exercise the runtime guard with an intentionally invalid wire value.
    await expect(
      provider.post.api.v1.jobs.createTask(
        request as Parameters<typeof provider.post.api.v1.jobs.createTask>[0],
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
