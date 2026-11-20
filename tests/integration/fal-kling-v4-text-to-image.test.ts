import { afterEach, describe, expect, it } from "vitest";
import { createFal, FalError } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Kling Image 4.0 text-to-image", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  // The minimal generation: a prompt and no optional input, so fal defaults
  // to one 2K image.
  it("generates one image from a prompt", async () => {
    ctx = setupPolly("fal/kling-v4-text-to-image");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.kling.v4.textToImage({
      prompt: "A red bow tie on a plain white background.",
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);

  // A free read: fal's queue keys requests by the app id (kling/v4), and a
  // request id it never issued is a 404. The text-to-image path itself
  // answers 405.
  it("reads a queue request that does not exist without a paid call", async () => {
    ctx = setupPolly("fal/kling-v4-text-to-image-status-not-found");
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
