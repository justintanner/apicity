import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMurekaApiGenerateSongParsedRequest,
  type FalMurekaApiGenerateSongRequest,
  type FalMurekaApiGenerateSongRequestInput,
  type FalMurekaApiGenerateSongResponse,
  type FalRunMurekaApiGenerateNamespace,
} from "@apicity/fal";
import {
  FalMurekaApiGenerateSongRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as falPricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Live OpenAPI 2026-10-15: enable_safety_checker removed from the archived input.
const endpoint = "mureka/api/generate/song";
// The recorded call. Prompt reused from
// tests/integration/fal-minimax-music-3.test.ts; mureka-7.6 is the cheapest
// documented model.
const recorded = {
  model: "mureka-7.6",
  lyrics: "[verse]\nMorning light filtering through the pine\n",
  prompt: "acoustic pop",
} satisfies FalMurekaApiGenerateSongRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mureka song generation", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mureka.api.generate.song;
    expect(leaf).toBe(provider.post.run.mureka.api.generate.song);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunMurekaApiGenerateNamespace["song"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMurekaApiGenerateSongRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMurekaApiGenerateSongResponse>();
    expectTypeOf<FalMurekaApiGenerateSongRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMurekaApiGenerateSongRequestInput>().toEqualTypeOf<FalMurekaApiGenerateSongRequest>();
    expectTypeOf<FalMurekaApiGenerateSongParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const response = {
      song_id: "song-1",
      audio: { url: "https://example.com/song.mp3" },
      duration: 30000,
      lyrics_sections: null,
    } satisfies FalMurekaApiGenerateSongResponse;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(await provider.run.mureka.api.generate.song(recorded)).toEqual(
      response
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://fal.run/" + endpoint);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual(recorded);
  });

  it("matches the input fields and defaults only the model", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "model",
      "lyrics",
      "styles",
      "prompt",
      "gender",
      "reference_id",
      "vocal_id",
      "melody_id",
    ]);
    expect(schema.parse(recorded)).toEqual(recorded);
    expect(schema.parse({ prompt: "acoustic pop" })).toEqual({
      model: "mureka-9.5",
      prompt: "acoustic pop",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ lyrics: null, prompt: null }).success).toBe(
      false
    );
    expect(schema.safeParse({ lyrics: "words" }).success).toBe(true);
    expect(accepts({ unknown_field: true })).toBe(true);
  });
  it.each([
    "mureka-7.6",
    "mureka-o2",
    "mureka-8",
    "mureka-9",
    "mureka-9.5",
    "mureka-10",
    "mureka-o3",
  ])("accepts model %s", (model) => {
    expect(accepts({ model })).toBe(true);
  });
  it.each(["mureka", "murek-9", "mureka-9-turbo", "mureka-9.5.1", "", null, 9])(
    "rejects malformed model %s",
    (model) => {
      expect(accepts({ model })).toBe(false);
    }
  );
  it.each([
    ["lyrics", 5000],
    ["prompt", 2000],
  ] as const)("bounds %s", (field, max) => {
    expect(accepts({ [field]: "a" })).toBe(true);
    expect(accepts({ [field]: "a".repeat(max) })).toBe(true);
    expect(accepts({ [field]: "a".repeat(max + 1) })).toBe(false);
    expect(accepts({ [field]: "" })).toBe(false);
    expect(accepts({ [field]: 1 })).toBe(false);
    expect(accepts({ [field]: null })).toBe(true);
  });
  it("accepts nullable IDs and gender but rejects invalid values", () => {
    for (const field of ["reference_id", "vocal_id", "melody_id"]) {
      const base = { ...recorded, prompt: null };
      expect(schema.safeParse({ ...base, [field]: "file-id" }).success).toBe(
        true
      );
      expect(schema.safeParse({ ...base, [field]: null }).success).toBe(true);
      for (const bad of ["", 1, {}])
        expect(schema.safeParse({ ...base, [field]: bad }).success).toBe(false);
    }
    for (const gender of ["female", "male", null])
      expect(accepts({ gender })).toBe(true);
    for (const gender of ["other", "", 1])
      expect(accepts({ gender })).toBe(false);
  });
  it("requires genres from the documented list in prompt mode", () => {
    const styles = [
      "pop",
      "rock",
      "jazz",
      "r&b",
      "edm",
      "ambient",
      "folk",
      "latin",
      "k-pop",
      "j-pop",
      "house",
      "gospel",
      "lo-fi",
    ];
    expect(accepts({ lyrics: null, styles })).toBe(true);
    expect(accepts({ styles: null })).toBe(true);
    for (const invalid of [[], ["country"], "pop", [1]])
      expect(accepts({ lyrics: null, styles: invalid })).toBe(false);
    expect(accepts({ styles: ["pop"] })).toBe(false);
  });
  it("rejects melody combined with prompt, reference or vocal ID", () => {
    for (const field of ["prompt", "reference_id", "vocal_id"]) {
      const result = schema.safeParse({
        lyrics: "words",
        melody_id: "melody",
        [field]: "id",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(["melody_id"]);
    }
    expect(
      schema.safeParse({
        lyrics: "words",
        melody_id: "melody",
        prompt: null,
        reference_id: null,
        vocal_id: null,
      }).success
    ).toBe(true);
  });

  it("prices every documented model and mode, including the recorded cost", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(falPricing[endpoint].source.asOf).toBe("2026-10-15");
    expect(MODEL_SLUGS.fal[endpoint]).toBe("mureka");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Mureka Song");
    const estimate = (payload: Record<string, unknown>) =>
      computeEstimate({ provider: "fal", endpoint, payload });
    expect(estimate(recorded).usd).toBe(0.045);
    expect(estimate(recorded).warnings).toEqual([]);
    for (const [model, lyricsRate, promptRate] of [
      ["mureka-7.6", 0.045, 0.45],
      ["mureka-o2", 0.0675, 0.45],
      ["mureka-8", 0.0675, 0.45],
      ["mureka-9", 0.0675, 0.45],
      ["mureka-9.5", 0.225, 0.75],
    ] as const) {
      expect(estimate({ ...recorded, model }).usd).toBe(lyricsRate);
      expect(estimate({ model, prompt: "acoustic pop" }).usd).toBe(promptRate);
      expect(
        estimate({ model, prompt: "acoustic pop", lyrics: null }).usd
      ).toBe(promptRate);
    }
    expect(estimate({ lyrics: "words" }).usd).toBe(0.225);
    expect(estimate({ prompt: "acoustic pop" }).usd).toBe(0.75);
    expect(
      estimate({ ...recorded, model: "mureka-10" }).warnings.length
    ).toBeGreaterThan(0);
  });
});
