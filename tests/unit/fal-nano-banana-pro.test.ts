import { describe, expect, it, vi } from "vitest";

import { createFal } from "../../packages/provider/fal/src/fal";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fal nano banana pro", () => {
  it("posts text-to-image requests to the fal.run endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        images: [
          {
            content_type: "image/png",
            file_name: "nano-banana-pro-t2i-output.png",
            url: "https://example.com/image.png",
          },
        ],
        description: "generated image",
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.run.nanoBananaPro.textToImage({
      prompt: "A black lab swimming in a suburban pool",
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      resolution: "1K",
    });

    expect(result.images[0].url).toBe("https://example.com/image.png");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/fal-ai/nano-banana-pro");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: "A black lab swimming in a suburban pool",
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      resolution: "1K",
    });
  });

  it("validates text-to-image payloads", () => {
    const provider = createFal({ apiKey: "fal-test-key" });

    const valid = provider.run.nanoBananaPro.textToImage.schema.safeParse({
      prompt: "a cat",
      num_images: 1,
      aspect_ratio: "16:9",
      output_format: "webp",
      safety_tolerance: "4",
      resolution: "2K",
      enable_web_search: false,
    });
    expect(valid.success).toBe(true);

    const missingPrompt =
      provider.run.nanoBananaPro.textToImage.schema.safeParse({});
    expect(missingPrompt.success).toBe(false);

    const invalidEnum = provider.run.nanoBananaPro.textToImage.schema.safeParse(
      {
        prompt: "a cat",
        resolution: "8K",
      }
    );
    expect(invalidEnum.success).toBe(false);
  });

  it("exposes text-to-image through run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });

    expect(provider.run.nanoBananaPro.textToImage).toBe(
      provider.post.run.nanoBananaPro.textToImage
    );
    expect(typeof provider.run.nanoBananaPro.textToImage.schema.safeParse).toBe(
      "function"
    );
  });
});
