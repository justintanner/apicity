import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { xai } from "@nakedapi/xai";

describe("xai models integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // GET /v1/models
  it("should list all models", async () => {
    ctx = setupPolly("xai/models-list");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.models();
    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].object).toBe("model");
    expect(result.data[0].owned_by).toBeTruthy();
    expect(typeof result.data[0].created).toBe("number");
  });

  // GET /v1/models/{model_id}
  it("should get a single model by id", async () => {
    ctx = setupPolly("xai/models-get");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.models("grok-3");
    expect(result.id).toBe("grok-3");
    expect(result.object).toBe("model");
    expect(result.owned_by).toBeTruthy();
    expect(typeof result.created).toBe("number");
  });

  // GET /v1/language-models
  it("should list all language models", async () => {
    ctx = setupPolly("xai/language-models-list");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.languageModels();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    const model = result.models[0];
    expect(model.id).toBeTruthy();
    expect(model.object).toBe("model");
    expect(model.fingerprint).toBeTruthy();
    expect(model.version).toBeTruthy();
    expect(Array.isArray(model.input_modalities)).toBe(true);
    expect(Array.isArray(model.output_modalities)).toBe(true);
    expect(typeof model.prompt_text_token_price).toBe("number");
    expect(typeof model.completion_text_token_price).toBe("number");
    expect(Array.isArray(model.aliases)).toBe(true);
  });

  // GET /v1/language-models/{model_id}
  it("should get a single language model by id", async () => {
    ctx = setupPolly("xai/language-models-get");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.languageModels("grok-3");
    expect(result.id).toBe("grok-3");
    expect(result.object).toBe("model");
    expect(result.fingerprint).toBeTruthy();
    expect(result.version).toBeTruthy();
    expect(Array.isArray(result.input_modalities)).toBe(true);
    expect(Array.isArray(result.output_modalities)).toBe(true);
    expect(typeof result.prompt_text_token_price).toBe("number");
    expect(typeof result.completion_text_token_price).toBe("number");
    expect(Array.isArray(result.aliases)).toBe(true);
  });

  // GET /v1/image-generation-models
  it("should list all image generation models", async () => {
    ctx = setupPolly("xai/image-generation-models-list");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.imageGenerationModels();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    const model = result.models[0];
    expect(model.id).toBeTruthy();
    expect(model.object).toBe("model");
    expect(model.fingerprint).toBeTruthy();
    expect(model.version).toBeTruthy();
    expect(typeof model.max_prompt_length).toBe("number");
    expect(Array.isArray(model.aliases)).toBe(true);
  });

  // GET /v1/image-generation-models/{model_id}
  it("should get a single image generation model by id", async () => {
    ctx = setupPolly("xai/image-generation-models-get");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result =
      await provider.v1.imageGenerationModels("grok-imagine-image");
    expect(result.id).toBe("grok-imagine-image");
    expect(result.object).toBe("model");
    expect(result.fingerprint).toBeTruthy();
    expect(result.version).toBeTruthy();
    expect(typeof result.max_prompt_length).toBe("number");
    expect(Array.isArray(result.aliases)).toBe(true);
  });

  // GET /v1/video-generation-models
  it("should list all video generation models", async () => {
    ctx = setupPolly("xai/video-generation-models-list");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.v1.videoGenerationModels();
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    const model = result.models[0];
    expect(model.id).toBeTruthy();
    expect(model.object).toBe("model");
    expect(model.fingerprint).toBeTruthy();
    expect(model.version).toBeTruthy();
    expect(Array.isArray(model.input_modalities)).toBe(true);
    expect(Array.isArray(model.output_modalities)).toBe(true);
    expect(Array.isArray(model.aliases)).toBe(true);
  });

  // GET /v1/video-generation-models/{model_id}
  it("should get a single video generation model by id", async () => {
    ctx = setupPolly("xai/video-generation-models-get");
    const provider = xai({
      apiKey: process.env.XAI_API_KEY ?? "sk-test-key",
    });
    const result =
      await provider.v1.videoGenerationModels("grok-imagine-video");
    expect(result.id).toBe("grok-imagine-video");
    expect(result.object).toBe("model");
    expect(result.fingerprint).toBeTruthy();
    expect(result.version).toBeTruthy();
    expect(Array.isArray(result.input_modalities)).toBe(true);
    expect(Array.isArray(result.output_modalities)).toBe(true);
    expect(Array.isArray(result.aliases)).toBe(true);
  });
});
