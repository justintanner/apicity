import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

describe("fal Bria Fibo Edit 1.5 expand", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/bria-fibo-edit-1-5-expand");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("grows our own fixture to 16:9 and returns the documented output", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // Our own fixture, sent as a data URL. With no prompt the model only
    // extends the image, the endpoint's usual call.
    const image = fs.readFileSync(
      path.resolve(import.meta.dirname, "..", "fixtures", "cat2.jpg")
    );
    const result = await provider.run.bria.fiboEdit1p5.expand({
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      aspect_ratio: "16:9",
    });
    expect(result.image.url).toMatch(/^https?:\/\//);
    // The canvas grows around the 1024x1008 original to 16:9.
    expect((result.image.width ?? 0) / (result.image.height ?? 1)).toBeCloseTo(
      16 / 9,
      2
    );
    expect(Number.isInteger(result.seed)).toBe(true);
    expect(typeof result.structured_instruction).toBe("object");
    // model_output is only returned when return_model_output is set.
    expect(result.model_output ?? null).toBeNull();
  }, 900000);
});
