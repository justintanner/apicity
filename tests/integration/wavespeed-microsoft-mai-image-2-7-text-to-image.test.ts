import { afterEach, describe, expect, it } from "vitest";
import {
  WaveSpeedError,
  type WaveSpeedMicrosoftMaiImage2p7TextToImageRequest,
} from "@apicity/wavespeed";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  recordWaveSpeed,
  wavespeedClient,
  WAVESPEED_TEST_TIMEOUT_MS,
} from "../wavespeed-helpers";

const recording = "wavespeed/microsoft-mai-image-2-7-text-to-image";
const payload = {
  prompt: "A sleeping tabby cat on a blue blanket.",
} satisfies WaveSpeedMicrosoftMaiImage2p7TextToImageRequest;

describe("wavespeed api.v3.microsoft.maiImage2p7.textToImage integration", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("rejects an unsupported resolution", async () => {
    ctx = setupPolly(
      "wavespeed/microsoft-mai-image-2-7-text-to-image-invalid-resolution"
    );
    const generate = wavespeedClient().api.v3.microsoft.maiImage2p7.textToImage;
    const error = await generate({
      ...payload,
      // @ts-expect-error Exercise the upstream validation response.
      resolution: "invalid",
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({
      status: 400,
      code: 400,
      message: expect.stringContaining('field "resolution" must be one of'),
    });
  });

  it(
    "generates one image at the default resolution",
    async () => {
      ctx = setupPolly(recording);
      const generate =
        wavespeedClient().api.v3.microsoft.maiImage2p7.textToImage;
      expect(generate.schema.safeParse(payload).success).toBe(true);
      await recordWaveSpeed(
        generate,
        payload,
        recording,
        "microsoft/mai-image-2.7/text-to-image"
      );
    },
    WAVESPEED_TEST_TIMEOUT_MS
  );
});
