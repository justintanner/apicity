import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("kie grok-imagine full lifecycle", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("step 1: text-to-image generation with credits check and poll", async () => {
    ctx = setupPolly("kie/grok-imagine-lifecycle/step-1-text-to-image");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Check credits before the call
    const credits = await provider.api.v1.chat.credit();
    expect(credits.code).toBe(200);
    expect(typeof credits.data).toBe("number");

    // Submit text-to-image task
    const task = await provider.api.v1.jobs.createTask({
      model: "grok-imagine/text-to-image",
      input: {
        prompt: "A red panda sitting on a mossy log in a bamboo forest",
        aspect_ratio: "1:1",
      },
    });

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const taskId = task.data!.taskId!;
    const deadline = Date.now() + 5 * 60 * 1000;
    const pollIntervalMs = ctx.mode === "record" ? 10_000 : 0;
    let finalState: string | undefined;
    let resultJson: string | undefined;

    // Poll until success or fail
    while (Date.now() < deadline) {
      const info = await provider.api.v1.jobs.recordInfo(taskId);

      if (info.data && info.data.taskId) {
        expect(info.data.taskId).toBe(taskId);
        finalState = info.data.state;

        if (finalState === "success") {
          resultJson = info.data.resultJson;
          break;
        }
        if (finalState === "fail") {
          break;
        }
      }

      if (pollIntervalMs > 0) {
        await sleep(pollIntervalMs);
      }
    }

    // Assert final result has an image URL
    expect(finalState).toBe("success");
    expect(resultJson).toBeTruthy();

    const result = JSON.parse(resultJson!);
    expect(result.resultUrls).toBeInstanceOf(Array);
    expect(result.resultUrls.length).toBeGreaterThan(0);
    expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
  }, 330_000);

  it("step 2: image-to-image transform with public reference image and poll", async () => {
    ctx = setupPolly("kie/grok-imagine-lifecycle/step-2-image-to-image");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Check credits before the call
    const credits = await provider.api.v1.chat.credit();
    expect(credits.code).toBe(200);
    expect(typeof credits.data).toBe("number");

    // Submit image-to-image task using a public reference image
    const task = await provider.api.v1.jobs.createTask({
      model: "grok-imagine/image-to-image",
      input: {
        prompt: "Transform into a watercolor painting style",
        image_urls: [
          "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
        ],
      },
    });

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const taskId = task.data!.taskId!;
    const deadline = Date.now() + 5 * 60 * 1000;
    const pollIntervalMs = ctx.mode === "record" ? 10_000 : 0;
    let finalState: string | undefined;
    let resultJson: string | undefined;

    // Poll until success or fail
    while (Date.now() < deadline) {
      const info = await provider.api.v1.jobs.recordInfo(taskId);

      if (info.data && info.data.taskId) {
        expect(info.data.taskId).toBe(taskId);
        finalState = info.data.state;

        if (finalState === "success") {
          resultJson = info.data.resultJson;
          break;
        }
        if (finalState === "fail") {
          break;
        }
      }

      if (pollIntervalMs > 0) {
        await sleep(pollIntervalMs);
      }
    }

    // Assert final result has an image URL
    expect(finalState).toBe("success");
    expect(resultJson).toBeTruthy();

    const result = JSON.parse(resultJson!);
    expect(result.resultUrls).toBeInstanceOf(Array);
    expect(result.resultUrls.length).toBeGreaterThan(0);
    expect(result.resultUrls[0]).toMatch(/^https?:\/\//);
  }, 330_000);
});
