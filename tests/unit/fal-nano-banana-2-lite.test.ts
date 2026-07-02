import { describe, expect, it, vi } from "vitest";

import { createFal } from "../../packages/provider/fal/src/fal";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fal nano banana 2 lite", () => {
  it("posts text-to-image requests to the google lite endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        images: [
          {
            content_type: "image/png",
            file_name: "nano-banana-2-lite-t2i-output.png",
            url: "https://example.com/image.png",
          },
        ],
        description: "",
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.run.nanoBanana2Lite.textToImage({
      prompt: "A compact robot painting a postcard",
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      system_prompt: "Render clean product-style imagery.",
      limit_generations: true,
    });

    expect(result.images[0].url).toBe("https://example.com/image.png");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/google/nano-banana-2-lite");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: "A compact robot painting a postcard",
      num_images: 1,
      aspect_ratio: "1:1",
      output_format: "png",
      safety_tolerance: "4",
      system_prompt: "Render clean product-style imagery.",
      limit_generations: true,
    });
  });

  it("posts edit requests to the google lite edit endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        images: [
          {
            content_type: "image/png",
            file_name: "nano-banana-2-lite-edit-output.png",
            url: "https://example.com/edit.png",
          },
        ],
        description: "",
      })
    );

    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.run.nanoBanana2Lite.edit({
      prompt: "Place the subject in a clean studio scene",
      image_urls: ["https://example.com/source.png"],
      num_images: 1,
      aspect_ratio: "auto",
      output_format: "png",
      safety_tolerance: "4",
      limit_generations: true,
    });

    expect(result.images[0].url).toBe("https://example.com/edit.png");

    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://fal.run/google/nano-banana-lite/edit");
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: "Place the subject in a clean studio scene",
      image_urls: ["https://example.com/source.png"],
      num_images: 1,
      aspect_ratio: "auto",
      output_format: "png",
      safety_tolerance: "4",
      limit_generations: true,
    });
  });

  it("validates lite text-to-image payloads", () => {
    const provider = createFal({ apiKey: "fal-test-key" });

    expect(
      provider.run.nanoBanana2Lite.textToImage.schema.safeParse({
        prompt: "a cat",
        num_images: 4,
        aspect_ratio: "8:1",
        output_format: "webp",
        safety_tolerance: "4",
        system_prompt: "Use a product photography style.",
        limit_generations: true,
        thinking_level: "minimal",
      }).success
    ).toBe(true);

    expect(
      provider.run.nanoBanana2Lite.textToImage.schema.safeParse({}).success
    ).toBe(false);

    expect(
      provider.run.nanoBanana2Lite.textToImage.schema.safeParse({
        prompt: "a cat",
        num_images: 5,
      }).success
    ).toBe(false);
  });

  it("validates lite edit payloads", () => {
    const provider = createFal({ apiKey: "fal-test-key" });

    expect(
      provider.run.nanoBanana2Lite.edit.schema.safeParse({
        prompt: "a cat",
        image_urls: ["https://example.com/cat.png"],
        aspect_ratio: "1:8",
      }).success
    ).toBe(true);

    expect(
      provider.run.nanoBanana2Lite.edit.schema.safeParse({
        prompt: "a cat",
      }).success
    ).toBe(true);

    expect(
      provider.run.nanoBanana2Lite.edit.schema.safeParse({
        prompt: "a cat",
        aspect_ratio: "9:9",
      }).success
    ).toBe(false);
  });

  it("exposes lite methods through run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });

    expect(provider.run.nanoBanana2Lite.textToImage).toBe(
      provider.post.run.nanoBanana2Lite.textToImage
    );
    expect(provider.run.nanoBanana2Lite.edit).toBe(
      provider.post.run.nanoBanana2Lite.edit
    );
    expect(
      typeof provider.run.nanoBanana2Lite.textToImage.schema.safeParse
    ).toBe("function");
  });
});
