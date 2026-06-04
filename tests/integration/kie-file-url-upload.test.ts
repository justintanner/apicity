import { describe, it, expect } from "vitest";
import { createKie } from "@apicity/kie";

describe("kie file URL upload payload validation", () => {
  it("should have schema", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    expect(provider.post.api.fileUrlUpload.schema).toBeDefined();
    expect(typeof provider.post.api.fileUrlUpload.schema.safeParse).toBe(
      "function"
    );
  });

  it("should validate payload correctly", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const validPayload = {
      fileUrl: "https://example.com/image.png",
      uploadPath: "images",
    };
    const result =
      provider.post.api.fileUrlUpload.schema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("should reject invalid payload", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const invalidPayload = {};
    const result =
      provider.post.api.fileUrlUpload.schema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toBeDefined();
  });
});
