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

// `grok-imagine-image-2-0/segment-edit` is documented on the page whose slug
// says image-edit — https://docs.kie.ai/market/grok-imagine-image-2-0/image-edit
// is titled "Grok Imagine Image 2.0 Segment Edit", while
// .../grok-imagine-image-2-0/segment-edit is a 404. The id was therefore
// confirmed live before anything was added: `createTask` with `input: {}`
// answers 500 "This field is required" for it (model recognized, input
// incomplete) and 422 "The model name you specified is not supported…" for
// `grok-imagine-image-2-0/not-a-real-task`.
//
// segment-edit needs a source task, so this recording seeds its own the way the
// vendor documents: a 2.0 text-to-image cat, then segment-map (free — the
// sibling recording reports creditsConsumed 0.0) for a one-based segment index.

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

describe("kie Grok Imagine Image 2.0 segment-edit", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "edits a segmented cat seed through grok-imagine-image-2-0/segment-edit",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPolly("kie/grok-imagine-image-2-segment-edit");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const sourceTaskId = await createTask(provider, {
        model: "grok-imagine-image-2-0/text-to-image",
        input: {
          prompt:
            "A white cat with mismatched yellow and blue eyes sitting in a softly lit studio, photorealistic.",
          aspect_ratio: "1:1",
        },
      } satisfies MediaGenerationRequest);
      parseResultUrls((await waitForTask(provider, sourceTaskId)).resultJson);

      const segmentMapTaskId = await createTask(provider, {
        model: "grok-imagine-image-2-0/segment-map",
        input: { task_id: sourceTaskId },
      } satisfies MediaGenerationRequest);
      const segmentMapResult = await waitForTask(provider, segmentMapTaskId);
      const segments = (
        JSON.parse(segmentMapResult.resultJson) as {
          resultObject?: { segments?: Segment[] };
        }
      ).resultObject?.segments;

      expect(segments).toBeInstanceOf(Array);
      expect(segments!.length).toBeGreaterThan(0);

      // segment-edit documents `mask_indexs` items as `minimum: 1`, so the
      // zero index segment-map also returns is never a valid selection here.
      const editableSegment = segments!.find((segment) => segment.index >= 1);
      expect(editableSegment).toBeTruthy();

      const segmentEditRequest = {
        model: "grok-imagine-image-2-0/segment-edit",
        input: {
          prompt: "Give the cat a red bow tie.",
          task_id: sourceTaskId,
          mask_indexs: [editableSegment!.index],
        },
      } satisfies MediaGenerationRequest;
      const segmentEditTaskId = await createTask(provider, segmentEditRequest);
      const segmentEditResult = await waitForTask(provider, segmentEditTaskId);
      parseResultUrls(segmentEditResult.resultJson);
      expect(segmentEditResult.creditsConsumed).toBeGreaterThan(0);
    }
  );
});
