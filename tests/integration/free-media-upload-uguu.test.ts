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

describe("free-media-upload uguu upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a file and return a URL", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/uguu-upload");
    const provider = createFreeMediaUpload();

    const content = "Hello, uguu!";
    const file = new Blob([content], { type: "text/plain" });

    const result = await provider.uguu.upload({
      file,
      filename: "test.txt",
    });

    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files[0].url).toContain("uguu.se");
    expect(result.files[0].size).toBeGreaterThan(0);
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/uguu-upload-image");
    const provider = createFreeMediaUpload();

    const imgPath = resolve(__dirname, "../fixtures/cat1.jpg");
    const imgBuffer = readFileSync(imgPath);
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.uguu.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files[0].url).toContain("uguu.se");
    expect(result.files[0].size).toBe(imgBuffer.length);
  });

  it("should upload a video", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/uguu-upload-video");
    const provider = createFreeMediaUpload();

    const vidPath = resolve(__dirname, "../fixtures/jump.mp4");
    const vidBuffer = readFileSync(vidPath);
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const result = await provider.uguu.upload({
      file,
      filename: "jump.mp4",
    });

    expect(result.success).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files[0].url).toContain("uguu.se");
    expect(result.files[0].size).toBe(vidBuffer.length);
  });

  it("should expose schema on upload", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/uguu-schema")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/uguu-schema");
    const provider = createFreeMediaUpload();
    const schema = provider.uguu.upload.schema;

    expect(typeof schema.safeParse).toBe("function");
    expect(typeof schema.parse).toBe("function");
  });

  it("should validate payload - missing file", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/uguu-validate")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/uguu-validate");
    const provider = createFreeMediaUpload();
    const result = provider.uguu.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
