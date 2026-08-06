import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Record against a deliberately non-existent task_id — do not call paid generate.
const RECORDING_NAME = "kie/suno/voice-check-voice-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";

describe("kie suno voice check-voice (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the 422 not-found envelope for a missing task", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const checkVoice = provider.suno.post.api.v1.voice.checkVoice;

    // Body field is upstream-documented snake_case `task_id` (not taskId).
    const result = await checkVoice({ task_id: MISSING_TASK_ID });

    // Free error path: HTTP 200 with business code 422 when the voice task
    // does not exist (no paid generate required).
    expect(result).toEqual({
      code: 422,
      msg: "Voice record not found",
      data: null,
    });
    expect(checkVoice.responseSchema.safeParse(result).success).toBe(true);
  });
});
