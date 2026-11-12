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
  GptImage26SunburstImageToImageRequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie gpt-image-2-6/sunburst-image-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should edit the uploaded cat and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads(
        "kie/gpt-image-2-6-sunburst-image-to-image"
      );

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

      // The cheapest documented settings, as text-to-image recorded them:
      // low quality and planning complexity, 1K, jpeg. The reference image
      // bills as image input tokens.
      const request = {
        model: "gpt-image-2-6/sunburst-image-to-image",
        input: {
          prompt: "Add a small red scarf to the cat.",
          input_urls: [upload.data!.downloadUrl],
          quality: "low",
          complexity: "low",
          resolution: "1K",
          aspect_ratio: "auto",
          output_format: "jpeg",
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

    const ok = schema.safeParse({
      model: "gpt-image-2-6/sunburst-image-to-image",
      input: {
        prompt: "Restyle as a cinematic still.",
        input_urls: ["https://example.com/a.png"],
        mask_url: "https://example.com/mask.png",
      },
    });
    expect(ok.success).toBe(true);

    // The mask/markup rule is asserted on the model schema: createTask.schema
    // is a plain z.union, and a union failure nests every member's issues
    // under one invalid_union issue.
    const maskAndMarkup = {
      model: "gpt-image-2-6/sunburst-image-to-image",
      input: {
        prompt: "An edit.",
        input_urls: ["https://example.com/a.png"],
        mask_url: "https://example.com/mask.png",
        markup: "https://example.com/markup.png",
      },
    };
    const family =
      GptImage26SunburstImageToImageRequestSchema.safeParse(maskAndMarkup);
    expect(family.success).toBe(false);
    expect(
      family.error?.issues.some(
        (issue) => issue.path.join(".") === "input.markup"
      )
    ).toBe(true);
    expect(schema.safeParse(maskAndMarkup).success).toBe(false);
  });
});
