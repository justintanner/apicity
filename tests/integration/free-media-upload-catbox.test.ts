import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { freeMediaUpload } from "@apicity/free-media-upload";

describe("free-media-upload catbox upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/catbox-upload");
    const provider = freeMediaUpload();
    const file = new Blob(["Hello, catbox!"], { type: "text/plain" });

    const url = await provider.catbox.upload({ file, filename: "test.txt" });

    expect(url).toContain("catbox.moe");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/catbox-upload-image");
    const provider = freeMediaUpload();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.catbox.upload({ file, filename: "cat1.jpg" });

    expect(url).toContain("catbox.moe");
  });

  it.skip("should upload a video (skipped: catbox.moe unreachable)", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/catbox-upload-video");
    const provider = freeMediaUpload();
    const vidBuffer = readFileSync(resolve(__dirname, "../fixtures/jump.mp4"));
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const url = await provider.catbox.upload({ file, filename: "jump.mp4" });

    expect(url).toContain("catbox.moe");
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free-media-upload/catbox-validate");
    const provider = freeMediaUpload();
    const result = provider.catbox.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
