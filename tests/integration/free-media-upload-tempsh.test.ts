import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { createFreeMediaUpload } from "@apicity/free-media-upload";

describe("free-media-upload temp.sh upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tempsh-upload");
    const provider = createFreeMediaUpload();
    const file = new Blob(["Hello, temp.sh!"], { type: "text/plain" });

    const url = await provider.tempsh.upload({ file, filename: "test.txt" });

    expect(url).toContain("temp.sh");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tempsh-upload-image");
    const provider = createFreeMediaUpload();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.tempsh.upload({ file, filename: "cat1.jpg" });

    expect(url).toContain("temp.sh");
  });

  it("should upload a video", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tempsh-upload-video");
    const provider = createFreeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const url = await provider.tempsh.upload({ file, filename: "jump.mp4" });

    expect(url).toContain("temp.sh");
  });

  it("should validate payload - missing file", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/tempsh-validate")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/tempsh-validate");
    const provider = createFreeMediaUpload();
    const result = provider.tempsh.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
