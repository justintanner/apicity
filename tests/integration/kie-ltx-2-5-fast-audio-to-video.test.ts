import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { Ltx25FastAudioToVideoRequestSchema } from "@apicity/kie/zod";

// ac-ium3f4: one paid generation under the operator's pre-approval of
// 2026-11-19 (survey ac-vmq3cy). The minimal request: the uploaded 6.008 s
// dialog.mp3 cut to its first 2 s (the shortest duration), 720p, no image,
// default fps, no seed: 2 x 10.8 credits = 21.6 credits (0.108 USD) on the
// 720p row, billed on the output length.
describe("kie ltx/2-5-fast-audio-to-video integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "makes a 2 s 720p video from the uploaded audio and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/ltx-2-5-fast-audio-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const upload = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [readFileSync(resolve(__dirname, "../fixtures/dialog.mp3"))],
          { type: "audio/mpeg" }
        ),
        filename: "dialog.mp3",
        uploadPath: "audio/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "ltx/2-5-fast-audio-to-video",
        input: {
          audio_url: upload.data!.downloadUrl!,
          prompt: "A radio host speaks into a studio microphone",
          resolution: "720p",
          duration: 2,
        },
      } satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
      let state = "waiting";
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;

      for (let i = 0; i < 180; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          creditsConsumed = (
            info.data as { creditsConsumed?: number } | undefined
          )?.creditsConsumed;
          break;
        }
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(state).toBe("success");
      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls![0]).toMatch(/^https:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("reads a task that does not exist without a paid call", async () => {
    ctx = setupPolly("kie/ltx-2-5-fast-audio-to-video-record-info-not-found");

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const info = await provider.get.api.v1.jobs.recordInfo(
      "apicity-test-nonexistent-task-id-do-not-record-real"
    );

    // KIE answers HTTP 200 with a 422 envelope and no data.
    expect(info.code).toBe(422);
    expect(info.msg).toBe("recordInfo is null");
    expect(info.data).toBeNull();
  });

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;
    const audio_url = "https://example.com/voice.mp3";

    expect(
      schema.safeParse({
        model: "ltx/2-5-fast-audio-to-video",
        input: { audio_url, prompt: "A host speaks." },
      }).success
    ).toBe(true);

    // The audio is required, and 1440p allows at most 10 seconds.
    for (const input of [
      { prompt: "A host speaks." },
      {
        audio_url,
        prompt: "A host speaks.",
        resolution: "1440p",
        duration: 12.5,
      },
    ]) {
      const request = { model: "ltx/2-5-fast-audio-to-video", input };
      expect(
        Ltx25FastAudioToVideoRequestSchema.safeParse(request).success
      ).toBe(false);
      expect(schema.safeParse(request).success).toBe(false);
    }
  });
});
