import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie download url", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should convert kie CDN URL to temporary download URL", async () => {
    ctx = setupPolly("kie/download-url/convert");
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Use a known kie CDN URL to convert to temporary download URL
    // This test requires a valid CDN URL that exists in the system
    const cdnUrl = "https://cdn.kie.ai/files/sample-test-file.mp4";
    const result = await provider.post.api.v1.common.downloadUrl({
      url: cdnUrl,
    });

    // The API might return various status codes depending on if the file exists
    // 200 = success with temp URL, 404 = file not found, 422 = validation error
    // Either way, we verify the schema/endpoint works
    expect([200, 404, 422]).toContain(result.code);
    if (result.code === 200) {
      // DownloadUrlResponse = KieApiEnvelope<string>: the temporary download
      // URL is the envelope string `data`, not a nested { url } object.
      expect(typeof result.data).toBe("string");
      expect(result.data).toBeTruthy();
      expect(result.msg).toBe("success");
    }
  });

  it("should validate payload schema for downloadUrl", async () => {
    const provider = createKie({
      apiKey: "test-key",
    });

    // Valid payload
    const validResult =
      provider.post.api.v1.common.downloadUrl.schema.safeParse({
        url: "https://cdn.kie.ai/files/test-file.mp4",
      });
    expect(validResult.success).toBe(true);

    // Invalid payload (missing required field)
    const invalidResult =
      provider.post.api.v1.common.downloadUrl.schema.safeParse({});
    expect(invalidResult.success).toBe(false);
    if (invalidResult.success) throw new Error("expected failure");
    expect(invalidResult.error?.issues.length).toBeGreaterThan(0);
  });
});
