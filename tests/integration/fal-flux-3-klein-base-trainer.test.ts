import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalFlux3KleinTrainerRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Owned cat1.jpg only; ZIP sha256:
// b6070fa9c035966b21874633d866700a94f5d0321bccd91941739bd400ccedfa.
const DATASET_URL =
  "https://v3b.fal.media/files/b/0ab0295f/cWH8_IX00IlRACO7t0eIL_klein-trainer-images.zip";

describe("fal FLUX 3 Klein base trainer", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-klein-base-trainer");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("trains a LoRA on the owned cat photo", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 1800000,
    });
    const input = {
      images_data_url: DATASET_URL,
      trigger_phrase: "apct cat",
      steps: 100,
      resolution: 512,
    } satisfies FalFlux3KleinTrainerRequest;
    expect(
      provider.run.blackforestlabs.flux3.klein.base.trainer.schema.safeParse(
        input
      ).success
    ).toBe(true);
    const job = await provider.v1.queue.submit({
      endpoint_id: "blackforestlabs/flux-3/klein/base/trainer",
      input,
      no_retry: true,
    });
    const endpoint_id = new URL(job.status_url).pathname
      .split("/requests/")[0]
      .slice(1);
    const params = { endpoint_id, request_id: job.request_id };
    let status = await provider.v1.queue.status(params);
    for (let i = 0; status.status !== "COMPLETED" && i < 180; i++) {
      if (ctx.mode !== "replay")
        await new Promise((resolve) => setTimeout(resolve, 10000));
      status = await provider.v1.queue.status(params);
    }
    expect(status.status).toBe("COMPLETED");
    const result = await provider.v1.queue.result(params);
    expect(result.lora_file).toMatchObject({
      url: expect.stringMatching(/^https:\/\//),
    });
    expect(result.config_file).toMatchObject({
      url: expect.stringMatching(/^https:\/\//),
    });
  }, 1800000);
});
