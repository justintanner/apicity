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
import { freeMediaUpload } from "@apicity/free-media-upload";

describe("free-media-upload tmpfiles upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a file and return a URL", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-upload");
    const provider = freeMediaUpload();

    const content = "Hello, tmpfiles!";
    const file = new Blob([content], { type: "text/plain" });

    const result = await provider.tmpfiles.api.v1.upload({
      file,
      filename: "test.txt",
    });

    expect(result.status).toBe("success");
    expect(result.data.url).toContain("tmpfiles.org");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-upload-image");
    const provider = freeMediaUpload();

    const imgPath = resolve(__dirname, "../fixtures/cat1.jpg");
    const imgBuffer = readFileSync(imgPath);
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.tmpfiles.api.v1.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(result.status).toBe("success");
    expect(result.data.url).toContain("tmpfiles.org");
  });

  it("should upload a video", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-upload-video");
    const provider = freeMediaUpload();

    const vidPath = resolve(__dirname, "../fixtures/jump.mp4");
    const vidBuffer = readFileSync(vidPath);
    const file = new Blob([vidBuffer], { type: "video/mp4" });

    const result = await provider.tmpfiles.api.v1.upload({
      file,
      filename: "jump.mp4",
    });

    expect(result.status).toBe("success");
    expect(result.data.url).toContain("tmpfiles.org");
  });

  it("should expose schema on upload", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/tmpfiles-schema")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-schema");
    const provider = freeMediaUpload();
    const schema = provider.tmpfiles.api.v1.upload.schema;

    expect(typeof schema.safeParse).toBe("function");
    expect(typeof schema.parse).toBe("function");
  });

  it("should validate payload - missing file", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/tmpfiles-validate")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/tmpfiles-validate");
    const provider = freeMediaUpload();
    const result = provider.tmpfiles.api.v1.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
