import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie file base64 upload integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/file-base64-upload");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload file from base64", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    // Small 1x1 red PNG as base64
    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
    const result = await provider.post.api.fileBase64Upload({
      base64: base64Image,
      filename: "test-base64.png",
      mimeType: "image/png",
    });
    expect(result.data).toBeDefined();
    expect(result.data?.downloadUrl).toBeTruthy();
    expect(result.data?.fileName).toBe("test-base64.png");
  });

  it("should infer mime type from filename", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const base64Content = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
    const result = await provider.post.api.fileBase64Upload({
      base64: base64Content,
      filename: "test.txt",
      // No mimeType provided - should infer
    });
    expect(result.data).toBeDefined();
    expect(result.data?.downloadUrl).toBeTruthy();
  });

  it("should have payload schema", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    expect(provider.post.api.fileBase64Upload.payloadSchema).toBeDefined();
    expect(provider.post.api.fileBase64Upload.validatePayload).toBeDefined();
  });

  it("should validate payload correctly", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const validPayload = {
      base64: "SGVsbG8=",
      filename: "test.txt",
    };
    const result =
      provider.post.api.fileBase64Upload.validatePayload(validPayload);
    expect(result.valid).toBe(true);
  });
});
