import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMicrosoftMaiImage2p7EditParsedRequest,
  type FalMicrosoftMaiImage2p7EditRequest,
  type FalMicrosoftMaiImage2p7EditRequestInput,
  type FalMicrosoftMaiImage2p7EditResponse,
  type FalRunMicrosoftMaiImage2p7Namespace,
} from "@apicity/fal";
import {
  FalMicrosoftMaiImage2p7EditRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-11-20
// (sha256 6be8ad1b6176ba07bd96bd0b3ba3b5b2d77b28534fe9014ddf53ed7fcf88c4c9).
const endpoint = "microsoft/mai-image-2.7/edit";
// The recording sends tests/fixtures/cat1.jpg as a data URL; a short URL
// stands in for it here, since these checks never reach fal.
const recorded = {
  prompt: "Add a small red bow tie to the cat.",
  image_urls: ["https://example.com/cat1.jpg"],
} satisfies FalMicrosoftMaiImage2p7EditRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MAI-Image-2.7 edit contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.microsoft.maiImage2p7.edit;
    expect(leaf).toBe(provider.post.run.microsoft.maiImage2p7.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    // maiImage2p7 is a plain object: fal serves no bare
    // microsoft/mai-image-2.7 endpoint, only the task routes under it.
    expect(typeof provider.run.microsoft.maiImage2p7).toBe("object");
    expectTypeOf(
      provider.run.microsoft.maiImage2p7
    ).toEqualTypeOf<FalRunMicrosoftMaiImage2p7Namespace>();
    expectTypeOf<FalMicrosoftMaiImage2p7EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMicrosoftMaiImage2p7EditRequestInput>().toEqualTypeOf<FalMicrosoftMaiImage2p7EditRequest>();
    expectTypeOf<FalMicrosoftMaiImage2p7EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalMicrosoftMaiImage2p7EditResponse>().toEqualTypeOf<{
      images: Array<{
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
      }>;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ images: [{ url: "https://example.com/out.png" }] })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.microsoft.maiImage2p7.edit(recorded);
    expect(result.images[0].url).toBe("https://example.com/out.png");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/microsoft/mai-image-2.7/edit");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("describes the documented fields in order", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_urls",
      "image_size",
      "resolution",
      "background",
      "output_format",
      "sync_mode",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "The instruction describing how to edit the input images."
    );
    expect(schema.shape.image_urls.description).toBe(
      "The URLs of the images to edit or reference (up to 5)."
    );
    expect(schema.shape.image_size.description).toBe(
      "The size of the edited image. If not set, the model picks a size close to the input. Each side must be at least 768 pixels and the total pixel count at most 4,194,304 (2048x2048). Custom sizes are rounded down to a multiple of 16."
    );
    expect(schema.shape.resolution.description).toBe(
      'Resolution of preset image sizes: "1K" (about 1 megapixel) or "2K" (each side doubled). Ignored for custom sizes.'
    );
    expect(schema.shape.background.description).toBe(
      'Use "transparent" for a transparent background (requires png or webp output).'
    );
    expect(schema.shape.output_format.description).toBe(
      "The format of the edited image."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the media will be returned as a data URI and the output data won't be available in the request history."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_image_urls = { ...recorded } as Record<string, unknown>;
    delete without_image_urls.image_urls;
    expect(schema.safeParse(without_image_urls).success).toBe(false);
    const without_prompt = { ...recorded } as Record<string, unknown>;
    delete without_prompt.prompt;
    expect(schema.safeParse(without_prompt).success).toBe(false);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(0) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(1) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(32000) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(32001) })).toBe(false);
  });

  it("takes one to five image_urls", () => {
    const urls = (n: number) =>
      Array.from({ length: n }, (_, i) => `https://example.com/${i}.png`);
    expect(accepts({ image_urls: urls(0) })).toBe(false);
    expect(accepts({ image_urls: urls(1) })).toBe(true);
    expect(accepts({ image_urls: urls(5) })).toBe(true);
    expect(accepts({ image_urls: urls(6) })).toBe(false);
  });

  it("accepts the documented image_size presets, a custom size and null", () => {
    for (const preset of [
      "square_hd",
      "portrait_4_3",
      "landscape_4_3",
      "portrait_3_2",
      "landscape_3_2",
      "portrait_16_9",
      "landscape_16_9",
    ]) {
      expect(accepts({ image_size: preset }), preset).toBe(true);
    }
    expect(accepts({ image_size: "square" })).toBe(false);
    expect(accepts({ image_size: "auto" })).toBe(false);
    expect(accepts({ image_size: null })).toBe(true);
    expect(schema.parse(recorded).image_size).toBeUndefined();
    expect(accepts({ image_size: { width: 1024, height: 768 } })).toBe(true);
    expect(accepts({ image_size: { width: 0, height: 768 } })).toBe(false);
    expect(accepts({ image_size: { width: 14142, height: 768 } })).toBe(true);
    expect(accepts({ image_size: { width: 14143, height: 768 } })).toBe(false);
    expect(accepts({ image_size: { width: 1024.5, height: 768 } })).toBe(false);
  });

  // The 768-pixel side minimum, the 4,194,304-pixel cap and the transparent
  // background's png/webp rule are prose in the descriptions. Free 422
  // pairing probes on 2026-11-20 drew no field error for any of them, so
  // the schema mirrors the OpenAPI and leaves them to fal.
  it("leaves the documented-only size and background rules to fal", () => {
    expect(accepts({ image_size: { width: 512, height: 1024 } })).toBe(true);
    expect(accepts({ image_size: { width: 2048, height: 2064 } })).toBe(true);
    expect(accepts({ background: "transparent", output_format: "jpeg" })).toBe(
      true
    );
  });

  it("accepts the documented resolution values", () => {
    expect(accepts({ resolution: "1K" })).toBe(true);
    expect(accepts({ resolution: "2K" })).toBe(true);
    expect(accepts({ resolution: "4K" })).toBe(false);
    expect(accepts({ resolution: null })).toBe(false);
    expect(schema.parse(recorded).resolution).toBe("1K");
  });

  it("accepts the documented background values", () => {
    expect(accepts({ background: "opaque" })).toBe(true);
    expect(accepts({ background: "transparent" })).toBe(true);
    expect(accepts({ background: "auto" })).toBe(false);
    expect(accepts({ background: null })).toBe(false);
    expect(schema.parse(recorded).background).toBe("opaque");
  });

  it("accepts the documented output_format values", () => {
    expect(accepts({ output_format: "jpeg" })).toBe(true);
    expect(accepts({ output_format: "png" })).toBe(true);
    expect(accepts({ output_format: "webp" })).toBe(true);
    expect(accepts({ output_format: "gif" })).toBe(false);
    expect(accepts({ output_format: null })).toBe(false);
    expect(schema.parse(recorded).output_format).toBe("png");
  });

  it("defaults sync_mode to false", () => {
    expect(schema.parse(recorded).sync_mode).toBe(false);
    expect(accepts({ sync_mode: true })).toBe(true);
    expect(accepts({ sync_mode: "yes" })).toBe(false);
  });

  it("is dynamically priced from the token card and has no static slug", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "MAI Image 2.7 Edit"
    );
    expect(falDynamicBilledUnit(endpoint)?.unit).toBe(
      "per 1M tokens: text $5 input; image $8 input / $34 output, rounded up to $0.0001"
    );
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings[0]).toContain("models/pricing/estimate");
  });
});
