import { describe, it, expect } from "vitest";
import { kie } from "@nakedapi/kie";

describe("kie file URL upload payload validation", () => {
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
