import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieSunoOtp, TEST_PAYGATE_SECRET } from "../harness";

// Free error path: bogus taskId — do not create a real validation-phrase task.
// Body uses upstream-documented `calBackUrl` (one l), not `callBackUrl`.
const RECORDING_NAME = "kie/suno/voice-regenerate-bogus-task";

describe("kie suno voice.regenerate (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope when taskId is not valid", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

    const request = {
      taskId: "apicity-test-bogus-task-id",
      calBackUrl: "https://example.com/cb",
    };

    const regenerate = provider.suno.post.api.v1.voice.regenerate;
    const result = await regenerate(
      request,
      mintKieSunoOtp("api.v1.voice.regenerate", request)
    );

    // Free error path: HTTP 200 with business code 422 when the voice task
    // is missing / not eligible for regenerate (no paid happy path required).
    // Live recording confirmed upstream accepts documented `calBackUrl` (one l).
    expect(result).toEqual({
      code: 422,
      msg: "The record is not found or does not need to be rebuilt or does not require a retry",
      data: null,
    });
    expect(regenerate.schema.safeParse(request).success).toBe(true);
    expect(regenerate.responseSchema.safeParse(result).success).toBe(true);
  });
});
