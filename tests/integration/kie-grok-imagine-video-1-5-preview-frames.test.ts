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

// Grok Imagine Video 1.5 Preview frame controls (KIE, 2026-10-22): pinned
// first and last frames, mid-video keyframes, and a loop image. Each clip is
// the cheapest that exercises its fields: 480p at 2.4 credits ($0.012) per
// second.

async function uploadFixture(
  provider: ReturnType<typeof createKie>,
  filename: string
): Promise<string> {
  const upload = await provider.post.api.fileStreamUpload({
    file: new Blob(
      [readFileSync(resolve(__dirname, "../fixtures", filename))],
      { type: "image/jpeg" }
    ),
    filename,
    uploadPath: "images/test-uploads",
  });
  expect(upload.data?.downloadUrl).toBeTruthy();
  return upload.data!.downloadUrl;
}

async function pollToEnd(
  provider: ReturnType<typeof createKie>,
  taskId: string
): Promise<{ state: string; param?: string; resultJson?: string }> {
  const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
  for (let i = 0; i < 180; i++) {
    const info = await provider.get.api.v1.jobs.recordInfo(taskId);
    const state = info.data?.state ?? "waiting";
    if (state === "success" || state === "fail") {
      expect(info.data?.taskId).toBe(taskId);
      return {
        state,
        param: info.data?.param,
        resultJson: info.data?.resultJson,
      };
    }
    if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
  }
  return { state: "timeout" };
}

// KIE echoes the stored request in recordInfo `param`, with `input` itself a
// JSON string.
function echoedInput(param: string | undefined): Record<string, unknown> {
  const outer = JSON.parse(param!) as { input: string };
  return JSON.parse(outer.input) as Record<string, unknown>;
}

function firstResultUrl(resultJson: string | undefined): string {
  const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
  expect(result.resultUrls).toBeInstanceOf(Array);
  expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
  return result.resultUrls![0];
}

describe("kie grok-imagine-video-1-5-preview frame controls", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "pins the first frame, a keyframe and the last frame",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads(
        "kie/grok-imagine-video-1-5-preview-keyframes"
      );

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const anchor = await uploadFixture(provider, "man.jpg");
      const studio = await uploadFixture(provider, "studio-bg.jpg");
      const request = {
        model: "grok-imagine-video-1-5-preview",
        input: {
          prompt:
            "The camera pulls back from the news anchor and pans across a retro control room, then returns to the anchor.",
          image_urls: [anchor],
          first_frame_url: anchor,
          keyframes: [{ url: studio, timestamp_s: 1.5 }],
          last_frame_url: anchor,
          aspect_ratio: "16:9",
          resolution: "480p",
          duration: 3,
        },
      } satisfies MediaGenerationRequest;

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const end = await pollToEnd(provider, task.data!.taskId!);

      expect(end.state).toBe("success");
      expect(echoedInput(end.param)).toMatchObject({
        first_frame_url: anchor,
        keyframes: [{ url: studio, timestamp_s: 1.5 }],
        last_frame_url: anchor,
      });
      firstResultUrl(end.resultJson);
    }
  );

  it(
    "loops one image as the first and last frame without audio",
    { timeout: 1_900_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/grok-imagine-video-1-5-preview-loop");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });
      const studio = await uploadFixture(provider, "studio-bg.jpg");
      const request = {
        model: "grok-imagine-video-1-5-preview",
        input: {
          prompt:
            "Monitor screens flicker and light beams drift through the control room in a seamless loop.",
          image_urls: [studio],
          loop_url: studio,
          aspect_ratio: "16:9",
          resolution: "480p",
          duration: 2,
          enable_audio: false,
        },
      } satisfies MediaGenerationRequest;

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const end = await pollToEnd(provider, task.data!.taskId!);

      expect(end.state).toBe("success");
      expect(echoedInput(end.param)).toMatchObject({
        loop_url: studio,
        enable_audio: false,
      });
      firstResultUrl(end.resultJson);
    }
  );
});
