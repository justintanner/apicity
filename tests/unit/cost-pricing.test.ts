import { describe, it, expect } from "vitest";
import {
  asString,
  asNumber,
  asObject,
  coerceSeconds,
} from "../../packages/provider/cost/src/pricing/helpers";
import {
  PRICING,
  PRICING_AS_OF,
} from "../../packages/provider/cost/src/pricing/index";
import {
  MODEL_SLUGS,
  type SlugProviderId,
} from "../../packages/provider/cost/src/slugs";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import { lookupPaidEndpoint } from "../../packages/provider/cost/src/paid-endpoints";
import type {
  CostHints,
  EstimateRequest,
} from "../../packages/provider/cost/src/types";
// Imported from kie source so the seedance-2 pins below can prove the
// linkage end to end: a payload the shipped SDK schema accepts must land on
// the rate keys this pricing table publishes. Unit tests reaching into kie
// source follow existing precedent (tests/unit/kie-model-input-schemas.test.ts).
import {
  Seedance2RequestSchema,
  Seedance2FastRequestSchema,
  Seedance25RequestSchema,
  SeedreamProTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProLayerDecompositionRequestSchema,
  MiniMaxH3ImageToVideoRequestSchema,
  MiniMaxH3ReferenceToVideoRequestSchema,
  Wan22A14bTextToVideoTurboRequestSchema,
  Wan22A14bImageToVideoTurboRequestSchema,
  Wan22A14bSpeechToVideoTurboRequestSchema,
  Wan22AnimateMoveRequestSchema,
  Wan22AnimateReplaceRequestSchema,
  Wan25TextToVideoRequestSchema,
  Wan25ImageToVideoRequestSchema,
  Wan26TextToVideoRequestSchema,
  Wan26ImageToVideoRequestSchema,
  Wan26VideoToVideoRequestSchema,
} from "../../packages/provider/kie/src/zod";

describe("pricing helpers", () => {
  describe("asString", () => {
    it("returns the string when input is a string", () => {
      expect(asString("hello")).toBe("hello");
      expect(asString("")).toBe("");
    });

    it("returns undefined for non-string values", () => {
      expect(asString(42)).toBeUndefined();
      expect(asString(null)).toBeUndefined();
      expect(asString(undefined)).toBeUndefined();
      expect(asString({})).toBeUndefined();
      expect(asString([])).toBeUndefined();
      expect(asString(true)).toBeUndefined();
    });
  });

  describe("asNumber", () => {
    it("returns the number when input is a finite number", () => {
      expect(asNumber(42)).toBe(42);
      expect(asNumber(0)).toBe(0);
      expect(asNumber(3.14)).toBe(3.14);
      expect(asNumber(-1)).toBe(-1);
    });

    it("returns undefined for non-number values", () => {
      expect(asNumber("42")).toBeUndefined();
      expect(asNumber(null)).toBeUndefined();
      expect(asNumber(undefined)).toBeUndefined();
      expect(asNumber({})).toBeUndefined();
      expect(asNumber([])).toBeUndefined();
    });

    it("returns undefined for non-finite numbers", () => {
      expect(asNumber(Infinity)).toBeUndefined();
      expect(asNumber(-Infinity)).toBeUndefined();
      expect(asNumber(NaN)).toBeUndefined();
    });
  });

  describe("asObject", () => {
    it("returns the object when input is a plain object", () => {
      const obj = { a: 1 };
      expect(asObject(obj)).toBe(obj);
      expect(asObject({})).toEqual({});
    });

    it("returns undefined for non-object values", () => {
      expect(asObject("hello")).toBeUndefined();
      expect(asObject(42)).toBeUndefined();
      expect(asObject(null)).toBeUndefined();
      expect(asObject(undefined)).toBeUndefined();
      expect(asObject([])).toBeUndefined();
    });

    it("returns undefined for arrays", () => {
      expect(asObject([1, 2, 3])).toBeUndefined();
    });
  });

  describe("coerceSeconds", () => {
    it("returns number input directly", () => {
      expect(coerceSeconds(5)).toBe(5);
      expect(coerceSeconds(10)).toBe(10);
      expect(coerceSeconds(0)).toBe(0);
      expect(coerceSeconds(3.5)).toBe(3.5);
    });

    it("parses '5s' style strings", () => {
      expect(coerceSeconds("5s")).toBe(5);
      expect(coerceSeconds("10s")).toBe(10);
      expect(coerceSeconds("120s")).toBe(120);
    });

    it("parses bare digit strings", () => {
      expect(coerceSeconds("6")).toBe(6);
      expect(coerceSeconds("30")).toBe(30);
    });

    it("parses decimal strings", () => {
      expect(coerceSeconds("5.5")).toBe(5.5);
      expect(coerceSeconds("5.5s")).toBe(5.5);
    });

    it("returns undefined for non-numeric strings", () => {
      expect(coerceSeconds("hello")).toBeUndefined();
      expect(coerceSeconds("")).toBeUndefined();
      expect(coerceSeconds("s5")).toBeUndefined();
    });

    it("returns undefined for non-finite values", () => {
      expect(coerceSeconds(Infinity)).toBeUndefined();
      expect(coerceSeconds(NaN)).toBeUndefined();
      expect(coerceSeconds(null)).toBeUndefined();
      expect(coerceSeconds(undefined)).toBeUndefined();
    });
  });
});

