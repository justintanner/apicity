import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";

describe("kie file base64 upload integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPollyForFileUploads("kie/file-base64-upload");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload file from base64", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    // Small 1x1 red PNG as base64
    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const result = await provider.post.api.fileBase64Upload({
      base64Data: base64Image,
      uploadPath: "images/test-uploads",
      fileName: "test-base64.png",
      mimeType: "image/png",
    });
    expect(result.data).toBeDefined();
    expect(result.data?.downloadUrl).toBeTruthy();
    expect(result.data?.fileName).toBeTruthy();
  });

  it("should infer mime type from filename", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const base64Content = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
    const result = await provider.post.api.fileBase64Upload({
      base64Data: base64Content,
      uploadPath: "documents/test-uploads",
      fileName: "test.txt",
    });
    expect(result.data).toBeDefined();
    expect(result.data?.downloadUrl).toBeTruthy();
  });

  it("should have schema", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    expect(provider.post.api.fileBase64Upload.schema).toBeDefined();
    expect(typeof provider.post.api.fileBase64Upload.schema.safeParse).toBe(
      "function"
    );
  });

  it("should validate payload correctly", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const validPayload = {
      base64Data: "SGVsbG8=",
      uploadPath: "uploads",
    };
    const result =
      provider.post.api.fileBase64Upload.schema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
