import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMurekaApiGenerateLyricsVideoParsedRequest,
  type FalMurekaApiGenerateLyricsVideoRequest,
  type FalMurekaApiGenerateLyricsVideoRequestInput,
  type FalMurekaApiGenerateLyricsVideoResponse,
  type FalRunMurekaApiGenerateNamespace,
} from "@apicity/fal";
import {
  FalMurekaApiGenerateLyricsVideoRequestSchema as schema,
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
const endpoint = "mureka/api/generate/lyrics-video";
// Owned song ID from the committed P09 song generation HAR.
const recorded = {
  song_id: "166489254723585",
} satisfies FalMurekaApiGenerateLyricsVideoRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mureka lyrics video", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mureka.api.generate.lyricsVideo;
    expect(leaf).toBe(provider.post.run.mureka.api.generate.lyricsVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunMurekaApiGenerateNamespace["lyricsVideo"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMurekaApiGenerateLyricsVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMurekaApiGenerateLyricsVideoResponse>();
    expectTypeOf<FalMurekaApiGenerateLyricsVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMurekaApiGenerateLyricsVideoRequestInput>().toEqualTypeOf<FalMurekaApiGenerateLyricsVideoRequest>();
    expectTypeOf<FalMurekaApiGenerateLyricsVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const response = {
      video: {
        url: "https://example.com/video.mp4",
        content_type: "video/mp4",
      },
    } satisfies FalMurekaApiGenerateLyricsVideoResponse;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(
      await provider.run.mureka.api.generate.lyricsVideo(recorded)
    ).toEqual(response);
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

  it("mirrors input fields and defaults only aspect ratio and layout", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "song_id",
      "upload_audio_id",
      "background_id",
      "cover_url",
      "title",
      "aspect_ratio",
      "layout",
      "lyrics_start_row",
      "lyrics_end_row",
      "selection_start",
      "selection_end",
    ]);
    expect(schema.parse(recorded)).toEqual({
      ...recorded,
      aspect_ratio: "9:16",
      layout: "layout_1",
    });
    expect(accepts({ unknown_field: true })).toBe(true);
  });
  it("requires exactly one nonempty audio ID", () => {
    for (const body of [
      {},
      { song_id: null },
      { song_id: "a", upload_audio_id: "b" },
      { song_id: "" },
      { upload_audio_id: "" },
      { song_id: 1 },
    ])
      expect(schema.safeParse(body).success).toBe(false);
    expect(
      schema.safeParse({ upload_audio_id: "a", song_id: null }).success
    ).toBe(true);
    expect(accepts({ upload_audio_id: null })).toBe(true);
  });
  it.each(["song_id", "upload_audio_id", "background_id", "title"])(
    "validates nullable nonempty %s",
    (field) => {
      const base = field === "upload_audio_id" ? { song_id: null } : {};
      expect(accepts({ ...base, [field]: "a" })).toBe(true);
      for (const bad of ["", 1, {}])
        expect(accepts({ ...base, [field]: bad })).toBe(false);
      if (field !== "song_id" && field !== "upload_audio_id")
        expect(accepts({ [field]: null })).toBe(true);
    }
  );
  it.each(["16:9", "9:16", "3:4", "4:3"])(
    "accepts aspect ratio %s",
    (aspect_ratio) => {
      expect(accepts({ aspect_ratio })).toBe(true);
    }
  );
  it.each([
    "layout_1",
    "layout_2",
    "layout_3",
    "layout_4",
    "layout_5",
    "layout_6",
    "layout_7",
  ])("accepts layout %s", (layout) => {
    expect(accepts({ layout })).toBe(true);
  });
  it("rejects invalid fixed enum values", () => {
    for (const value of ["invalid", "", null, 1]) {
      expect(accepts({ aspect_ratio: value })).toBe(false);
      expect(accepts({ layout: value })).toBe(false);
    }
  });
  it.each([
    ["lyrics_start_row", "lyrics_end_row", 1],
    ["selection_start", "selection_end", 0],
  ] as const)("requires paired integer %s and %s", (start, end, min) => {
    expect(accepts({ [start]: min, [end]: min + 1 })).toBe(true);
    expect(accepts({ [start]: null, [end]: null })).toBe(true);
    expect(accepts({ [start]: min })).toBe(false);
    expect(accepts({ [end]: min })).toBe(false);
    expect(accepts({ [start]: min, [end]: null })).toBe(false);
    for (const bad of [min - 1, 1.5, "1"]) {
      expect(accepts({ [start]: bad, [end]: min + 2 })).toBe(false);
      expect(accepts({ [start]: min, [end]: bad })).toBe(false);
    }
  });
  it("rejects row and time selections combined", () => {
    for (const row of ["lyrics_start_row", "lyrics_end_row"]) {
      for (const time of ["selection_start", "selection_end"])
        expect(accepts({ [row]: 1, [time]: 0 })).toBe(false);
    }
    expect(
      accepts({
        lyrics_start_row: 1,
        lyrics_end_row: 2,
        selection_start: 0,
        selection_end: 1000,
      })
    ).toBe(false);
  });
  it("disallows covers with the default layout", () => {
    expect(accepts({ cover_url: "https://example.com/cover.png" })).toBe(false);
    expect(accepts({ cover_url: null })).toBe(true);
    for (const layout of [
      "layout_2",
      "layout_3",
      "layout_4",
      "layout_5",
      "layout_6",
      "layout_7",
    ])
      expect(
        accepts({ layout, cover_url: "https://example.com/cover.png" })
      ).toBe(true);
    expect(accepts({ layout: "layout_2", cover_url: 1 })).toBe(false);
  });
});
