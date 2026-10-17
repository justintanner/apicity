import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMireloAiSfx2p0VideoToAudioRequest,
  type FalMireloAiSfx2p0VideoToAudioParsedRequest,
  type FalMireloAiSfx2p0VideoToAudioResponse,
  type FalRunMireloAiNamespace,
  type FalRunMireloAiSfx2p0Namespace,
} from "@apicity/fal";
import {
  FalMireloAiSfx2p0VideoToAudioRequestSchema as schema,
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

// Live OpenAPI 2026-10-15 sha256 42ced3b346e89455d4d1a8b0fae06b5c634d873571da8daf2d281f8c8442acac.
const endpoint = "mirelo-ai/sfx2.0/video-to-audio";
const recorded = {
  video_url:
    "https://v3b.fal.media/files/b/0aae75bd/Y4B2Ki-9zZ5gWeEpfw42T_mirelo-sfx2-source.mp4",
  duration: 1.5,
  num_samples: 1,
} satisfies FalMireloAiSfx2p0VideoToAudioRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mirelo SFX 2.0 video-to-audio", () => {
  it("exports both namespaces, aliases and the queue schema", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mireloAi.sfx2p0.videoToAudio;
    expect(leaf).toBe(provider.post.run.mireloAi.sfx2p0.videoToAudio);
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
      .toEqualTypeOf<FalMireloAiSfx2p0VideoToAudioRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMireloAiSfx2p0VideoToAudioResponse>();
    expectTypeOf<FalMireloAiSfx2p0VideoToAudioRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMireloAiSfx2p0VideoToAudioParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the unchanged body to the exact endpoint", async () => {
    const response = {
      model: "sfx-2.0",
      audio: [{ url: "https://example.com/sound.wav" }],
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(await provider.run.mireloAi.sfx2p0.videoToAudio(recorded)).toEqual(
      response
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://fal.run/" + endpoint);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(recorded);
  });
  it("requires video_url and applies only documented defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.parse({ video_url: "video.mp4" })).toEqual({
      video_url: "video.mp4",
      preserve_speech: true,
      duration: 10,
      num_samples: 2,
      upload_audio_format: "wav",
    });
    expect(accepts({ unknown_field: true })).toBe(true);
    expect(
      accepts({
        text_prompt: "a".repeat(2000),
        negative_prompt: "a".repeat(1000),
      })
    ).toBe(true);
    expect(
      accepts({
        text_prompt: null,
        negative_prompt: null,
        seed: null,
        upload_audio_bitrate_kbps: null,
      })
    ).toBe(true);
    expect(accepts({ text_prompt: "", preserve_speech: false })).toBe(true);
  });
  it.each([
    { video_url: null },
    { video_url: {} },
    { video_url: 42 },
    { text_prompt: "a".repeat(2001) },
    { text_prompt: 42 },
    { preserve_speech: null },
    { preserve_speech: "false" },
    { negative_prompt: "a".repeat(1001) },
    { negative_prompt: 3 },
    { duration: 0.9 },
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
    { seed: 2e19 },
    { upload_audio_format: "ogg" },
    { upload_audio_format: null },
    { upload_audio_format: "mp3", upload_audio_bitrate_kbps: 31 },
    { upload_audio_format: "mp3", upload_audio_bitrate_kbps: 321 },
    { upload_audio_format: "mp3", upload_audio_bitrate_kbps: 32.5 },
  ])("rejects invalid input %j", (body) => {
    expect(accepts(body)).toBe(false);
  });
  it("accepts inclusive numeric boundaries and fractional duration", () => {
    expect(accepts({ duration: 1, num_samples: 1, seed: -1 })).toBe(true);
    expect(
      accepts({ duration: 600, num_samples: 4, seed: 18446744073709552000 })
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
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Mirelo SFX 2.0"
    );
  });
});
