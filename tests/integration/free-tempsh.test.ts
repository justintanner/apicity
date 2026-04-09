import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { free } from "@nakedapi/free";

describe("free temp.sh upload", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload a text file", async () => {
    ctx = setupPollyForFileUploads("free/tempsh-upload");
    const provider = free();
    const file = new Blob(["Hello, temp.sh!"], { type: "text/plain" });

    const url = await provider.tempsh.upload({ file, filename: "test.txt" });

    expect(url).toContain("temp.sh");
  });

  it("should upload an image", async () => {
    ctx = setupPollyForFileUploads("free/tempsh-upload-image");
    const provider = free();
    const imgBuffer = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const file = new Blob([imgBuffer], { type: "image/jpeg" });

    const url = await provider.tempsh.upload({ file, filename: "cat1.jpg" });

    expect(url).toContain("temp.sh");
  });

  it("should validate payload - missing file", () => {
    ctx = setupPollyForFileUploads("free/tempsh-validate");
    const provider = free();
    const result = provider.tempsh.upload.validatePayload({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
  });
});
