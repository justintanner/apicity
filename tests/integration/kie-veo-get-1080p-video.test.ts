import { afterEach, describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  mintKieVeoOtp,
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";

const recordingName = "kie/veo/get-1080p-video";
const missingTaskId = "apicity-test-veo-1080p-not-found";

describe("kie veo get 1080p video", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("surfaces the live missing-record response", async () => {
    ctx = setupPolly(recordingName);

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
      timeout: 120000,
    });
    const request = {
      taskId: missingTaskId,
      index: 0,
    };
    const get1080pVideo = provider.veo.get.api.v1.veo.get1080pVideo;

    const result = await get1080pVideo(
      request,
      mintKieVeoOtp("api.v1.veo.get1080pVideo", request)
    );

    expect(result).toMatchObject({
      code: 422,
      msg: "Record does not exist",
      data: null,
    });
    expect(get1080pVideo.responseSchema.safeParse(result).success).toBe(true);
  });
});
