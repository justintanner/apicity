import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenAvatar5DigitalTwinParsedRequest,
  type FalHeygenAvatar5DigitalTwinRequest,
  type FalHeygenAvatar5DigitalTwinRequestInput,
  type FalHeygenAvatar5DigitalTwinResponse,
  type FalRunHeygenAvatar5Namespace,
} from "@apicity/fal";
import {
  FalHeygenAvatar5DigitalTwinRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  falDynamicBilledUnit,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-23
// (sha256 86e5a05104f3b9a5b19186e924335ada4f6ce52f8796e5050f66070455820740).
const endpoint = "fal-ai/heygen/avatar5/digital-twin";
const recorded = {
  prompt: "A red panda waves once, then holds still.",
} satisfies FalHeygenAvatar5DigitalTwinRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Avatar 5 digital twin contract", () => {
  it("owns the avatar5 object under heygen, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.avatar5.digitalTwin;
    expect(provider.run.heygen.avatar5).toHaveProperty("digitalTwin", leaf);
    expect(provider.run.heygen).toHaveProperty("avatar4");
    expect(leaf).toBe(provider.post.run.heygen.avatar5.digitalTwin);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.avatar5
    ).toEqualTypeOf<FalRunHeygenAvatar5Namespace>();
    expectTypeOf<FalHeygenAvatar5DigitalTwinRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenAvatar5DigitalTwinRequestInput>().toEqualTypeOf<FalHeygenAvatar5DigitalTwinRequest>();
    expectTypeOf<FalHeygenAvatar5DigitalTwinParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenAvatar5DigitalTwinResponse["video"]>().toEqualTypeOf<{
      url: string;
      content_type?: string | null;
      file_name?: string | null;
      file_size?: number | null;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ video: { url: "https://example.com/out.mp4" } }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.heygen.avatar5.digitalTwin(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/heygen/avatar5/digital-twin"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order with their defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "avatar",
      "prompt",
      "voice",
      "audio_url",
      "fit",
      "remove_background",
      "background",
      "watermark",
      "caption",
      "output_format",
      "resolution",
      "aspect_ratio",
      "enable_safety_checker",
    ]);
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      avatar: "Abigail Sofa Front",
      voice: "Warm Pro Narrator",
      fit: "cover",
      remove_background: false,
      caption: false,
      output_format: "mp4",
      resolution: "720p",
      aspect_ratio: "16:9",
      enable_safety_checker: true,
    });
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(true);
    expect(accepts({ avatar: "Any Avatar V Name" })).toBe(true);
    expect(accepts({ fit: "stretch" })).toBe(false);
    expect(accepts({ output_format: "gif" })).toBe(false);
    expect(accepts({ output_format: "webm" })).toBe(true);
    expect(accepts({ resolution: "360p" })).toBe(false);
    expect(accepts({ resolution: "4k" })).toBe(true);
    expect(accepts({ background: { type: "video", value: "u" } })).toBe(false);
    expect(accepts({ background: { type: "image", value: "u" } })).toBe(true);
    expect(accepts({ watermark: { scale: 1 } })).toBe(false);
    expect(accepts({ watermark: { image_url: "u", scale: 0 } })).toBe(false);
    expect(accepts({ watermark: { image_url: "u", scale: 2 } })).toBe(true);
    expect(accepts({ watermark: { image_url: "u", scale: 2.5 } })).toBe(false);
    expect(accepts({ watermark: { image_url: "u", opacity: -0.1 } })).toBe(
      false
    );
    expect(
      accepts({ watermark: { image_url: "u", placement: "center" } })
    ).toBe(false);
    expect(
      accepts({
        avatar: null,
        prompt: null,
        voice: null,
        audio_url: null,
        background: null,
        watermark: null,
      })
    ).toBe(true);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the spoken script sets the billed output seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Avatar 5 Digital Twin"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "seconds of output video at $0.10"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
