import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMinimaxH3MaxStylesVhsRequest,
  type FalMinimaxH3MaxStylesVhsRequestInput,
  type FalMinimaxH3MaxStylesVhsParsedRequest,
  type FalMinimaxH3MaxStylesVhsResponse,
  type FalRunMinimaxH3MaxStylesNamespace,
} from "@apicity/fal";
import {
  FalMinimaxH3MaxStylesVhsRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "minimax/h3-max/styles/vhs";
const payload = {
  prompt: "A red panda waves once, then holds still.",
  duration: 5,
} satisfies FalMinimaxH3MaxStylesVhsRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("MiniMax H3 Max VHS styled text-to-video", () => {
  it("exports the owned styles namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.minimax.h3Max.styles)).toEqual([
      "sixteenBitPixel",
      "handDrawn",
      "lowPoly",
      "retroToon70s",
      "vhs",
    ]);
    expect(p.run.minimax.h3Max.styles.vhs).toBe(
      p.post.run.minimax.h3Max.styles.vhs
    );
    expect(p.run.minimax.h3Max.styles.vhs.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.minimax.h3Max.styles
    ).toEqualTypeOf<FalRunMinimaxH3MaxStylesNamespace>();
    expectTypeOf(p.run.minimax.h3Max.styles.vhs)
      .parameter(0)
      .toEqualTypeOf<FalMinimaxH3MaxStylesVhsRequest>();
    expectTypeOf(
      p.run.minimax.h3Max.styles.vhs
    ).returns.resolves.toEqualTypeOf<FalMinimaxH3MaxStylesVhsResponse>();
    expectTypeOf<FalMinimaxH3MaxStylesVhsRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMinimaxH3MaxStylesVhsParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalMinimaxH3MaxStylesVhsResponse = {
      video: {
        url: "https://example.com/vhs.mp4",
        content_type: "video/mp4",
        file_name: null,
        file_size: null,
      },
      seed: 42,
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
    expect(await p.run.minimax.h3Max.styles.vhs(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/minimax/h3-max/styles/vhs");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output declares both video and seed required.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalMinimaxH3MaxStylesVhsResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalMinimaxH3MaxStylesVhsResponse>();
  });
  it("requires a non-empty prompt and applies all documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(valid({ prompt: "" })).toBe(false);
    expect(valid({ prompt: null })).toBe(false);
    expect(schema.parse({ prompt: payload.prompt })).toEqual({
      prompt: payload.prompt,
      damage_level: "medium",
      duration: 5,
      aspect_ratio: "16:9",
    });
    for (const key of ["damage_level", "duration", "aspect_ratio"])
      expect(valid({ [key]: null })).toBe(false);
  });
  it("refuses unknown fields because the input is closed", () => {
    expect(valid({ resolution: "768P" })).toBe(false);
    expect(valid({ generate_audio: true })).toBe(false);
  });
  it("bounds the prompt to 49910 characters", () => {
    for (const prompt of ["x", "x".repeat(49910)])
      expect(valid({ prompt })).toBe(true);
    expect(valid({ prompt: "x".repeat(49911) })).toBe(false);
  });
  it("bounds duration to integer seconds 5 through 15", () => {
    for (const duration of [5, 10, 15]) expect(valid({ duration })).toBe(true);
    for (const duration of [4, 16, 5.5, "5"])
      expect(valid({ duration })).toBe(false);
  });
  it("takes the three damage levels and six aspect ratios", () => {
    for (const damage_level of ["light", "medium", "heavy"])
      expect(valid({ damage_level })).toBe(true);
    expect(valid({ damage_level: "extreme" })).toBe(false);
    for (const aspect_ratio of ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"])
      expect(valid({ aspect_ratio })).toBe(true);
    expect(valid({ aspect_ratio: "2:3" })).toBe(false);
  });
  it("accepts null or omission for the optional image and seed", () => {
    for (const key of ["image_url", "seed"]) {
      expect(valid({ [key]: null })).toBe(true);
      expect(valid({ [key]: undefined })).toBe(true);
    }
    expect(valid({ image_url: "https://example.com/frame.jpg" })).toBe(true);
    expect(valid({ image_url: 1 })).toBe(false);
    expect(valid({ seed: 7 })).toBe(true);
    for (const seed of [1.5, "7"]) expect(valid({ seed })).toBe(false);
  });
});

describe("MiniMax H3 Max VHS pricing", () => {
  it("prices the recorded five-second call at exactly $0.40", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(
      0.4
    );
    expect(MODEL_SLUGS.fal[endpoint]).toBe("h3mstyle");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("H3 Max VHS");
  });
  it("bills each requested second at the card's $0.08 and defaults to 5", () => {
    for (const duration of [5, 10, 15])
      expect(
        computeEstimate({
          provider: "fal",
          endpoint,
          payload: { prompt: payload.prompt, duration },
        }).usd
      ).toBeCloseTo(duration * 0.08, 10);
    expect(
      computeEstimate({
        provider: "fal",
        endpoint,
        payload: { prompt: payload.prompt },
      }).usd
    ).toBe(0.4);
  });
});
