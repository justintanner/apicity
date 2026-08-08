import { describe, expect, it, vi } from "vitest";

import {
  createKie,
  type SeedreamProLayerDecompositionParsedRequest,
  type SeedreamProLayerDecompositionRequest,
  type SeedreamProLayerDecompositionRequestInput,
} from "@apicity/kie";
import {
  MediaGenerationRequestSchema,
  SeedreamProLayerDecompositionRequestSchema,
} from "@apicity/kie/zod";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const IMAGE_URL = "https://example.com/source.webp";

describe("KIE Seedream 5 Pro layer decomposition contract", () => {
  const provider = createKie({ apiKey: "test-key" });

  it("accepts automatic requests and materializes documented defaults", () => {
    const request: SeedreamProLayerDecompositionRequestInput = {
      model: "seedream/5-pro-layer-decomposition",
      input: { image_url: IMAGE_URL },
    };

    const parsed: SeedreamProLayerDecompositionParsedRequest =
      SeedreamProLayerDecompositionRequestSchema.parse(request);

    expect(parsed.input).toMatchObject({
      image_url: IMAGE_URL,
      size: "auto",
      output_format: "jpeg",
    });
    expect(MediaGenerationRequestSchema.safeParse(request).success).toBe(true);
    expect(
      provider.post.api.v1.jobs.createTask.schema.safeParse(request).success
    ).toBe(true);
  });

  it("preserves targeted values and accepts the full documented enum set", () => {
    const prompt = `${"Separate the bird"} <bbox>330 274 641 991</bbox>`;
    const values = [
      ["auto", "png"],
      ["1K", "jpeg"],
      ["1.5K", "png"],
      ["2K", "jpeg"],
    ] as const;

    for (const [size, output_format] of values) {
      const request: SeedreamProLayerDecompositionRequestInput = {
        model: "seedream/5-pro-layer-decomposition",
        input: { image_url: IMAGE_URL, prompt, size, output_format },
      };
      const parsed = SeedreamProLayerDecompositionRequestSchema.parse(request);

      expect(parsed.input).toMatchObject({
        image_url: IMAGE_URL,
        prompt,
        size,
        output_format,
      });
      expect(
        provider.post.api.v1.jobs.createTask.schema.safeParse(request).success
      ).toBe(true);
    }

    const maxPrompt: SeedreamProLayerDecompositionRequestInput = {
      model: "seedream/5-pro-layer-decomposition",
      input: { image_url: IMAGE_URL, prompt: "x".repeat(5000) },
    };
    expect(
      SeedreamProLayerDecompositionRequestSchema.safeParse(maxPrompt).success
    ).toBe(true);
  });

  it.each([
    {
      name: "missing image_url",
      input: { prompt: "Separate the subject" },
    },
    {
      name: "plural image_urls",
      input: { image_urls: [IMAGE_URL] },
    },
    {
      name: "array image_url",
      input: { image_url: [IMAGE_URL] },
    },
    {
      name: "unsupported size",
      input: { image_url: IMAGE_URL, size: "4K" },
    },
    {
      name: "unsupported output format",
      input: { image_url: IMAGE_URL, output_format: "jpg" },
    },
    {
      name: "overlong prompt",
      input: { image_url: IMAGE_URL, prompt: "x".repeat(5001) },
    },
  ])("rejects $name locally", ({ input }) => {
    expect(
      SeedreamProLayerDecompositionRequestSchema.safeParse({
        model: "seedream/5-pro-layer-decomposition",
        input,
      }).success
    ).toBe(false);
  });

  it("validates without injecting defaults into the transport body", async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "task_seedream_layer_123" },
        }),
        { status: 200 }
      )
    );
    const provider = createKie({
      apiKey: "test-key",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request: SeedreamProLayerDecompositionRequest = {
      model: "seedream/5-pro-layer-decomposition",
      input: { image_url: IMAGE_URL },
    };

    const response = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(response.data?.taskId).toBe("task_seedream_layer_123");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const init = mockFetch.mock.calls[0]?.[1];
    if (!init) throw new Error("createTask did not provide fetch init");
    expect(JSON.parse(init.body as string)).toEqual(request);
  });
});
