import { describe, it, expect } from "vitest";
import { fal } from "@nakedapi/fal";

describe("fal apps queue flush validation", () => {
  it("should validate payload for required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result =
      provider.delete.v1.serverless.apps.queue.flush.validatePayload({
        owner: "test-owner",
        name: "test-app",
      });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result =
      provider.delete.v1.serverless.apps.queue.flush.validatePayload({
        idempotency_key: "test-key",
      });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("owner is required");
    expect(result.errors).toContain("name is required");
  });
});
