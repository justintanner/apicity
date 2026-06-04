import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie grok-imagine full lifecycle", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "step 1: text-to-image generation with credits check and poll",
    { timeout: 660_000 },
    async () => {
      ctx = setupPolly("kie/grok-imagine-lifecycle/step-1-text-to-image");
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Check credits before the call
      const credits = await provider.get.api.v1.chat.credit();
      expect(credits.code).toBe(200);
      expect(typeof credits.data).toBe("number");

      // Submit text-to-image task
      const request = {
        model: "grok-imagine/text-to-image",
        input: {
          prompt: "A red panda sitting on a mossy log in a bamboo forest",
          aspect_ratio: "1:1",
        },
      };
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
      let state = "waiting";
      let resultJson: string | undefined;

      for (let i = 0; i < 120; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();

      const result = JSON.parse(resultJson!);
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls.length).toBeGreaterThan(0);
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );

  it(
    "step 2: image-to-image transform with public reference image and poll",
    { timeout: 660_000 },
    async () => {
      ctx = setupPolly("kie/grok-imagine-lifecycle/step-2-image-to-image");
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Check credits before the call
      const credits = await provider.get.api.v1.chat.credit();
      expect(credits.code).toBe(200);
      expect(typeof credits.data).toBe("number");

      // Submit image-to-image task using a public reference image
      const request = {
        model: "grok-imagine/image-to-image",
        input: {
          prompt: "Transform into a watercolor painting style",
          image_urls: [
            "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
          ],
        },
      };
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
      let state = "waiting";
      let resultJson: string | undefined;

      for (let i = 0; i < 120; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();

      const result = JSON.parse(resultJson!);
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls.length).toBeGreaterThan(0);
      expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
    }
  );
});
