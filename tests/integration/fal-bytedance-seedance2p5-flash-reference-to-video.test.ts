import { afterEach, describe, expect, it } from "vitest";
import {
  createFal,
  FalError,
  type FalBytedanceSeedance2p5FlashReferenceToVideoRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// tests/fixtures/cat1.jpg (768x1024) at its pinned raw URL.
const CAT =
  "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg";

describe("fal Seedance 2.5 Flash reference-to-video", () => {
  let ctx: PollyContext | undefined;
  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  // A free read: fal's queue keys requests by the app id
  // (bytedance/seedance-2.5), and a request id it never issued is a 404.
  it("reads a queue request that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "fal/bytedance-seedance2p5-flash-reference-to-video-status-not-found"
    );
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });
    const err = await provider.v1.queue
      .status({
        endpoint_id: "bytedance/seedance-2.5",
        request_id: "00000000-0000-4000-8000-000000000000",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(404);
    expect((err as FalError).body).toEqual({ status: "NOT_FOUND" });
  });

  // The cheapest call: the shortest duration (4 s) at the lower resolution
  // (480p), with the cat photo and a short prompt and no other input.
  it("uses the cat as an image reference for 4 s at 480p", async () => {
    ctx = setupPolly("fal/bytedance-seedance2p5-flash-reference-to-video");
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const payload = {
      prompt: "The cat in @Image1 blinks slowly.",
      image_urls: [CAT],
      resolution: "480p",
      duration: "4",
    } satisfies FalBytedanceSeedance2p5FlashReferenceToVideoRequest;
    expect(
      provider.run.bytedance.seedance2p5.flash.referenceToVideo.schema.safeParse(
        payload
      ).success
    ).toBe(true);
    const result =
      await provider.run.bytedance.seedance2p5.flash.referenceToVideo(payload);
    expect(result.video.url).toMatch(/^https?:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
