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

describe("free-media-upload gofile upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/gofile-upload");
    const provider = createFreeMediaUpload();
    const file = new Blob(["Hello, gofile!"], { type: "text/plain" });

    const result = await provider.gofile.upload({
      file,
      filename: "test.txt",
    });

    expect(result.status).toBe("ok");
    expect(result.data.downloadPage).toContain("gofile.io");
    expect(result.data.md5).toBeTruthy();
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/gofile-upload-image");
    const provider = createFreeMediaUpload();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.gofile.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(result.status).toBe("ok");
    expect(result.data.size).toBe(imgBuffer.length);
  });

  it("should upload a video", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/gofile-upload-video");
    const provider = createFreeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const result = await provider.gofile.upload({
      file,
      filename: "jump.mp4",
    });

    expect(result.status).toBe("ok");
    expect(result.data.downloadPage).toContain("gofile.io");
    expect(result.data.size).toBe(vidBuffer.length);
  });

  it("should validate payload - missing file", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/gofile-validate")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/gofile-validate");
    const provider = createFreeMediaUpload();
    const result = provider.gofile.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
