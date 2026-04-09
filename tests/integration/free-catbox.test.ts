import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { free } from "@nakedapi/free";

describe("free catbox upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free/catbox-upload");
    const provider = free();
    const file = new Blob(["Hello, catbox!"], { type: "text/plain" });

    const url = await provider.catbox.upload({ file, filename: "test.txt" });

    expect(url).toContain("catbox.moe");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free/catbox-upload-image");
    const provider = free();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.catbox.upload({ file, filename: "cat1.jpg" });

    expect(url).toContain("catbox.moe");
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free/catbox-validate");
    const provider = free();
    const result = provider.catbox.upload.validatePayload({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });
});
