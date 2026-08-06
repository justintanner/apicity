import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Record against deliberately non-existent ids — do not call paid generate.
const RECORDING_NAME = "kie/suno/get-timestamped-lyrics-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";
const MISSING_AUDIO_ID = "apicity-test-nonexistent-audio-id-do-not-record-real";

describe("kie suno get-timestamped-lyrics (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the 422 not-found envelope for missing task+audio ids", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const getTimestampedLyrics =
      provider.suno.post.api.v1.generate.getTimestampedLyrics;

    const result = await getTimestampedLyrics({
      taskId: MISSING_TASK_ID,
      audioId: MISSING_AUDIO_ID,
    });

    // Free error path: HTTP 200 with business code 422 when the record does
    // not exist (no paid generate required).
    expect(result).toEqual({
      code: 422,
      msg: "The corresponding record does not exist",
      data: null,
    });
    expect(getTimestampedLyrics.responseSchema.safeParse(result).success).toBe(
      true
    );
  });
});
