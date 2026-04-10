import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xAI image generation models integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/image-generation-models");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list image generation models", async () => {
    const provider = createXaiProvider();
    const result = await provider.get.v1.imageGenerationModels();
    expect(result.models).toBeDefined();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models[0].id).toBeTruthy();
  });
});
