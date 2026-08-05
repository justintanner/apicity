import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

const RECORDING_NAME = "kie/wav/record-info-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";

describe("kie suno wav record-info (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the null-data success envelope for a missing task", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const recordInfo = provider.suno.get.api.v1.wav.recordInfo;

    const result = await recordInfo(MISSING_TASK_ID);

    expect(result).toEqual({ code: 200, msg: "success", data: null });
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });
});
