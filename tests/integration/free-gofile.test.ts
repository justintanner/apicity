import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { free } from "@nakedapi/free";

describe("free gofile upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free/gofile-upload");
    const provider = free();
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
    ctx = setupPollyForFileUploads("free/gofile-upload-image");
    const provider = free();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.gofile.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(result.status).toBe("ok");
    expect(result.data.size).toBe(imgBuffer.length);
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free/gofile-validate");
    const provider = free();
    const result = provider.gofile.upload.validatePayload({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });
});
