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
  Kling40FlashReferenceToVideoRequestSchema,
  Kling40TaskResultJsonSchema,
} from "@apicity/kie/zod";

// Sweep recording (ac-3gah9x C14, ac-xfuy6c): one 3 s 720p clip from the
// cat1.jpg reference image and no video input, 3 x 17 = 51 credits ($0.255).
// Video input would bill at least 2 x 3 s x 11.3 = 67.8 credits.
describe("kie kling-4.0/flash-reference-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "animates the uploaded reference image and polls to a successful video",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-40-flash-reference-to-video");

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

      // The minimum duration at the only resolution, without video input.
      // No aspect_ratio: upstream uses auto with a reference asset.
      const request = {
        model: "kling-4.0/flash-reference-to-video",
        input: {
          prompt: "@image_1 The cat turns its head toward the camera.",
          duration: 3,
          resolution: "720p",
          image_urls: [upload.data!.downloadUrl],
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
        model: "kling-4.0/flash-reference-to-video",
        input: { prompt: "A paper boat drifts down a rainy street." },
      }).success
    ).toBe(true);

    // Flash has no standalone voices. The model schema refuses the field;
    // createTask.schema is a plain z.union whose failure nests every
    // member's issues under one invalid_union issue.
    const withVoices = {
      model: "kling-4.0/flash-reference-to-video",
      input: {
        prompt: "@Narrator reads",
        voices: [{ name: "Narrator", audio_url: "https://example.com/a.mp3" }],
      },
    };
    expect(
      Kling40FlashReferenceToVideoRequestSchema.safeParse(withVoices).success
    ).toBe(false);
    expect(schema.safeParse(withVoices).success).toBe(false);
  });
});
