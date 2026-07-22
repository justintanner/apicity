import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalGptImage1p5RequestSchema } from "@apicity/fal/zod";

describe("fal gpt-image-1.5 text-to-image integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/gpt-image-1.5");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate an image from a text prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 600000,
    });

    const result = await provider.run.gptImage1p5({
      prompt:
        "An action shot of a black lab swimming in an inground suburban swimming pool.",
      num_images: 1,
      image_size: "1024x1024",
      output_format: "png",
      quality: "low",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
  }, 600000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.gptImage1p5.schema.safeParse({
      prompt: "a cat",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing prompt", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.gptImage1p5.schema.safeParse({});
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
  });

  it("should reject payload with wrong enum value", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.gptImage1p5.schema.safeParse({
      prompt: "a cat",
      image_size: "2048x2048",
    });
    expect(v.success).toBe(false);
  });

  it("should reject payload with prompt too short", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.gptImage1p5.schema.safeParse({
      prompt: "a",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.gptImage1p5.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalGptImage1p5RequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.gptImage1p5).toBe(provider.post.run.gptImage1p5);
  });
});
