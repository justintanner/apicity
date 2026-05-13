import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { freeMediaUpload } from "@apicity/free-media-upload";

describe("free-media-upload litterbox upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file with 1h expiry", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/litterbox-upload");
    const provider = freeMediaUpload();
    const file = new Blob(["Hello, litterbox!"], { type: "text/plain" });

    const url = await provider.litterbox.upload({
      file,
      filename: "test.txt",
      time: "1h",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/litterbox-upload-image");
    const provider = freeMediaUpload();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.litterbox.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should upload a video with 1h expiry", async () => {
    ctx = setupPollyForFileUploads(
      "free-media-upload/litterbox-upload-video-1h"
    );
    const provider = freeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const url = await provider.litterbox.upload({
      file,
      filename: "jump.mp4",
      time: "1h",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should upload a video with 12h expiry", async () => {
    ctx = setupPollyForFileUploads(
      "free-media-upload/litterbox-upload-video-12h"
    );
    const provider = freeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const url = await provider.litterbox.upload({
      file,
      filename: "jump.mp4",
      time: "12h",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should upload a video with 24h expiry", async () => {
    ctx = setupPollyForFileUploads(
      "free-media-upload/litterbox-upload-video-24h"
    );
    const provider = freeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const url = await provider.litterbox.upload({
      file,
      filename: "jump.mp4",
      time: "24h",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should upload a video with 72h expiry", async () => {
    ctx = setupPollyForFileUploads(
      "free-media-upload/litterbox-upload-video-72h"
    );
    const provider = freeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const url = await provider.litterbox.upload({
      file,
      filename: "jump.mp4",
      time: "72h",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free-media-upload/litterbox-validate");
    const provider = freeMediaUpload();
    const result = provider.litterbox.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
