import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { free } from "@nakedapi/free";

describe("free litterbox upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file with 1h expiry", async () => {
    ctx = setupPollyForFileUploads("free/litterbox-upload");
    const provider = free();
    const file = new Blob(["Hello, litterbox!"], { type: "text/plain" });

    const url = await provider.litterbox.upload({
      file,
      filename: "test.txt",
      time: "1h",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free/litterbox-upload-image");
    const provider = free();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.litterbox.upload({
      file,
      filename: "cat1.jpg",
    });

    expect(url).toContain("litter.catbox.moe");
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free/litterbox-validate");
    const provider = free();
    const result = provider.litterbox.upload.validatePayload({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });
});
