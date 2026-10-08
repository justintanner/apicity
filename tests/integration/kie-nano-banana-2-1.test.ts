import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie nano-banana-2-1 integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-image task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/nano-banana-2-1");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "nano-banana-2-1",
        input: {
          prompt: "A red apple on a white table",
          aspect_ratio: "1:1",
          resolution: "1K",
          output_format: "jpg",
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
      let resultJson = "";
      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          if (state === "success") {
            resultJson = info.data?.resultJson ?? "";
            expect(resultJson).toBeTruthy();
          }
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
      const parsed = JSON.parse(resultJson) as { resultUrls?: unknown };
      expect(parsed.resultUrls).toEqual([expect.any(String)]);
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const ok = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "nano-banana-2-1",
      input: {
        prompt: "A red apple on a white table",
        aspect_ratio: "16:9",
        resolution: "2K",
        output_format: "png",
      },
    });
    expect(ok.success).toBe(true);

    const tooMany = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "nano-banana-2-1",
      input: {
        prompt: "A red apple on a white table",
        image_input: Array.from(
          { length: 11 },
          (_, index) => `https://example.com/reference-${index}.png`
        ),
      },
    });
    expect(tooMany.success).toBe(false);
  });
});
