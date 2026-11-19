import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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
import { GrokImagineImage2ImageEditRequestSchema } from "@apicity/kie/zod";

// ac-sb6m5h: KIE re-pointed grok-imagine-image-2-0/image-edit to image_urls
// (https://docs.kie.ai/market/grok-imagine-image-2-0/image-to-image, read
// 2026-11-19); the old task_id + mask_indexs form lives on segment-edit. One
// paid edit of the uploaded cat1.jpg at 1:1: 4 credits (0.02 USD), the feed's
// "Image Edit" row.
describe("kie grok-imagine-image-2-0/image-edit integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "edits an uploaded image and polls to a successful result",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/grok-imagine-image-2-image-edit");

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
        model: "grok-imagine-image-2-0/image-edit",
        input: {
          prompt: "Give the cat a red bow tie.",
          aspect_ratio: "1:1",
          image_urls: [upload.data!.downloadUrl],
        },
      } satisfies MediaGenerationRequest;
      expect(
        GrokImagineImage2ImageEditRequestSchema.safeParse(request).success
      ).toBe(true);

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5_000;
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
    ctx = setupPolly(
      "kie/grok-imagine-image-2-image-edit-record-info-not-found"
    );

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

    expect(
      schema.safeParse({
        model: "grok-imagine-image-2-0/image-edit",
        input: {
          prompt: "Give the cat a red bow tie.",
          aspect_ratio: "auto",
          image_urls: ["https://example.com/cat.jpg"],
        },
      }).success
    ).toBe(true);

    // The retired task_id + mask_indexs form now belongs to segment-edit.
    const oldForm = {
      model: "grok-imagine-image-2-0/image-edit",
      input: {
        prompt: "Give the cat a red bow tie.",
        task_id: "task-cat-source",
        mask_indexs: [1],
      },
    };
    expect(
      GrokImagineImage2ImageEditRequestSchema.safeParse(oldForm).success
    ).toBe(false);
    expect(schema.safeParse(oldForm).success).toBe(false);
  });
});
