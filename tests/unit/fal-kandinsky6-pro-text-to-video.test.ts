import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalKandinsky6ProTextToVideoParsedRequest,
  type FalKandinsky6ProTextToVideoRequest,
  type FalKandinsky6ProTextToVideoRequestInput,
  type FalKandinsky6ProTextToVideoResponse,
  type FalRunKandinsky6ProNamespace,
  type FalRunNamespace,
} from "@apicity/fal";
import {
  FalKandinsky6ProTextToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-15
// (sha256 97b2677ffefb0f26a6c912346db1fbd93339071df677b870c5338197e96533be,
// the planning archive's JSON) and the free 422 probes of the same day.
const endpoint = "fal-ai/kandinsky6-pro/text-to-video";
// The recorded call. The prompt is the repo's house prompt, reused from
// tests/integration/fal-ideogram-v4-5.test.ts and others.
const recorded = {
  prompt: "A red panda waves once, then holds still.",
  num_inference_steps: 8,
} satisfies FalKandinsky6ProTextToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Kandinsky 6.0 Pro text-to-video contract", () => {
  it("exposes the leaf on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.kandinsky6Pro.textToVideo;
    expect(typeof leaf).toBe("function");
    expect(leaf).toBe(provider.post.run.kandinsky6Pro.textToVideo);
    expect(provider.run.kandinsky6Pro).toHaveProperty("textToVideo", leaf);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf<
      FalRunNamespace["kandinsky6Pro"]
    >().toEqualTypeOf<FalRunKandinsky6ProNamespace>();
    expectTypeOf(leaf).toEqualTypeOf<
      FalRunKandinsky6ProNamespace["textToVideo"]
    >();
    expectTypeOf(leaf)
      .parameter(0)
      .toEqualTypeOf<FalKandinsky6ProTextToVideoRequest>();
    expectTypeOf(
      leaf
    ).returns.resolves.toEqualTypeOf<FalKandinsky6ProTextToVideoResponse>();
    expectTypeOf<FalKandinsky6ProTextToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalKandinsky6ProTextToVideoRequestInput>().toEqualTypeOf<FalKandinsky6ProTextToVideoRequest>();
    expectTypeOf<FalKandinsky6ProTextToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalKandinsky6ProTextToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
      };
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        video: { url: "https://example.com/red-panda.mp4" },
        seed: 7,
      })
    );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result = await provider.run.kandinsky6Pro.textToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/red-panda.mp4");
    expect(result.seed).toBe(7);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/fal-ai/kandinsky6-pro/text-to-video"
    );
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Key fal-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(recorded);
  });

  it("requires only prompt and fills the documented defaults", () => {
    expect(Object.keys(schema.shape)).toEqual([
      "prompt",
      "negative_prompt",
      "aspect_ratio",
      "generate_audio",
      "enable_prompt_expansion",
      "upscale_factor",
      "seed",
      "sync_mode",
      "num_inference_steps",
      "guidance_scale",
      "enable_safety_checker",
    ]);
    expect(schema.parse({ prompt: recorded.prompt })).toEqual({
      prompt: recorded.prompt,
      aspect_ratio: "16:9",
      generate_audio: true,
      enable_prompt_expansion: false,
      sync_mode: false,
      num_inference_steps: 50,
      guidance_scale: 5,
      enable_safety_checker: true,
    });
    const missing = schema.safeParse({});
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path)).toEqual([
      ["prompt"],
    ]);
    // The validator took an empty prompt and ignored an undocumented field,
    // so the schema sets no minimum and is not strict.
    expect(accepts({ prompt: "" })).toBe(true);
    expect(accepts({ unknown_field: true })).toBe(true);
    for (const prompt of [null, 1, {}]) expect(accepts({ prompt })).toBe(false);
  });

  it("takes a negative prompt string or null, with no default", () => {
    for (const negative of ["blurry", "", null])
      expect(accepts({ negative_prompt: negative })).toBe(true);
    expect(schema.parse(recorded).negative_prompt).toBeUndefined();
    for (const negative of [1, {}, ["blurry"]])
      expect(accepts({ negative_prompt: negative })).toBe(false);
  });

  it("takes only the five documented aspect ratios", () => {
    for (const ratio of ["16:9", "9:16", "1:1", "4:3", "3:4"])
      expect(accepts({ aspect_ratio: ratio })).toBe(true);
    for (const ratio of ["21:9", "auto", "16x9", null])
      expect(accepts({ aspect_ratio: ratio })).toBe(false);
  });

  it("takes the documented upscale factors or null, with no default", () => {
    for (const factor of [2, 2.25, 4, null])
      expect(accepts({ upscale_factor: factor })).toBe(true);
    expect(schema.parse(recorded).upscale_factor).toBeUndefined();
    for (const factor of [3, 1, 2.5, "2"])
      expect(accepts({ upscale_factor: factor })).toBe(false);
  });

  it("bounds num_inference_steps at eight to fifty whole steps", () => {
    for (const steps of [8, 20, 50])
      expect(accepts({ num_inference_steps: steps })).toBe(true);
    for (const steps of [7, 51, 8.5, "8", null])
      expect(accepts({ num_inference_steps: steps })).toBe(false);
  });

  it("bounds guidance_scale at one to ten", () => {
    for (const scale of [1, 1.5, 5, 10])
      expect(accepts({ guidance_scale: scale })).toBe(true);
    for (const scale of [0.5, 10.5, "5", null])
      expect(accepts({ guidance_scale: scale })).toBe(false);
  });

  it("takes an integer or null seed", () => {
    for (const seed of [0, 42, null]) expect(accepts({ seed })).toBe(true);
    expect(schema.parse(recorded).seed).toBeUndefined();
    for (const seed of [1.5, "42", {}]) expect(accepts({ seed })).toBe(false);
  });

  it.each([
    "generate_audio",
    "enable_prompt_expansion",
    "sync_mode",
    "enable_safety_checker",
  ])("takes %s as a boolean", (field) => {
    for (const value of [true, false])
      expect(accepts({ [field]: value })).toBe(true);
    for (const value of ["true", 1, null, {}])
      expect(accepts({ [field]: value })).toBe(false);
  });

  it("keeps billing dynamic because the recorded units miss the card", () => {
    // The card prices eight steps at $0.24 against a $1.35 unit, but the
    // recorded eight-step call billed 0.1756 units ($0.23706) and the usage
    // API agrees. The listed step counts are examples, not a formula.
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).toContain(endpoint);
    expect(falPricing[endpoint]).toBeUndefined();
    expect(MODEL_SLUGS.fal).not.toHaveProperty(endpoint);
    expect(MODEL_DISPLAY.fal).not.toHaveProperty(endpoint);
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.join(" ")).toContain("pricing/estimate");
  });
});
