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
import { GrokImagineImage2SegmentMapRequestSchema } from "@apicity/kie/zod";

// ac-mtdgxe: segment-map takes a direct image_url as well as a task_id
// (https://docs.kie.ai/market/grok-imagine-image-2-0/segment-map, read
// 2026-11-19). The feed prices segment-map at 0 credits per image, so this
// recording of the image_url path is free: cat1.jpg goes up through KIE's
// file API and its download URL is segmented.

interface Segment {
  maskUrl: string;
  name: string;
  index: number;
}

describe("kie grok-imagine-image-2-0/segment-map image_url integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
    ctx = undefined;
  });

  it(
    "segments an uploaded image by URL and polls to named mask layers",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPollyForFileUploads(
        "kie/grok-imagine-image-2-segment-map-image-url"
      );

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
        model: "grok-imagine-image-2-0/segment-map",
        input: { image_url: upload.data!.downloadUrl },
      } satisfies MediaGenerationRequest;
      expect(
        GrokImagineImage2SegmentMapRequestSchema.safeParse(request).success
      ).toBe(true);

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5_000;
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
      const result = JSON.parse(resultJson!) as {
        resultObject?: { segments_count?: number; segments?: Segment[] };
      };
      const segments = result.resultObject?.segments;
      expect(segments).toBeInstanceOf(Array);
      expect(segments!.length).toBeGreaterThan(0);
      expect(result.resultObject?.segments_count).toBe(segments!.length);
      for (const segment of segments!) {
        expect(segment.maskUrl).toMatch(/^https?:\/\//);
        expect(typeof segment.name).toBe("string");
        expect(Number.isInteger(segment.index)).toBe(true);
      }
      // The feed prices segment-map at 0 credits per image.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBe(0);
      }
    }
  );

  it("reads a task that does not exist without a paid call", async () => {
    ctx = setupPolly(
      "kie/grok-imagine-image-2-segment-map-record-info-not-found"
    );

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

    for (const input of [
      { task_id: "task-cat-source" },
      { image_url: "https://example.com/cat.jpg" },
    ]) {
      expect(
        schema.safeParse({
          model: "grok-imagine-image-2-0/segment-map",
          input,
        }).success
      ).toBe(true);
    }

    // Exactly one source: both, or neither, is refused.
    for (const input of [
      { task_id: "task-cat-source", image_url: "https://example.com/cat.jpg" },
      {},
    ]) {
      const request = { model: "grok-imagine-image-2-0/segment-map", input };
      expect(
        GrokImagineImage2SegmentMapRequestSchema.safeParse(request).success
      ).toBe(false);
      expect(schema.safeParse(request).success).toBe(false);
    }
  });
});
