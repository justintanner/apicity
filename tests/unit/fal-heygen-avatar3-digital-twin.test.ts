import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalHeygenAvatar3DigitalTwinParsedRequest,
  type FalHeygenAvatar3DigitalTwinRequest,
  type FalHeygenAvatar3DigitalTwinRequestInput,
  type FalHeygenAvatar3DigitalTwinResponse,
  type FalRunHeygenAvatar3Namespace,
} from "@apicity/fal";
import {
  FalHeygenAvatar3DigitalTwinRequestSchema as schema,
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
// (sha256 c088f32e3ae911b2441ead3f5a600eec4f70f1e0bc63f3e863d578367e618ffc).
const endpoint = "fal-ai/heygen/avatar3/digital-twin";
const recorded = {
  character: { avatar: "Abigail Office Front" },
  voice: { prompt: "A red panda waves once, then holds still.", voice: "Ivy" },
  resolution: "360p",
} satisfies FalHeygenAvatar3DigitalTwinRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

describe("HeyGen Avatar 3 digital twin contract", () => {
  it("owns the avatar3 object under heygen, on both run aliases and the registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.heygen.avatar3.digitalTwin;
    expect(provider.run.heygen.avatar3).toHaveProperty("digitalTwin", leaf);
    expect(provider.run.heygen).toHaveProperty("heygenVideo");
    expect(leaf).toBe(provider.post.run.heygen.avatar3.digitalTwin);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.heygen.avatar3
    ).toEqualTypeOf<FalRunHeygenAvatar3Namespace>();
    expectTypeOf<FalHeygenAvatar3DigitalTwinRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalHeygenAvatar3DigitalTwinRequestInput>().toEqualTypeOf<FalHeygenAvatar3DigitalTwinRequest>();
    expectTypeOf<FalHeygenAvatar3DigitalTwinParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalHeygenAvatar3DigitalTwinResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
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
    await provider.run.heygen.avatar3.digitalTwin(recorded);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/heygen/avatar3/digital-twin"
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
      "character",
      "voice",
      "audio_url",
      "resolution",
      "aspect_ratio",
      "enable_safety_checker",
    ]);
    expect(Object.keys(schema.shape.character.shape)).toEqual([
      "avatar",
      "avatar_style",
    ]);
    expect(Object.keys(schema.shape.voice.shape)).toEqual([
      "prompt",
      "voice",
      "voice_id",
      "speed",
    ]);
    expect(schema.parse(recorded)).toEqual({
      character: { avatar: "Abigail Office Front", avatar_style: "closeUp" },
      voice: {
        prompt: "A red panda waves once, then holds still.",
        voice: "Ivy",
        speed: 1,
      },
      resolution: "360p",
      aspect_ratio: "16:9",
      enable_safety_checker: true,
    });
  });

  it("keeps fal's published stock catalogs: 1286 avatars and 102 voices", () => {
    const avatars = z.toJSONSchema(schema.shape.character.shape.avatar).enum;
    expect(avatars).toHaveLength(1286);
    expect(avatars?.[0]).toBe("Abigail (Upper Body)");
    expect(avatars).toContain("Florin Business Sitting Side");
    const voiceField = z.toJSONSchema(schema.shape.voice.shape.voice);
    const voices = (voiceField.anyOf ?? []).flatMap((v) =>
      typeof v === "object" && Array.isArray(v.enum) ? v.enum : []
    );
    expect(voices).toHaveLength(102);
    expect(voices.slice(0, 3)).toEqual([
      "Warm Pro Narrator",
      "Chill Brian",
      "Ivy",
    ]);
    // fal's validator accepted names outside both lists in a free 422 probe;
    // the schema keeps the published contract.
    expect(accepts({ character: { avatar: "Nobody Real Front" } })).toBe(false);
  });

  it("restates the field rules fal's validator confirmed in free 422 probes", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ ...recorded, character: {} }).success).toBe(
      false
    );
    expect(
      accepts({
        character: { avatar: "Abigail Office Front", avatar_style: "square" },
      })
    ).toBe(false);
    expect(accepts({ voice: { prompt: "hi", speed: 2.5 } })).toBe(false);
    expect(accepts({ voice: { prompt: "hi", speed: 0.4 } })).toBe(false);
    expect(accepts({ voice: { prompt: "hi", speed: 2 } })).toBe(true);
    expect(accepts({ voice: {} })).toBe(true);
    expect(
      accepts({
        voice: { prompt: null, voice: null, voice_id: null, speed: null },
        audio_url: null,
      })
    ).toBe(true);
    expect(accepts({ aspect_ratio: "auto" })).toBe(false);
    expect(accepts({ aspect_ratio: "4:5" })).toBe(true);
    expect(accepts({ resolution: "4k" })).toBe(false);
    expect(accepts({ foo: 1 })).toBe(true);
  });

  it("is dynamically priced: the spoken script sets the billed output seconds", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "HeyGen Avatar 3 Digital Twin"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "seconds of output video at $0.034"
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
