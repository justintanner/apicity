import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalBriaFibo2GenerateRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal Bria Fibo 2 generate", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/bria-fibo-2-generate");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("generates one square image and returns its VGL", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt:
        "A watercolor painting of a small orange cat sitting beside a blue vase.",
      aspect_ratio: "1:1",
      seed: 5555,
    } satisfies FalBriaFibo2GenerateRequest;
    expect(
      provider.run.bria.fibo2.generate.schema.safeParse(input).success
    ).toBe(true);
    const job = await provider.v1.queue.submit({
      endpoint_id: "bria/fibo-2/generate",
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
