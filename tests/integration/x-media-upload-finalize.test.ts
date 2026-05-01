import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { x } from "@apicity/x";

const recordingName = "x/media-upload-finalize";

describe("x post.v2.media.upload.finalize", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("finalizes the upload session and returns processing_info", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = x({
      accessToken: process.env.X_ACCESS_TOKEN ?? "x-test-token",
    });

    const mediaId = process.env.X_TEST_MEDIA_ID ?? "2050120900222296064";
    const res = await provider.post.v2.media.upload.finalize(mediaId);

    expect(res.data).toBeDefined();
    expect(typeof res.data.id).toBe("string");
    expect(res.data.processing_info).toBeDefined();
    expect(["pending", "in_progress", "succeeded", "failed"]).toContain(
      res.data.processing_info?.state
    );
  });

  it("exposes the finalize method", () => {
    const provider = x({ accessToken: "x-test-token" });
    expect(typeof provider.post.v2.media.upload.finalize).toBe("function");
  });
});
