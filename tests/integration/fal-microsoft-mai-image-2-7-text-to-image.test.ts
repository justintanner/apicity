import { afterEach, describe, expect, it } from "vitest";
import { createFal, FalError } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MAI-Image-2.7 text-to-image", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  // The minimal request: a prompt and no optional input, so fal renders the
  // default square_hd preset at 1K.
  it("generates one image from a prompt", async () => {
    ctx = setupPolly("fal/microsoft-mai-image-2-7-text-to-image");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const result = await provider.run.microsoft.maiImage2p7.textToImage({
      prompt: "A ceramic teapot beside a sunlit window.",
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);

  // A free read: fal's queue keys requests by the app id
  // (microsoft/mai-image-2.7), and a request id it never issued is a 404.
  it("reads a queue request that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "fal/microsoft-mai-image-2-7-text-to-image-status-not-found"
    );
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const err = await provider.v1.queue
      .status({
        endpoint_id: "microsoft/mai-image-2.7",
        request_id: "00000000-0000-4000-8000-000000000001",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(404);
    expect((err as FalError).body).toEqual({ status: "NOT_FOUND" });
  });
});
