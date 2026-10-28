import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalFlux3KleinTrainerRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// Owned cat_start.jpg (cat1.jpg) + cat_end.jpg (grayscale); ZIP sha256:
// 626538d10843204d1fb3827751dc56df21ff15b6c695dba96003287291a781bb.
const DATASET_URL =
  "https://v3b.fal.media/files/b/0ab02abb/NLzYeb182HMm7bICeqXbw_klein-trainer-edit-pairs.zip";

describe("fal FLUX 3 Klein base edit trainer", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/flux-3-klein-base-trainer-edit");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("trains an edit LoRA on the owned cat pair", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 1800000,
    });
    const input = {
      images_data_url: DATASET_URL,
      trigger_phrase: "Make the photo black and white.",
      steps: 100,
      resolution: 512,
    } satisfies FalFlux3KleinTrainerRequest;
    expect(
      provider.run.blackforestlabs.flux3.klein.base.trainer.edit.schema.safeParse(
        input
      ).success
    ).toBe(true);
    const job = await provider.v1.queue.submit({
      endpoint_id: "blackforestlabs/flux-3/klein/base/trainer/edit",
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
