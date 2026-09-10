import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Record against a deliberately non-existent taskId — do not call paid generate.
const RECORDING_NAME = "kie/suno/recovery-invalid-task";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";

describe("kie suno recovery (create, invalid task)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the envelope as recorded for a missing task_id", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const recovery = provider.suno.post.api.v1.suno.recovery;

    const result = await recovery({ task_id: MISSING_TASK_ID });

    expect(result.code).toBe(500);
    expect(result.msg).toBe("The original Suno task does not exist.");
    expect(result.data).toBeNull();
  });

  it("validates task_id metadata without issuing another request", () => {
    const recovery = createKie({
      apiKey: "kie-test-key",
    }).suno.post.api.v1.suno.recovery;

    expect(
      recovery.schema.safeParse({ task_id: MISSING_TASK_ID }).success
    ).toBe(true);
    expect(recovery.schema.safeParse({}).success).toBe(false);
    expect(recovery.schema.safeParse({ task_id: "" }).success).toBe(false);
  });
});
