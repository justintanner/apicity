import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";

describe("kie google/gemini-3-8-flash-lite-tts integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-speech task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/gemini-3-8-flash-lite-tts");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "google/gemini-3-8-flash-lite-tts",
        input: {
          speakers: [{ speaker_id: "Speaker 1", voice_name: "Fola" }],
          dialogue_turns: [
            {
              speaker_id: "Speaker 1",
              text: "Hello from Apicity. Have a wonderful day.",
              style: "Warm and friendly",
            },
          ],
        },
      } satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          if (state === "success") {
            expect(typeof info.data?.resultJson).toBe("string");
            expect(info.data?.resultJson).toBeTruthy();
          }
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
    }
  );
});
