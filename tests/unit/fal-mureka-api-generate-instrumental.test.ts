import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalMurekaApiGenerateInstrumentalParsedRequest,
  type FalMurekaApiGenerateInstrumentalRequest,
  type FalMurekaApiGenerateInstrumentalRequestInput,
  type FalMurekaApiGenerateInstrumentalResponse,
  type FalRunMurekaApiGenerateNamespace,
} from "@apicity/fal";
import {
  FalMurekaApiGenerateInstrumentalRequestSchema as schema,
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

// Live OpenAPI 2026-10-15 sha256 800419648e77c01bd522ca075001066efb2fc303ff2ca5f94d0dcd0191c32c6f.
// fal dropped enable_safety_checker from this input between the planner's
// 03:09Z archive and the 11:33Z and 11:34Z reads.
const endpoint = "mureka/api/generate/instrumental";
// The recorded call. Prompt reused from
// tests/integration/elevenlabs-music.test.ts; mureka-7.6 is the cheapest
// documented model.
const recorded = {
  model: "mureka-7.6",
  prompt: "calm lo-fi piano loop",
} satisfies FalMurekaApiGenerateInstrumentalRequest;
const accepts = (body: Record<string, unknown>) =>
  schema.safeParse({ ...recorded, ...body }).success;

describe("Mureka instrumental generation", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.mureka.api.generate.instrumental;
    expect(leaf).toBe(provider.post.run.mureka.api.generate.instrumental);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunMurekaApiGenerateNamespace["instrumental"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalMurekaApiGenerateInstrumentalRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalMurekaApiGenerateInstrumentalResponse>();
    expectTypeOf<FalMurekaApiGenerateInstrumentalRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalMurekaApiGenerateInstrumentalRequestInput>().toEqualTypeOf<FalMurekaApiGenerateInstrumentalRequest>();
    expectTypeOf<FalMurekaApiGenerateInstrumentalParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const response = {
      song_id: "song-1",
      audio: { url: "https://example.com/instrumental.mp3" },
      duration: 30000,
      lyrics_sections: null,
    } satisfies FalMurekaApiGenerateInstrumentalResponse;
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      })
    );
    const provider = createFal({ apiKey: "fal-test-key", fetch: fetcher });
    expect(
      await provider.run.mureka.api.generate.instrumental(recorded)
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

  it("mirrors the live input fields and fills only the model default", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "model",
      "prompt",
      "instrumental_id",
    ]);
    expect(schema.parse(recorded)).toEqual(recorded);
    expect(schema.parse({ prompt: "calm lo-fi piano loop" })).toEqual({
      model: "mureka-9.5",
      prompt: "calm lo-fi piano loop",
    });
    expect(schema.parse({ instrumental_id: "abc" })).toEqual({
      model: "mureka-9.5",
      instrumental_id: "abc",
    });
    // additionalProperties is not false: fal's validator reported no error
    // for an unknown field, nor for a string enable_safety_checker, which it
    // no longer declares (2026-10-15).
    expect(accepts({ unknown_field: 1 })).toBe(true);
    expect(accepts({ enable_safety_checker: "maybe" })).toBe(true);
  });

  it.each(["mureka-7.6", "mureka-8", "mureka-9", "mureka-9.5"])(
    "accepts the listed model %s",
    (model) => {
      expect(accepts({ model })).toBe(true);
    }
  );

  it("stays open to versioned Mureka ids without accepting typos", () => {
    // fal's own validator is closed (it refused mureka-6 with a 422 on
    // 2026-10-15); the schema stays open to Mureka's id grammar per
    // CLAUDE.md, so a model fal ships later needs no release here.
    for (const model of ["mureka-10", "mureka-9.6", "mureka-o1"]) {
      expect(accepts({ model }), model).toBe(true);
    }
    for (const model of [
      "mureka",
      "mureka-",
      "Mureka-9",
      "mureka-9.5.1",
      "mureka-9-turbo",
      "murek-9",
      "",
      null,
      9.5,
    ]) {
      expect(accepts({ model }), String(model)).toBe(false);
    }
  });

  it("bounds prompt to 1 to 1024 characters", () => {
    // fal's validator: "" string_too_short, 1025 characters string_too_long,
    // 1024 characters and a blank prompt accepted (2026-10-15).
    expect(accepts({ prompt: "a" })).toBe(true);
    expect(accepts({ prompt: "a".repeat(1024) })).toBe(true);
    expect(accepts({ prompt: "   " })).toBe(true);
    expect(accepts({ prompt: "" })).toBe(false);
    expect(accepts({ prompt: "a".repeat(1025) })).toBe(false);
    expect(accepts({ prompt: 1 })).toBe(false);
  });

  it("takes a nonempty instrumental_id, and null for the unused field", () => {
    // fal's validator: "" string_too_short, null accepted (2026-10-15).
    expect(schema.safeParse({ instrumental_id: "abc" }).success).toBe(true);
    expect(
      schema.safeParse({ instrumental_id: "abc", prompt: null }).success
    ).toBe(true);
    expect(accepts({ prompt: "x", instrumental_id: null })).toBe(true);
    expect(schema.safeParse({ instrumental_id: "" }).success).toBe(false);
    expect(schema.safeParse({ instrumental_id: 1 }).success).toBe(false);
  });

  it("requires exactly one of prompt or instrumental_id", () => {
    // Restated from both field descriptions. fal's field validator reported
    // no error for either case (2026-10-15), so upstream checks it after the
    // field rules.
    const issues = (body: Record<string, unknown>) =>
      schema
        .safeParse(body)
        .error?.issues.map((issue) => [issue.path, issue.message]);
    const rule = [
      ["prompt"],
      "Provide exactly one of prompt or instrumental_id.",
    ];
    expect(issues({ model: "mureka-7.6" })).toEqual([rule]);
    expect(issues({ prompt: null, instrumental_id: null })).toEqual([rule]);
    expect(issues({ ...recorded, instrumental_id: "abc" })).toEqual([rule]);
  });

  it("stays dynamic because the recording billed a third of the card", () => {
    // The card prices mureka-7.6 at $0.045 per request (6 units of $0.0075);
    // the recorded call came with x-fal-billable-units: 2 and the usage API
    // read 2 x $0.0075 = $0.015. P-7 rule 4: no per-model table is inferred.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(falPricing[endpoint]).toBeUndefined();
    expect(
      (MODEL_SLUGS.fal as Record<string, string>)[endpoint]
    ).toBeUndefined();
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Mureka Instrumental"
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
