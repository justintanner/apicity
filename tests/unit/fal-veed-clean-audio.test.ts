import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalVeedCleanAudioRequest,
  type FalVeedCleanAudioRequestInput,
  type FalVeedCleanAudioParsedRequest,
  type FalVeedCleanAudioResponse,
  type FalRunVeedNamespace,
} from "@apicity/fal";
import {
  FalVeedCleanAudioRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";

// Live OpenAPI 2026-10-16: 6e3d1459cc036ff2a92524941163b50bc25ba75a08b4cea2c949ae7637e08df6.
const endpoint = "veed/clean-audio";
const payload = {
  audio_url: "data:audio/mpeg;base64,YQ==",
} satisfies FalVeedCleanAudioRequest;

describe("VEED Clean Audio", () => {
  it("exposes the namespace, aliases, request types and registry schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    expect(Object.keys(provider.run.veed)).toEqual(["cleanAudio"]);
    expect(provider.run.veed.cleanAudio).toBe(
      provider.post.run.veed.cleanAudio
    );
    expect(provider.run.veed.cleanAudio.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.veed).toEqualTypeOf<FalRunVeedNamespace>();
    expectTypeOf(provider.run.veed.cleanAudio)
      .parameter(0)
      .toEqualTypeOf<FalVeedCleanAudioRequest>();
    expectTypeOf(
      provider.run.veed.cleanAudio
    ).returns.resolves.toEqualTypeOf<FalVeedCleanAudioResponse>();
    expectTypeOf<FalVeedCleanAudioRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalVeedCleanAudioRequestInput>().toEqualTypeOf<FalVeedCleanAudioRequest>();
    expectTypeOf<FalVeedCleanAudioParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalVeedCleanAudioResponse>().toEqualTypeOf<{
      audio: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      audio_duration: number;
    }>();
  });

  it("posts the unchanged request to the documented URL", async () => {
    const response: FalVeedCleanAudioResponse = {
      audio: { url: "https://example.com/clean.flac" },
      audio_duration: 6.008,
    };
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    expect(await provider.run.veed.cleanAudio(payload)).toEqual(response);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/veed/clean-audio");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });

  it("requires only audio_url and applies documented defaults", () => {
    expect(Object.keys(schema.shape).sort()).toEqual([
      "audio_url",
      "output_format",
      "strength",
      "target_lufs",
    ]);
    expect(schema.parse(payload)).toEqual({
      ...payload,
      strength: 0.874,
      target_lufs: -19,
      output_format: "flac",
    });
    expect(schema.safeParse({}).error?.issues.map((x) => x.path)).toEqual([
      ["audio_url"],
    ]);
    for (const audio_url of [null, 3, {}])
      expect(schema.safeParse({ audio_url }).success).toBe(false);
    // Upstream declares a plain string, without a URL pattern or minLength.
    expect(schema.safeParse({ audio_url: "" }).success).toBe(true);
    expect(schema.safeParse({ ...payload, unknown_field: true }).success).toBe(
      true
    );
  });

  it.each([0, 0.874, 1])("accepts strength %s", (strength) => {
    expect(schema.safeParse({ ...payload, strength }).success).toBe(true);
  });
  it.each([-0.001, 1.001, null, "0.5"])("rejects strength %s", (strength) => {
    expect(schema.safeParse({ ...payload, strength }).success).toBe(false);
  });
  it.each([-40, -19, -8, null])("accepts target_lufs %s", (target_lufs) => {
    expect(schema.parse({ ...payload, target_lufs }).target_lufs).toBe(
      target_lufs
    );
  });
  it.each([-40.001, -7.999, "-19"])("rejects target_lufs %s", (target_lufs) => {
    expect(schema.safeParse({ ...payload, target_lufs }).success).toBe(false);
  });
  it.each(["flac", "wav"])("accepts output_format %s", (output_format) => {
    expect(schema.safeParse({ ...payload, output_format }).success).toBe(true);
  });
  it.each(["mp3", "not-a-format", null])(
    "rejects output_format %s",
    (output_format) => {
      expect(schema.safeParse({ ...payload, output_format }).success).toBe(
        false
      );
    }
  );
});

describe("VEED Clean Audio pricing", () => {
  it.each([
    [0.1, 1],
    [5.952, 1],
    [6.008, 1],
    [60, 1],
    [60.49, 1],
    [60.5, 2],
    [120, 2],
    [600, 10],
    [1800, 30],
  ])("prices %s input seconds as %s minutes", (durationSeconds, minutes) => {
    const result = computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      costHints: { durationSeconds },
    });
    expect(result.breakdown).toEqual({
      units: minutes * 60,
      unit: "seconds",
      perUnitUsd: 0.0125 / 60,
    });
    expect(result.usd).toBeCloseTo(minutes * 0.0125, 10);
    expect(result.rateAsOf).toBe("2026-10-16");
    expect(result.warnings).toEqual([]);
  });
  it.each([undefined, 0, -1, NaN, Infinity])(
    "warns for unusable input duration %s",
    (durationSeconds) => {
      const result = computeEstimate({
        provider: "fal",
        endpoint,
        payload: { ...payload, duration: 60, audio_duration: 60 },
        costHints: { durationSeconds },
      });
      expect(result.usd).toBe(0);
      expect(result.warnings).toEqual([
        "fal 'veed/clean-audio': input audio duration is required; pass costHints.durationSeconds",
      ]);
    }
  );
  it("prices the recorded call and the card examples exactly", () => {
    const usd = (durationSeconds: number) =>
      computeEstimate({
        provider: "fal",
        endpoint,
        payload,
        costHints: { durationSeconds },
      }).usd;
    // The recorded call sent 6.008 s of audio and billed one minute.
    expect(usd(6.008)).toBe(0.0125);
    expect(usd(600)).toBe(0.125);
    expect(usd(1800)).toBe(0.375);
  });
  it("registers the verified static card rate and model names", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/veed/clean-audio",
      asOf: "2026-10-16",
    });
    expect(MODEL_SLUGS.fal[endpoint]).toBe("veedclean");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("VEED Clean Audio");
  });
});
