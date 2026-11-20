import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { createFal, FalError } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal MAI-Image-2.7 Flash edit", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  // The minimal edit: the owned cat photo and a prompt, with no optional
  // input, so fal picks an output size close to the 768x1024 input.
  it("edits the owned cat photo", async () => {
    ctx = setupPolly("fal/microsoft-mai-image-2-7-flash-edit");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result = await provider.run.microsoft.maiImage2p7.flash.edit({
      prompt: "Add a small red bow tie to the cat.",
      image_urls: [`data:image/jpeg;base64,${cat.toString("base64")}`],
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);

  // A free read: fal's queue keys requests by the app id
  // (microsoft/mai-image-2.7, which also serves the Flash routes), and a
  // request id it never issued is a 404.
  it("reads a queue request that does not exist without a paid call", async () => {
    ctx = setupPolly("fal/microsoft-mai-image-2-7-flash-edit-status-not-found");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const err = await provider.v1.queue
      .status({
        endpoint_id: "microsoft/mai-image-2.7",
        request_id: "00000000-0000-4000-8000-000000000002",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(404);
    expect((err as FalError).body).toEqual({ status: "NOT_FOUND" });
  });
});
