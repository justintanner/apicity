import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai image edits integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/image-edits");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should edit an image with a prompt", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const imageBuffer = readFileSync(
      resolve(__dirname, "../fixtures/cat1.jpg")
    );
    const image = new Blob([imageBuffer], { type: "image/jpeg" });

    const result = await provider.v1.images.edits({
      image,
      prompt: "Add a small red dot in the center",
      model: "gpt-image-1",
      size: "1024x1024",
      n: 1,
    });

    expect(result.created).toBeGreaterThan(0);
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data!.length).toBeGreaterThan(0);
  });
});
