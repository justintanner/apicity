import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalGeminiOmniFlashV1p1EditParsedRequest,
  type FalGeminiOmniFlashV1p1EditRequest,
  type FalGeminiOmniFlashV1p1EditRequestInput,
  type FalGeminiOmniFlashV1p1EditResponse,
  type FalRunGeminiOmniFlashV1p1Namespace,
} from "@apicity/fal";
import {
  FalGeminiOmniFlashV1p1EditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  fal as falPricing,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-10-08 (sha256
// aa6fcfa124fb288a50ea9fae76153e737f7ec3c73181093be5f53df1e4e6ae49, equal to
// the 2026-10-05 capture) and the seven unbilled 422 probes of the same day,
// which showed that upstream requires `prompt` and `video_url`, bounds the
// prompt at 20,000 characters, closes `resolution` to the documented
// lower-case values, and checks `video_url` only as a string.
const endpoint = "google/gemini-omni-flash/v1.1/edit";
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

describe("Google Gemini Omni Flash 1.1 edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.geminiOmniFlash.v1p1.edit;
    expect(leaf).toBe(provider.post.run.geminiOmniFlash.v1p1.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // The v1p1 object is new here, a child of the v1 callable, which keeps
    // its own call and its v1 edit leaf beside it.
    expect(typeof provider.run.geminiOmniFlash).toBe("function");
    expect(provider.run.geminiOmniFlash.v1p1).toHaveProperty("edit", leaf);
    expect(provider.run.geminiOmniFlash.edit).not.toBe(leaf);
    // Compile-time only: the public namespace and request types, and the
    // documented Output with its File shape, optionality included.
    expectTypeOf(
      provider.run.geminiOmniFlash.v1p1
    ).toEqualTypeOf<FalRunGeminiOmniFlashV1p1Namespace>();
    expectTypeOf<FalGeminiOmniFlashV1p1EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1EditRequestInput>().toEqualTypeOf<FalGeminiOmniFlashV1p1EditRequest>();
    expectTypeOf<FalGeminiOmniFlashV1p1EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalGeminiOmniFlashV1p1EditResponse>().toEqualTypeOf<{
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
    const result = await provider.run.geminiOmniFlash.v1p1.edit(body);
    expect(result.video.url).toBe("https://example.com/out.mp4");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/google/gemini-omni-flash/v1.1/edit"
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

  it("describes every documented field without billing claims", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "video_url",
      "resolution",
    ]);
    for (const [key, field] of Object.entries(schema.shape)) {
      expect(field.description, key).toBeTruthy();
      expect(field.description ?? "", key).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  // Dynamic branch (P-7 rules 2 and 4): the card bills each second of output
  // video at $0.03/$0.10/$0.15/$0.30 at 360p/720p/1080p/4K, and the request
  // carries no duration, since the edit follows the source video, which the
  // payload carries only as a URL. A costHints.durationSeconds rate would not
  // match the billing: the recorded 360p call sent a 5.000 s source, got back
  // 5.000 s of video with a generated audio track of 5.034667 s, and billed
  // x-fal-billable-units 5.034667 at $0.03, $0.15104, which fal's usage API
  // confirms, where the card predicts $0.15 for the 5 s source. So a payload
  // is deferred whether or not its length is hinted.
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
    }
  );

  it("carries no local rate, slug or display name", () => {
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect(
      (MODEL_DISPLAY.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
  });
});
