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
import {
  createKie,
  KieVideoUpscaleRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie video/upscale integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upscale the uploaded cat clip to 1080P and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/video-upscale");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The owned 3.0 s, 720 x 960 cat clip, uploaded through KIE's file API.
      const upload = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [
            readFileSync(
              resolve(__dirname, "../fixtures/cat1-kling-o3-3s.mp4")
            ),
          ],
          { type: "video/mp4" }
        ),
        filename: "cat1-kling-o3-3s.mp4",
        uploadPath: "videos/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      // The cheapest box: 1080P bills 1.5 credits per second of input video.
      const request = {
        model: "video/upscale",
        input: {
          video_url: upload.data!.downloadUrl,
          resolution: "1080P",
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
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;
      for (let i = 0; i < 200; i++) {
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
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();
      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls!.length).toBeGreaterThan(0);
      expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
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
    const video = "https://example.com/cat.mp4";

    expect(
      schema.safeParse({
        model: "video/upscale",
        input: { video_url: video, resolution: "4K" },
      }).success
    ).toBe(true);

    // video_url is required.
    expect(
      schema.safeParse({
        model: "video/upscale",
        input: { resolution: "2K" },
      }).success
    ).toBe(false);

    // The box is uppercase, exactly as the docs write it.
    for (const resolution of ["1080p", "2k", "720P"]) {
      const request = {
        model: "video/upscale",
        input: { video_url: video, resolution },
      };
      const model = KieVideoUpscaleRequestSchema.safeParse(request);
      expect(model.success, resolution).toBe(false);
      expect(
        model.error?.issues.some(
          (issue) => issue.path.join(".") === "input.resolution"
        ),
        resolution
      ).toBe(true);
      expect(schema.safeParse(request).success, resolution).toBe(false);
    }
  });
});
