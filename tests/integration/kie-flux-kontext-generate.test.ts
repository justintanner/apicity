import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, type FluxKontextGenerateRequest } from "@apicity/kie";
import { mintKieFluxKontextOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie flux-kontext generate integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a Flux Kontext image-generation task",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/flux-kontext-generate");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        prompt:
          "A cinematic night city poster with neon reflections on a rainy street.",
        aspectRatio: "16:9",
        model: "flux-kontext-pro",
        outputFormat: "jpeg",
      } satisfies FluxKontextGenerateRequest;

      const task = await provider.post.api.v1.flux.kontext.generate(
        request,
        mintKieFluxKontextOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();
      expect(typeof task.data?.taskId).toBe("string");
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const generate = provider.post.api.v1.flux.kontext.generate;

    const ok = generate.schema.safeParse({
      prompt: "A serene mountain lake at sunrise.",
      aspectRatio: "1:1",
      model: "flux-kontext-max",
      outputFormat: "png",
      safetyTolerance: 2,
    });
    expect(ok.success).toBe(true);

    // Editing mode with inputImage.
    const edit = generate.schema.safeParse({
      prompt: "Add a rainbow over the lake.",
      inputImage: "https://example.com/lake.jpg",
      aspectRatio: "3:4",
    });
    expect(edit.success).toBe(true);

    // Missing the required prompt.
    const noPrompt = generate.schema.safeParse({
      aspectRatio: "16:9",
    });
    expect(noPrompt.success).toBe(false);

    // Out-of-range aspect ratio.
    const badAspect = generate.schema.safeParse({
      prompt: "hello world",
      aspectRatio: "2:1",
    });
    expect(badAspect.success).toBe(false);

    // Out-of-range safetyTolerance.
    const badTolerance = generate.schema.safeParse({
      prompt: "hello world",
      safetyTolerance: 9,
    });
    expect(badTolerance.success).toBe(false);
  });
});
