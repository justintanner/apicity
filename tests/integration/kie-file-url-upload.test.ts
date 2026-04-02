import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie file URL upload integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/file-url-upload");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should upload file from URL", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const result = await provider.post.api.fileUrlUpload({
      url: "https://example.com/test-image.png",
      uploadPath: "uploads/test-url-upload.png",
    });
    expect(result.data).toBeDefined();
    expect(result.data?.downloadUrl).toBeTruthy();
    expect(result.data?.fileName).toBeTruthy();
  });

  it("should have payload schema", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    expect(provider.post.api.fileUrlUpload.payloadSchema).toBeDefined();
    expect(provider.post.api.fileUrlUpload.validatePayload).toBeDefined();
  });

  it("should validate payload correctly", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const validPayload = {
      url: "https://example.com/image.png",
    };
    const result =
      provider.post.api.fileUrlUpload.validatePayload(validPayload);
    expect(result.valid).toBe(true);
  });

  it("should reject invalid payload", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const invalidPayload = {};
    const result =
      provider.post.api.fileUrlUpload.validatePayload(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
