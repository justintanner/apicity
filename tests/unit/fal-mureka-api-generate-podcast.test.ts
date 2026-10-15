import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMurekaApiGeneratePodcastParsedRequest,
  type FalMurekaApiGeneratePodcastRequest,
  type FalMurekaApiGeneratePodcastRequestInput,
  type FalMurekaApiGeneratePodcastResponse,
  type FalRunMurekaApiGenerateNamespace,
} from "@apicity/fal";
import {
  FalMurekaApiGeneratePodcastRequestSchema as schema,
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

const endpoint = "mureka/api/generate/podcast";
const recorded = {
  conversations: [
    { text: "Hello from Apicity. Have a wonderful day.", voice: "Emma" },
    { text: "A red panda waves once, then holds still.", voice: "Ethan" },
  ],
} satisfies FalMurekaApiGeneratePodcastRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mureka podcast generation", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mureka.api.generate.podcast;
    expect(leaf).toBe(provider.post.run.mureka.api.generate.podcast);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunMurekaApiGenerateNamespace["podcast"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMurekaApiGeneratePodcastRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMurekaApiGeneratePodcastResponse>();
    expectTypeOf<FalMurekaApiGeneratePodcastRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMurekaApiGeneratePodcastRequestInput>().toEqualTypeOf<FalMurekaApiGeneratePodcastRequest>();
    expectTypeOf<FalMurekaApiGeneratePodcastParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const response = {
      song_id: "song-1",
      audio: { url: "https://example.com/podcast.mp3" },
      duration: 30000,
      lyrics_sections: null,
    } satisfies FalMurekaApiGeneratePodcastResponse;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(await provider.run.mureka.api.generate.podcast(recorded)).toEqual(
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

  it("requires conversations without adding defaults", () => {
    expect(Object.keys(schema.shape)).toEqual(["conversations"]);
    expect(schema.parse(recorded)).toEqual(recorded);
    for (const body of [{}, { conversations: null }, { conversations: {} }])
      expect(schema.safeParse(body).success).toBe(false);
    expect(accepts({ extra: true })).toBe(true);
  });
  it("bounds conversations at one to ten turns", () => {
    for (const count of [1, 10])
      expect(
        accepts({ conversations: Array(count).fill(recorded.conversations[0]) })
      ).toBe(true);
    for (const count of [0, 11])
      expect(
        accepts({ conversations: Array(count).fill(recorded.conversations[0]) })
      ).toBe(false);
  });
  it("requires text and voice for each turn", () => {
    for (const turn of [{}, { text: "hi" }, { voice: "Emma" }, null, "hi"])
      expect(accepts({ conversations: [turn] })).toBe(false);
  });
  it("bounds each text at one to four hundred characters", () => {
    for (const text of ["a", "a".repeat(400)])
      expect(accepts({ conversations: [{ text, voice: "Emma" }] })).toBe(true);
    for (const text of ["", "a".repeat(401), null, 1])
      expect(accepts({ conversations: [{ text, voice: "Emma" }] })).toBe(false);
  });
  it("accepts only the five documented voices", () => {
    for (const voice of ["Ethan", "Victoria", "Jake", "Luna", "Emma"])
      expect(accepts({ conversations: [{ text: "hi", voice }] })).toBe(true);
    for (const voice of ["ethan", "Other", "", null, 1])
      expect(accepts({ conversations: [{ text: "hi", voice }] })).toBe(false);
  });
  it("keeps output-duration billing dynamic", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect(MODEL_DISPLAY.fal).not.toHaveProperty(endpoint);
    expect(
      computeEstimate({ provider: "fal", endpoint, payload: recorded }).warnings
        .length
    ).toBeGreaterThan(0);
  });
});
