import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMireloAiSfx2p0TextToAudioRequest,
  type FalMireloAiSfx2p0TextToAudioParsedRequest,
  type FalMireloAiSfx2p0TextToAudioResponse,
  type FalRunMireloAiNamespace,
  type FalRunMireloAiSfx2p0Namespace,
} from "@apicity/fal";
import {
  FalMireloAiSfx2p0TextToAudioRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Live OpenAPI 2026-10-15 sha256 4fbb8aa78af1f1dd68f97427150e144d441e8c3f07c4806a09a6bb431649cf68.
const endpoint = "mirelo-ai/sfx2.0/text-to-audio";
const recorded = {
  prompt: "Rain falling on a tin roof, gentle thunder in distance",
  duration: 1.5,
  num_samples: 1,
} satisfies FalMireloAiSfx2p0TextToAudioRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mirelo SFX 2.0 text-to-audio", () => {
  it("exports both namespaces, aliases and the queue schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mireloAi.sfx2p0.textToAudio;
    expect(leaf).toBe(provider.post.run.mireloAi.sfx2p0.textToAudio);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.mireloAi
    ).toEqualTypeOf<FalRunMireloAiNamespace>();
    expectTypeOf(
      provider.run.mireloAi.sfx2p0
    ).toEqualTypeOf<FalRunMireloAiSfx2p0Namespace>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMireloAiSfx2p0TextToAudioRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMireloAiSfx2p0TextToAudioResponse>();
    expectTypeOf<FalMireloAiSfx2p0TextToAudioRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMireloAiSfx2p0TextToAudioParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the unchanged body to the exact endpoint", async () => {
    const response = {
      model: "sfx-2.0",
      seeds: [42],
      audio: [{ url: "https://example.com/sound.wav" }],
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(await provider.run.mireloAi.sfx2p0.textToAudio(recorded)).toEqual(
      response
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://fal.run/" + endpoint);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(recorded);
  });
  it("requires prompt and applies the documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.parse({ prompt: "rain" })).toEqual({
      prompt: "rain",
      duration: 30,
      num_samples: 2,
      upload_audio_format: "wav",
    });
    expect(accepts({ unknown_field: true })).toBe(true);
    expect(accepts({ prompt: "a".repeat(2000) })).toBe(true);
    expect(accepts({ negative_prompt: "a".repeat(1000) })).toBe(true);
    expect(
      accepts({
        negative_prompt: null,
        seed: null,
        upload_audio_bitrate_kbps: null,
      })
    ).toBe(true);
  });
  it.each([
    { prompt: "" },
    { prompt: null },
    { prompt: {} },
    { prompt: "a".repeat(2001) },
    { negative_prompt: "a".repeat(1001) },
    { negative_prompt: 3 },
    { duration: 0.09 },
    { duration: 601 },
    { duration: null },
    { duration: "1.5" },
    { num_samples: 0 },
    { num_samples: 5 },
    { num_samples: 1.5 },
    { num_samples: null },
    { seed: -2 },
    { seed: 1.5 },
    { seed: "1" },
    { seed: 1e19 },
    { upload_audio_format: "ogg" },
    { upload_audio_format: null },
    { upload_audio_format: "mp3", upload_audio_bitrate_kbps: 31 },
    { upload_audio_format: "mp3", upload_audio_bitrate_kbps: 321 },
    { upload_audio_format: "mp3", upload_audio_bitrate_kbps: 32.5 },
  ])("rejects invalid input %j", (body) => {
    expect(accepts(body)).toBe(false);
  });
  it("accepts inclusive numeric boundaries and fractional duration", () => {
    expect(accepts({ duration: 0.1, num_samples: 1, seed: -1 })).toBe(true);
    expect(
      accepts({ duration: 600, num_samples: 4, seed: 9223372036854776000 })
    ).toBe(true);
    expect(accepts({ duration: 1.5, seed: 42 })).toBe(true);
  });
  it.each(["wav", "mp3", "aac", "flac"])(
    "accepts %s without bitrate",
    (format) => {
      expect(accepts({ upload_audio_format: format })).toBe(true);
    }
  );
  it("enforces the documented bitrate cross-field rules", () => {
    for (const format of [undefined, "wav", "flac"])
      expect(
        accepts({ upload_audio_format: format, upload_audio_bitrate_kbps: 128 })
      ).toBe(false);
    for (const rate of [
      32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320,
    ])
      expect(
        accepts({ upload_audio_format: "mp3", upload_audio_bitrate_kbps: rate })
      ).toBe(true);
    expect(
      accepts({ upload_audio_format: "mp3", upload_audio_bitrate_kbps: 100 })
    ).toBe(false);
    for (const rate of [32, 100, 256])
      expect(
        accepts({ upload_audio_format: "aac", upload_audio_bitrate_kbps: rate })
      ).toBe(true);
    expect(
      accepts({ upload_audio_format: "aac", upload_audio_bitrate_kbps: 257 })
    ).toBe(false);
  });
  it("stays dynamic because the recording bills 2 units for 1.5 seconds", () => {
    // Card says seconds across samples; HAR has x-fal-billable-units: 2.
    // P-7 rule 4: do not infer a rounding rule from a single observation.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect(
      (MODEL_DISPLAY.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
  });
});
