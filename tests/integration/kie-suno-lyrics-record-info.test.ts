import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

const RECORDING_NAME = "kie/suno/lyrics-record-info";
const MISSING_TASK_ID =
  "apicity-test-nonexistent-lyrics-task-id-do-not-record-real";

describe("kie suno lyrics record-info", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a live response envelope for a missing lyrics task", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const recordInfo = provider.suno.get.api.v1.lyrics.recordInfo;
    const result = await recordInfo(MISSING_TASK_ID);

    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data).toBeNull();
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });

  it("validates the request taskId via schema", () => {
    const recordInfo = createKie({
      apiKey: "kie-test-key",
    }).suno.get.api.v1.lyrics.recordInfo;

    expect(recordInfo.schema.safeParse({ taskId: "abc123" }).success).toBe(
      true
    );
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    expect(recordInfo.schema.safeParse({ taskId: "" }).success).toBe(false);
  });
});
