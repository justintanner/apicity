import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieSunoOtp, TEST_PAYGATE_SECRET } from "../harness";

// Record against deliberately non-existent ids — do not call paid generate.
const RECORDING_NAME = "kie/suno/generate-persona-not-found";
const MISSING_TASK_ID = "apicity-test-nonexistent-task-id-do-not-record-real";
const MISSING_AUDIO_ID = "apicity-test-nonexistent-audio-id-do-not-record-real";

describe("kie suno generate-persona (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly(RECORDING_NAME);
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a not-found envelope for missing task+audio ids", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const generatePersona = provider.suno.post.api.v1.generate.generatePersona;

    const request = {
      taskId: MISSING_TASK_ID,
      audioId: MISSING_AUDIO_ID,
      name: "Apicity Test Persona",
      description: "error-path fixture only — nonexistent task/audio ids",
    };

    const result = await generatePersona(
      request,
      mintKieSunoOtp("api.v1.generate.generatePersona", request)
    );

    // Free error path: HTTP 200 with business code 422 when the music
    // record does not exist (no paid generate required).
    expect(result).toEqual({
      code: 422,
      msg: "Music does not exist",
      data: null,
    });
    expect(generatePersona.responseSchema.safeParse(result).success).toBe(true);
  });
});
