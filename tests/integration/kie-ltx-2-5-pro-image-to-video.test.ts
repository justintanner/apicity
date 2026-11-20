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
import { Ltx25ProImageToVideoRequestSchema } from "@apicity/kie/zod";

// ac-kevvtj: one paid generation under the operator's pre-approval of
// 2026-11-19 (survey ac-vmq3cy). The minimal request: the uploaded cat1.jpg as
// the first frame, 720p and 6 s set explicitly (the defaults are 1080p and
// 10 s), default fps, no seed: 6 x 14.4 credits = 86.4 credits (0.432 USD) on
// the 720p row. The image adds no charge.
describe("kie ltx/2-5-pro-image-to-video integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "animates the uploaded first frame at 720p for 6 s and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/ltx-2-5-pro-image-to-video");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const upload = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
          { type: "image/jpeg" }
        ),
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "ltx/2-5-pro-image-to-video",
        input: {
          image_url: upload.data!.downloadUrl!,
          prompt: "The cat slowly turns its head toward the camera",
          resolution: "720p",
          duration: 6,
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
    ctx = setupPolly("kie/ltx-2-5-pro-image-to-video-record-info-not-found");

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
    const image_url = "https://example.com/cat.jpg";

    expect(
      schema.safeParse({
        model: "ltx/2-5-pro-image-to-video",
        input: { image_url, prompt: "The cat blinks." },
      }).success
    ).toBe(true);

    // The image is required, and Pro has no clip past 10 seconds.
    for (const input of [
      { prompt: "The cat blinks." },
      { image_url, prompt: "The cat blinks.", duration: 12 },
    ]) {
      const request = { model: "ltx/2-5-pro-image-to-video", input };
      expect(Ltx25ProImageToVideoRequestSchema.safeParse(request).success).toBe(
        false
      );
      expect(schema.safeParse(request).success).toBe(false);
    }
  });
});
