import { describe, it, expect, afterEach } from "vitest";
import { Buffer } from "node:buffer";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { x } from "@apicity/x";

const recordingName = "x/media-upload-append";

describe("x post.v2.media.upload.append", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("appends a single chunk and returns expires_at", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPollyForFileUploads(recordingName);

    const provider = x({
      accessToken: process.env.X_ACCESS_TOKEN ?? "x-test-token",
    });

    const mediaId = process.env.X_TEST_MEDIA_ID ?? "2050120900222296064";
    const chunk = new Blob([Buffer.alloc(64)], { type: "video/mp4" });

    const res = await provider.post.v2.media.upload.append(mediaId, {
      media: chunk,
      segment_index: 0,
    });

    expect(res.data).toBeDefined();
    expect(typeof res.data.expires_at).toBe("number");
  });

  it("exposes a Zod schema with safeParse", () => {
    const provider = x({ accessToken: "x-test-token" });
    const endpoint = provider.post.v2.media.upload.append;
    expect(endpoint.schema).toBeDefined();
    expect(typeof endpoint.schema.safeParse).toBe("function");

    const valid = endpoint.schema.safeParse({
      media: new Blob([new Uint8Array(8)]),
      segment_index: 0,
    });
    expect(valid.success).toBe(true);

    const negative = endpoint.schema.safeParse({
      media: new Blob([new Uint8Array(8)]),
      segment_index: -1,
    });
    expect(negative.success).toBe(false);

    const tooHigh = endpoint.schema.safeParse({
      media: new Blob([new Uint8Array(8)]),
      segment_index: 1000,
    });
    expect(tooHigh.success).toBe(false);
  });
});
