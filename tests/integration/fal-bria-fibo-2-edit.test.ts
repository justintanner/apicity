import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalBriaFibo2EditRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Bria Fibo 2 edit", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bria-fibo-2-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("edits the owned cat image and returns its VGL", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      instruction: "Give the cat in image 1 a small red knitted scarf.",
      image_urls: [
        `data:image/jpeg;base64,${readFileSync(new URL("../fixtures/legacy/cat1.jpg", import.meta.url)).toString("base64")}`,
      ],
      seed: 5555,
    } satisfies FalBriaFibo2EditRequest;
    expect(provider.run.bria.fibo2.edit.schema.safeParse(input).success).toBe(
      true
    );
    const job = await provider.v1.queue.submit({
      endpoint_id: "bria/fibo-2/edit",
      input,
      no_retry: true,
    });
    const params = { endpoint_id: "bria/fibo-2", request_id: job.request_id };
    let status = await provider.v1.queue.status(params);
    for (let i = 0; status.status !== "COMPLETED" && i < 180; i++) {
      if (ctx.mode !== "replay")
        await new Promise((resolve) => setTimeout(resolve, 5000));
      status = await provider.v1.queue.status(params);
    }
    expect(status.status).toBe("COMPLETED");
    const result = await provider.v1.queue.result(params);
    expect(result.image).toMatchObject({
      url: expect.stringMatching(/^https:\/\//),
    });
    expect(result.vgl).toEqual(expect.any(Object));
  }, 900000);
});
