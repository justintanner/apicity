import { describe, it, expect } from "vitest";
import { openai } from "../../packages/provider/openai/src/openai";
import { OpenAiImageVariationRequestSchema } from "../../packages/provider/openai/src/zod";

describe("openai image variations endpoint", () => {
  it("should expose .schema on post.v1.images.variations", () => {
    const provider = openai({ apiKey: "test-key" });
    expect(provider.post.v1.images.variations.schema).toBeDefined();
    expect(typeof provider.post.v1.images.variations.schema.safeParse).toBe(
      "function"
    );
  });

  it("should use OpenAiImageVariationRequestSchema", () => {
    const provider = openai({ apiKey: "test-key" });
    expect(provider.post.v1.images.variations.schema).toBe(
      OpenAiImageVariationRequestSchema
    );
  });

  it("should validate a valid variation request via schema", () => {
    const provider = openai({ apiKey: "test-key" });
    const result = provider.post.v1.images.variations.schema.safeParse({
      image: new Blob(["fake-image"]),
      model: "dall-e-2",
      n: 1,
      size: "1024x1024",
    });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid variation request via schema", () => {
    const provider = openai({ apiKey: "test-key" });
    const result = provider.post.v1.images.variations.schema.safeParse({
      n: 1,
    });
    expect(result.success).toBe(false);
  });
});
