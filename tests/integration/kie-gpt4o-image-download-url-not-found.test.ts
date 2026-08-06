import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Verifies the SDK request/response shape for the 4o Image download-url
// converter against the live API on the error path. Uses a deterministic
// bogus taskId + URL so the recording is stable and free (no paid generation).
describe("kie 4o image download-url (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/gpt4o-image/download-url-not-found");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the kie envelope when the task/url pair does not resolve", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.post.api.v1.gpt4oImage.downloadUrl({
      taskId: "apicity-test-nonexistent-task-id-do-not-record-real",
      url: "https://tempfile.aiquickdraw.com/v/apicity-test-nonexistent.png",
    });

    // Free retrieval: upstream returns its standard envelope for missing
    // records (typically 422 validation / record-is-null). Schema still
    // validates the request shape.
    expect(typeof result.code).toBe("number");
    expect(typeof result.msg).toBe("string");
    expect([200, 404, 422, 451, 500]).toContain(result.code);
    if (result.code === 200) {
      expect(typeof result.data).toBe("string");
      expect(result.data).toBeTruthy();
    }
  });

  it("should validate payload schema for gpt4oImage.downloadUrl", async () => {
    const provider = createKie({
      apiKey: "test-key",
    });

    const validResult =
      provider.post.api.v1.gpt4oImage.downloadUrl.schema.safeParse({
        taskId: "task12345",
        url: "https://tempfile.aiquickdraw.com/v/xxxxxxx.png",
      });
    expect(validResult.success).toBe(true);

    const missingTaskId =
      provider.post.api.v1.gpt4oImage.downloadUrl.schema.safeParse({
        url: "https://tempfile.aiquickdraw.com/v/xxxxxxx.png",
      });
    expect(missingTaskId.success).toBe(false);

    const missingUrl =
      provider.post.api.v1.gpt4oImage.downloadUrl.schema.safeParse({
        taskId: "task12345",
      });
    expect(missingUrl.success).toBe(false);

    const empty = provider.post.api.v1.gpt4oImage.downloadUrl.schema.safeParse(
      {}
    );
    expect(empty.success).toBe(false);
  });
});
