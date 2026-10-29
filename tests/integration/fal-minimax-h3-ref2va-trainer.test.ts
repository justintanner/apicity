import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFal, type FalMinimaxH3Ref2vaTrainerRequest } from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// The same owned cat1.jpg clip zip recorded for the text-to-video trainer.
// ZIP sha256: c0a488c6a95b4149d45f3c2187182d15c688f1867771852e027f7d0da927159c.
const DATASET_URL =
  "https://v3b.fal.media/files/b/0ab058c4/3llAgREfXZoh36mMnJYKX_h3-t2v-trainer.zip";

describe("fal MiniMax H3 reference-to-video-audio trainer", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/minimax-h3-ref2va-trainer");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("trains one step on the owned cat clip", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 2700000,
    });
    const input = {
      training_data_url: DATASET_URL,
      number_of_steps: 1,
      auto_scale_input: true,
      trigger_phrase: "apct cat",
    } satisfies FalMinimaxH3Ref2vaTrainerRequest;
    expect(
      provider.run.minimax.h3.ref2va.trainer.schema.safeParse(input).success
    ).toBe(true);
    const job = await provider.v1.queue.submit({
      endpoint_id: "minimax/h3/ref2va/trainer",
      input,
      no_retry: true,
    });
    const endpoint_id = new URL(job.status_url).pathname
      .split("/requests/")[0]
      .slice(1);
    const params = { endpoint_id, request_id: job.request_id };
    let status = await provider.v1.queue.status(params);
    for (let i = 0; status.status !== "COMPLETED" && i < 240; i++) {
      if (ctx.mode !== "replay") {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
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
  }, 2700000);
});
