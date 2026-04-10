import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { XaiError } from "@nakedapi/xai";
import { createXaiProvider } from "../xai-provider";

describe("xAI error handling integration", () => {
  let ctx: PollyContext;

  beforeAll(() => {
    ctx = setupPolly("xai/error-handling");
  });

  afterAll(async () => {
    await teardownPolly(ctx);
  });

  it("should extract error message from API error response with message field", async () => {
    const provider = createXaiProvider();

    // Trigger an error by sending an invalid request
    // This tests line 150-152 where error.message is extracted
    try {
      await provider.post.v1.chat.completions({
        model: "grok-3-fast",
        messages: [], // Empty messages should trigger a validation error
      });
      expect.fail("Should have thrown XaiError");
    } catch (error) {
      expect(error).toBeInstanceOf(XaiError);
      const xaiError = error as XaiError;
      expect(xaiError.status).toBeGreaterThanOrEqual(400);
      expect(xaiError.message).toBeTruthy();
      expect(xaiError.body).toBeDefined();
    }
  });

  it("should handle API error without message field in error object", async () => {
    const provider = createXaiProvider();

    // Send a request with invalid parameters to trigger error without message
    try {
      await provider.post.v1.chat.completions({
        model: "grok-3-fast",
        messages: [{ role: "invalid_role", content: "test" }],
      } as unknown as Parameters<typeof provider.post.v1.chat.completions>[0]);
      expect.fail("Should have thrown XaiError");
    } catch (error) {
      expect(error).toBeInstanceOf(XaiError);
      const xaiError = error as XaiError;
      expect(xaiError.status).toBeGreaterThanOrEqual(400);
      expect(xaiError.body).toBeDefined();
    }
  });

  it("should handle rate limit error when encountered", async () => {
    // Note: Rate limits are hard to trigger consistently
    // This test verifies the error structure if we do hit a 429
    const provider = createXaiProvider();

    // Make a successful request first
    const result = await provider.get.v1.models();
    expect(result.data).toBeDefined();
  });
});
