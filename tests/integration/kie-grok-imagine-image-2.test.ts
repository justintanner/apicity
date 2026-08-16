import { afterEach, describe, expect, it } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";

// The preferred cat-asset seed was tested first: cat1.jpg was uploaded and
// transformed by the 1.x `grok-imagine/image-to-image` model. Passing that
// completed task ID to 2.0 `segment-map` failed with "source task image
// metadata not found", so the shipped recording uses the documented fallback:
// its 2.0 text-to-image cat task seeds both segment-map and image-edit.
// Recording observations: text-to-image returned one result URL; segment-map
// returned nine segments and reported `creditsConsumed: 0.0`; image-edit
// returned one result URL.

interface CompletedTask {
  resultJson: string;
  creditsConsumed?: number;
}

interface Segment {
  maskUrl: string;
  name: string;
  index: number;
}

async function createTask(
  provider: ReturnType<typeof createKie>,
  request: MediaGenerationRequest
): Promise<string> {
  const task = await provider.post.api.v1.jobs.createTask(
    request,
    mintKieCreateTaskOtp(request)
  );

  expect(task.code).toBe(200);
  expect(task.data?.taskId).toBeTruthy();
  return task.data!.taskId;
}

async function waitForTask(
  provider: ReturnType<typeof createKie>,
  taskId: string
): Promise<CompletedTask> {
  const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
  let state = "waiting";
  let resultJson: string | undefined;
  let creditsConsumed: number | undefined;

  for (let i = 0; i < 180; i++) {
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
  return { resultJson: resultJson!, creditsConsumed };
}

function parseResultUrls(resultJson: string): string[] {
  const result = JSON.parse(resultJson) as { resultUrls?: string[] };
  expect(result.resultUrls).toBeInstanceOf(Array);
  expect(result.resultUrls!.length).toBeGreaterThan(0);
  expect(result.resultUrls![0]).toMatch(/^https:\/\//);
  return result.resultUrls!;
}

describe("kie Grok Imagine Image 2.0 lifecycle", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "chains a cat seed through text-to-image, segment-map, and image-edit",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPolly("kie/grok-imagine-image-2-lifecycle");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const textToImageRequest = {
        model: "grok-imagine-image-2-0/text-to-image",
        input: {
          prompt:
            "A white cat with mismatched yellow and blue eyes sitting in a softly lit studio, photorealistic.",
          aspect_ratio: "1:1",
        },
      } satisfies MediaGenerationRequest;
      const textToImageTaskId = await createTask(provider, textToImageRequest);
      const textToImageResult = await waitForTask(provider, textToImageTaskId);
      const textToImageUrls = parseResultUrls(textToImageResult.resultJson);
      expect(textToImageUrls.every((url) => /^https:\/\//.test(url))).toBe(
        true
      );

      const segmentMapRequest = {
        model: "grok-imagine-image-2-0/segment-map",
        input: { task_id: textToImageTaskId },
      } satisfies MediaGenerationRequest;
      const segmentMapTaskId = await createTask(provider, segmentMapRequest);
      const segmentMapResult = await waitForTask(provider, segmentMapTaskId);
      const segmentResult = JSON.parse(segmentMapResult.resultJson) as {
        resultObject?: {
          segments_count?: number;
          segments?: Segment[];
        };
      };
      const segments = segmentResult.resultObject?.segments;

      expect(segments).toBeInstanceOf(Array);
      expect(segments!.length).toBeGreaterThan(0);
      expect(segmentResult.resultObject?.segments_count).toBe(segments!.length);
      for (const segment of segments!) {
        expect(segment.maskUrl).toMatch(/^https:\/\//);
        expect(typeof segment.name).toBe("string");
        expect(Number.isInteger(segment.index)).toBe(true);
      }
      if (segmentMapResult.creditsConsumed !== undefined) {
        expect(segmentMapResult.creditsConsumed).toBeGreaterThanOrEqual(0);
      }

      const editableSegment = segments!.find((segment) => segment.index >= 1);
      expect(editableSegment).toBeTruthy();

      const imageEditRequest = {
        model: "grok-imagine-image-2-0/image-edit",
        input: {
          prompt: "Give the cat a red bow tie.",
          task_id: textToImageTaskId,
          mask_indexs: [editableSegment!.index],
        },
      } satisfies MediaGenerationRequest;
      const imageEditTaskId = await createTask(provider, imageEditRequest);
      const imageEditResult = await waitForTask(provider, imageEditTaskId);
      parseResultUrls(imageEditResult.resultJson);
    }
  );
});
