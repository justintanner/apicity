import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p2EditParsedRequest,
  type FalGeminiOmniFlashV1p2EditRequest,
  type FalGeminiOmniFlashV1p2EditRequestInput,
  type FalGeminiOmniFlashV1p2EditResponse,
  type FalRunGeminiOmniFlashV1p2Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p2EditRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-11-11 (sha256
// c9219206492f5ab5117bddbf35355c4fde4649978b382a876569f72b50be8bda, equal to
// the 2026-11-11 survey copy): `prompt` and `video_url` are required, the
// prompt stops at 20,000 characters with no minimum, and `resolution` is one
// of the documented lower-case values.
const endpoint = "google/gemini-omni-flash/v1.2/edit";
const input = {
  prompt: "Make this video anime. Keep everything else the same.",
  video_url: "https://example.com/source.mp4",
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Google Gemini Omni Flash 1.2 edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p2.edit;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p2.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // The v1p2 object is new here, a child of the v1 callable, which keeps
    // its own call, its v1 edit leaf and the v1p1 object beside it.
    expect(typeof provider.run.geminiOmniFlash).toBe("function");
    expect(provider.run.geminiOmniFlash.v1p2).toHaveProperty("edit", leaf);
    expect(provider.run.geminiOmniFlash.v1p1.edit).not.toBe(leaf);
    expect(provider.run.geminiOmniFlash.edit).not.toBe(leaf);
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its File shape, optionality included.
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p2
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p2Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p2EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2EditRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p2EditRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p2EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p2EditResponse>().toEqualTypeOf<{
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
        jsonResponse({ video: { url: "https://example.com/out.mp4" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const body = { ...input, resolution: "360p" as const };
    const result = await provider.run.geminiOmniFlash.v1p2.edit(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.2/edit"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("requires the prompt and the video and applies the documented default", () => {
    expect(schema.parse(input)).toStrictEqual({
      ...input,
      resolution: "720p",
    });
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ prompt: input.prompt }).success).toBe(false);
    expect(schema.safeParse({ video_url: input.video_url }).success).toBe(
      false
    );
  });

  it("caps the prompt at 20,000 characters, with no documented minimum", () => {
    expect(schema.safeParse({ ...input, prompt: "" }).success).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(20000) }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...input, prompt: "p".repeat(20001) }).success
    ).toBe(false);
  });

  it.each(["https://example.com/clip.mp4", "data:video/mp4;base64,AAAA"])(
    "accepts video URL %s",
    (video_url) =>
      expect(schema.safeParse({ ...input, video_url }).success).toBe(true)
  );

  it.each([123, null, ["https://example.com/clip.mp4"]])(
    "rejects video URL %s",
    (video_url) =>
      expect(schema.safeParse({ ...input, video_url }).success).toBe(false)
  );

  it.each(["360p", "720p", "1080p", "4k"])(
    "accepts resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(true)
  );

  it.each(["360P", "480p", "1080P", "4K", "auto", ""])(
    "rejects resolution %s",
    (resolution) =>
      expect(schema.safeParse({ ...input, resolution }).success).toBe(false)
  );

  it("strips a duration and an aspect ratio, which this endpoint does not document", () => {
    const parsed = schema.parse({
      ...input,
      duration: 1,
      aspect_ratio: "9:16",
    });
    expect(parsed).not.toHaveProperty("duration");
    expect(parsed).not.toHaveProperty("aspect_ratio");
  });

  it("describes every documented field in order, without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "video_url",
      "resolution",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "A simple instruction describing the edit."
    );
    expect(schema.shape.video_url.description).toBe(
      "URL of the video to edit. Must be at most 15 seconds long."
    );
    expect(schema.shape.resolution.description).toBe(
      "The resolution of the edited video."
    );
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic, as v1.1 edit is: the card bills each second of output video at
  // $0.0273/$0.0819/$0.1229/$0.2457 at 360p/720p/1080p/4K plus input tokens
  // at $1.50 per 1M, and the request carries no duration, since the edit
  // follows the source video, which the payload carries only as a URL. The
  // recorded 360p call sent a 5.000 s source, got back a 5.035 s file (5.000 s
  // of video, 5.034667 s of generated audio), and billed 7.137917 seconds at
  // $0.0273, USD 0.194865, which fal's usage API confirms: about 5.03 seconds
  // for the output and the rest for input tokens no request field measures.
  // So a payload is deferred whether or not its length is hinted.
  it.each([
    ["minimal", input, undefined],
    ["recorded", { ...input, resolution: "360p" }, undefined],
    [
      "recorded, length-hinted",
      { ...input, resolution: "360p" },
      { durationSeconds: 5 },
    ],
    [
      "4k, length-hinted",
      { ...input, resolution: "4k" },
      { durationSeconds: 10 },
    ],
  ])(
    "defers the %s payload to fal's estimate API",
    (_label, payload, costHints) => {
      expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
      const estimate = computeEstimate({
        provider: "fal",
        endpoint,
        payload,
        costHints,
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings).toHaveLength(1);
      expect(estimate.warnings[0]).toContain(
        "POST https://api.fal.ai/v1/models/pricing/estimate"
      );
      expect(estimate.warnings[0]).toContain("fal.v1.models.pricing.estimate");
      expect(estimate.warnings[0]).toContain(
        `fal '${endpoint}' bills ${falDynamicBilledUnit(endpoint)?.unit}.`
      );
    }
  );

  it("carries no local rate or slug, only a display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Gemini Omni 1.2 Flash Edit"
    );
  });
});
