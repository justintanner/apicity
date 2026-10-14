import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  ViduQ4ImageToVideoRequestSchema as schema,
} from "@apicity/kie/zod";
import { computeEstimate } from "../../../packages/provider/cost/src/compute";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../../harness";

const model = "vidu-q4/image-to-video" as const;
const input = { image_url: "https://example.com/cat.jpg" };
const estimate = (extra: Record<string, unknown> = {}) =>
  computeEstimate({
    provider: "kie",
    payload: { model, input: { ...input, ...extra } },
  });

describe("Vidu Q4 image-to-video", () => {
  it.each([0, 20000])("accepts optional prompt length %i", (length) => {
    expect(
      schema.safeParse({
        model,
        input: { ...input, prompt: "p".repeat(length) },
      }).success
    ).toBe(true);
  });
  it.each([
    { prompt: "p".repeat(20001) },
    { duration: 2 },
    { duration: 17 },
    { duration: 3.5 },
    { resolution: "8k" },
    { image_url: "ftp://example.com/cat.jpg" },
    { image_url: "invalid" },
  ])("rejects invalid input %#", (extra) => {
    expect(
      schema.safeParse({ model, input: { ...input, ...extra } }).success
    ).toBe(false);
  });
  it("requires the image", () =>
    expect(schema.safeParse({ model, input: {} }).success).toBe(false));
  it.each([3, 16])("accepts duration boundary %i", (duration) =>
    expect(
      schema.safeParse({ model, input: { ...input, duration } }).success
    ).toBe(true)
  );
  it("applies defaults and strips unknown fields", () => {
    expect(
      CreateTaskRequestSchema.parse({
        model,
        input: { ...input, aspect_ratio: "16:9" },
      }).input
    ).toEqual({ ...input, duration: 5, resolution: "720p", audio: true });
  });
  it.each([
    ["540p", 0.036],
    ["720p", 0.076],
    ["1080p", 0.096],
    ["2k", 0.152],
    ["4k", 0.312],
  ] as const)("prices %s", (resolution, rate) => {
    expect(
      schema.safeParse({ model, input: { ...input, resolution } }).success
    ).toBe(true);
    expect(estimate({ resolution, duration: 3 }).usd).toBeCloseTo(3 * rate, 10);
  });
  it("uses documented defaults", () => {
    expect(estimate().usd).toBeCloseTo(0.38, 10);
    expect(estimate({ duration: 3 }).usd).toBeCloseTo(0.228, 10);
    expect(estimate({ resolution: "540p" }).usd).toBeCloseTo(0.18, 10);
  });
  it.each([true, false])("does not bill audio %s differently", (audio) =>
    expect(
      estimate({ audio, duration: 3, resolution: "540p" }).usd
    ).toBeCloseTo(0.108, 10)
  );
  it.each([null, "abc"])("fails closed for duration %s", (duration) => {
    const result = estimate({ duration });
    expect(result.usd).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it("ignores duration hints and legacy top-level duration", () => {
    const result = computeEstimate({
      provider: "kie",
      payload: { model, input, duration: 12 },
      costHints: { durationSeconds: 16 },
    });
    expect(result.usd).toBeCloseTo(0.38, 10);
  });
  it("rejects invalid input before transport", async () => {
    let calls = 0;
    const provider = createKie({
      apiKey: "test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      fetch: async () => {
        calls++;
        throw new Error("Transport must not run");
      },
    });
    const request = { model, input: { ...input, duration: 2 } };
    await expect(
      provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({ name: "KieError", status: 400 });
    expect(calls).toBe(0);
  });
});
