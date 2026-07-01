import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";

describe("kie upload endpoints", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("uploads a file stream through post.api.fileStreamUpload", async () => {
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

  it("uploads base64 content through post.api.fileBase64Upload", async () => {
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

  it("validates upload endpoint schemas", async () => {
    const provider = createKie({
      apiKey: "test-key",
    });

    const validStream = provider.post.api.fileStreamUpload.schema.safeParse({
      file: new Blob(["test"]),
      filename: "test.bin",
      uploadPath: "uploads",
    });
    expect(validStream.success).toBe(true);

    const invalidStream = provider.post.api.fileStreamUpload.schema.safeParse(
      {}
    );
    expect(invalidStream.success).toBe(false);
    expect(invalidStream.error?.issues.length).toBeGreaterThan(0);

    const validUrl = provider.post.api.fileUrlUpload.schema.safeParse({
      fileUrl: "https://example.com/image.png",
      uploadPath: "images",
      fileName: "image.png",
    });
    expect(validUrl.success).toBe(true);

    const invalidUrl = provider.post.api.fileUrlUpload.schema.safeParse({
      uploadPath: "images",
    });
    expect(invalidUrl.success).toBe(false);
    expect(
      invalidUrl.error?.issues.some((issue) => issue.path.includes("fileUrl"))
    ).toBe(true);

    const validBase64 = provider.post.api.fileBase64Upload.schema.safeParse({
      base64Data: "SGVsbG8=",
      uploadPath: "uploads",
      fileName: "hello.txt",
      mimeType: "text/plain",
    });
    expect(validBase64.success).toBe(true);

    const invalidBase64 = provider.post.api.fileBase64Upload.schema.safeParse(
      {}
    );
    expect(invalidBase64.success).toBe(false);
    expect(
      invalidBase64.error?.issues.some((issue) =>
        issue.path.includes("base64Data")
      )
    ).toBe(true);
    expect(
      invalidBase64.error?.issues.some((issue) =>
        issue.path.includes("uploadPath")
      )
    ).toBe(true);
  });
});
