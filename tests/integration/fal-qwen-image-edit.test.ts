import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createFal } from "@apicity/fal";
import { FalQwenImageEditRequestSchema } from "@apicity/fal/zod";

describe("fal qwen-image edit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/qwen-image-edit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image with a prompt", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 600000,
    });

    const fixturePath = path.resolve(
      import.meta.dirname,
      "..",
      "fixtures",
      "man.jpg"
    );
    const b64 = fs.readFileSync(fixturePath).toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${b64}`;

    const result = await provider.run.qwenImage.edit({
      prompt:
        "change the background to a red mercedes convertible on the california coastline at sunset",
      image_url: imageDataUrl,
      num_images: 1,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.images)).toBe(true);
    expect(result.images.length).toBeGreaterThan(0);
    expect(typeof result.images[0].url).toBe("string");
    expect(result.images[0].url.startsWith("http")).toBe(true);
    expect(typeof result.prompt).toBe("string");
    expect(typeof result.seed).toBe("number");
  }, 600000);

  it("should validate a valid payload", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.qwenImage.edit.schema.safeParse({
      prompt: "a cat",
      image_url: "https://example.com/cat.png",
    });
    expect(v.success).toBe(true);
  });

  it("should reject payload missing required fields", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.qwenImage.edit.schema.safeParse({});
    expect(v.success).toBe(false);
    if (v.success) throw new Error("expected failure");
    expect(v.error.issues.some((i) => i.path.includes("prompt"))).toBe(true);
    expect(v.error.issues.some((i) => i.path.includes("image_url"))).toBe(true);
  });

  it("should reject payload with wrong enum value", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const v = provider.run.qwenImage.edit.schema.safeParse({
      prompt: "a cat",
      image_url: "https://example.com/cat.png",
      acceleration: "turbo",
    });
    expect(v.success).toBe(false);
  });

  it("should expose schema", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    const schema = provider.run.qwenImage.edit.schema;
    // Bind the identity, not just presence: the MCP server derives this
    // endpoint's tool input JSON Schema from `.schema`, so attaching a
    // sibling's schema here would ship a wrong tool contract silently.
    expect(schema).toBe(FalQwenImageEditRequestSchema);
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should expose the same function via run and post.run", () => {
    const provider = createFal({ apiKey: "fal-test-key" });
    expect(provider.run.qwenImage.edit).toBe(provider.post.run.qwenImage.edit);
  });
});
