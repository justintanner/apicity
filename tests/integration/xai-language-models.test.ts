import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xAI language models integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("xai/language-models");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list language models", async () => {
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });
    const result = await provider.get.v1.languageModels();
    expect(result.models).toBeDefined();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models[0].id).toBeTruthy();
  });
});
