import { afterEach, describe, expect, it } from "vitest";

import { createWaveSpeed, WaveSpeedError } from "@apicity/wavespeed";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("wavespeed api.v3.predictions.result integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("surfaces WaveSpeed's 404 for an unknown prediction", async () => {
    ctx = setupPolly("wavespeed/prediction-not-found");
    const wavespeed = createWaveSpeed({
      apiKey: process.env.WAVESPEED_API_KEY ?? "wavespeed-test-key",
    });

    const error = await wavespeed.api.v3.predictions
      .result("00000000000000000000000000000000")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({
      name: "WaveSpeedError",
      status: 404,
      code: 404,
    });
    expect((error as WaveSpeedError).message).toContain("Prediction not found");
  });

  it("surfaces WaveSpeed's 401 for an invalid key", async () => {
    ctx = setupPolly("wavespeed/invalid-key");
    const wavespeed = createWaveSpeed({ apiKey: "invalid-wavespeed-key" });

    const error = await wavespeed.api.v3.predictions
      .result("11111111111111111111111111111111")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({
      name: "WaveSpeedError",
      status: 401,
      code: 401,
    });
    expect((error as WaveSpeedError).message).toContain("Invalid API key");
  });
});
