import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { freeMediaUpload } from "@apicity/free-media-upload";

describe("free-media-upload filebin upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/filebin-upload");
    const provider = freeMediaUpload();
    const file = new Blob(["Hello, filebin!"], { type: "text/plain" });

    const result = await provider.filebin.upload({
      file,
      filename: "test.txt",
      bin: "apicity-test",
    });

    expect(result.bin.id).toBe("apicity-test");
    expect(result.file.filename).toBe("test.txt");
    expect(result.file.sha256).toBeTruthy();
    expect(result.bin.expired_at).toBeTruthy();
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/filebin-upload-image");
    const provider = freeMediaUpload();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.filebin.upload({
      file,
      filename: "cat1.jpg",
      bin: "apicity-test-img",
    });

    expect(result.file.bytes).toBe(imgBuffer.length);
    expect(result.file.md5).toBeTruthy();
  });

  it("should upload a video", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/filebin-upload-video");
    const provider = freeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const result = await provider.filebin.upload({
      file,
      filename: "jump.mp4",
      bin: "apicity-test-video",
    });

    expect(result.bin.id).toBe("apicity-test-video");
    expect(result.file.filename).toBe("jump.mp4");
    expect(result.file.bytes).toBe(vidBuffer.length);
    expect(result.file.sha256).toBeTruthy();
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free-media-upload/filebin-validate");
    const provider = freeMediaUpload();
    const result = provider.filebin.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