describe("PRICING data", () => {
  it("has PRICING_AS_OF as a valid date string", () => {
    expect(PRICING_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(
      new Date(PRICING_AS_OF).toISOString().startsWith(PRICING_AS_OF)
    ).toBe(true);
  });

  it("has all expected providers", () => {
    expect(Object.keys(PRICING)).toEqual(
      expect.arrayContaining([
        "alibaba",
        "anthropic",
        "elevenlabs",
        "fireworks",
        "kimicoding",
        "kie",
        "openai",
        "xai",
      ])
    );
  });

  it("alibaba has token-priced models", () => {
    expect(PRICING.alibaba["qwen3.6-plus"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.325, output: 1.95 },
    });
    expect(PRICING.alibaba["qwen3.5-0.8b"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.01, output: 0.04 },
    });
  });

  it("alibaba prices every registered image model per image", () => {
    const perImage: Record<string, number> = {
      "qwen-image-2.0": 0.035,
      "qwen-image-2.0-pro": 0.075,
      "qwen-image-edit": 0.045,
      "qwen-image-edit-plus": 0.03,
      "qwen-image-edit-max": 0.075,
      "wan2.7-image": 0.03,
      "wan2.7-image-pro": 0.075,
    };
    for (const [model, rate] of Object.entries(perImage)) {
      expect(PRICING.alibaba[model]).toMatchObject({
        kind: "perUnit",
        unit: "images",
        rates: { "": rate },
      });
    }
  });

  it("alibaba prices wan2.7 video at a flat per-second rate", () => {
    for (const model of ["wan2.7-i2v", "wan2.7-videoedit"]) {
      expect(PRICING.alibaba[model]).toMatchObject({
        kind: "perUnit",
        unit: "seconds",
        select: [],
        rates: { "": 0.1 },
      });
    }
  });

  it("stamps the new alibaba media rates with their own asOf", () => {
    const entry = PRICING.alibaba["wan2.7-i2v"];
    expect(entry.source.asOf).toBe("2026-07-20");
    expect(entry.source.asOf).not.toBe(PRICING_AS_OF);
  });

  // The slug registry and the pricing table are two halves of one fact.
  // Registering a slug without a rate produced the alibaba/googleflow split
  // this walk generalizes, so walk every provider family of the registry
  // rather than pinning today's provider or model list.
  //
  // Slugs registered in MODEL_SLUGS with intentionally no direct PRICING
  // entry. Every entry is itself asserted below: it must exist in
  // MODEL_SLUGS and be absent from PRICING, so a stale entry fails.
  const UNPRICED_SLUG_ALLOWLIST: Partial<
    Record<SlugProviderId, readonly string[]>
  > = {
    kie: [
      // Synthetic tier keys over the single mode-tiered "kling-3.0/video"
      // pricing entry (slugs.ts:10-14).
      "kling-3.0/video/std",
      "kling-3.0/video/pro",
    ],
  };

  it.each(Object.keys(MODEL_SLUGS) as SlugProviderId[])(
    "has a PRICING entry for every registered %s slug",
    (provider) => {
      const allow = new Set(UNPRICED_SLUG_ALLOWLIST[provider] ?? []);
      const priced = (PRICING as Record<string, Record<string, unknown>>)[
        provider
      ];
      const unpriced = Object.keys(MODEL_SLUGS[provider]).filter(
        (model) => priced?.[model] === undefined && !allow.has(model)
      );
      expect(unpriced, `${provider} registered-but-unpriced`).toEqual([]);
    }
  );

  it("keeps the unpriced-slug allowlist registered and rate-free", () => {
    for (const [provider, models] of Object.entries(UNPRICED_SLUG_ALLOWLIST)) {
      for (const model of models) {
        expect(
          MODEL_SLUGS[provider as SlugProviderId],
          `${provider}/${model} allowlisted but not registered`
        ).toHaveProperty([model]);
        expect(
          (PRICING as Record<string, Record<string, unknown>>)[provider]?.[
            model
          ],
          `${provider}/${model} allowlisted but priced`
        ).toBeUndefined();
      }
    }
  });

  it("openai has token-priced models", () => {
    expect(PRICING.openai["gpt-5"]).toMatchObject({
      kind: "tokens",
      rate: { input: 1.25, output: 10 },
    });
    expect(PRICING.openai["gpt-4o-mini"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.15, output: 0.6 },
    });
  });

  it("anthropic has token-priced models with cache rates", () => {
    expect(PRICING.anthropic["claude-opus-4-7"]).toMatchObject({
      kind: "tokens",
      rate: { input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25 },
    });
  });

  it("xai has token-priced models", () => {
    expect(PRICING.xai["grok-4"]).toMatchObject({
      kind: "tokens",
      rate: { input: 3, output: 15 },
    });
    expect(PRICING.xai["grok-build-0.1"]).toMatchObject({
      kind: "tokens",
      rate: { input: 1, output: 2, cacheRead: 0.2 },
    });
    expect(PRICING.xai["grok-code-fast-1"]).toBe(PRICING.xai["grok-build-0.1"]);
    expect(PRICING.xai["grok-code-fast"]).toBe(PRICING.xai["grok-build-0.1"]);
    expect(PRICING.xai["grok-code-fast-1-0825"]).toBe(
      PRICING.xai["grok-build-0.1"]
    );
  });

  it("xai has per-second video rates", () => {
    expect(PRICING.xai["grok-imagine-video"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.05 },
    });
    expect(PRICING.xai["grok-imagine-video-1.5"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.08 },
    });
    // The provider exports the preview id; it prices at the released rate.
    expect(PRICING.xai["grok-imagine-video-1.5-preview"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.08 },
    });
  });

  it("xai has per-generation image rates", () => {
    expect(PRICING.xai["grok-imagine-image"]).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "": 0.02 },
    });
    expect(PRICING.xai["grok-imagine-image-quality"]).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "": 0.05 },
    });
  });

  it("every xai media rate carries a source url and asOf stamp", () => {
    for (const [model, entry] of Object.entries(PRICING.xai)) {
      if (entry.kind !== "perUnit") continue;
      expect(entry.source.url, model).toMatch(/^https:\/\/docs\.x\.ai\//);
      expect(entry.source.asOf, model).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  // Review finding R-3: the per-unit route is derived from the table's own
  // `kind`, so the set of per-unit xai models is pinned here rather than in a
  // hand-maintained endpoint allowlist that could drift from it.
  it("marks exactly the Grok Imagine media models as per-unit", () => {
    const perUnit = Object.entries(PRICING.xai)
      .filter(([, entry]) => entry.kind === "perUnit")
      .map(([model]) => model)
      .sort();
    expect(perUnit).toEqual([
      "grok-imagine-image",
      "grok-imagine-image-quality",
      "grok-imagine-video",
      "grok-imagine-video-1.5",
      "grok-imagine-video-1.5-preview",
    ]);
  });

  it("kimicoding has token-priced models", () => {
    expect(PRICING.kimicoding["kimi-k2.6"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.95, output: 4, cacheRead: 0.16 },
    });
  });

  it("fireworks has token-priced models", () => {
    expect(PRICING.fireworks["deepseek-v3"]).toMatchObject({
      kind: "tokens",
      rate: { input: 0.56, output: 1.68 },
    });
  });

  it("elevenlabs has per-unit (character) pricing", () => {
    expect(PRICING.elevenlabs.eleven_flash_v2_5).toMatchObject({
      kind: "perUnit",
      unit: "characters",
      rates: { "": 0.00006 },
    });
  });

  it("kie has per-unit pricing for video", () => {
    expect(PRICING.kie["wan/2-7-text-to-video"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "720p": 0.08, "1080p": 0.12 },
    });
  });

  // Veo moved from per-second to per-video: the unit is `generations` and the
  // rates are keyed by the page's resolution columns, not a bare "" flat rate.
  it("kie prices veo per video, keyed by resolution", () => {
    expect(PRICING.kie.veo3).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "720p": 1.25, "1080p": 1.275, "4k": 1.85 },
      source: { url: "https://kie.ai/veo-3-1", asOf: "2026-08-06" },
    });
    expect(PRICING.kie.veo3_fast).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "720p": 0.3, "1080p": 0.325, "4k": 0.9 },
    });
    expect(PRICING.kie.veo3_lite).toMatchObject({
      kind: "perUnit",
      unit: "generations",
      rates: { "720p": 0.15, "1080p": 0.175, "4k": 0.75 },
    });
  });

  it("kie prices the registered Nano Banana image model", () => {
    expect(PRICING.kie["nano-banana"]).toMatchObject({
      kind: "perUnit",
      unit: "images",
      rates: { "": 0.02 },
      source: {
        url: "https://kie.ai/nano-banana",
        asOf: "2026-07-22",
      },
    });
  });

  it("kie has tiered per-unit pricing for kling", () => {
    expect(PRICING.kie["kling-3.0/video"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: {
        std: 0.07,
        "std|sound": 0.1,
        pro: 0.09,
        "pro|sound": 0.135,
        "4K": 0.335,
        "4K|sound": 0.335,
      },
    });
  });

  it("fal has flat per-image pricing", () => {
    expect(PRICING.fal["fal-ai/nano-banana"]).toMatchObject({
      kind: "perUnit",
      unit: "images",
      rates: { "": 0.039 },
    });
  });

  it("fal has resolution-tiered per-image pricing", () => {
    expect(PRICING.fal["fal-ai/nano-banana-pro"]).toMatchObject({
      kind: "perUnit",
      unit: "images",
      rates: { "1K": 0.15, "2K": 0.15, "4K": 0.3 },
    });
  });

  it("fal has per-megapixel pricing for area-billed models", () => {
    expect(PRICING.fal["fal-ai/flux/dev"]).toMatchObject({
      kind: "perUnit",
      unit: "megapixels",
      rates: { "": 0.025 },
    });
  });

  it("every fal rate carries a source url and an asOf stamp", () => {
    for (const [model, entry] of Object.entries(PRICING.fal)) {
      expect(entry.source.url, `fal/${model} url`).toMatch(
        /^https:\/\/fal\.ai\/models\//
      );
      expect(entry.source.asOf, `fal/${model} asOf`).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    }
  });

  it("kie has flat per-second pricing for the lip-sync models", () => {
    expect(PRICING.kie["omnihuman-1-5"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.135 },
    });
    expect(PRICING.kie["volcengine/video-to-video-lip-sync"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "": 0.04 },
    });
  });

  it("kie lip-sync entries carry a source url and asOf stamp", () => {
    for (const model of [
      "omnihuman-1-5",
      "volcengine/video-to-video-lip-sync",
    ]) {
      const entry = PRICING.kie[model];
      expect(entry.source.url, model).toMatch(/^https:\/\/kie\.ai\//);
      expect(entry.source.asOf, model).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("kie lip-sync requests return estimates", () => {
    const omni = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "omnihuman-1-5",
        duration: 8,
        input: { image_url: "https://example.com/a.png" },
      },
    });
    expect(omni.usd).toBeCloseTo(1.08, 10); // 8 * 0.135
    expect(omni.source).toBe("per-unit-table");
    expect(omni.breakdown).toMatchObject({
      units: 8,
      unit: "seconds",
      perUnitUsd: 0.135,
    });
    expect(omni.warnings).toEqual([]);

    // The lip-sync schema declares no duration field — the output length
    // follows the source video — so the seconds arrive through the cost-only
    // hint rather than through a wire field the caller cannot actually send.
    const lipSync = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { mode: "basic" },
      },
      costHints: { durationSeconds: 12 },
    });
    expect(lipSync.usd).toBeCloseTo(0.48, 10); // 12 * 0.04
    expect(lipSync.source).toBe("per-unit-table");
    expect(lipSync.warnings).toEqual([]);
  });

  // Back-compat for the pre-hint fixture this test used to carry: callers that
  // already stuff seconds into the payload keep the estimate they had, whether
  // they use input.duration or the deprecated top-level duration.
  it("kie lip-sync still prices legacy payload durations (back-compat)", () => {
    const viaInput = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { duration: 12, mode: "basic" },
      },
    });
    expect(viaInput.usd).toBeCloseTo(0.48, 10); // 12 * 0.04
    expect(viaInput.warnings).toEqual([]);

    const viaTopLevel = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        duration: 12,
        input: { mode: "basic" },
      },
    });
    expect(viaTopLevel.usd).toBe(viaInput.usd);
    expect(viaTopLevel.warnings).toEqual([]);
  });

  it("kie lip-sync rate is flat across mode and resolution", () => {
    const lite = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { duration: 10, mode: "lite" },
      },
    });
    const basic = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "volcengine/video-to-video-lip-sync",
        input: { duration: 10, mode: "basic" },
      },
    });
    expect(lite.usd).toBe(basic.usd);

    const at720 = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "omnihuman-1-5",
        duration: 5,
        input: { output_resolution: "720" },
      },
    });
    const at1080 = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "omnihuman-1-5",
        duration: 5,
        input: { output_resolution: "1080" },
      },
    });
    expect(at720.usd).toBe(at1080.usd);
  });

  // The variant key is built by joining non-empty selector values, so a v2v
  // key must not carry an empty duration segment — "v2v||720p" can never be
  // produced and would silently price V2V at zero. Since the 2026-08-06 pull
  // v2v is flat per video by RESOLUTION, so the surviving segment is the
  // resolution, not the duration it used to carry.
  it("kie gemini-omni-video v2v rate keys carry only mode and resolution", () => {
    const entry = PRICING.kie["gemini-omni-video"];
    expect(entry.kind).toBe("perUnit");
    if (entry.kind !== "perUnit") return;

    const v2vKeys = Object.keys(entry.rates).filter((k) => k.startsWith("v2v"));
    expect(v2vKeys.sort()).toEqual(["v2v|1080p", "v2v|4k", "v2v|720p"]);
    for (const key of v2vKeys) {
      expect(key.includes("||"), key).toBe(false);
      expect(key.endsWith("|"), key).toBe(false);
    }
  });

  it("every pricing entry has a source", () => {
    for (const [provider, models] of Object.entries(PRICING)) {
      for (const [model, entry] of Object.entries(models)) {
        expect(entry.source, `${provider}/${model}`).toBeDefined();
        expect(entry.source.url, `${provider}/${model}`).toBeTruthy();
      }
    }
  });

  it("token entries have input and output rates", () => {
    for (const [provider, models] of Object.entries(PRICING)) {
      for (const [model, entry] of Object.entries(models)) {
        if (entry.kind === "tokens") {
          expect(entry.rate.input, `${provider}/${model} input`).toBeDefined();
          expect(
            entry.rate.output,
            `${provider}/${model} output`
          ).toBeDefined();
          expect(
            entry.rate.input,
            `${provider}/${model} input`
          ).toBeGreaterThanOrEqual(0);
          expect(
            entry.rate.output,
            `${provider}/${model} output`
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("stamps googleflow rates with their own asOf, ahead of the global", () => {
    for (const [model, entry] of Object.entries(PRICING.googleflow)) {
      expect(entry.source.asOf, model).toBe("2026-07-20");
      expect(Date.parse(entry.source.asOf as string), model).toBeGreaterThan(
        Date.parse(PRICING_AS_OF)
      );
    }
  });

  // REQ-003 table shape: every googleflow variant exposes both a `pro` and an
  // `ultra` rate, and the Ultra rate never exceeds the Pro rate — so selecting
  // Ultra can only lower (or, for the free lite-low-priority, equal) the cost.
  it("googleflow exposes a pro and ultra rate per variant, ultra <= pro", () => {
    for (const [model, entry] of Object.entries(PRICING.googleflow)) {
      expect(entry.kind, model).toBe("perUnit");
      if (entry.kind !== "perUnit") continue;
      const proKeys = Object.keys(entry.rates).filter(
        (k) => k === "pro" || k.endsWith("|pro")
      );
      expect(proKeys.length, `${model} pro rates`).toBeGreaterThan(0);
      for (const proKey of proKeys) {
        const ultraKey =
          proKey === "pro" ? "ultra" : proKey.replace(/\|pro$/, "|ultra");
        expect(entry.rates, `${model} ${ultraKey}`).toHaveProperty(ultraKey);
        expect(
          entry.rates[ultraKey],
          `${model} ${ultraKey} <= ${proKey}`
        ).toBeLessThanOrEqual(entry.rates[proKey]);
      }
    }
  });

  it("per-unit entries have at least one rate", () => {
    for (const [provider, models] of Object.entries(PRICING)) {
      for (const [model, entry] of Object.entries(models)) {
        if (entry.kind === "perUnit") {
          expect(
            Object.keys(entry.rates).length,
            `${provider}/${model} rates`
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});

// The kie video entries whose upstream schema carries no duration field at
// all: the output length follows a source clip or a driving audio track, so
// the payload can never bound the estimate on its own.
//
// Every payload here is deliberately duration-free — `costHints` is the only
// seconds source. The tiered entries still carry their selector value
// (`input.resolution` for happyhorse, `input.mode` for kling motion-control);
// without it the variant key is "" and the estimate fails on "no rate for
// variant" rather than on units, which would make `warnings: []` unreachable
// for reasons that have nothing to do with the hint.
const HINT_ONLY_KIE = [
  {
    label: "happyhorse/video-edit @720p",
    model: "happyhorse/video-edit",
    input: {
      video_url: "https://example.com/in.mp4",
      resolution: "720p",
    } as Record<string, unknown>,
    seconds: 6,
    perUnitUsd: 0.14,
  },
  {
    label: "happyhorse/video-edit @1080p",
    model: "happyhorse/video-edit",
    input: {
      video_url: "https://example.com/in.mp4",
      resolution: "1080p",
    } as Record<string, unknown>,
    seconds: 6,
    perUnitUsd: 0.24,
  },
  {
    label: "kling-3.0/motion-control @720p",
    model: "kling-3.0/motion-control",
    input: {
      video_url: "https://example.com/in.mp4",
      mode: "720p",
    } as Record<string, unknown>,
    seconds: 5,
    perUnitUsd: 0.1,
  },
  {
    label: "kling-3.0/motion-control @1080p",
    model: "kling-3.0/motion-control",
    input: {
      video_url: "https://example.com/in.mp4",
      mode: "1080p",
    } as Record<string, unknown>,
    seconds: 5,
    perUnitUsd: 0.135,
  },
  {
    label: "omnihuman-1-5",
    model: "omnihuman-1-5",
    input: {
      image_url: "https://example.com/a.png",
      audio_url: "https://example.com/a.mp3",
    } as Record<string, unknown>,
    seconds: 8,
    perUnitUsd: 0.135,
  },
  {
    label: "volcengine/video-to-video-lip-sync",
    model: "volcengine/video-to-video-lip-sync",
    input: {
      video_url: "https://example.com/in.mp4",
      mode: "basic",
    } as Record<string, unknown>,
    seconds: 12,
    perUnitUsd: 0.04,
  },
  // veo3 / veo3_fast used to live here. They bill per video now (see the
  // "kie veo per-video pricing" block below), so no duration channel — wire
  // field, hint, or deprecated top-level — bounds their estimate any more.
  {
    label: "happyhorse/video-edit",
    model: "happyhorse/video-edit",
    input: {
      video_url: "https://example.com/in.mp4",
      resolution: "720p",
    } as Record<string, unknown>,
    seconds: 8,
    perUnitUsd: 0.14,
  },
  // 2026-08-06 pull: four more per-second families whose schema carries no
  // duration field. Motion-control follows the source clip; the avatar and
  // InfiniTalk models follow the driving audio; topaz follows the input video.
  {
    label: "kling-2.6/motion-control @720p",
    model: "kling-2.6/motion-control",
    input: {
      input_urls: ["https://example.com/x.jpg"],
      video_urls: ["https://example.com/in.mp4"],
      character_orientation: "image",
      mode: "720p",
    } as Record<string, unknown>,
    seconds: 5,
    perUnitUsd: 0.055,
  },
  {
    label: "kling-2.6/motion-control @1080p",
    model: "kling-2.6/motion-control",
    input: {
      input_urls: ["https://example.com/x.jpg"],
      video_urls: ["https://example.com/in.mp4"],
      character_orientation: "image",
      mode: "1080p",
    } as Record<string, unknown>,
    seconds: 5,
    perUnitUsd: 0.09,
  },
  {
    label: "kling/ai-avatar-standard",
    model: "kling/ai-avatar-standard",
    input: {
      image_url: "https://example.com/a.png",
      audio_url: "https://example.com/a.mp3",
      prompt: "x",
    } as Record<string, unknown>,
    seconds: 12,
    perUnitUsd: 0.04,
  },
  {
    label: "kling/ai-avatar-pro",
    model: "kling/ai-avatar-pro",
    input: {
      image_url: "https://example.com/a.png",
      audio_url: "https://example.com/a.mp3",
      prompt: "x",
    } as Record<string, unknown>,
    seconds: 12,
    perUnitUsd: 0.08,
  },
  {
    label: "topaz/video-upscale @4x",
    model: "topaz/video-upscale",
    input: {
      video_url: "https://example.com/in.mp4",
      upscale_factor: "4",
    } as Record<string, unknown>,
    seconds: 10,
    perUnitUsd: 0.07,
  },
  {
    label: "infinitalk/from-audio @720p",
    model: "infinitalk/from-audio",
    input: {
      image_url: "https://example.com/a.png",
      audio_url: "https://example.com/a.mp3",
      prompt: "x",
      resolution: "720p",
    } as Record<string, unknown>,
    seconds: 15,
    perUnitUsd: 0.06,
  },
];

describe("kie costHints.durationSeconds", () => {
  it.each(HINT_ONLY_KIE)(
    "bounds $label from the hint alone",
    ({ model, input, seconds, perUnitUsd }) => {
      const costHints: CostHints = { durationSeconds: seconds };
      const req: EstimateRequest = {
        provider: "kie",
        payload: { model, input },
        costHints,
      };
      const result = computeEstimate(req);

      expect(result.usd).toBeCloseTo(seconds * perUnitUsd, 10);
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: seconds,
        unit: "seconds",
        perUnitUsd,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  it.each(HINT_ONLY_KIE)(
    "tells a $label caller which field to pass when nothing bounds it",
    ({ model, input }) => {
      const result = computeEstimate({
        provider: "kie" as const,
        payload: { model, input },
      });

      expect(result.usd).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("costHints.durationSeconds");
      expect(result.warnings[0]).toContain(model);
    }
  );

  // Precedence tier 1: the wire field is what upstream actually bills, so a
  // present input.duration outranks any hint.
  it("bills the wire input.duration over a conflicting hint", () => {
    const result = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "wan/2-7-text-to-video",
        input: { prompt: "a sunset", duration: 8, resolution: "720p" },
      },
      costHints: { durationSeconds: 3 },
    });

    expect(result.usd).toBeCloseTo(0.64, 10); // 8 * 0.08, not 3 * 0.08
    expect(result.breakdown.units).toBe(8);
    expect(result.warnings).toEqual([]);
  });

  // Tier 1 is a stop, not a probe. A present-but-uncoercible input.duration
  // means the wire value is malformed, so pricing must fail loudly rather than
  // fall through to the hint or to the deprecated top-level field and quote a
  // number the caller never asked upstream for.
  it("stops at an uncoercible wire input.duration instead of falling through", () => {
    const hinted = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "wan/2-7-text-to-video",
        input: { prompt: "a sunset", duration: "about eight" },
      },
      costHints: { durationSeconds: 6 },
    });

    expect(hinted.usd).toBe(0); // not 0.6 — the hint must not rescue it
    expect(hinted.warnings).toHaveLength(1);
    expect(hinted.warnings[0]).toContain("costHints.durationSeconds");

    const alsoLegacy = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "wan/2-7-text-to-video",
        duration: 8,
        input: { prompt: "a sunset", duration: "about eight" },
      },
      costHints: { durationSeconds: 6 },
    });

    expect(alsoLegacy.usd).toBe(0); // not 0.8 either
    expect(alsoLegacy.warnings).toHaveLength(1);
  });

  // Precedence tier 3: the deprecated top-level convention keeps its 0.8.0
  // estimate for callers who never adopt the hint.
  it("keeps the legacy top-level duration estimate unchanged", () => {
    const result = computeEstimate({
      provider: "kie" as const,
      payload: { model: "omnihuman-1-5", duration: 8 },
    });

    expect(result.usd).toBeCloseTo(1.08, 10); // 8 * 0.135
    expect(result.breakdown.units).toBe(8);
    expect(result.warnings).toEqual([]);
  });

  // Precedence tier 2 beats tier 3: with no wire field in play, the declared
  // hint wins over the deprecated top-level channel.
  it("lets the hint outrank the deprecated top-level duration", () => {
    const result = computeEstimate({
      provider: "kie" as const,
      payload: { model: "omnihuman-1-5", duration: 8 },
      costHints: { durationSeconds: 4 },
    });

    expect(result.usd).toBeCloseTo(0.54, 10); // 4 * 0.135
    expect(result.breakdown.units).toBe(4);
    expect(result.warnings).toEqual([]);
  });

  it.each(["5s", "5"])(
    "still coerces the string wire duration %s",
    (duration) => {
      const result = computeEstimate({
        provider: "kie" as const,
        payload: {
          model: "kling-3.0/motion-control",
          input: {
            video_url: "https://example.com/in.mp4",
            mode: "720p",
            duration,
          },
        },
      });

      expect(result.usd).toBeCloseTo(0.5, 10); // 5 * 0.10
      expect(result.breakdown.units).toBe(5);
      expect(result.warnings).toEqual([]);
    }
  );

  // An unusable hint is ABSENT, not a number to multiply by: it must fall
  // through to the missing-units warning rather than produce -0.20 or NaN.
  it.each([
    { label: "zero", costHints: { durationSeconds: 0 } as CostHints },
    { label: "negative", costHints: { durationSeconds: -5 } as CostHints },
    { label: "NaN", costHints: { durationSeconds: NaN } as CostHints },
    {
      label: "Infinity",
      costHints: { durationSeconds: Infinity } as CostHints,
    },
    {
      // Untyped JS callers can reach this path; the guard is runtime, not
      // compile-time.
      label: "a non-number",
      costHints: { durationSeconds: "12" } as unknown as CostHints,
    },
  ])(
    "rejects $label durationSeconds without inventing a number",
    ({ costHints }) => {
      const result = computeEstimate({
        provider: "kie" as const,
        payload: {
          model: "volcengine/video-to-video-lip-sync",
          input: { video_url: "https://example.com/in.mp4", mode: "basic" },
        },
        costHints,
      });

      expect(result.usd).toBe(0);
      expect(Number.isFinite(result.usd)).toBe(true);
      expect(result.usd).toBeGreaterThanOrEqual(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("costHints.durationSeconds");
    }
  );

  // gemini-omni-video reads the duration twice: once for units and once as a
  // rate-key selector. The hint must reach both, or a hinted call silently
  // prices off the 4-second default row.
  it("selects the same gemini-omni-video rate row from the hint as from the wire", () => {
    const viaWire = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "gemini-omni-video",
        input: { prompt: "a cat", duration: 6, resolution: "720p" },
      },
    });
    const viaHint = computeEstimate({
      provider: "kie" as const,
      payload: {
        model: "gemini-omni-video",
        input: { prompt: "a cat", resolution: "720p" },
      },
      costHints: { durationSeconds: 6 },
    });

    expect(viaWire.usd).toBeCloseTo(0.42, 10); // the 6s row, not the 4s 0.315
    expect(viaHint.usd).toBe(viaWire.usd);
    expect(viaHint.breakdown).toEqual(viaWire.breakdown);
    expect(viaHint.warnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Veo per-video restructure + endpoint-keyed kie entries (REQ-004 veo row,
// REQ-006, REQ-010). Rates verified against the 2026-08-06 kie pricing pull.
// ---------------------------------------------------------------------------

const kieEstimate = (
  payload: Record<string, unknown>,
  extra: Partial<EstimateRequest> = {}
) => computeEstimate({ provider: "kie", payload, ...extra } as EstimateRequest);

describe("kie veo per-video pricing", () => {
  // The behavior-change pin: veo used to bill per second, so a duration hint
  // scaled the price. It bills per video now, and this rate must not move no
  // matter what the caller declares.
  it.each([undefined, 4, 8, 30])(
    "prices veo3 1080p at $1.275 regardless of costHints.durationSeconds=%s",
    (durationSeconds) => {
      const result = kieEstimate(
        { model: "veo3", prompt: "a sunset", resolution: "1080p" },
        durationSeconds === undefined
          ? {}
          : { costHints: { durationSeconds } as CostHints }
      );

      expect(result.usd).toBeCloseTo(1.275, 10);
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: 1.275,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  // A wire `duration` is equally inert — the field still exists on the veo
  // schema, it just no longer scales the bill.
  it("prices veo3 the same with and without a wire duration", () => {
    const withDuration = kieEstimate({
      model: "veo3",
      prompt: "a sunset",
      resolution: "4k",
      duration: 8,
    });
    const withoutDuration = kieEstimate({
      model: "veo3",
      prompt: "a sunset",
      resolution: "4k",
    });

    expect(withDuration.usd).toBeCloseTo(1.85, 10);
    expect(withoutDuration.usd).toBe(withDuration.usd);
  });

  it.each([
    { model: "veo3", resolution: "720p", usd: 1.25 },
    { model: "veo3", resolution: "1080p", usd: 1.275 },
    { model: "veo3", resolution: "4k", usd: 1.85 },
    { model: "veo3_fast", resolution: "720p", usd: 0.3 },
    { model: "veo3_fast", resolution: "1080p", usd: 0.325 },
    { model: "veo3_fast", resolution: "4k", usd: 0.9 },
    { model: "veo3_lite", resolution: "720p", usd: 0.15 },
    { model: "veo3_lite", resolution: "1080p", usd: 0.175 },
    { model: "veo3_lite", resolution: "4k", usd: 0.75 },
  ])("prices $model at $resolution", ({ model, resolution, usd }) => {
    const result = kieEstimate({ model, prompt: "a sunset", resolution });

    expect(result.usd).toBeCloseTo(usd, 10);
    expect(result.breakdown.unit).toBe("generations");
    expect(result.warnings).toEqual([]);
  });

  // Documented upstream default when `resolution` is omitted.
  it.each([
    { model: "veo3", usd: 1.25 },
    { model: "veo3_fast", usd: 0.3 },
    { model: "veo3_lite", usd: 0.15 },
  ])(
    "falls back to the documented 720p default for $model",
    ({ model, usd }) => {
      const result = kieEstimate({ model, prompt: "a sunset" });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.warnings).toEqual([]);
    }
  );
});

describe("kie veo auxiliary endpoints", () => {
  it.each([
    { model: "quality", usd: 1.25 },
    { model: "fast", usd: 0.3 },
  ])("prices veo/extend $model per video", ({ model, usd }) => {
    const result = kieEstimate(
      { taskId: "t", prompt: "keep going", model },
      { endpoint: "veo/extend" }
    );

    expect(result.usd).toBeCloseTo(usd, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: usd,
    });
    expect(result.warnings).toEqual([]);
  });

  // Unlike the model-keyed generate entries, the endpoint key resolves without
  // `payload.model`, so the documented "fast" default is reachable here.
  it("applies the documented fast default when veo/extend omits model", () => {
    const result = kieEstimate(
      { taskId: "t", prompt: "keep going" },
      { endpoint: "veo/extend" }
    );

    expect(result.usd).toBeCloseTo(0.3, 10);
  });

  // The page's Extend Lite row ($0.15) is unreachable: VeoExtendRequestSchema
  // has no lite value, so it is recorded in the entry comment, not as a rate.
  it("has no veo/extend lite rate while the schema enum lacks it", () => {
    const entry = PRICING.kie["veo/extend"];
    expect(entry.kind).toBe("perUnit");
    if (entry.kind !== "perUnit") throw new Error("expected a per-unit entry");
    expect(Object.keys(entry.rates).sort()).toEqual(["fast", "quality"]);
  });

  it.each([
    { endpoint: "veo/get-1080p-video", usd: 0.025 },
    { endpoint: "veo/get-4k-video", usd: 0.6 },
  ])("prices $endpoint flat", ({ endpoint, usd }) => {
    const result = kieEstimate({ taskId: "t" }, { endpoint });

    expect(result.usd).toBeCloseTo(usd, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: usd,
    });
  });
});

describe("kie runway / aleph / gpt4o-image / flux-kontext", () => {
  // `duration` is numeric on the wire (5 | 10), so this also pins the String
  // coercion at pick time — asString alone would miss every rate.
  it.each([
    { duration: 5, quality: "720p", usd: 0.06 },
    { duration: 10, quality: "720p", usd: 0.15 },
    { duration: 5, quality: "1080p", usd: 0.15 },
  ])(
    "prices runway/generate $duration s at $quality",
    ({ duration, quality, usd }) => {
      const result = kieEstimate(
        { prompt: "a cat", duration, quality },
        { endpoint: "runway/generate" }
      );

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: usd,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  // Upstream documents 10s @ 1080p as unsupported and publishes no rate, so
  // the estimate must fail rather than invent one.
  it("has no runway/generate rate for the unsupported 10s 1080p combo", () => {
    const result = kieEstimate(
      { prompt: "a cat", duration: 10, quality: "1080p" },
      { endpoint: "runway/generate" }
    );

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("10|1080p");
  });

  it.each([
    { quality: "720p", usd: 0.06 },
    { quality: "1080p", usd: 0.15 },
  ])("prices runway/extend at $quality", ({ quality, usd }) => {
    const result = kieEstimate(
      { taskId: "t", prompt: "more", quality },
      { endpoint: "runway/extend" }
    );

    expect(result.usd).toBeCloseTo(usd, 10);
    expect(result.warnings).toEqual([]);
  });

  it("prices aleph/generate flat per video", () => {
    const result = kieEstimate(
      { prompt: "make it snow", videoUrl: "https://example.com/in.mp4" },
      { endpoint: "aleph/generate" }
    );

    expect(result.usd).toBeCloseTo(0.55, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: 0.55,
    });
  });

  it("prices gpt4o-image/generate flat per image", () => {
    const result = kieEstimate(
      { prompt: "a cat", size: "1:1" },
      { endpoint: "gpt4o-image/generate" }
    );

    expect(result.usd).toBeCloseTo(0.03, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "images",
      perUnitUsd: 0.03,
    });
  });

  it.each([
    { model: "flux-kontext-pro", usd: 0.025 },
    { model: "flux-kontext-max", usd: 0.05 },
  ])("prices $model per image", ({ model, usd }) => {
    const result = kieEstimate({ model, prompt: "a cat" });

    expect(result.usd).toBeCloseTo(usd, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "images",
      perUnitUsd: usd,
    });
  });

  // Model-keyed entries cannot apply upstream's documented default model: with
  // no `payload.model` and no caller endpoint there is no pricing key at all,
  // so the estimate fails by engine rule instead of guessing flux-kontext-pro.
  it("fails the estimate when flux-kontext omits payload.model", () => {
    const result = kieEstimate({ prompt: "a cat" });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("endpoint or payload.model");
  });
});

describe("kie suno rows", () => {
  it("prices suno/timestamped-lyrics flat per request", () => {
    const result = kieEstimate(
      { taskId: "t", audioId: "a" },
      { endpoint: "suno/timestamped-lyrics" }
    );

    expect(result.usd).toBeCloseTo(0.0025, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: 0.0025,
    });
    expect(result.warnings).toEqual([]);
  });

  // Published at 0 credits. These resolve to a real $0 estimate rather than
  // failing with "model not found" — the reason they are entries at all.
  it.each([
    "suno/cover-generate",
    "suno/persona-generate",
    "suno/midi-generate",
  ])("resolves %s to a $0 estimate", (endpoint) => {
    const result = kieEstimate({ taskId: "t" }, { endpoint });

    expect(result.usd).toBe(0);
    expect(result.source).toBe("per-unit-table");
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: 0,
    });
    expect(result.warnings).toEqual([]);
  });

  // The two schema-representable separate-vocals rates stay as they are; the
  // page's "Advanced Split" ($0.10) has no schema discriminator to key on.
  it.each([
    { type: "separate_vocal", usd: 0.05 },
    { type: "split_stem", usd: 0.25 },
  ])("prices suno/vocal-removal-generate $type", ({ type, usd }) => {
    const result = kieEstimate(
      {
        taskId: "t",
        audioId: "a",
        callBackUrl: "https://example.com/cb",
        type,
      },
      { endpoint: "suno/vocal-removal-generate" }
    );

    expect(result.usd).toBeCloseTo(usd, 10);
  });
});

// createTask image families added by the same 2026-08-06 pull (REQ-005).
// Every family gets at least one estimate-level assertion; the blocks below
// additionally pin the three decisions this item had to make — the seedream
// 4.5 id mapping, the string-enum image count, and the two places where an
// omitted field has no documented default to fall back to.
const IMAGE_FAMILY_RATES = [
  // Seedream 5 Pro — quality tiers (basic = the page's 1K/1.5K rows).
  {
    model: "seedream/5-pro-text-to-image",
    input: { quality: "basic" },
    usd: 0.035,
  },
  {
    model: "seedream/5-pro-text-to-image",
    input: { quality: "high" },
    usd: 0.07,
  },
  {
    model: "seedream/5-pro-image-to-image",
    input: {
      quality: "basic",
      image_urls: ["https://example.com/input.png"],
    },
    usd: 0.035,
  },
  {
    model: "seedream/5-pro-image-to-image",
    input: {
      quality: "high",
      image_urls: ["https://example.com/input.png"],
    },
    usd: 0.07,
  },
  // Seedream 4.5 — one published rate for the family.
  { model: "seedream/4.5-text-to-image", input: {}, usd: 0.0325 },
  { model: "seedream/4.5-edit", input: {}, usd: 0.0325 },
  // Flat single-rate families.
  { model: "nano-banana-2-lite", input: {}, usd: 0.02 },
  { model: "google/nano-banana", input: {}, usd: 0.02 },
  { model: "google/nano-banana-edit", input: {}, usd: 0.02 },
  { model: "google/imagen4", input: {}, usd: 0.04 },
  { model: "google/imagen4-fast", input: {}, usd: 0.02 },
  { model: "google/imagen4-ultra", input: {}, usd: 0.06 },
  { model: "z-image", input: {}, usd: 0.004 },
  { model: "recraft/crisp-upscale", input: {}, usd: 0.0025 },
  { model: "recraft/remove-background", input: {}, usd: 0.005 },
  // GPT Image 1.5 — quality tiers on both modalities.
  {
    model: "gpt-image/1.5-text-to-image",
    input: { quality: "medium" },
    usd: 0.02,
  },
  {
    model: "gpt-image/1.5-text-to-image",
    input: { quality: "high" },
    usd: 0.11,
  },
  {
    model: "gpt-image/1.5-image-to-image",
    input: { quality: "medium" },
    usd: 0.02,
  },
  {
    model: "gpt-image/1.5-image-to-image",
    input: { quality: "high" },
    usd: 0.11,
  },
  // Flux 2 — resolution tiers on the flex and pro ladders.
  {
    model: "flux-2/flex-text-to-image",
    input: { resolution: "1K" },
    usd: 0.07,
  },
  {
    model: "flux-2/flex-text-to-image",
    input: { resolution: "2K" },
    usd: 0.12,
  },
  {
    model: "flux-2/flex-image-to-image",
    input: { resolution: "1K" },
    usd: 0.07,
  },
  {
    model: "flux-2/flex-image-to-image",
    input: { resolution: "2K" },
    usd: 0.12,
  },
  {
    model: "flux-2/pro-text-to-image",
    input: { resolution: "1K" },
    usd: 0.025,
  },
  {
    model: "flux-2/pro-text-to-image",
    input: { resolution: "2K" },
    usd: 0.035,
  },
  {
    model: "flux-2/pro-image-to-image",
    input: { resolution: "1K" },
    usd: 0.025,
  },
  {
    model: "flux-2/pro-image-to-image",
    input: { resolution: "2K" },
    usd: 0.035,
  },
  // Ideogram — the V3 ladder (the Example Mapping case in requirements.md).
  {
    model: "ideogram/v3-text-to-image",
    input: { rendering_speed: "TURBO" },
    usd: 0.0175,
  },
  {
    model: "ideogram/v3-text-to-image",
    input: { rendering_speed: "BALANCED" },
    usd: 0.035,
  },
  {
    model: "ideogram/v3-text-to-image",
    input: { rendering_speed: "QUALITY" },
    usd: 0.05,
  },
  {
    model: "ideogram/v3-edit",
    input: { rendering_speed: "TURBO" },
    usd: 0.0175,
  },
  {
    model: "ideogram/v3-remix",
    input: { rendering_speed: "QUALITY" },
    usd: 0.05,
  },
  // Ideogram — the Character ladder.
  {
    model: "ideogram/character",
    input: { rendering_speed: "TURBO" },
    usd: 0.06,
  },
  {
    model: "ideogram/character",
    input: { rendering_speed: "BALANCED" },
    usd: 0.09,
  },
  {
    model: "ideogram/character",
    input: { rendering_speed: "QUALITY" },
    usd: 0.12,
  },
  {
    model: "ideogram/character-edit",
    input: { rendering_speed: "QUALITY" },
    usd: 0.12,
  },
  {
    model: "ideogram/character-remix",
    input: { rendering_speed: "TURBO" },
    usd: 0.06,
  },
];

describe("kie createTask image families (REQ-005)", () => {
  it.each(IMAGE_FAMILY_RATES)(
    "prices $model $input at $usd per image",
    ({ model, input, usd }) => {
      const result = kieEstimate({ model, input: { prompt: "x", ...input } });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "images",
        perUnitUsd: usd,
      });
    }
  );

  // Documented upstream defaults, applied only where the model's own docs
  // page publishes one.
  it.each([
    { model: "gpt-image/1.5-text-to-image", usd: 0.02, note: "medium" },
    { model: "gpt-image/1.5-image-to-image", usd: 0.02, note: "medium" },
    { model: "flux-2/pro-text-to-image", usd: 0.025, note: "1K" },
    { model: "flux-2/flex-text-to-image", usd: 0.07, note: "1K" },
    { model: "ideogram/v3-edit", usd: 0.035, note: "BALANCED" },
    { model: "ideogram/character", usd: 0.09, note: "BALANCED" },
    { model: "ideogram/character-edit", usd: 0.09, note: "BALANCED" },
    { model: "ideogram/character-remix", usd: 0.09, note: "BALANCED" },
  ])(
    "falls back to the documented $note default for $model",
    ({ model, usd }) => {
      const result = kieEstimate({ model, input: { prompt: "x" } });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.warnings).toEqual([]);
    }
  );

  it.each(["seedream/5-pro-text-to-image", "seedream/5-pro-image-to-image"])(
    "fails %s when live createTask quality is omitted",
    (model) => {
      const input =
        model === "seedream/5-pro-image-to-image"
          ? { prompt: "x", image_urls: ["https://example.com/input.png"] }
          : { prompt: "x" };
      const parsed =
        model === "seedream/5-pro-image-to-image"
          ? SeedreamProImageToImageRequestSchema.safeParse({ model, input })
          : SeedreamProTextToImageRequestSchema.safeParse({ model, input });
      expect(parsed.success).toBe(false);

      const result = kieEstimate({ model, input });

      expect(result.usd).toBe(0);
      expect(result.breakdown).toEqual({});
      expect(result.warnings).toEqual([
        `kie '${model}': missing required selector(s): quality`,
      ]);
    }
  );

  it("adds Seedream 5 Pro edit input-image charges exactly", () => {
    const parsed = SeedreamProImageToImageRequestSchema.safeParse({
      model: "seedream/5-pro-image-to-image",
      input: {
        prompt: "edit this image",
        image_urls: [
          "https://example.com/one.png",
          "https://example.com/two.png",
          "https://example.com/three.png",
        ],
        quality: "basic",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(0.04, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "images",
      perUnitUsd: 0.035,
      extraUsd: 0.005,
    });
    expect(result.warnings).toEqual([]);
  });

  it("fails Seedream 5 Pro edit when the surcharge input list is unknown", () => {
    const result = kieEstimate({
      model: "seedream/5-pro-image-to-image",
      input: { prompt: "edit this image", quality: "basic" },
    });

    expect(result.usd).toBe(0);
    expect(result.breakdown).toEqual({});
    expect(result.warnings).toEqual([
      "kie 'seedream/5-pro-image-to-image': could not derive exact additional charge from payload",
    ]);
  });

  // The other side of that rule: docs.kie.ai publishes NO rendering_speed
  // default for these two, so an omitted field must fail rather than quote
  // the middle tier.
  it.each(["ideogram/v3-text-to-image", "ideogram/v3-remix"])(
    "fails %s when rendering_speed is omitted and upstream documents no default",
    (model) => {
      const result = kieEstimate({ model, input: { prompt: "x" } });

      expect(result.usd).toBe(0);
      expect(result.breakdown).toEqual({});
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("missing required selector(s)");
      expect(result.warnings[0]).toContain("rendering_speed");
    }
  );

  // OQ-3: the "seedream 4.5" page rate keys the two 4.5 model ids only. The
  // enum-listed ByteDance ids are Seedream 3.0 / 4.0 per docs.kie.ai and
  // publish no price row, so they stay unpriced (fail-safe prohibitive).
  it.each([
    "bytedance/seedream",
    "bytedance/seedream-v4-edit",
    "bytedance/seedream-v4-text-to-image",
  ])("leaves %s unpriced — no published page row", (model) => {
    expect(PRICING.kie[model]).toBeUndefined();

    const result = kieEstimate({ model, input: { prompt: "x" } });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("not found in pricing table");
  });

  // Plan-review finding 3: ideogram and qwen/image-edit declare `num_images`
  // as a STRING enum, and asNumber rejects strings — reading it through the
  // old imageCount would have priced three images as one.
  it("scales by the string-enum num_images", () => {
    const result = kieEstimate({
      model: "ideogram/character",
      input: {
        prompt: "x",
        reference_image_urls: ["https://example.com/x.jpg"],
        rendering_speed: "TURBO",
        num_images: "3",
      },
    });

    expect(result.usd).toBeCloseTo(0.18, 10);
    expect(result.breakdown).toEqual({
      units: 3,
      unit: "images",
      perUnitUsd: 0.06,
    });
  });

  it("keeps the wan `n` batch field working alongside num_images", () => {
    const result = kieEstimate({
      model: "wan/2-7-image",
      input: { prompt: "x", n: 4 },
    });

    expect(result.breakdown).toMatchObject({ units: 4, unit: "images" });
  });

  // The page bills topaz by output resolution, which upscale_factor cannot
  // express. No nonzero tier is exact, so the estimator fails closed.
  it("fails closed when topaz/image-upscale output resolution is unmappable", () => {
    const result = kieEstimate({
      model: "topaz/image-upscale",
      input: { image_url: "https://example.com/x.jpg", upscale_factor: "4" },
    });

    expect(result.usd).toBe(0);
    expect(result.breakdown).toEqual({});
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("OUTPUT resolution");
    expect(result.warnings[0]).toContain("fails closed");
    expect(PRICING.kie["topaz/image-upscale"]).toMatchObject({
      rates: { "": 0 },
    });
  });
});

// OQ-4: the Qwen Image family is area-billed. Units are ceil(megapixels per
// image) x image count, resolved from the `image_size` preset.
describe("kie qwen per-megapixel pricing (OQ-4)", () => {
  it.each([
    { model: "qwen/text-to-image", image_size: "square", mp: 1, usd: 0.02 },
    { model: "qwen/text-to-image", image_size: "square_hd", mp: 2, usd: 0.04 },
    {
      model: "qwen/text-to-image",
      image_size: "portrait_4_3",
      mp: 1,
      usd: 0.02,
    },
    {
      model: "qwen/text-to-image",
      image_size: "landscape_16_9",
      mp: 1,
      usd: 0.02,
    },
    { model: "qwen/image-edit", image_size: "landscape_4_3", mp: 1, usd: 0.03 },
    { model: "qwen/image-edit", image_size: "square_hd", mp: 2, usd: 0.06 },
  ])(
    "prices $model $image_size as $mp MP = $usd",
    ({ model, image_size, mp, usd }) => {
      const result = kieEstimate({
        model,
        input: { prompt: "x", image_size },
      });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown).toEqual({
        units: mp,
        unit: "megapixels",
        perUnitUsd: model === "qwen/image-edit" ? 0.03 : 0.02,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  // Schema defaults are the absent-field fallback: square_hd (2 MP) for
  // text-to-image, landscape_4_3 (1 MP) for image-edit.
  it.each([
    { model: "qwen/text-to-image", usd: 0.04 },
    { model: "qwen/image-edit", usd: 0.03 },
  ])("applies $model's documented image_size default", ({ model, usd }) => {
    expect(kieEstimate({ model, input: { prompt: "x" } }).usd).toBeCloseTo(
      usd,
      10
    );
  });

  it("multiplies megapixels by the string-enum num_images", () => {
    const result = kieEstimate({
      model: "qwen/image-edit",
      input: {
        prompt: "x",
        image_url: "https://example.com/x.jpg",
        image_size: "square_hd",
        num_images: "3",
      },
    });

    expect(result.usd).toBeCloseTo(0.18, 10);
    expect(result.breakdown).toEqual({
      units: 6,
      unit: "megapixels",
      perUnitUsd: 0.03,
    });
  });

  // Warn, don't guess: an unrecognized preset has no dimensions to derive an
  // area from, so the estimate fails instead of assuming a square.
  it("fails on an unrecognized image_size preset instead of guessing", () => {
    const result = kieEstimate({
      model: "qwen/text-to-image",
      input: { prompt: "x", image_size: "ultra_wide_9000" },
    });

    expect(result.usd).toBe(0);
    expect(result.breakdown).toEqual({});
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("could not derive units");
  });

  // qwen/image-to-image carries the published $0.02/MP rate but has no size
  // field and no documented default output size, so no payload can derive an
  // area. It stays an entry — the rate and the gap are recorded in one place
  // — and every request warns rather than being priced off an invented size.
  it("keeps qwen/image-to-image priced but underivable", () => {
    const entry = PRICING.kie["qwen/image-to-image"];
    expect(entry.kind).toBe("perUnit");
    if (entry.kind !== "perUnit") throw new Error("expected a perUnit entry");
    expect(entry.unit).toBe("megapixels");
    expect(entry.rates[""]).toBe(0.02);

    const result = kieEstimate({
      model: "qwen/image-to-image",
      input: { prompt: "x", image_url: "https://example.com/x.jpg" },
    });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("could not derive units");
  });
});

// One representative payload per per-VIDEO family added by the 2026-08-06
// pull. These bill per generation, so `duration` picks a rate rather than
// scaling one and the expected usd is the published cell itself.
const VIDEO_PER_VIDEO_RATES = [
  {
    model: "kling-2.6/text-to-video",
    input: { sound: false, aspect_ratio: "16:9", duration: "5" },
    usd: 0.275,
  },
  {
    model: "kling-2.6/text-to-video",
    input: { sound: true, aspect_ratio: "16:9", duration: "5" },
    usd: 0.55,
  },
  {
    model: "kling-2.6/text-to-video",
    input: { sound: false, aspect_ratio: "16:9", duration: "10" },
    usd: 0.55,
  },
  {
    model: "kling-2.6/text-to-video",
    input: { sound: true, aspect_ratio: "16:9", duration: "10" },
    usd: 1.1,
  },
  {
    model: "kling-2.6/image-to-video",
    input: {
      image_urls: ["https://example.com/x.jpg"],
      sound: true,
      duration: "10",
    },
    usd: 1.1,
  },
  {
    model: "kling/v2-5-turbo-text-to-video-pro",
    input: { duration: "10" },
    usd: 0.42,
  },
  {
    model: "kling/v2-5-turbo-image-to-video-pro",
    input: { image_url: "https://example.com/x.jpg", duration: "5" },
    usd: 0.21,
  },
  {
    model: "kling/v2-1-standard",
    input: { image_url: "https://example.com/x.jpg", duration: "10" },
    usd: 0.25,
  },
  {
    model: "kling/v2-1-pro",
    input: { image_url: "https://example.com/x.jpg", duration: "10" },
    usd: 0.5,
  },
  {
    model: "kling/v2-1-master-text-to-video",
    input: { duration: "10" },
    usd: 1.6,
  },
  {
    model: "kling/v2-1-master-image-to-video",
    input: { image_url: "https://example.com/x.jpg", duration: "5" },
    usd: 0.8,
  },
];

// Per-SECOND families added by the same pull. `seconds` is what the payload
// (or, for the no-duration-field models, the hint) declares; `perUnitUsd` is
// the published rate.
const VIDEO_PER_SECOND_RATES = [
  {
    label: "seedance-1.5-pro 480p silent",
    model: "bytedance/seedance-1.5-pro",
    input: { aspect_ratio: "16:9", resolution: "480p", duration: 4 },
    seconds: 4,
    perUnitUsd: 0.00875,
  },
  {
    label: "seedance-1.5-pro 480p audio",
    model: "bytedance/seedance-1.5-pro",
    input: {
      aspect_ratio: "16:9",
      resolution: "480p",
      generate_audio: true,
      duration: 4,
    },
    seconds: 4,
    perUnitUsd: 0.0175,
  },
  {
    label: "seedance-1.5-pro 720p audio",
    model: "bytedance/seedance-1.5-pro",
    input: {
      aspect_ratio: "16:9",
      resolution: "720p",
      generate_audio: true,
      duration: 8,
    },
    seconds: 8,
    perUnitUsd: 0.035,
  },
  {
    label: "seedance-1.5-pro 1080p silent",
    model: "bytedance/seedance-1.5-pro",
    input: {
      aspect_ratio: "16:9",
      resolution: "1080p",
      generate_audio: false,
      duration: 12,
    },
    seconds: 12,
    perUnitUsd: 0.0375,
  },
  {
    label: "seedance-1.5-pro 1080p audio",
    model: "bytedance/seedance-1.5-pro",
    input: {
      aspect_ratio: "16:9",
      resolution: "1080p",
      generate_audio: true,
      duration: 12,
    },
    seconds: 12,
    perUnitUsd: 0.075,
  },
];

describe("kie createTask video families (REQ-005)", () => {
  it.each(VIDEO_PER_VIDEO_RATES)(
    "prices $model $input at $usd per video",
    ({ model, input, usd }) => {
      const result = kieEstimate({ model, input: { prompt: "x", ...input } });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: usd,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  it.each(VIDEO_PER_SECOND_RATES)(
    "prices $label at $perUnitUsd per second",
    ({ model, input, seconds, perUnitUsd }) => {
      const result = kieEstimate({ model, input: { prompt: "xxx", ...input } });

      expect(result.usd).toBeCloseTo(seconds * perUnitUsd, 10);
      expect(result.source).toBe("per-unit-table");
      expect(result.breakdown).toEqual({
        units: seconds,
        unit: "seconds",
        perUnitUsd,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  // The per-video families ignore the duration channel that the per-second
  // ones live on: a 10s hint must not turn the 5s cell into ten of them.
  it("prices kling 2.1 per video regardless of costHints.durationSeconds", () => {
    const result = kieEstimate(
      {
        model: "kling/v2-1-pro",
        input: {
          prompt: "x",
          image_url: "https://example.com/x.jpg",
          duration: "5",
        },
      },
      { costHints: { durationSeconds: 10 } }
    );

    expect(result.usd).toBeCloseTo(0.25, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: 0.25,
    });
  });

  // Documented upstream defaults, applied only where the model's own schema
  // publishes one.
  it.each([
    {
      model: "kling/v2-1-standard",
      input: { image_url: "https://example.com/x.jpg" },
      note: "duration 5",
      usd: 0.125,
    },
    {
      model: "kling/v2-1-pro",
      input: { image_url: "https://example.com/x.jpg" },
      note: "duration 5",
      usd: 0.25,
    },
    {
      model: "kling/v2-1-master-text-to-video",
      input: {},
      note: "duration 5",
      usd: 0.8,
    },
    {
      model: "kling/v2-5-turbo-text-to-video-pro",
      input: {},
      note: "duration 5",
      usd: 0.21,
    },
  ])(
    "falls back to the documented $note default for $model",
    ({ model, input, usd }) => {
      const result = kieEstimate({ model, input: { prompt: "x", ...input } });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.warnings).toEqual([]);
    }
  );

  // Seedance 1.5 Pro declares both price selectors with defaults, so an
  // omitted resolution and audio flag price the documented 720p no-audio row.
  it("applies the seedance-1.5-pro 720p no-audio defaults", () => {
    const result = kieEstimate({
      model: "bytedance/seedance-1.5-pro",
      input: { prompt: "xxx", aspect_ratio: "16:9", duration: 6 },
    });

    expect(result.usd).toBeCloseTo(0.105, 10); // 6 × 0.0175
    expect(result.breakdown).toEqual({
      units: 6,
      unit: "seconds",
      perUnitUsd: 0.0175,
    });
    expect(result.warnings).toEqual([]);
  });

  // The no-duration-field models still take their tier from the payload; the
  // hint only supplies the length. Both defaults are the schema's own.
  it.each([
    {
      model: "topaz/video-upscale",
      input: { video_url: "https://example.com/in.mp4" },
      note: 'upscale_factor "2"',
      perUnitUsd: 0.04,
    },
    {
      model: "infinitalk/from-audio",
      input: {
        image_url: "https://example.com/a.png",
        audio_url: "https://example.com/a.mp3",
        prompt: "x",
      },
      note: 'resolution "480p"',
      perUnitUsd: 0.015,
    },
  ])(
    "falls back to the documented $note default for $model",
    ({ model, input, perUnitUsd }) => {
      const result = kieEstimate(
        { model, input },
        { costHints: { durationSeconds: 10 } }
      );

      expect(result.usd).toBeCloseTo(10 * perUnitUsd, 10);
      expect(result.warnings).toEqual([]);
    }
  );

  // The other side of that rule: kling 2.6 requires `duration` and documents
  // no default, so an omitted one must fail rather than quote the 5s tier.
  it.each(["kling-2.6/text-to-video", "kling-2.6/image-to-video"])(
    "fails %s when duration is omitted and upstream documents no default",
    (model) => {
      const result = kieEstimate({
        model,
        input: { prompt: "x", sound: false },
      });

      expect(result.usd).toBe(0);
      expect(result.breakdown).toEqual({});
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("missing required selector(s)");
      expect(result.warnings[0]).toContain("duration");
    }
  );
});

// WP5.5: kie publishes these per 1000 characters; the table stores the
// per-character rate, so units are the raw character count.
describe("kie ElevenLabs TTS per-character pricing (REQ-005)", () => {
  it.each([
    {
      model: "elevenlabs/text-to-speech-multilingual-v2",
      perUnitUsd: 0.00006,
    },
    { model: "elevenlabs/text-to-speech-turbo-2-5", perUnitUsd: 0.00003 },
  ])("bills $model by input.text length", ({ model, perUnitUsd }) => {
    const text = "a".repeat(1000);
    const result = kieEstimate({ model, input: { text, voice: "Rachel" } });

    expect(result.usd).toBeCloseTo(1000 * perUnitUsd, 10);
    expect(result.source).toBe("per-unit-table");
    expect(result.breakdown).toEqual({
      units: 1000,
      unit: "characters",
      perUnitUsd,
    });
    expect(result.warnings).toEqual([]);
  });

  // The published rate is per 1000 characters; a partial thousand bills
  // pro rata, so the per-character rate must not round up to a block.
  it("bills a partial thousand characters pro rata", () => {
    const result = kieEstimate({
      model: "elevenlabs/text-to-speech-multilingual-v2",
      input: { text: "hello world", voice: "Rachel" },
    });

    expect(result.breakdown.units).toBe(11);
    expect(result.usd).toBeCloseTo(11 * 0.00006, 10);
  });

  it("sums every dialogue turn for text-to-dialogue-v3", () => {
    const result = kieEstimate({
      model: "elevenlabs/text-to-dialogue-v3",
      input: {
        dialogue: [
          { text: "a".repeat(400), voice: "Rachel" },
          { text: "b".repeat(600), voice: "Adam" },
        ],
      },
    });

    expect(result.usd).toBeCloseTo(1000 * 0.00007, 10);
    expect(result.breakdown).toEqual({
      units: 1000,
      unit: "characters",
      perUnitUsd: 0.00007,
    });
    expect(result.warnings).toEqual([]);
  });

  // A turn with no usable text means the request cannot be sized; failing is
  // the fail-safe, since summing the rest would under-bill it.
  it.each([
    { label: "a malformed turn", dialogue: [{ voice: "Rachel" }] },
    { label: "an empty array", dialogue: [] },
  ])("fails text-to-dialogue-v3 on $label", ({ dialogue }) => {
    const result = kieEstimate({
      model: "elevenlabs/text-to-dialogue-v3",
      input: { dialogue },
    });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("could not derive units");
  });

  // Cross-route parity: the same two models are priced by the elevenlabs
  // provider itself. kie resells at its own rate, but both tables must agree
  // on the unit, or a caller comparing routes compares different things.
  it.each([
    {
      kieModel: "elevenlabs/text-to-speech-multilingual-v2",
      directModel: "eleven_multilingual_v2",
    },
    {
      kieModel: "elevenlabs/text-to-speech-turbo-2-5",
      directModel: "eleven_turbo_v2_5",
    },
  ])(
    "prices $kieModel in the same unit as elevenlabs' own entry",
    ({ kieModel, directModel }) => {
      const kieEntry = PRICING.kie[kieModel];
      const directEntry = PRICING.elevenlabs[directModel];

      expect(kieEntry.kind).toBe("perUnit");
      expect(directEntry.kind).toBe("perUnit");
      if (kieEntry.kind !== "perUnit" || directEntry.kind !== "perUnit") return;
      expect(kieEntry.unit).toBe(directEntry.unit);
    }
  );
});

describe("kie 2026-08-06 pricing pull provenance", () => {
  it("stamps every entry added or refreshed by this pull", () => {
    const refreshedOnAugustEleven = new Set([
      "suno/vocal-removal-generate",
      "elevenlabs/text-to-dialogue-v3",
      "seedream/5-pro-image-to-image",
      "seedream/5-pro-layer-decomposition",
    ]);
    for (const model of [
      "veo3",
      "veo3_fast",
      "veo3_lite",
      "veo/extend",
      "veo/get-1080p-video",
      "veo/get-4k-video",
      "runway/generate",
      "runway/extend",
      "aleph/generate",
      "gpt4o-image/generate",
      "flux-kontext-pro",
      "flux-kontext-max",
      "suno/timestamped-lyrics",
      "suno/cover-generate",
      "suno/persona-generate",
      "suno/midi-generate",
      "suno/vocal-removal-generate",
      "seedream/5-pro-text-to-image",
      "seedream/5-pro-image-to-image",
      "seedream/5-pro-layer-decomposition",
      "seedream/4.5-text-to-image",
      "seedream/4.5-edit",
      "nano-banana-2-lite",
      "gpt-image/1.5-text-to-image",
      "gpt-image/1.5-image-to-image",
      "google/imagen4",
      "google/imagen4-fast",
      "google/imagen4-ultra",
      "google/nano-banana",
      "google/nano-banana-edit",
      "z-image",
      "flux-2/flex-text-to-image",
      "flux-2/flex-image-to-image",
      "flux-2/pro-text-to-image",
      "flux-2/pro-image-to-image",
      "ideogram/v3-text-to-image",
      "ideogram/v3-edit",
      "ideogram/v3-remix",
      "ideogram/character",
      "ideogram/character-edit",
      "ideogram/character-remix",
      "recraft/crisp-upscale",
      "recraft/remove-background",
      "topaz/image-upscale",
      "qwen/text-to-image",
      "qwen/image-to-image",
      "qwen/image-edit",
      "kling-2.6/text-to-video",
      "kling-2.6/image-to-video",
      "kling-2.6/motion-control",
      "kling/ai-avatar-standard",
      "kling/ai-avatar-pro",
      "kling/v2-5-turbo-text-to-video-pro",
      "kling/v2-5-turbo-image-to-video-pro",
      "kling/v2-1-standard",
      "kling/v2-1-pro",
      "kling/v2-1-master-text-to-video",
      "kling/v2-1-master-image-to-video",
      "bytedance/seedance-1.5-pro",
      "topaz/video-upscale",
      "infinitalk/from-audio",
      "elevenlabs/text-to-speech-multilingual-v2",
      "elevenlabs/text-to-speech-turbo-2-5",
      "elevenlabs/text-to-dialogue-v3",
      "hailuo/02-text-to-video-pro",
      "hailuo/02-image-to-video-pro",
      "hailuo/02-text-to-video-standard",
      "hailuo/02-image-to-video-standard",
      "hailuo/2-3-image-to-video-standard",
      "hailuo/2-3-image-to-video-pro",
      "happyhorse/text-to-video",
      "happyhorse/image-to-video",
      "happyhorse/reference-to-video",
      "happyhorse/video-edit",
      "happyhorse-1-1/text-to-video",
      "happyhorse-1-1/image-to-video",
      "happyhorse-1-1/reference-to-video",
      "wan/2-7-text-to-video",
      "wan/2-7-image-to-video",
      "wan/2-7-r2v",
      "wan/2-7-videoedit",
      "grok-imagine/text-to-video",
      "grok-imagine/image-to-video",
      "grok-imagine-video-1-5-preview",
      "grok-imagine/extend",
      "grok-imagine/upscale",
      "gemini-omni-video",
      "bytedance/seedance-2",
    ]) {
      const entry = PRICING.kie[model];
      expect(entry, model).toBeDefined();
      expect(entry.source.url, `${model} url`).toMatch(
        /^https:\/\/(docs\.)?kie\.ai\//
      );
      expect(entry.source.asOf, `${model} asOf`).toBe(
        refreshedOnAugustEleven.has(model) ? "2026-08-11" : "2026-08-06"
      );
    }
  });
});

// REQ-002 / REQ-003 (AC-2). Hailuo 02 and 2.3 bill per video: `duration` picks
// a rate row, it never multiplies one, and only cells kie publishes have a
// rate at all.
describe("kie Hailuo 02 / 2.3 per-video pricing (REQ-002/003)", () => {
  it.each([
    {
      label: "02 t2v pro (single published cell)",
      model: "hailuo/02-text-to-video-pro",
      input: {},
      usd: 0.285,
    },
    {
      label: "02 i2v pro (single published cell)",
      model: "hailuo/02-image-to-video-pro",
      input: { image_url: "https://example.com/x.jpg" },
      usd: 0.285,
    },
    {
      label: "02 t2v standard 6s",
      model: "hailuo/02-text-to-video-standard",
      input: { duration: "6" },
      usd: 0.15,
    },
    {
      label: "02 t2v standard 10s",
      model: "hailuo/02-text-to-video-standard",
      input: { duration: "10" },
      usd: 0.25,
    },
    {
      label: "02 i2v standard 6s 512P",
      model: "hailuo/02-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "6",
        resolution: "512P",
      },
      usd: 0.06,
    },
    {
      label: "02 i2v standard 10s 512P",
      model: "hailuo/02-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "10",
        resolution: "512P",
      },
      usd: 0.1,
    },
    {
      label: "02 i2v standard 6s 768P",
      model: "hailuo/02-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "6",
        resolution: "768P",
      },
      usd: 0.15,
    },
    {
      label: "02 i2v standard 10s 768P",
      model: "hailuo/02-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "10",
        resolution: "768P",
      },
      usd: 0.25,
    },
    {
      label: "2.3 i2v standard 6s 768P",
      model: "hailuo/2-3-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "6",
        resolution: "768P",
      },
      usd: 0.15,
    },
    {
      label: "2.3 i2v standard 10s 768P",
      model: "hailuo/2-3-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "10",
        resolution: "768P",
      },
      usd: 0.25,
    },
    {
      label: "2.3 i2v standard 6s 1080P",
      model: "hailuo/2-3-image-to-video-standard",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "6",
        resolution: "1080P",
      },
      usd: 0.25,
    },
    {
      label: "2.3 i2v pro 6s 768P",
      model: "hailuo/2-3-image-to-video-pro",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "6",
        resolution: "768P",
      },
      usd: 0.225,
    },
    {
      label: "2.3 i2v pro 10s 768P",
      model: "hailuo/2-3-image-to-video-pro",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "10",
        resolution: "768P",
      },
      usd: 0.45,
    },
    {
      label: "2.3 i2v pro 6s 1080P",
      model: "hailuo/2-3-image-to-video-pro",
      input: {
        image_url: "https://example.com/x.jpg",
        duration: "6",
        resolution: "1080P",
      },
      usd: 0.4,
    },
  ])("prices hailuo $label at $usd per video", ({ model, input, usd }) => {
    const result = kieEstimate({ model, input: { prompt: "x", ...input } });

    expect(result.usd).toBeCloseTo(usd, 10);
    expect(result.source).toBe("per-unit-table");
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: usd,
    });
    expect(result.warnings).toEqual([]);
  });

  // Documented schema defaults, applied only where the model publishes one.
  // Note the 02 image-to-video default duration is "10", not "6".
  it.each([
    {
      model: "hailuo/02-text-to-video-standard",
      note: 'duration "6"',
      input: {},
      usd: 0.15,
    },
    {
      model: "hailuo/02-image-to-video-standard",
      note: 'duration "10" x resolution "768P"',
      input: { image_url: "https://example.com/x.jpg" },
      usd: 0.25,
    },
    {
      model: "hailuo/2-3-image-to-video-pro",
      note: 'duration "6" x resolution "768P"',
      input: { image_url: "https://example.com/x.jpg" },
      usd: 0.225,
    },
    {
      model: "hailuo/2-3-image-to-video-standard",
      note: 'duration "6" x resolution "768P"',
      input: { image_url: "https://example.com/x.jpg" },
      usd: 0.15,
    },
  ])(
    "prices $model off its documented default ($note)",
    ({ model, input, usd }) => {
      const result = kieEstimate({ model, input: { prompt: "x", ...input } });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.warnings).toEqual([]);
    }
  );

  // AC-2's other half: kie publishes no 10s row at 1080P (upstream documents
  // it as unsupported), so the estimate must fail rather than invent a cell.
  it.each([
    "hailuo/2-3-image-to-video-pro",
    "hailuo/2-3-image-to-video-standard",
  ])("does not price %s at the unpublished 10s/1080P combination", (model) => {
    const result = kieEstimate({
      model,
      input: {
        prompt: "x",
        image_url: "https://example.com/x.jpg",
        duration: "10",
        resolution: "1080P",
      },
    });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("no rate for variant '10|1080P'");
  });

  // Per-video means per video: a duration hint selects nothing and scales
  // nothing, the same pin the veo and Kling per-video families carry.
  it("ignores costHints.durationSeconds for a per-video hailuo cell", () => {
    const result = kieEstimate(
      {
        model: "hailuo/2-3-image-to-video-pro",
        input: {
          prompt: "x",
          image_url: "https://example.com/x.jpg",
          duration: "6",
          resolution: "768P",
        },
      },
      { costHints: { durationSeconds: 10 } }
    );

    expect(result.usd).toBeCloseTo(0.225, 10);
    expect(result.breakdown.units).toBe(1);
  });
});

