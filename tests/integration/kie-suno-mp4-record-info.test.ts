import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

const RECORDING_NAME = "kie/mp4/record-info-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";

describe("kie suno mp4 record-info", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a successful null-data envelope for an unknown task", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const recordInfo = provider.suno.get.api.v1.mp4.recordInfo;

    const result = await recordInfo(MISSING_TASK_ID);

    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data).toBeNull();
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });

  it("validates taskId metadata without issuing another request", () => {
    const recordInfo = createKie({
      apiKey: "kie-test-key",
    }).suno.get.api.v1.mp4.recordInfo;

    expect(
      recordInfo.schema.safeParse({ taskId: MISSING_TASK_ID }).success
    ).toBe(true);
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    expect(recordInfo.schema.safeParse({ taskId: "" }).success).toBe(false);
  });
});
