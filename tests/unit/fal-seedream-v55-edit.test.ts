import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalSeedreamV55EditParsedRequest,
  type FalSeedreamV55EditRequest,
  type FalSeedreamV55EditRequestInput,
  type FalSeedreamV55EditResponse,
} from "@apicity/fal";
import {
  FalSeedreamV55EditRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { fal as falPricing } from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_DISPLAY,
  MODEL_SLUGS,
} from "../../packages/provider/cost/src/slugs";

// Pinned against the live queue OpenAPI read on 2026-11-20
// (sha256 717a8bfaa7293167665dcaeb6bc9d35ab4b16793fc45402fa7626c6dfc19e3c6).
const endpoint = "bytedance/seedream/v5.5/edit";
const recorded = {
  prompt: "Add a small red bow tie to the cat.",
  image_size: "auto_1K",
  image_urls: ["data:image/jpeg;base64,Y2F0"],
} satisfies FalSeedreamV55EditRequest;

function estimate(payload: Record<string, unknown>) {
  return computeEstimate({ provider: "fal", endpoint, payload });
}

describe("Seedream 5.5 edit contract", () => {
  it("adds edit on a new seedream.v5p5 object", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.bytedance.seedream.v5p5.edit;
    expect(provider.run.bytedance.seedream.v5).toHaveProperty("pro");
    expect(provider.run.bytedance.seedream.v5p5).toEqual({ edit: leaf });
    expect(leaf).toBe(provider.post.run.bytedance.seedream.v5p5.edit);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<FalSeedreamV55EditRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalSeedreamV55EditRequestInput>().toEqualTypeOf<FalSeedreamV55EditRequest>();
    expectTypeOf<FalSeedreamV55EditParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalSeedreamV55EditResponse>().toEqualTypeOf<{
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
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ images: [{ url: "https://example.com/out.png" }] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    await provider.run.bytedance.seedream.v5p5.edit(recorded);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://fal.run/bytedance/seedream/v5.5/edit");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Key fal-test-key"
    );
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("keeps the OpenAPI field order and non-billing descriptions", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "image_size",
      "num_images",
      "output_format",
      "watermark",
      "sync_mode",
      "enable_safety_checker",
      "background",
      "image_urls",
    ]);
    for (const field of Object.values(schema.shape)) {
      const description = field.description ?? "";
      expect(description.length).toBeGreaterThan(0);
      expect(description).not.toMatch(/bill|price|\$|USD/i);
    }
  });

  it("applies the documented defaults", () => {
    expect(
      schema.parse({
        prompt: "edit",
        image_urls: ["https://example.com/a.png"],
      })
    ).toMatchObject({
      image_size: "auto_2K",
      num_images: 1,
      output_format: "png",
      watermark: false,
      sync_mode: false,
      enable_safety_checker: true,
      background: "auto",
    });
  });

  it("accepts the documented bounds and rejects the neighbors", () => {
    expect(schema.safeParse({ prompt: "", image_urls: ["u"] }).success).toBe(
      true
    );
    expect(schema.safeParse({ image_urls: ["u"] }).success).toBe(false);
    expect(schema.safeParse({ prompt: "p", image_urls: [] }).success).toBe(
      false
    );
    for (const num of [1, 6]) {
      expect(
        schema.safeParse({
          prompt: "p",
          image_urls: ["u"],
          num_images: num,
        }).success
      ).toBe(true);
    }
    for (const num of [0, 7, 1.5]) {
      expect(
        schema.safeParse({
          prompt: "p",
          image_urls: ["u"],
          num_images: num,
        }).success
      ).toBe(false);
    }
    for (const size of [
      "auto_1K",
      "auto_1.5K",
      "auto_2K",
      "square_hd",
      "square",
    ]) {
      expect(
        schema.safeParse({
          prompt: "p",
          image_urls: ["u"],
          image_size: size,
        }).success
      ).toBe(true);
    }
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        image_size: "auto_4K",
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        image_size: { width: 1024, height: 1024 },
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        image_size: { width: 0, height: 1024 },
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        image_size: { width: 14143, height: 1024 },
      }).success
    ).toBe(false);
    for (const background of ["auto", "opaque", "transparent"]) {
      expect(
        schema.safeParse({
          prompt: "p",
          image_urls: ["u"],
          background,
        }).success
      ).toBe(true);
    }
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        background: "batch",
        extra: true,
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "p",
        image_urls: ["u"],
        extra: true,
      }).success
    ).toBe(true);
  });

  it("prices the card: output tier plus each input image", () => {
    expect(falPricing[endpoint]).toBeDefined();
    expect(MODEL_SLUGS.fal[endpoint]).toBe("sd5p5");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Seedream 5.5 Edit");
    expect(falPricing[endpoint].source).toMatchObject({
      asOf: "2026-11-20",
    });

    const one = estimate(recorded);
    expect(one.usd).toBeCloseTo(0.042, 10);
    expect(one.warnings).toEqual([]);

    const omitted = estimate({
      prompt: "p",
      image_urls: ["u"],
    });
    expect(omitted.usd).toBeCloseTo(0.0525, 10);

    const cardOne = estimate({
      prompt: "p",
      image_size: "auto_1.5K",
      image_urls: ["a", "b"],
    });
    expect(cardOne.usd).toBeCloseTo(0.054, 10);

    const cardTwo = estimate({
      prompt: "p",
      image_size: "auto_2K",
      num_images: 2,
      image_urls: ["a", "b"],
    });
    expect(cardTwo.usd).toBeCloseTo(0.129, 10);

    const squareHd = estimate({
      prompt: "p",
      image_size: "square_hd",
      image_urls: ["u"],
    });
    expect(squareHd.usd).toBeCloseTo(0.042, 10);

    const customLow = estimate({
      prompt: "p",
      image_size: { width: 1024, height: 1024 },
      image_urls: ["u"],
    });
    expect(customLow.usd).toBeCloseTo(0.042, 10);

    const customHigh = estimate({
      prompt: "p",
      image_size: { width: 2048, height: 2048 },
      image_urls: ["u"],
    });
    expect(customHigh.usd).toBeCloseTo(0.0525, 10);

    const truncated = estimate({
      prompt: "p",
      image_size: "auto_1K",
      image_urls: Array.from({ length: 11 }, () => "u"),
    });
    expect(truncated.usd).toBeCloseTo(0.03 + 0.012 * 10, 10);

    const preset = estimate({
      prompt: "p",
      image_size: "square",
      image_urls: ["u"],
    });
    expect(preset.usd).toBe(0);
    expect(preset.warnings.join(" ")).toContain("921600");
  });
});
