import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalNvidiaCosmos3SuperImageToVideoParsedRequest,
  type FalNvidiaCosmos3SuperImageToVideoRequest,
  type FalNvidiaCosmos3SuperImageToVideoRequestInput,
  type FalNvidiaCosmos3SuperImageToVideoResponse,
  type FalRunNvidiaCosmos3SuperNamespace,
} from "@apicity/fal";
import {
  FalNvidiaCosmos3SuperImageToVideoRequestSchema as schema,
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

// Pinned against the live queue OpenAPI read on 2026-10-08
// (sha256 4924d039363d46ea7c2caed4304f68383c957f05514cc14711d833dccb8ef079).
const endpoint = "nvidia/cosmos-3-super/image-to-video";
const recorded = {
  prompt:
    "The camera slowly pushes in as the subject turns their head toward the light, hair drifting in a gentle breeze, dust motes floating through warm afternoon sun.",
  image_url:
    "https://storage.googleapis.com/falserverless/example_inputs/hunyuan_i2v.jpg",
  num_frames: 5,
  enable_agentic_generation: false,
  enable_prompt_expansion: false,
} satisfies FalNvidiaCosmos3SuperImageToVideoRequest;

function accepts(body: Record<string, unknown>): boolean {
  return schema.safeParse({ ...recorded, ...body }).success;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Cosmos 3 Super image-to-video contract", () => {
  it("exposes the schema on both run aliases and the queue registry", () => {
    const provider = createFal({ apiKey: "test-key" });
    const leaf = provider.run.nvidia.cosmos3Super.imageToVideo;
    expect(leaf).toBe(provider.post.run.nvidia.cosmos3Super.imageToVideo);
    expect(leaf.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      provider.run.nvidia.cosmos3Super
    ).toEqualTypeOf<FalRunNvidiaCosmos3SuperNamespace>();
    expectTypeOf<FalNvidiaCosmos3SuperImageToVideoRequest>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalNvidiaCosmos3SuperImageToVideoRequestInput>().toEqualTypeOf<FalNvidiaCosmos3SuperImageToVideoRequest>();
    expectTypeOf<FalNvidiaCosmos3SuperImageToVideoParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
    expectTypeOf<FalNvidiaCosmos3SuperImageToVideoResponse>().toEqualTypeOf<{
      video: {
        url: string;
        content_type?: string | null;
        file_name?: string | null;
        file_size?: number | null;
        width?: number | null;
        height?: number | null;
        fps?: number | null;
        duration?: number | null;
        num_frames?: number | null;
      };
      seed: number;
    }>();
  });

  it("posts the body unchanged to fal.run with the key header", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ video: { url: "https://example.com/out.bin" } })
      );
    const provider = createFal({
      apiKey: "fal-test-key",
      fetch: mockFetch as unknown as typeof fetch,
    });
    const result =
      await provider.run.nvidia.cosmos3Super.imageToVideo(recorded);
    expect(result.video.url).toBe("https://example.com/out.bin");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe(
      "https://fal.run/nvidia/cosmos-3-super/image-to-video"
    );
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
      "image_url",
      "negative_prompt",
      "enable_prompt_expansion",
      "enable_agentic_generation",
      "agentic_max_iterations",
      "agentic_samples_per_iteration",
      "agentic_early_stop",
      "image_size",
      "num_frames",
      "frames_per_second",
      "num_inference_steps",
      "guidance_scale",
      "seed",
      "enable_safety_checker",
      "sync_mode",
    ]);
    expect(schema.shape.prompt.description).toBe(
      "Text prompt describing the motion and scene of the video to generate."
    );
    expect(schema.shape.image_url.description).toBe(
      "URL of the conditioning first-frame image for the video."
    );
    expect(schema.shape.negative_prompt.description).toBe(
      "Content to steer the generation away from (artifacts, unwanted motion). Defaults to NVIDIA's recommended i2v negative prompt; pass an empty string to disable."
    );
    expect(schema.shape.enable_prompt_expansion.description).toBe(
      "If true, the Cosmos3-Nano Reasoner (a VLM that sees the first frame) rewrites the prompt into the dense caption Cosmos3 was trained on. The app starts a local Reasoner by default, or uses COSMOS_PROMPT_UPSAMPLER_BASE_URL when configured. Falls back to the raw prompt if expansion fails."
    );
    expect(schema.shape.enable_agentic_generation.description).toBe(
      "Enable the iterative Cosmos agentic loop: prompt upsampling, candidate video generation, VLM critique of sampled frames, and prompt rewrite. Each candidate is a full render, so this is substantially slower and costlier than a single generation."
    );
    expect(schema.shape.agentic_max_iterations.description).toBe(
      "Maximum agentic prompt stages when agentic generation is enabled."
    );
    expect(schema.shape.agentic_samples_per_iteration.description).toBe(
      "Candidate videos to generate and judge per agentic iteration. The best candidate advances to the next rewrite stage."
    );
    expect(schema.shape.agentic_early_stop.description).toBe(
      "Stop the agentic loop early when the critic score clears the strict quality threshold."
    );
    expect(schema.shape.image_size.description).toBe(
      "The size of the generated video. The request is clamped and snapped to the nearest supported NVIDIA tier (256p/480p/720p) and aspect ratio."
    );
    expect(schema.shape.num_frames.description).toBe(
      "Number of frames to generate. More frames yield a longer video."
    );
    expect(schema.shape.frames_per_second.description).toBe(
      "Frames per second of the output video."
    );
    expect(schema.shape.num_inference_steps.description).toBe(
      "Number of denoising steps. More steps yield higher quality but take longer."
    );
    expect(schema.shape.guidance_scale.description).toBe(
      "Classifier-free guidance scale. Higher values increase prompt adherence at the cost of diversity."
    );
    expect(schema.shape.seed.description).toBe(
      "The same seed and prompt given to the same model version will produce the same video every time."
    );
    expect(schema.shape.enable_safety_checker.description).toBe(
      "Enable content moderation for the input prompt and image. Disabling it requires account authorization; unauthorized requests are always checked."
    );
    expect(schema.shape.sync_mode.description).toBe(
      "If `True`, the video is returned as a data URI and the output data won't be available in the request history."
    );
  });

  it("leaves the input open, as upstream does", () => {
    expect(accepts({ unknown_field: 1 })).toBe(true);
  });

  it("requires the documented fields", () => {
    expect(schema.safeParse(recorded).success).toBe(true);
    const without_image_url = { ...recorded } as Record<string, unknown>;
    delete without_image_url.image_url;
    expect(schema.safeParse(without_image_url).success).toBe(false);
    const without_prompt = { ...recorded } as Record<string, unknown>;
    delete without_prompt.prompt;
    expect(schema.safeParse(without_prompt).success).toBe(false);
  });

  it("bounds prompt", () => {
    expect(accepts({ prompt: "x".repeat(0) })).toBe(false);
    expect(accepts({ prompt: "x".repeat(1) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(4096) })).toBe(true);
    expect(accepts({ prompt: "x".repeat(4097) })).toBe(false);
  });

  it("bounds negative_prompt", () => {
    expect(accepts({ negative_prompt: "x".repeat(2048) })).toBe(true);
    expect(accepts({ negative_prompt: "x".repeat(2049) })).toBe(false);
  });

  it("bounds the agentic_max_iterations number", () => {
    expect(accepts({ agentic_max_iterations: 1 })).toBe(true);
    expect(accepts({ agentic_max_iterations: 0 })).toBe(false);
    expect(accepts({ agentic_max_iterations: 3 })).toBe(true);
    expect(accepts({ agentic_max_iterations: 4 })).toBe(false);
  });

  it("bounds the agentic_samples_per_iteration number", () => {
    expect(accepts({ agentic_samples_per_iteration: 1 })).toBe(true);
    expect(accepts({ agentic_samples_per_iteration: 0 })).toBe(false);
    expect(accepts({ agentic_samples_per_iteration: 3 })).toBe(true);
    expect(accepts({ agentic_samples_per_iteration: 4 })).toBe(false);
  });

  it("bounds the num_frames number", () => {
    expect(accepts({ num_frames: 5 })).toBe(true);
    expect(accepts({ num_frames: 4 })).toBe(false);
    expect(accepts({ num_frames: 189 })).toBe(true);
    expect(accepts({ num_frames: 190 })).toBe(false);
  });

  it("bounds the frames_per_second number", () => {
    expect(accepts({ frames_per_second: 4 })).toBe(true);
    expect(accepts({ frames_per_second: 3 })).toBe(false);
    expect(accepts({ frames_per_second: 60 })).toBe(true);
    expect(accepts({ frames_per_second: 61 })).toBe(false);
  });

  it("bounds the num_inference_steps number", () => {
    expect(accepts({ num_inference_steps: 1 })).toBe(true);
    expect(accepts({ num_inference_steps: 0 })).toBe(false);
    expect(accepts({ num_inference_steps: 50 })).toBe(true);
    expect(accepts({ num_inference_steps: 51 })).toBe(false);
  });

  it("bounds the guidance_scale number", () => {
    expect(accepts({ guidance_scale: 0 })).toBe(true);
    expect(accepts({ guidance_scale: -1 })).toBe(false);
    expect(accepts({ guidance_scale: 20 })).toBe(true);
    expect(accepts({ guidance_scale: 21 })).toBe(false);
  });

  it("accepts a null seed", () => {
    expect(accepts({ seed: null })).toBe(true);
  });

  it("prices the cheapest documented payload from the card", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: recorded,
    });
    expect(estimate.usd).toBeCloseTo(0.05, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("rounds the documented frame default up to whole seconds", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {
        prompt: recorded.prompt,
        image_url: recorded.image_url,
      },
    });
    // 189 frames at 24 fps rounds up to 8 seconds.
    expect(estimate.usd).toBeCloseTo(0.4, 8);
    expect(estimate.warnings).toEqual([]);
  });

  it("warns when agentic generation is on", () => {
    const estimate = computeEstimate({
      provider: "fal",
      endpoint,
      payload: { ...recorded, enable_agentic_generation: true },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it("accepts an image size preset or a pixel size", () => {
    expect(accepts({ image_size: "landscape_16_9" })).toBe(true);
    expect(accepts({ image_size: { width: 832, height: 480 } })).toBe(true);
    expect(accepts({ image_size: "not-a-documented-value" })).toBe(false);
  });

  it("is statically priced, with a slug and a display name", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS).not.toContain(endpoint);
    expect(falPricing[endpoint]?.source).toEqual({
      url: "https://fal.ai/models/nvidia/cosmos-3-super/image-to-video",
      asOf: "2026-10-08",
    });
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe(
      "cosmos3s"
    );
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Cosmos 3 Super"
    );
  });
});
