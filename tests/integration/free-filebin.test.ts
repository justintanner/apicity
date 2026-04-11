import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { free } from "@apicity/free";

describe("free filebin upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free/filebin-upload");
    const provider = free();
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
    ctx = setupPollyForFileUploads("free/filebin-upload-image");
    const provider = free();
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

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free/filebin-validate");
    const provider = free();
    const result = provider.filebin.upload.validatePayload({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });
});