// REQ-004 (AC-3). Every family the 2026-08-06 pull moved, including the two
// that changed SHAPE and not just price.
describe("kie stale-family refresh (REQ-004)", () => {
  // wan 2.7 went from a flat $0.10/s to resolution tiers. The requirements'
  // worked example: 5s at 720p is $0.40 where the old table said $0.50.
  it.each([
    "wan/2-7-text-to-video",
    "wan/2-7-image-to-video",
    "wan/2-7-r2v",
    "wan/2-7-videoedit",
  ])("prices %s by resolution instead of one flat rate", (model) => {
    const at720 = kieEstimate({
      model,
      input: { prompt: "x", duration: 5, resolution: "720p" },
    });
    const at1080 = kieEstimate({
      model,
      input: { prompt: "x", duration: 5, resolution: "1080p" },
    });

    expect(at720.usd).toBeCloseTo(0.4, 10); // 5 * 0.08, was 5 * 0.10
    expect(at720.breakdown.perUnitUsd).toBe(0.08);
    expect(at1080.usd).toBeCloseTo(0.6, 10); // 5 * 0.12
    expect(at1080.breakdown.perUnitUsd).toBe(0.12);
  });

  it("prices wan 2.7 off its documented 1080p default", () => {
    const result = kieEstimate({
      model: "wan/2-7-text-to-video",
      input: { prompt: "x", duration: 5 },
    });

    expect(result.usd).toBeCloseTo(0.6, 10);
    expect(result.warnings).toEqual([]);
  });

  // gemini-omni t2v: 720p and 1080p are the same price now, and 4k is its own
  // column rather than a copy of the 1080p one.
  it.each([
    { resolution: "720p", duration: 4, usd: 0.315 },
    { resolution: "720p", duration: 6, usd: 0.42 },
    { resolution: "720p", duration: 8, usd: 0.525 },
    { resolution: "720p", duration: 10, usd: 0.63 },
    { resolution: "1080p", duration: 4, usd: 0.315 },
    { resolution: "1080p", duration: 10, usd: 0.63 },
    { resolution: "4k", duration: 4, usd: 0.735 },
    { resolution: "4k", duration: 6, usd: 0.84 },
    { resolution: "4k", duration: 8, usd: 0.945 },
    { resolution: "4k", duration: 10, usd: 1.05 },
  ])(
    "prices gemini-omni t2v $duration s at $resolution as $usd",
    ({ resolution, duration, usd }) => {
      const result = kieEstimate({
        model: "gemini-omni-video",
        input: { prompt: "x", duration: String(duration), resolution },
      });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown.units).toBe(1);
    }
  );

  // gemini-omni v2v: flat per video by resolution. The requirements' worked
  // example — an 8s 1080p v2v request is $0.84, not the old duration-keyed
  // $1.68 — plus the pin that duration no longer moves the cell at all.
  it.each([
    { resolution: "720p", usd: 0.84 },
    { resolution: "1080p", usd: 0.84 },
    { resolution: "4k", usd: 1.26 },
  ])(
    "prices gemini-omni v2v at $resolution as a flat $usd per video",
    ({ resolution, usd }) => {
      for (const duration of ["4", "6", "8", "10"]) {
        const result = kieEstimate({
          model: "gemini-omni-video",
          input: {
            prompt: "x",
            duration,
            resolution,
            video_list: [
              { url: "https://example.com/in.mp4", start: 0, ends: 5 },
            ],
          },
        });

        expect(result.usd, `${resolution} @ ${duration}s`).toBeCloseTo(usd, 10);
        expect(result.breakdown).toEqual({
          units: 1,
          unit: "generations",
          perUnitUsd: usd,
        });
      }
    }
  );

  it("prices gemini-omni v2v off the documented 720p default", () => {
    const result = kieEstimate({
      model: "gemini-omni-video",
      input: {
        prompt: "x",
        duration: "8",
        video_list: [{ url: "https://example.com/in.mp4", start: 0, ends: 5 }],
      },
    });

    expect(result.usd).toBeCloseTo(0.84, 10);
    expect(result.warnings).toEqual([]);
  });

  // AC-4 paper trail: the two OTP pay-gated Gemini Omni routes that are NOT
  // the video generator publish no rate in the 2026-08-06 pull (0 of 404
  // rows), so they are intentionally unpriced rather than silently skipped.
  // Same treatment as the unpriced bytedance/seedream* ids above — no entry,
  // fail-safe `prohibitive`, and an estimate that fails loudly instead of
  // quoting a guessed rate. Delete this pin only when a page row appears.
  it.each(["api.v1.omni.audio.create", "api.v1.omni.character.create"])(
    "leaves %s pay-gated but unpriced — no published page row",
    (dotPath) => {
      expect(lookupPaidEndpoint("kie", "POST", dotPath)).toBeDefined();
      expect(PRICING.kie[dotPath]).toBeUndefined();

      const result = kieEstimate({ prompt: "x" }, { endpoint: dotPath });

      expect(result.usd).toBe(0);
      expect(result.warnings[0]).toContain("not found in pricing table");
    }
  );

  // seedance-2 rate columns. Two links are pinned here at once, both through
  // the same parse-then-estimate route:
  //
  //   1. schema member <-> rate key (ac-8cfo6r) — the 4K tier is
  //      schema-reachable and its key is the case-sensitive lowercase "4k", so
  //      a drift to "4K" on either side fails here instead of silently quoting
  //      $0. The seedance-2 4k rows in scripts/compare-video-cost.mjs guard
  //      the schema half of that link at lint time.
  //   2. selector <-> column (ac-4jaqty) — the column is chosen by
  //      input.reference_video_urls (the family's actual "video input", shared
  //      with seedance-2-mini), NOT by the first_frame_url image seed.
  //
  // The 4k first-frame row is the observed-billing anchor: the committed
  // fixture tests/recordings/kie_2079838932/bytedance-seedance-2-4k_1424029474
  // sends exactly this shape (first_frame_url, no reference video, "4k", 4 s)
  // and was billed 832 credits = $4.16 at $0.005/credit = 4 x $1.04, the
  // "no video input" column. Keying off first_frame_url priced it at $2.56.
  //
  // Reference-video rows omit first/last frame URLs because the request
  // schema's refine rejects combining them.
  it.each([
    {
      label: "4k first-frame -> 4k|no-video (the 832-credit anchor)",
      input: {
        prompt: "xxx",
        duration: 4,
        resolution: "4k",
        first_frame_url: "https://example.com/x.jpg",
      },
      seconds: 4,
      perUnitUsd: 1.04,
    },
    {
      label: "4k reference-video -> 4k|video",
      input: {
        prompt: "xxx",
        duration: 4,
        resolution: "4k",
        reference_video_urls: ["https://example.com/ref.mp4"],
      },
      seconds: 4,
      perUnitUsd: 0.64,
    },
    {
      label: "720p first-frame -> 720p|no-video",
      input: {
        prompt: "xxx",
        duration: 5,
        resolution: "720p",
        first_frame_url: "https://example.com/x.jpg",
      },
      seconds: 5,
      perUnitUsd: 0.205,
    },
    {
      label: "720p reference-video -> 720p|video",
      input: {
        prompt: "xxx",
        duration: 5,
        resolution: "720p",
        reference_video_urls: ["https://example.com/ref.mp4"],
      },
      seconds: 5,
      perUnitUsd: 0.125,
    },
    {
      label: "480p prompt-only -> 480p|no-video",
      input: { prompt: "xxx", duration: 5, resolution: "480p" },
      seconds: 5,
      perUnitUsd: 0.095,
    },
    {
      label: "720p prompt-only -> 720p|no-video",
      input: { prompt: "xxx", duration: 5, resolution: "720p" },
      seconds: 5,
      perUnitUsd: 0.205,
    },
    {
      label: "1080p prompt-only -> 1080p|no-video",
      input: { prompt: "xxx", duration: 5, resolution: "1080p" },
      seconds: 5,
      perUnitUsd: 0.51,
    },
    {
      label: "4k prompt-only -> 4k|no-video",
      input: { prompt: "xxx", duration: 5, resolution: "4k" },
      seconds: 5,
      perUnitUsd: 1.04,
    },
  ])("prices seedance-2 $label", ({ input, seconds, perUnitUsd }) => {
    // Parse first, then estimate the PARSED payload. Feeding the raw literal
    // would only prove the rate table has a matching row; routing it through
    // the shipped schema proves a payload the SDK actually accepts reaches
    // that row.
    const parsed = Seedance2RequestSchema.safeParse({
      model: "bytedance/seedance-2",
      input,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    // Defaults the schema applied — evidence this is the parsed output and
    // not the literal above. The estimator ignores fields it does not select.
    expect(parsed.data.input.nsfw_checker).toBe(false);

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(seconds * perUnitUsd, 10);
    expect(result.breakdown).toEqual({
      units: seconds,
      unit: "seconds",
      perUnitUsd,
    });
    expect(
      result.warnings.some((warning) =>
        warning.includes("not found in pricing table")
      )
    ).toBe(false);
  });

  // seedance-2-fast shares the page and the column semantics, so it shares the
  // reference-video discriminator. No creditsConsumed observation exists for
  // this model — these pins hold the mapping and the unchanged prompt-only
  // values rather than an observed bill.
  it.each([
    {
      label: "720p reference-video -> 720p|video",
      input: {
        prompt: "xxx",
        duration: 5,
        resolution: "720p",
        reference_video_urls: ["https://example.com/ref.mp4"],
      },
      seconds: 5,
      perUnitUsd: 0.075,
    },
    {
      label: "480p first-frame -> 480p|no-video",
      input: {
        prompt: "xxx",
        duration: 5,
        resolution: "480p",
        first_frame_url: "https://example.com/x.jpg",
      },
      seconds: 5,
      perUnitUsd: 0.059,
    },
    {
      label: "480p prompt-only -> 480p|no-video",
      input: { prompt: "xxx", duration: 5, resolution: "480p" },
      seconds: 5,
      perUnitUsd: 0.059,
    },
    {
      label: "720p prompt-only -> 720p|no-video",
      input: { prompt: "xxx", duration: 5, resolution: "720p" },
      seconds: 5,
      perUnitUsd: 0.124,
    },
  ])("prices seedance-2-fast $label", ({ input, seconds, perUnitUsd }) => {
    const parsed = Seedance2FastRequestSchema.safeParse({
      model: "bytedance/seedance-2-fast",
      input,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.input.nsfw_checker).toBe(false);

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(seconds * perUnitUsd, 10);
    expect(result.breakdown).toEqual({
      units: seconds,
      unit: "seconds",
      perUnitUsd,
    });
    expect(
      result.warnings.some((warning) =>
        warning.includes("not found in pricing table")
      )
    ).toBe(false);
  });

  it("uses Seedance 2 Fast's documented 720p fallback when omitted", () => {
    const parsed = Seedance2FastRequestSchema.safeParse({
      model: "bytedance/seedance-2-fast",
      input: { prompt: "xxx", duration: 5 },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.input.resolution).toBeUndefined();

    const result = kieEstimate(parsed.data);
    expect(result.usd).toBeCloseTo(5 * 0.124, 10);
    expect(result.breakdown).toEqual({
      units: 5,
      unit: "seconds",
      perUnitUsd: 0.124,
    });
    expect(result.warnings).toEqual([]);
  });

  it.each([
    { resolution: "480p", generate_audio: false, rate: 0.14 },
    { resolution: "480p", generate_audio: true, rate: 0.085 },
    { resolution: "720p", generate_audio: false, rate: 0.315 },
    { resolution: "720p", generate_audio: true, rate: 0.19 },
  ])(
    "prices Seedance 2.5 $resolution $generate_audio at $rate/s",
    ({ resolution, generate_audio, rate }) => {
      const parsed = Seedance25RequestSchema.safeParse({
        model: "bytedance/seedance-2-5",
        input: {
          prompt: "a city skyline",
          duration: 6,
          resolution,
          generate_audio,
        },
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = kieEstimate(parsed.data);
      expect(result.usd).toBeCloseTo(6 * rate, 10);
      expect(result.breakdown).toEqual({
        units: 6,
        unit: "seconds",
        perUnitUsd: rate,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  it("uses Seedance 2.5 documented defaults and fresh provenance", () => {
    const parsed = Seedance25RequestSchema.safeParse({
      model: "bytedance/seedance-2-5",
      input: {},
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.input.duration).toBe(5);
    expect(parsed.data.input.resolution).toBe("720p");
    expect(parsed.data.input.generate_audio).toBe(true);

    const result = kieEstimate(parsed.data);
    expect(result.usd).toBeCloseTo(5 * 0.19, 10);
    expect(PRICING.kie["bytedance/seedance-2-5"].source).toEqual({
      url: "https://kie.ai/seedance-2-5",
      asOf: "2026-08-11",
    });
  });

  it("does not price Seedance 2.5's -1 duration sentinel without a hint", () => {
    const request = {
      model: "bytedance/seedance-2-5",
      input: { resolution: "720p", generate_audio: true, duration: -1 },
    };

    const failed = kieEstimate(request);
    expect(failed.usd).toBe(0);
    expect(failed.warnings[0]).toContain("could not derive units");

    const hinted = kieEstimate(request, { costHints: { durationSeconds: 6 } });
    expect(hinted.usd).toBeCloseTo(6 * 0.19, 10);
    expect(hinted.breakdown.perUnitUsd).toBe(0.19);
  });

  it.each([
    { size: "1K", rate: 0.035 },
    { size: "1.5K", rate: 0.035 },
    { size: "2K", rate: 0.07 },
  ])(
    "prices callable Seedream layer decomposition at $size",
    ({ size, rate }) => {
      const parsed = SeedreamProLayerDecompositionRequestSchema.safeParse({
        model: "seedream/5-pro-layer-decomposition",
        input: { image_url: "https://example.com/image.png", size },
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      const result = kieEstimate(parsed.data);
      expect(result.usd).toBeCloseTo(rate, 10);
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "images",
        perUnitUsd: rate,
      });
    }
  );

  it.each([
    { imageCount: 1, resolution: "768P", duration: 5, usd: 0.44 },
    { imageCount: 3, resolution: "2K", duration: 4, usd: 0.64 },
  ])(
    "prices MiniMax H3 reference images with exact per-image input charges",
    ({ imageCount, resolution, duration, usd }) => {
      const parsed = MiniMaxH3ReferenceToVideoRequestSchema.safeParse({
        model: "minimax-h3/reference-to-video",
        input: {
          prompt: "make a cinematic scene",
          reference_image_urls: Array.from(
            { length: imageCount },
            (_, index) => `https://example.com/ref-${index}.png`
          ),
          duration,
          resolution,
        },
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      const result = kieEstimate(parsed.data);

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown.extraUsd).toBeCloseTo(imageCount * 0.04, 10);
      expect(result.warnings).toEqual([]);
    }
  );

  it.each([
    {
      label: "first_frame_url",
      input: { first_frame_url: "https://example.com/first.png" },
      extraUsd: 0.04,
      usd: 0.44,
    },
    {
      label: "first_frame_url and last_frame_url",
      input: {
        first_frame_url: "https://example.com/first.png",
        last_frame_url: "https://example.com/last.png",
      },
      extraUsd: 0.08,
      usd: 0.48,
    },
  ])(
    "prices MiniMax H3 image-to-video $label input surcharge exactly",
    ({ input, extraUsd, usd }) => {
      const parsed = MiniMaxH3ImageToVideoRequestSchema.safeParse({
        model: "minimax-h3/image-to-video",
        input: {
          prompt: "animate the supplied frames",
          duration: 5,
          resolution: "768P",
          ...input,
        },
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      const result = kieEstimate(parsed.data);

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown.extraUsd).toBeCloseTo(extraUsd, 10);
      expect(result.warnings).toEqual([]);
    }
  );

  it("fails closed for MiniMax H3 reference video input", () => {
    const parsed = MiniMaxH3ReferenceToVideoRequestSchema.safeParse({
      model: "minimax-h3/reference-to-video",
      input: {
        prompt: "use the reference motion",
        reference_video_urls: ["https://example.com/ref.mp4"],
        duration: 5,
        resolution: "768P",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const result = kieEstimate(parsed.data);

    expect(result.usd).toBe(0);
    expect(result.breakdown).toEqual({});
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("reference_video_urls");
    expect(result.warnings[0]).toContain("fails closed");
  });

  // grok-imagine video: both existing tiers rose and 1080p is new. The 1080p
  // rate is credits-derived (8 credits/s x $0.005) because the page's
  // image-to-video USD cell prints a malformed "$0.004".
  it.each([
    { model: "grok-imagine/text-to-video", resolution: "480p", rate: 0.012 },
    { model: "grok-imagine/text-to-video", resolution: "720p", rate: 0.0225 },
    { model: "grok-imagine/text-to-video", resolution: "1080p", rate: 0.04 },
    { model: "grok-imagine/image-to-video", resolution: "480p", rate: 0.012 },
    { model: "grok-imagine/image-to-video", resolution: "720p", rate: 0.0225 },
    { model: "grok-imagine/image-to-video", resolution: "1080p", rate: 0.04 },
    {
      model: "grok-imagine-video-1-5-preview",
      resolution: "480p",
      rate: 0.012,
    },
    {
      model: "grok-imagine-video-1-5-preview",
      resolution: "720p",
      rate: 0.0225,
    },
  ])(
    "prices $model at $resolution as $rate/s",
    ({ model, resolution, rate }) => {
      const result = kieEstimate({
        model,
        input: { prompt: "x", duration: 6, resolution },
      });

      expect(result.breakdown.perUnitUsd).toBe(rate);
      expect(result.usd).toBeCloseTo(6 * rate, 10);
    }
  );

  // The preview model publishes no 1080p row, so its schema's top tier is
  // where the table stops too.
  it("does not price grok-imagine-video-1-5-preview at 1080p", () => {
    const result = kieEstimate({
      model: "grok-imagine-video-1-5-preview",
      input: { prompt: "x", duration: 6, resolution: "1080p" },
    });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
  });

  it.each([
    { extendTimes: "6", resolution: "480p", usd: 0.072 },
    { extendTimes: "6", resolution: "720p", usd: 0.135 },
    { extendTimes: "10", resolution: "480p", usd: 0.12 },
    { extendTimes: "10", resolution: "720p", usd: 0.225 },
  ])(
    "prices grok-imagine/extend $extendTimes s at $resolution as $usd",
    ({ extendTimes, resolution, usd }) => {
      const result = kieEstimate({
        model: "grok-imagine/extend",
        resolution,
        input: {
          task_id: "abc",
          prompt: "more",
          extend_at: 2,
          extend_times: extendTimes,
        },
      });

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown.perUnitUsd).toBe(usd);
    }
  );

  // OQ-2's resolution: the upscale schema carries only `task_id`, so none of
  // the task-dependent tiers can be selected. The estimate fails closed.
  it("fails closed for grok-imagine/upscale without task resolutions", () => {
    const result = kieEstimate({
      model: "grok-imagine/upscale",
      input: { task_id: "abc" },
    });

    expect(result.usd).toBe(0);
    expect(result.breakdown).toEqual({});
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("360p→720p");
    expect(result.warnings[0]).toContain("720P→1080P ($0.10)");
    expect(result.warnings[0]).toContain("480P→1080P ($0.15)");
    expect(result.warnings[0]).toContain("fails closed");
    expect(PRICING.kie["grok-imagine/upscale"]).toMatchObject({
      rates: { "": 0 },
    });
  });

  it.each([
    { model: "happyhorse/text-to-video", resolution: "720p", rate: 0.14 },
    { model: "happyhorse/text-to-video", resolution: "1080p", rate: 0.24 },
    { model: "happyhorse/image-to-video", resolution: "720p", rate: 0.14 },
    { model: "happyhorse/image-to-video", resolution: "1080p", rate: 0.24 },
    { model: "happyhorse/reference-to-video", resolution: "720p", rate: 0.14 },
    {
      model: "happyhorse/reference-to-video",
      resolution: "1080p",
      rate: 0.24,
    },
    { model: "happyhorse/video-edit", resolution: "720p", rate: 0.14 },
    { model: "happyhorse/video-edit", resolution: "1080p", rate: 0.24 },
    {
      model: "happyhorse-1-1/text-to-video",
      resolution: "720p",
      rate: 0.1125,
    },
    {
      model: "happyhorse-1-1/text-to-video",
      resolution: "1080p",
      rate: 0.145,
    },
    {
      model: "happyhorse-1-1/image-to-video",
      resolution: "720p",
      rate: 0.1125,
    },
    {
      model: "happyhorse-1-1/image-to-video",
      resolution: "1080p",
      rate: 0.145,
    },
    {
      model: "happyhorse-1-1/reference-to-video",
      resolution: "720p",
      rate: 0.1125,
    },
    {
      model: "happyhorse-1-1/reference-to-video",
      resolution: "1080p",
      rate: 0.145,
    },
  ])(
    "prices $model at $resolution as $rate/s",
    ({ model, resolution, rate }) => {
      const result = kieEstimate({
        model,
        input: { prompt: "x", duration: 5, resolution },
      });

      expect(result.breakdown.perUnitUsd).toBe(rate);
      expect(result.usd).toBeCloseTo(5 * rate, 10);
    }
  );
});

// REQ-004 (AC-4). The seven wan 2.2 / 2.5 createTask models kie prices but the
// cost table did not cover. Rates re-checked live against
// `POST https://api.kie.ai/client/v1/model-pricing/page` on 2026-08-07: all 23
// wan rows are identical to the 2026-08-06 pull (the only diff in the whole
// 408-row table is four new bytedance/seedance-2-5 rows), so every entry keeps
// the `pricePage()` 2026-08-06 stamp rather than a fresh `asOf`.
//
// Every estimate below runs on the OUTPUT of the shipped kie request schema,
// not on a hand-written literal — the seedance-2 precedent above. That is what
// makes the schema defaults (720p turbo, 480p speech/animate) load-bearing
// evidence instead of a restatement of the rate table.
describe("kie wan 2.2 / 2.5 per-model pricing (REQ-004)", () => {
  const WAN_MODELS = [
    "wan/2-2-a14b-text-to-video-turbo",
    "wan/2-2-a14b-image-to-video-turbo",
    "wan/2-2-a14b-speech-to-video-turbo",
    "wan/2-2-animate-move",
    "wan/2-2-animate-replace",
    "wan/2-5-text-to-video",
    "wan/2-5-image-to-video",
  ];

  it.each(WAN_MODELS)("stamps %s with the 2026-08-06 pull provenance", (m) => {
    const entry = PRICING.kie[m];
    expect(entry, m).toBeDefined();
    expect(entry.source.url, `${m} url`).toMatch(/^https:\/\/kie\.ai\//);
    expect(entry.source.asOf, `${m} asOf`).toBe(
      m === "wan/2-2-a14b-speech-to-video-turbo" ||
        m === "wan/2-2-animate-move" ||
        m === "wan/2-2-animate-replace"
        ? "2026-08-11"
        : "2026-08-06"
    );
  });

  it("prices the A14B turbo pair per video by resolution", () => {
    for (const model of [
      "wan/2-2-a14b-text-to-video-turbo",
      "wan/2-2-a14b-image-to-video-turbo",
    ]) {
      expect(PRICING.kie[model], model).toMatchObject({
        kind: "perUnit",
        unit: "generations",
        rates: { "480p": 0.2, "720p": 0.4 },
      });
      expect(PRICING.kie[model].source.url).toContain(
        "https://kie.ai/wan/v2-2?model=wan%2F2-2-a14b-"
      );
    }
  });

  it("prices speech-to-video and the animate pair per second by resolution", () => {
    expect(PRICING.kie["wan/2-2-a14b-speech-to-video-turbo"]).toMatchObject({
      kind: "perUnit",
      unit: "seconds",
      rates: { "480p": 0.06, "580p": 0.09, "720p": 0.12 },
      source: { url: "https://kie.ai/wan-speech-to-video-turbo" },
    });

    for (const model of ["wan/2-2-animate-move", "wan/2-2-animate-replace"]) {
      expect(PRICING.kie[model], model).toMatchObject({
        kind: "perUnit",
        unit: "seconds",
        rates: { "480p": 0.03, "580p": 0.0475, "720p": 0.0625 },
        source: { url: "https://kie.ai/wan-animate" },
      });
    }
  });

  it("prices the wan 2.5 pair per video across all four published cells", () => {
    for (const model of ["wan/2-5-text-to-video", "wan/2-5-image-to-video"]) {
      expect(PRICING.kie[model], model).toMatchObject({
        kind: "perUnit",
        unit: "generations",
        rates: { "5|720p": 0.3, "5|1080p": 0.5, "10|720p": 0.6, "10|1080p": 1 },
      });
      expect(PRICING.kie[model].source.url).toContain(
        "https://kie.ai/wan-2-5?model=wan%2F2-5-"
      );
    }
  });

  // Separate from the WAN_MODELS block above on purpose: the wan 2.6 table was
  // confirmed by mayor ruling R2 on 2026-08-07, a day after the shared
  // 2026-08-06 pull those entries are stamped with.
  const WAN_26_PRICED = [
    "wan/2-6-text-to-video",
    "wan/2-6-image-to-video",
    "wan/2-6-video-to-video",
  ];

  it.each(WAN_26_PRICED)("stamps %s with the R2 confirmation date", (m) => {
    const entry = PRICING.kie[m];
    expect(entry, m).toBeDefined();
    expect(entry.source.url, `${m} url`).toContain(
      "https://kie.ai/wan-2-6?model=wan%2F2-6-"
    );
    expect(entry.source.asOf, `${m} asOf`).toBe("2026-08-07");
  });

  it("prices the wan 2.6 text/image pair across all six published cells", () => {
    for (const model of ["wan/2-6-text-to-video", "wan/2-6-image-to-video"]) {
      expect(PRICING.kie[model], model).toMatchObject({
        kind: "perUnit",
        unit: "generations",
        rates: {
          "5|720p": 0.35,
          "5|1080p": 0.5225,
          "10|720p": 0.7,
          "10|1080p": 1.0475,
          "15|720p": 1.05,
          "15|1080p": 1.575,
        },
      });
    }
  });

  // Wan26VideoDurationSchema stops at "10" while the text- and image-input
  // siblings accept "15", so this entry publishes four cells, not six. The kie
  // page prints 15s rows across the family; pricing one here would quote a
  // video video-to-video's own guard rejects.
  it("gives wan 2.6 video-to-video four cells with no 15s row", () => {
    const entry = PRICING.kie["wan/2-6-video-to-video"];
    expect(entry.kind).toBe("perUnit");
    if (entry.kind !== "perUnit") return;

    expect(entry.unit).toBe("generations");
    expect(entry.rates).toEqual({
      "5|720p": 0.35,
      "5|1080p": 0.5225,
      "10|720p": 0.7,
      "10|1080p": 1.0475,
    });
  });

  // R2: kie publishes no flash rate on any surface, so the pair stays unpriced
  // and fails safe into the prohibitive tier rather than borrowing the standard
  // trio's rate. Same discipline as pixverse-v6/*.
  it.each(["wan/2-6-flash-image-to-video", "wan/2-6-flash-video-to-video"])(
    "leaves %s unpriced",
    (model) => {
      expect(PRICING.kie[model]).toBeUndefined();
    }
  );

  // One representative payload per priced model, each routed through the
  // shipped schema first so the USD figure is evidence about the SDK's own
  // output rather than about a literal written to match the table.
  it("prices a text-to-video turbo clip off the schema's 720p default", () => {
    const parsed = Wan22A14bTextToVideoTurboRequestSchema.safeParse({
      model: "wan/2-2-a14b-text-to-video-turbo",
      input: { prompt: "a hot air balloon over the ice fields" },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.input.resolution).toBe("720p");

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(0.4, 10);
    expect(result.breakdown).toEqual({
      units: 1,
      unit: "generations",
      perUnitUsd: 0.4,
    });
    expect(result.warnings).toEqual([]);
  });

  it("prices an image-to-video turbo clip at the 480p cell", () => {
    const parsed = Wan22A14bImageToVideoTurboRequestSchema.safeParse({
      model: "wan/2-2-a14b-image-to-video-turbo",
      input: {
        image_url: "https://example.com/still.png",
        prompt: "the camera pushes in",
        resolution: "480p",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(0.2, 10);
    expect(result.breakdown.perUnitUsd).toBe(0.2);
    expect(result.warnings).toEqual([]);
  });

  // The per-video basis, pinned the way veo's is: these two bill one fixed ~5s
  // clip, so a declared length must not scale the price no matter its value.
  it.each([undefined, 3, 5, 30])(
    "keeps the turbo pair at one generation with costHints.durationSeconds=%s",
    (durationSeconds) => {
      const result = kieEstimate(
        {
          model: "wan/2-2-a14b-text-to-video-turbo",
          input: { prompt: "x", resolution: "720p" },
        },
        durationSeconds === undefined
          ? {}
          : { costHints: { durationSeconds } as CostHints }
      );

      expect(result.usd).toBeCloseTo(0.4, 10);
      expect(result.breakdown.units).toBe(1);
    }
  );

  // kie publishes a 580p turbo cell at $0.30 per video, and it is deliberately
  // absent from the table: the docs fragment and the shipped schema both
  // enumerate `resolution` as 480p|720p, so no payload the SDK accepts can
  // reach that row. Both halves are pinned so a future enum widening trips
  // here rather than silently pricing at the 720p cell.
  it("leaves the unreachable 580p turbo cell unpriced", () => {
    expect(
      Wan22A14bTextToVideoTurboRequestSchema.safeParse({
        model: "wan/2-2-a14b-text-to-video-turbo",
        input: { prompt: "x", resolution: "580p" },
      }).success
    ).toBe(false);

    for (const model of [
      "wan/2-2-a14b-text-to-video-turbo",
      "wan/2-2-a14b-image-to-video-turbo",
    ]) {
      const entry = PRICING.kie[model];
      expect(entry.kind, model).toBe("perUnit");
      if (entry.kind !== "perUnit") return;

      expect(Object.keys(entry.rates).sort(), model).toEqual(["480p", "720p"]);
    }
  });

  it("prices speech-to-video per second off the schema's 480p default", () => {
    const parsed = Wan22A14bSpeechToVideoTurboRequestSchema.safeParse({
      model: "wan/2-2-a14b-speech-to-video-turbo",
      input: {
        prompt: "a newsreader delivers the segment",
        image_url: "https://example.com/anchor.png",
        audio_url: "https://example.com/vo.mp3",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.input.resolution).toBe("480p");
    // 80 frames / 16 fps = 5s of output. The estimator derives this directly
    // from the parsed wire payload; no cost hint is needed.
    expect(parsed.data.input.num_frames).toBe(80);
    expect(parsed.data.input.frames_per_second).toBe(16);

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(0.3, 10); // 5 * 0.06
    expect(result.breakdown).toEqual({
      units: 5,
      unit: "seconds",
      perUnitUsd: 0.06,
    });
    expect(result.warnings).toEqual([]);
  });

  it("prices speech-to-video at the 720p cell", () => {
    const result = kieEstimate({
      model: "wan/2-2-a14b-speech-to-video-turbo",
      input: {
        prompt: "x",
        image_url: "https://example.com/a.png",
        audio_url: "https://example.com/a.mp3",
        num_frames: 120,
        frames_per_second: 20,
        resolution: "720p",
      },
    });

    expect(result.usd).toBeCloseTo(0.72, 10); // 120 / 20 * 0.12
    expect(result.breakdown).toEqual({
      units: 6,
      unit: "seconds",
      perUnitUsd: 0.12,
    });
  });

  it("derives speech-to-video duration from non-default frames and FPS", () => {
    const result = kieEstimate({
      model: "wan/2-2-a14b-speech-to-video-turbo",
      input: {
        prompt: "x",
        image_url: "https://example.com/a.png",
        audio_url: "https://example.com/a.mp3",
        num_frames: 90,
        frames_per_second: 30,
        resolution: "580p",
      },
    });

    expect(result.usd).toBeCloseTo(0.27, 10); // 90 / 30 * 0.09
    expect(result.breakdown).toEqual({
      units: 3,
      unit: "seconds",
      perUnitUsd: 0.09,
    });
  });

  it("prices animate-move per second off the schema's 480p default", () => {
    const parsed = Wan22AnimateMoveRequestSchema.safeParse({
      model: "wan/2-2-animate-move",
      input: {
        video_url: "https://example.com/drive.mp4",
        image_url: "https://example.com/subject.png",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.input.resolution).toBe("480p");

    const result = kieEstimate(parsed.data, {
      costHints: { durationSeconds: 8 },
    });

    expect(result.usd).toBeCloseTo(0.24, 10); // 8 * 0.03
    expect(result.breakdown.unit).toBe("seconds");
    expect(result.warnings).toEqual([]);
  });

  it("prices animate-replace at the 580p and 720p cells", () => {
    const parsed = Wan22AnimateReplaceRequestSchema.safeParse({
      model: "wan/2-2-animate-replace",
      input: {
        video_url: "https://example.com/drive.mp4",
        image_url: "https://example.com/subject.png",
        resolution: "580p",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const at580 = kieEstimate(parsed.data, {
      costHints: { durationSeconds: 8 },
    });
    expect(at580.usd).toBeCloseTo(0.38, 10); // 8 * 0.0475

    const at720 = kieEstimate(
      {
        ...parsed.data,
        input: { ...parsed.data.input, resolution: "720p" },
      },
      { costHints: { durationSeconds: 8 } }
    );
    expect(at720.usd).toBeCloseTo(0.5, 10); // 8 * 0.0625
  });

  // Animate inherits its driving-video length and still requires the hint.
  it.each(["wan/2-2-animate-move", "wan/2-2-animate-replace"])(
    "fails %s when no duration is declared",
    (model) => {
      const result = kieEstimate({ model, input: { resolution: "480p" } });

      expect(result.usd).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("costHints.durationSeconds");
    }
  );

  it.each([
    { duration: "5", resolution: "720p", usd: 0.3 },
    { duration: "5", resolution: "1080p", usd: 0.5 },
    { duration: "10", resolution: "720p", usd: 0.6 },
    { duration: "10", resolution: "1080p", usd: 1 },
  ])(
    "prices wan 2.5 text-to-video $duration s at $resolution as $usd",
    ({ duration, resolution, usd }) => {
      const parsed = Wan25TextToVideoRequestSchema.safeParse({
        model: "wan/2-5-text-to-video",
        input: { prompt: "a kite over the harbour", duration, resolution },
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = kieEstimate(parsed.data);

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: usd,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  it("prices wan 2.5 image-to-video off its own published cells", () => {
    const parsed = Wan25ImageToVideoRequestSchema.safeParse({
      model: "wan/2-5-image-to-video",
      input: {
        prompt: "the sails fill",
        image_url: "https://example.com/boat.png",
        duration: "10",
        resolution: "1080p",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(1, 10);
    expect(result.breakdown.perUnitUsd).toBe(1);
    expect(result.warnings).toEqual([]);
  });

  // The wan 2.5 duration is a per-video SELECTOR, not a multiplier: 10s costs
  // twice 5s because kie publishes it that way, and units stay at one video.
  it("selects a wan 2.5 rate with duration instead of scaling one", () => {
    const at5 = kieEstimate({
      model: "wan/2-5-text-to-video",
      input: { prompt: "x", duration: "5", resolution: "720p" },
    });

    expect(at5.breakdown.units).toBe(1);
    expect(at5.breakdown.unit).toBe("generations");
    expect(at5.breakdown.perUnitUsd).toBe(0.3);
  });

  // Neither wan 2.5 axis has a documented default — the docs fragments give
  // `resolution` an enum and an *example* of 1080p but no `default:` key, and
  // `duration` is required — so an omitted field must fail loudly rather than
  // quote a tier upstream never named (the kling-2.6 / grok-imagine rule).
  it.each([
    {
      label: "resolution omitted",
      input: { prompt: "x", duration: "5" },
    },
    {
      label: "duration omitted",
      input: { prompt: "x", resolution: "720p" },
    },
    { label: "both omitted", input: { prompt: "x" } },
  ])("fails wan 2.5 with $label", ({ input }) => {
    const result = kieEstimate({ model: "wan/2-5-text-to-video", input });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("missing required selector(s)");
  });

  // Both resolutions and all three durations, each routed through the shipped
  // schema first so the USD figure is evidence about the SDK's own output.
  // 1080p is not a fixed multiple of 720p here — 5s is 1.493x and 15s is 1.5x —
  // which is why every cell is listed rather than derived from a tier.
  it.each([
    { duration: "5", resolution: "720p", usd: 0.35 },
    { duration: "5", resolution: "1080p", usd: 0.5225 },
    { duration: "10", resolution: "720p", usd: 0.7 },
    { duration: "10", resolution: "1080p", usd: 1.0475 },
    { duration: "15", resolution: "720p", usd: 1.05 },
    { duration: "15", resolution: "1080p", usd: 1.575 },
  ])(
    "prices wan 2.6 text-to-video $duration s at $resolution as $usd",
    ({ duration, resolution, usd }) => {
      const parsed = Wan26TextToVideoRequestSchema.safeParse({
        model: "wan/2-6-text-to-video",
        input: { prompt: "a kite over the harbour", duration, resolution },
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const result = kieEstimate(parsed.data);

      expect(result.usd).toBeCloseTo(usd, 10);
      expect(result.breakdown).toEqual({
        units: 1,
        unit: "generations",
        perUnitUsd: usd,
      });
      expect(result.warnings).toEqual([]);
    }
  );

  it("prices wan 2.6 image-to-video at its top 15s/1080p cell", () => {
    const parsed = Wan26ImageToVideoRequestSchema.safeParse({
      model: "wan/2-6-image-to-video",
      input: {
        prompt: "the sails fill",
        image_urls: ["https://example.com/boat.png"],
        duration: "15",
        resolution: "1080p",
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const result = kieEstimate(parsed.data);

    expect(result.usd).toBeCloseTo(1.575, 10);
    expect(result.breakdown.perUnitUsd).toBe(1.575);
    expect(result.warnings).toEqual([]);
  });

  // The opposite of the wan 2.5 rule directly above: all five wan 2.6 schemas
  // document `duration` default "5" and `resolution` default "1080p", so an
  // omitted field prices the documented row instead of failing. The schema
  // fills both in, and the pricing entry's own defaults keep a raw payload —
  // one that never went through the schema — landing on the same cell.
  it.each([
    { label: "the schema's applied defaults", viaSchema: true },
    { label: "a raw payload naming neither field", viaSchema: false },
  ])("prices wan 2.6 5s/1080p from $label", ({ viaSchema }) => {
    const input = { prompt: "a still lake at dawn" };
    const parsed = Wan26TextToVideoRequestSchema.safeParse({
      model: "wan/2-6-text-to-video",
      input,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.input.duration).toBe("5");
    expect(parsed.data.input.resolution).toBe("1080p");

    const result = kieEstimate(
      viaSchema ? parsed.data : { model: "wan/2-6-text-to-video", input }
    );

    expect(result.usd).toBeCloseTo(0.5225, 10);
    expect(result.breakdown.perUnitUsd).toBe(0.5225);
    expect(result.warnings).toEqual([]);
  });

  // The duration asymmetry, from both ends: the schema rejects 15s for
  // video-to-video, and even if a raw payload smuggles it past the SDK the
  // table has no cell to price it with.
  it("has no wan 2.6 video-to-video rate at a duration its schema rejects", () => {
    expect(
      Wan26VideoToVideoRequestSchema.safeParse({
        model: "wan/2-6-video-to-video",
        input: {
          prompt: "restyle the clip as neon noir",
          video_urls: ["https://example.com/source.mp4"],
          duration: "15",
        },
      }).success
    ).toBe(false);

    const result = kieEstimate({
      model: "wan/2-6-video-to-video",
      input: {
        prompt: "restyle the clip as neon noir",
        video_urls: ["https://example.com/source.mp4"],
        duration: "15",
        resolution: "1080p",
      },
    });

    expect(result.usd).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("no rate for variant '15|1080p'");
  });
});
