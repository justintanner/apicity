import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";

describe("kie file uploads", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload file stream and return download URL", async () => {
    ctx = setupPollyForFileUploads("kie/file-uploads/stream");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Create a small 1x1 PNG pixel as Blob
    const base64Pixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFCcSAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const binaryString = atob(base64Pixel);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const file = new Blob([bytes], { type: "image/png" });

    const result = await provider.post.api.fileStreamUpload({
      file,
      filename: "test-upload.png",
      uploadPath: "images/test-uploads",
    });

    expect(result.code).toBe(200);
    expect(result.data?.downloadUrl).toBeTruthy();
    expect(result.data?.downloadUrl).toMatch(/^https:\/\//);
  });

  it("should upload base64 encoded file", async () => {
    ctx = setupPollyForFileUploads("kie/file-uploads/base64");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const base64Pixel =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFCcSAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await provider.post.api.fileBase64Upload({
      base64Data: base64Pixel,
      uploadPath: "images/test-uploads",
      fileName: "test-base64.png",
      mimeType: "image/png",
    });

    expect(result.code).toBe(200);
    expect(result.data?.downloadUrl).toBeTruthy();
  });

  it("should validate payload schema for file uploads", async () => {
    const provider = createKie({
      apiKey: "test-key",
    });

    // Valid payload
    const validResult = provider.post.api.fileStreamUpload.schema.safeParse({
      file: new Blob(["test"]),
      filename: "test.bin",
      uploadPath: "uploads",
    });
    expect(validResult.success).toBe(true);

    // Invalid payload (missing required fields)
    const invalidResult = provider.post.api.fileStreamUpload.schema.safeParse(
      {}
    );
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error?.issues.length).toBeGreaterThan(0);
  });
});
