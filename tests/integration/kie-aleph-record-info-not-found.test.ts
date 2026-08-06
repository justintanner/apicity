import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Free poll path: deliberate non-existent taskId — no paid generate call.
const RECORDING_NAME = "kie/aleph/record-info-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";

describe("kie aleph record-info (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a valid envelope for a missing task", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const recordInfo = provider.get.api.v1.aleph.recordInfo;

    const result = await recordInfo(MISSING_TASK_ID);

    expect(typeof result.code).toBe("number");
    expect(typeof result.msg).toBe("string");
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });
});
