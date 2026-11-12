import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import {
  Kling40FlashKeyframeToVideoRequestSchema,
  Kling40TaskResultJsonSchema,
} from "@apicity/kie/zod";

// Sweep recording (ac-3gah9x C13, ac-ye4q12): one 3 s 720p clip from the
// cat1.jpg first frame, 3 x 17 = 51 credits ($0.255). Flash takes no middle
// frames and no last frame.
describe("kie kling-4.0/flash-keyframe-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the uploaded first frame and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-40-flash-keyframe-to-video");

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

      // The minimum duration at the only resolution. No aspect_ratio: with a
      // first frame the output follows the frame.
      const request = {
        model: "kling-4.0/flash-keyframe-to-video",
        input: {
          prompt: "@first_frame The cat turns its head toward the camera.",
          duration: 3,
          resolution: "720p",
          first_frame_url: upload.data!.downloadUrl,
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
      const result = Kling40TaskResultJsonSchema.parse(JSON.parse(resultJson!));
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    expect(
      schema.safeParse({
        model: "kling-4.0/flash-keyframe-to-video",
        input: { prompt: "A paper boat drifts down a rainy street." },
      }).success
    ).toBe(true);

    // Flash takes no middle frames or last frame. The model schema names
    // the field; createTask.schema is a plain z.union whose failure nests
    // every member's issues under one invalid_union issue.
    const withLastFrame = {
      model: "kling-4.0/flash-keyframe-to-video",
      input: {
        prompt: "@first_frame then @last_frame",
        first_frame_url: "https://example.com/a.jpg",
        last_frame_url: "https://example.com/b.jpg",
      },
    };
    const model =
      Kling40FlashKeyframeToVideoRequestSchema.safeParse(withLastFrame);
    expect(model.success).toBe(false);
    expect(schema.safeParse(withLastFrame).success).toBe(false);
  });
});
