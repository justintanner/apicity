import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { free } from "@nakedapi/free";

describe("free tflink upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free/tflink-upload");
    const provider = free();
    const file = new Blob(["Hello, tflink!"], { type: "text/plain" });

    const result = await provider.tflink.upload({
      file,
      filename: "test.txt",
    });

    expect(result.downloadLink).toContain("tmpfile.link");
    expect(result.fileName).toBe("test.txt");
    expect(result.size).toBeGreaterThan(0);
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free/tflink-upload-image");
    const provider = free();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const result = await provider.tflink.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(result.downloadLink).toContain("tmpfile.link");
    expect(result.size).toBe(imgBuffer.length);
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free/tflink-validate");
    const provider = free();
    const result = provider.tflink.upload.validatePayload({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });
});
