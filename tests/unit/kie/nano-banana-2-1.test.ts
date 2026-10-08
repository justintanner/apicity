import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  NanoBanana21RequestSchema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const model = "nano-banana-2-1" as const;
const schema = NanoBanana21RequestSchema;

describe("Nano Banana 2.1", () => {
  it.each([1, 20000])("accepts a %i-character prompt", (length) => {
    expect(
      schema.safeParse({ model, input: { prompt: "p".repeat(length) } }).success
    ).toBe(true);
  });

  it.each([0, 20001])("rejects a %i-character prompt", (length) => {
    expect(
      schema.safeParse({ model, input: { prompt: "p".repeat(length) } }).success
    ).toBe(false);
  });

  it("applies the documented defaults and drops unknown fields", () => {
    const parsed = CreateTaskRequestSchema.parse({
      model,
      input: { prompt: "A red apple on a white table", google_search: true },
    });
    expect(parsed.input).toEqual({
      prompt: "A red apple on a white table",
      aspect_ratio: "auto",
      resolution: "1K",
      output_format: "jpg",
    });
  });

  it("accepts ten reference images and rejects eleven", () => {
    const urls = (count: number) =>
      Array.from(
        { length: count },
        (_, index) => `https://example.com/reference-${index}.png`
      );
    expect(
      schema.safeParse({
        model,
        input: {
          prompt: "A product variation",
          image_input: urls(10),
          aspect_ratio: "8:1",
          resolution: "4K",
          output_format: "png",
        },
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        model,
        input: { prompt: "A product variation", image_input: urls(11) },
      }).success
    ).toBe(false);
  });

  it.each([
    ["1K", 0.02],
    ["2K", 0.03],
    ["4K", 0.045],
  ] as const)("prices resolution %s at $%s", (resolution, usd) => {
    const payload = {
      model,
      input: { prompt: "A red apple", resolution },
    };
    expect(schema.safeParse(payload).success).toBe(true);
    const estimate = computeEstimate({ provider: "kie", payload });
    expect(estimate.usd).toBe(usd);
    expect(estimate.warnings).toEqual([]);
  });

  it("prices an omitted resolution at the documented 1K default", () => {
    const estimate = computeEstimate({
      provider: "kie",
      payload: { model, input: { prompt: "A red apple" } },
    });
    expect(estimate.usd).toBe(0.02);
    expect(estimate.warnings).toEqual([]);
  });

  it.each([
    { resolution: "8K" },
    { output_format: "jpeg" },
    { aspect_ratio: "square" },
  ])("rejects unsupported input %j", (extra) => {
    expect(
      schema.safeParse({ model, input: { prompt: "A red apple", ...extra } })
        .success
    ).toBe(false);
  });

  it("rejects an unsupported resolution before transport", async () => {
    let calls = 0;
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      fetch: async () => {
        calls++;
        throw new Error("Transport must not run");
      },
    });
    const request = {
      model,
      input: { prompt: "A red apple", resolution: "8K" },
    };
    await expect(
      provider.post.api.v1.jobs.createTask(
        request as Parameters<typeof provider.post.api.v1.jobs.createTask>[0],
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
