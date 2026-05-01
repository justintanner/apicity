import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { x } from "@apicity/x";

const recordingName = "x/media-upload-status";

describe("x get.v2.media.upload (status)", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("returns processing_info for an in-flight media upload", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = x({
      accessToken: process.env.X_ACCESS_TOKEN ?? "x-test-token",
    });

    const mediaId = process.env.X_TEST_MEDIA_ID ?? "2050120900222296064";
    const res = await provider.get.v2.media.upload(mediaId);

    expect(res.data).toBeDefined();
    expect(res.data.id).toBe(mediaId);
    expect(res.data.processing_info).toBeDefined();
    expect(["pending", "in_progress", "succeeded", "failed"]).toContain(
      res.data.processing_info?.state
    );
  });

  it("exposes the status method", () => {
    const provider = x({ accessToken: "x-test-token" });
    expect(typeof provider.get.v2.media.upload).toBe("function");
  });
});
