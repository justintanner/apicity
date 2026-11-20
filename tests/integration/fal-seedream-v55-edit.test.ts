import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { createFal, FalError } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Seedream 5.5 edit", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  // Cheapest documented size: one owned cat photo, auto_1K, no other input.
  // The card prices that call at 0.03 + 0.012 USD.
  it("edits the owned cat photo at auto_1K", async () => {
    ctx = setupPolly("fal/seedream-v55-edit");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const cat = readFileSync(new URL("../fixtures/cat1.jpg", import.meta.url));
    const result = await provider.run.bytedance.seedream.v5p5.edit({
      prompt: "Add a small red bow tie to the cat.",
      image_size: "auto_1K",
      image_urls: [`data:image/jpeg;base64,${cat.toString("base64")}`],
    });
    expect(result.images).toHaveLength(1);
    expect(result.images[0].url).toMatch(/^https?:\/\//);
  }, 900000);

  // A free read. fal's queue keys requests by the app id
  // (bytedance/seedream). The v5.5 path itself answers 405.
  it("reads a queue request that does not exist without a paid call", async () => {
    ctx = setupPolly("fal/seedream-v55-edit-status-not-found");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const err = await provider.v1.queue
      .status({
        endpoint_id: "bytedance/seedream",
        request_id: "00000000-0000-4000-8000-000000000000",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(404);
    expect((err as FalError).body).toEqual({ status: "NOT_FOUND" });
  });
});
