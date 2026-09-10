import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Record against a deliberately non-existent taskId — do not call paid generate.
const RECORDING_NAME = "kie/suno/recovery-record-info-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";

describe("kie suno recovery record-info (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the envelope as recorded for a missing task", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const recordInfo = provider.suno.get.api.v1.suno.recovery.recordInfo;

    const result = await recordInfo(MISSING_TASK_ID);

    expect(result.code).toBe(500);
    expect(result.msg).toBe("The music link recovery task does not exist.");
    expect(result.data).toBeNull();
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });

  it("validates task_id metadata without issuing another request", () => {
    const recordInfo = createKie({
      apiKey: "kie-test-key",
    }).suno.get.api.v1.suno.recovery.recordInfo;

    expect(
      recordInfo.schema.safeParse({ task_id: MISSING_TASK_ID }).success
    ).toBe(true);
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    expect(recordInfo.schema.safeParse({ task_id: "" }).success).toBe(false);
  });
});
