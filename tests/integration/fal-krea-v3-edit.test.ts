import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

function fixtureDataUrl(name: string, mime: string): string {
  return `data:${mime};base64,${readFileSync(new URL(`../fixtures/${name}`, import.meta.url)).toString("base64")}`;
}

describe("fal Krea 3 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/krea-v3-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits cat1.jpg at low reasoning and 1024x1024", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.krea.v3.edit({
      prompt: "Keep the cat and soften the background",
      image_urls: [fixtureDataUrl("cat1.jpg", "image/jpeg")],
      image_size: { width: 1024, height: 1024 },
      reasoning_level: "low",
    });
    expect(result.images[0]?.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
    expect(typeof result.prompt).toBe("string");
    expect(Array.isArray(result.has_nsfw_concepts)).toBe(true);
  }, 900000);
});
