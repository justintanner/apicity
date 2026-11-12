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
  KieImageUpscaleRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie kie/image-upscale integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upscale the uploaded cat 2x and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kie-image-upscale");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Our cat1.jpg fixture, uploaded through KIE's file API.
      const upload = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"))],
          { type: "image/jpeg" }
        ),
        filename: "cat1.jpg",
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toBeTruthy();

      // The documented default factor. cat1.jpg is 768 x 1024, so the output
      // is 1536 x 2048 (3.1 MP), inside the cheapest tier (2K, 1.5 credits).
      const request = {
        model: "kie/image-upscale",
        input: {
          image_url: upload.data!.downloadUrl,
          upscale_factor: "2",
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
    const image = "https://example.com/cat.jpg";

    const ok = schema.safeParse({
      model: "kie/image-upscale",
      input: { image_url: image, upscale_factor: "8" },
    });
    expect(ok.success).toBe(true);

    // image_url is required.
    expect(
      schema.safeParse({
        model: "kie/image-upscale",
        input: { upscale_factor: "2" },
      }).success
    ).toBe(false);

    // The factor is the declared string enum: no "3", and no bare number.
    for (const upscale_factor of ["3", 2]) {
      const request = {
        model: "kie/image-upscale",
        input: { image_url: image, upscale_factor },
      };
      const model = KieImageUpscaleRequestSchema.safeParse(request);
      expect(model.success, String(upscale_factor)).toBe(false);
      expect(
        model.error?.issues.some(
          (issue) => issue.path.join(".") === "input.upscale_factor"
        ),
        String(upscale_factor)
      ).toBe(true);
      expect(schema.safeParse(request).success, String(upscale_factor)).toBe(
        false
      );
    }
  });
});
