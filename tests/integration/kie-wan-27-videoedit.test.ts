import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, Wan27VideoEditDurationValues } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie wan/2-7-videoedit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload video, create a videoedit task and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/wan-27-videoedit");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Upload local jump.mp4 fixture
      const videoPath = resolve(__dirname, "../fixtures/jump.mp4");
      const videoBuffer = readFileSync(videoPath);
      const videoBlob = new Blob([videoBuffer], { type: "video/mp4" });

      const upload = await provider.post.api.fileStreamUpload({
        file: videoBlob,
        filename: "jump.mp4",
        uploadPath: "videos/test-uploads",
      });

      expect(upload.code).toBe(200);
      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        model: "wan/2-7-videoedit",
        input: {
          prompt: "Make the scene look like a watercolor painting.",
          negative_prompt:
            "low resolution, errors, worst quality, low quality, malformed",
          video_url: upload.data!.downloadUrl,
          resolution: "720p",
          duration: 0,
          audio_setting: "auto",
          prompt_extend: true,
          watermark: false,
          nsfw_checker: false,
        },
      };
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      // Poll until terminal state (skip delay in replay mode)
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          if (state === "success") {
            expect(info.data?.resultJson).toBeTruthy();
          }
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
    }
  );

  it("should validate wan/2-7-videoedit payload", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const valid = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "wan/2-7-videoedit",
      input: {
        video_url: "https://example.com/demo/video.mp4",
        prompt: "Make it look cinematic",
      },
    });
    expect(valid.success).toBe(true);

    // Missing required model field
    const invalid = provider.post.api.v1.jobs.createTask.schema.safeParse({
      input: {},
    });
    expect(invalid.success).toBe(false);
    expect(invalid.error?.issues.length).toBeGreaterThan(0);
  });

  it("should expose model input schema for wan/2-7-videoedit", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.modelInputSchemas["wan/2-7-videoedit"];

    expect(schema).toBeDefined();
    expect(schema.type).toBe("video");
    expect(schema.fields.video_url.required).toBe(true);
    expect(schema.fields.video_url.type).toBe("string");
    expect(schema.fields.prompt.type).toBe("string");
    expect(schema.fields.negative_prompt).toBeDefined();
    expect(schema.fields.reference_image.type).toBe("string");
    expect(schema.fields.resolution.enum).toContain("720p");
    expect(schema.fields.resolution.enum).toContain("1080p");
    expect(schema.fields.aspect_ratio.enum).toContain("16:9");
    expect(schema.fields.aspect_ratio.enum).toContain("9:16");
    expect(schema.fields.aspect_ratio.enum).toContain("1:1");
    expect(schema.fields.aspect_ratio.enum).toContain("4:3");
    expect(schema.fields.aspect_ratio.enum).toContain("3:4");
    expect(schema.fields.duration.type).toBe("number");
    expect(schema.fields.duration.enum).toEqual(Wan27VideoEditDurationValues);
    expect(schema.fields.audio_setting.enum).toContain("auto");
    expect(schema.fields.audio_setting.enum).toContain("origin");
    expect(schema.fields.prompt_extend.type).toBe("boolean");
    expect(schema.fields.watermark.type).toBe("boolean");
    expect(schema.fields.seed.type).toBe("number");
    expect(schema.fields.nsfw_checker).toBeDefined();
    expect(schema.fields.nsfw_checker.type).toBe("boolean");
  });
});
