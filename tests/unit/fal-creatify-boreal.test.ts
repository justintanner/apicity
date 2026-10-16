import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalCreatifyBorealRequest,
  type FalCreatifyBorealRequestInput,
  type FalCreatifyBorealParsedRequest,
  type FalCreatifyBorealResponse,
  type FalRunCreatifyNamespace,
} from "@apicity/fal";
import {
  FalCreatifyBorealRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";
const endpoint = "creatify/boreal";
const payload = {
  prompt: "A red panda waves once, then holds still.",
  duration: 1,
} satisfies FalCreatifyBorealRequest;
// Live OpenAPI 2026-10-16: 4de9559a3f93d1c11c0756430d5359a3f78579361451e79bc25d5316304f4020.
describe("Creatify Boreal", () => {
  it("exports the namespace, aliases and request schema", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.creatify)).toEqual(["boreal"]);
    expect(p.run.creatify.boreal).toBe(p.post.run.creatify.boreal);
    expect(p.run.creatify.boreal.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(p.run.creatify).toEqualTypeOf<FalRunCreatifyNamespace>();
    expectTypeOf(p.run.creatify.boreal)
      .parameter(0)
      .toEqualTypeOf<FalCreatifyBorealRequest>();
    expectTypeOf(
      p.run.creatify.boreal
    ).returns.resolves.toEqualTypeOf<FalCreatifyBorealResponse>();
    expectTypeOf<FalCreatifyBorealRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalCreatifyBorealParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the unchanged body to the documented endpoint", async () => {
    const response: FalCreatifyBorealResponse = {
      video: { url: "https://example.com/video.mp4" },
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(await p.run.creatify.boreal(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/creatify/boreal");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });
  it("requires prompt and preserves upstream defaults and optional nullable URLs", () => {
    expect(schema.parse({ prompt: "x" })).toEqual({
      prompt: "x",
      negative_prompt: "",
      resolution: "720p",
      aspect_ratio: "auto",
      duration: 10,
      manifest_disclosure: false,
      enable_safety_checker: true,
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(
      schema.parse({ ...payload, image_url: null, audio_url: null })
    ).toMatchObject({ image_url: null, audio_url: null });
    expect(
      schema.safeParse({ ...payload, image_url: "", audio_url: "" }).success
    ).toBe(true);
    expect(schema.safeParse({ ...payload, unknown: true }).success).toBe(true);
    expect(Object.keys(schema.shape).sort()).toEqual([
      "aspect_ratio",
      "audio_url",
      "duration",
      "enable_safety_checker",
      "image_url",
      "manifest_disclosure",
      "negative_prompt",
      "prompt",
      "resolution",
    ]);
  });
  it.each(["x", "x".repeat(5000)])("accepts prompt boundaries", (prompt) => {
    expect(schema.safeParse({ prompt }).success).toBe(true);
  });
  it.each(["", "x".repeat(5001), null, 3])(
    "rejects invalid prompt",
    (prompt) => {
      expect(schema.safeParse({ prompt }).success).toBe(false);
    }
  );
  it.each([1, 1.5, 10, 20])("accepts duration %s", (duration) => {
    expect(schema.safeParse({ ...payload, duration }).success).toBe(true);
  });
  it.each([0.99, 20.01, null, "1"])("rejects duration %s", (duration) => {
    expect(schema.safeParse({ ...payload, duration }).success).toBe(false);
  });
  it.each(["720p", "1080p", "2k"])("accepts resolution %s", (resolution) => {
    expect(schema.safeParse({ ...payload, resolution }).success).toBe(true);
  });
  it.each(["auto", "16:9", "9:16", "1:1", "4:3", "3:4"])(
    "accepts ratio %s",
    (aspect_ratio) => {
      expect(schema.safeParse({ ...payload, aspect_ratio }).success).toBe(true);
    }
  );
  it("rejects invalid optional field types and enum values", () => {
    for (const extra of [
      { resolution: "4k" },
      { aspect_ratio: "2:1" },
      { image_url: 3 },
      { audio_url: false },
      { negative_prompt: null },
      { manifest_disclosure: "false" },
      { enable_safety_checker: null },
    ])
      expect(schema.safeParse({ ...payload, ...extra }).success).toBe(false);
    expect(
      schema.safeParse({
        ...payload,
        negative_prompt: "",
        manifest_disclosure: true,
        enable_safety_checker: false,
      }).success
    ).toBe(true);
  });
});
describe("Creatify Boreal static pricing", () => {
  it.each([
    ["720p", 0.01],
    ["1080p", 0.03],
    ["2k", 0.12],
  ] as const)("prices %s seconds at the card rate", (resolution, rate) => {
    for (const duration of [1, 1.5, 10, 20]) {
      const result = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, resolution, duration },
      });
      expect(result.usd).toBeCloseTo(duration * rate, 10);
      expect(result.breakdown).toMatchObject({
        units: duration,
        unit: "seconds",
        perUnitUsd: rate,
      });
      expect(result.rateAsOf).toBe("2026-10-16");
      expect(result.warnings).toEqual([]);
    }
  });
  it("matches the recorded charge and applies omitted defaults", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(
      0.01
    );
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { prompt: payload.prompt },
      }).usd
    ).toBe(0.1);
  });
  it("warns on an unpriced resolution", () => {
    const result = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...payload, resolution: "4k" },
    });
    expect(result.usd).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
