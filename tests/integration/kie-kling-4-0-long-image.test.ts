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
import { Kling40LongImageRequestSchema } from "@apicity/kie/zod";

// ac-zakqnf: one paid generation under the operator's KIE pre-approval of
// 2026-11-19. The cheapest page: ecommerce, Short, 1K, from one product
// image (the uploaded cat1.jpg), 42.5 + 0.5 = 43 credits (0.215 USD).
describe("kie kling-4-0/long-image integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "builds a short 1K ecommerce page from an uploaded image and polls to success",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-4-0-long-image");

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
        model: "kling-4-0/long-image",
        input: {
          prompt:
            "A short product detail page for @image_1, a cat-themed plush toy, on a clean white background",
          skill: "ecommerce",
          image_urls: [upload.data!.downloadUrl],
          length: "short",
          resolution: "1k",
        },
      } satisfies MediaGenerationRequest;
      expect(Kling40LongImageRequestSchema.safeParse(request).success).toBe(
        true
      );

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
    ctx = setupPolly("kie/kling-4-0-long-image-record-info-not-found");

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
        model: "kling-4-0/long-image",
        input: { prompt: "A landing page", skill: "webpage" },
      }).success
    ).toBe(true);

    // image_urls belongs to ecommerce; KIE answers it on webpage with 422.
    const crossed = {
      model: "kling-4-0/long-image",
      input: {
        prompt: "A landing page",
        skill: "webpage",
        image_urls: ["https://example.com/a.png"],
      },
    };
    expect(Kling40LongImageRequestSchema.safeParse(crossed).success).toBe(
      false
    );
    expect(schema.safeParse(crossed).success).toBe(false);
  });
});
