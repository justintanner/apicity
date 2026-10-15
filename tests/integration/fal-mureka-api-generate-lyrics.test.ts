import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Mureka lyrics generation", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/mureka-api-generate-lyrics");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates a title and lyrics", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Prompt reused from tests/integration/kie-suno-lyrics.test.ts.
    const result = await provider.run.mureka.api.generate.lyrics({
      prompt: "A short song about morning coffee",
    });
    expect(typeof result.title).toBe("string");
    expect(typeof result.lyrics).toBe("string");
  }, 900000);
});
