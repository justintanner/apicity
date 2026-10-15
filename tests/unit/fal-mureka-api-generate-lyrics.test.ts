import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createFal,
  type FalMurekaApiGenerateLyricsRequest,
  type FalMurekaApiGenerateLyricsResponse,
  type FalRunMurekaNamespace,
  type FalRunMurekaApiNamespace,
  type FalRunMurekaApiGenerateNamespace,
} from "@apicity/fal";
import {
  FalMurekaApiGenerateLyricsRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { FAL_DYNAMIC_PRICING_ENDPOINTS } from "../../packages/provider/cost/src/pricing/fal";

// Live OpenAPI 2026-10-15 sha256 e960cd84dfd84c9062167b288cebb61d62884edddda419e0b4f6991651d90b37.
const endpoint = "mureka/api/generate/lyrics";
const recorded = {
  prompt: "A short song about morning coffee",
} satisfies FalMurekaApiGenerateLyricsRequest;

describe("Mureka lyrics generation", () => {
  it("exports the shared namespaces and exposes both aliases and registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mureka.api.generate.lyrics;
    expect(leaf).toBe(provider.post.run.mureka.api.generate.lyrics);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(provider.run.mureka).toEqualTypeOf<FalRunMurekaNamespace>();
    expectTypeOf(
      provider.run.mureka.api
    ).toEqualTypeOf<FalRunMurekaApiNamespace>();
    expectTypeOf(
      provider.run.mureka.api.generate
    ).toEqualTypeOf<FalRunMurekaApiGenerateNamespace>();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMurekaApiGenerateLyricsRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMurekaApiGenerateLyricsResponse>();
  });
  it("requires a nonempty string prompt without injecting defaults", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.parse(recorded)).toEqual(recorded);
    expect(schema.safeParse({ prompt: "a" }).success).toBe(true);
    expect(schema.safeParse({ prompt: "a".repeat(10000) }).success).toBe(true);
    // additionalProperties is not false in the live contract.
    expect(schema.safeParse({ ...recorded, extra: true }).success).toBe(true);
  });
  it.each(["", null, {}, 1, [], false])(
    "rejects invalid prompt %j",
    (prompt) => {
      expect(schema.safeParse({ prompt }).success).toBe(false);
    }
  );
  it("posts the unchanged payload to the documented endpoint", async () => {
    const response = { title: "Coffee", lyrics: "Morning coffee" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(await provider.run.mureka.api.generate.lyrics(recorded)).toEqual(
      response
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe("https://fal.run/" + endpoint);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual(recorded);
  });
  it("prices each request at the verified public billing rate", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(MODEL_SLUGS.fal[endpoint]).toBe("mureka");
    expect(MODEL_DISPLAY.fal[endpoint]).toBe("Mureka Lyrics");
    for (const payload of [
      recorded,
      { prompt: "a" },
      { prompt: "a".repeat(10000) },
    ]) {
      const estimate = computeEstimate({ provider: "fal", endpoint, payload });
      expect(estimate.usd).toBe(0.0135);
      expect(estimate.warnings).toEqual([]);
    }
  });
});
