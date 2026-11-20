import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { createFal, FalError } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kling Image 4.0 image-to-image", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  // The minimal edit: the owned cat photo and a prompt, with no optional
  // input, so fal defaults to one 2K image.
  it("edits the owned cat photo", async () => {
    ctx = setupPolly("fal/kling-v4-image-to-image");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result = await provider.run.kling.v4.imageToImage({
      prompt: "Add a small red bow tie to the cat in @Image1.",
      image_urls: [`data:image/jpeg;base64,${cat.toString("base64")}`],
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);

  // A free read: fal's queue keys requests by the app id (kling/v4), and a
  // request id it never issued is a 404. The image path itself answers 405.
  it("reads a queue request that does not exist without a paid call", async () => {
    ctx = setupPolly("fal/kling-v4-image-to-image-status-not-found");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const err = await provider.v1.queue
      .status({
        endpoint_id: "kling/v4",
        request_id: "00000000-0000-4000-8000-000000000000",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(404);
    expect((err as FalError).body).toEqual({ status: "NOT_FOUND" });
  });
});
