import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";

// Qwen Image text-to-image (`qwen/text-to-image`, KIE market): createTask ->
// poll recordInfo to a completed image, once per image_size preset. These
// recordings are the billing evidence behind @apicity/cost's per-megapixel
// Qwen estimate (ac-dgvqms probes P1 and P2): only prompt and image_size are
// sent, so every other input keeps its upstream default and the terminal
// recordInfo's creditsConsumed varies with the preset alone. The outputs
// measured 1328x1328 and 1472x1104, not the page's nominal 1024x1024 and
// 1024x768. The poll runs to `success` BEFORE teardownPolly so the committed
// recording.har ends on the finished media URL.

interface CompletedTask {
  resultUrls: string[];
  creditsConsumed?: number;
}

async function createAndWait(
  provider: ReturnType<typeof createKie>,
  request: MediaGenerationRequest
): Promise<CompletedTask> {
  const task = await provider.post.api.v1.jobs.createTask(
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
    const info = await provider.get.api.v1.jobs.recordInfo(taskId);
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
  return { resultUrls: result.resultUrls!, creditsConsumed };
}

const PROMPT =
  "A red bicycle leaning against a whitewashed brick wall in soft morning light, photorealistic";

describe("kie qwen/text-to-image integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "generates one square_hd image and polls it to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/qwen-text-to-image-square-hd");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const { creditsConsumed } = await createAndWait(provider, {
        model: "qwen/text-to-image",
        input: { prompt: PROMPT, image_size: "square_hd" },
      });

      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it(
    "generates one landscape_4_3 image and polls it to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/qwen-text-to-image-landscape-4-3");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const { creditsConsumed } = await createAndWait(provider, {
        model: "qwen/text-to-image",
        input: { prompt: PROMPT, image_size: "landscape_4_3" },
      });

      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );
});
