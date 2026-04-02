import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal apps queue flush integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/apps-queue-flush");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should flush app queue", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.delete.v1.serverless.apps.queue.flush({
      owner: process.env.FAL_APP_OWNER ?? "test-owner",
      name: process.env.FAL_APP_NAME ?? "test-app",
      idempotency_key: "test-key-123",
    });

    expect(result).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.delete.v1.serverless.apps.queue.flush.validatePayload({
        owner: "test-owner",
        name: "test-app",
      });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.delete.v1.serverless.apps.queue.flush.validatePayload({
        idempotency_key: "test-key",
      });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("owner is required");
    expect(validation.errors).toContain("name is required");
  });
});
