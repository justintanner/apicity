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

describe("free-media-upload catbox upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/catbox-upload");
    const provider = createFreeMediaUpload();
    const file = new Blob(["Hello, catbox!"], { type: "text/plain" });

    const url = await provider.catbox.upload({ file, filename: "test.txt" });

    expect(url).toContain("catbox.moe");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free-media-upload/catbox-upload-image");
    const provider = createFreeMediaUpload();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.catbox.upload({ file, filename: "cat1.jpg" });

    expect(url).toContain("catbox.moe");
  });

  it("should validate payload - missing file", () => {
    if (
      getPollyMode() === "replay" &&
      !recordingExists("free-media-upload/catbox-validate")
    ) {
      return;
    }
    ctx = setupPollyForFileUploads("free-media-upload/catbox-validate");
    const provider = createFreeMediaUpload();
    const result = provider.catbox.upload.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });
});
