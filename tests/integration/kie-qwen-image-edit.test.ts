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

// Qwen Image edit (`qwen/image-edit`, KIE market) fed with OUR OWN fixture:
// cat1.jpg (686x667) is uploaded through fileStreamUpload and edited once per
// image_size preset. These recordings are billing evidence behind
// @apicity/cost's per-preset image-edit estimate (ac-dgvqms probe P3,
// ac-ul6b3m probes E1 to E5): only prompt, image_url and image_size are sent,
// so every other input keeps its upstream default and creditsConsumed varies
// with the preset alone. KIE fixes it at submission, and the outputs are not
// the page's nominal sizes (square_hd measured 2048x2048). The poll runs to
// `success` BEFORE teardownPolly so the committed recording.har ends on the
// finished media URL.

const PROMPT =
  "Give the cat a small red bow tie and keep everything else unchanged";

function provider() {
  return createKie({
    paygate: { secret: TEST_PAYGATE_SECRET },
    apiKey: process.env.KIE_API_KEY ?? "test-key",
  });
}

async function uploadCat(kie: ReturnType<typeof createKie>): Promise<string> {
  const blob = new Blob(
    [readFileSync(resolve(__dirname, "../fixtures", "cat1.jpg"))],
    { type: "image/jpeg" }
  );
  const upload = await kie.post.api.fileStreamUpload({
    file: blob,
    filename: "cat1.jpg",
    uploadPath: "images/test-uploads",
  });
  expect(upload.data?.downloadUrl).toBeTruthy();
  return upload.data!.downloadUrl;
}

type QwenImageSize =
  | "square"
  | "square_hd"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

// Uploads the cat, edits it at `imageSize`, polls to a terminal state and
// asserts the documented success shape.
async function editCatAt(imageSize: QwenImageSize): Promise<void> {
  const kie = provider();
  const imageUrl = await uploadCat(kie);
  const request = {
    model: "qwen/image-edit",
    input: { prompt: PROMPT, image_url: imageUrl, image_size: imageSize },
  } satisfies MediaGenerationRequest;
  const task = await kie.post.api.v1.jobs.createTask(
    request,
    mintKieCreateTaskOtp(request)
  );

  expect(task.code).toBe(200);
  expect(task.data?.taskId).toBeTruthy();

  const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
  const taskId = task.data!.taskId;
  let state = "waiting";
  let resultJson: string | undefined;
  let creditsConsumed: number | undefined;
  for (let i = 0; i < 55; i++) {
    const info = await kie.get.api.v1.jobs.recordInfo(taskId);
    state = info.data?.state ?? "waiting";
    if (state === "success" || state === "fail") {
      expect(info.data?.taskId).toBe(taskId);
      resultJson = info.data?.resultJson;
      creditsConsumed = (info.data as { creditsConsumed?: number } | undefined)
        ?.creditsConsumed;
      break;
    }
    if (pollDelay)
      await new Promise((resolve) => setTimeout(resolve, pollDelay));
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

describe("kie qwen/image-edit integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits our cat fixture at square_hd and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-square-hd");
      await editCatAt("square_hd");
    }
  );

  it(
    "edits our cat fixture at landscape_4_3 and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-landscape-4-3");
      await editCatAt("landscape_4_3");
    }
  );

  it(
    "edits our cat fixture at square and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-square");
      await editCatAt("square");
    }
  );

  it(
    "edits our cat fixture at portrait_4_3 and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-portrait-4-3");
      await editCatAt("portrait_4_3");
    }
  );

  it(
    "edits our cat fixture at portrait_16_9 and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-portrait-16-9");
      await editCatAt("portrait_16_9");
    }
  );

  it(
    "edits our cat fixture at landscape_16_9 and polls to a completed image",
    { timeout: 600_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/qwen-image-edit-landscape-16-9");
      await editCatAt("landscape_16_9");
    }
  );
});
