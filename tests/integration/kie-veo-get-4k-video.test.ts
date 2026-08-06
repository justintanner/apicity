import { afterEach, describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import {
  mintKieVeoOtp,
  setupPolly,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";

const recordingName = "kie/veo/get-4k-video";
const missingTaskId = "apicity-test-veo-4k-not-found";

describe("kie veo get 4k video", () => {
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
    const get4kVideo = provider.veo.post.api.v1.veo.get4kVideo;

    const result = await get4kVideo(
      request,
      mintKieVeoOtp("api.v1.veo.get4kVideo", request)
    );

    expect(result).toMatchObject({
      code: 422,
      msg: "Record does not exist",
      data: null,
    });
    expect(get4kVideo.responseSchema.safeParse(result).success).toBe(true);
  });
});
