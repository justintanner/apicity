import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("kie grok-imagine image-to-video harness", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should check credits, create image-to-video task, poll until complete, and return video URL", async () => {
    ctx = setupPolly("kie/grok-imagine-image-to-video-harness");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Step 1: Check account credits before the expensive call
    const credits = await provider.get.api.v1.chat.credit();
    expect(credits.code).toBe(200);
    expect(typeof credits.data).toBe("number");

    // Step 2: Submit image-to-video task using a hosted image URL
    // (KIE image_urls requires hosted URLs, not data URIs)
    const task = await provider.post.api.v1.jobs.createTask({
      model: "grok-imagine/image-to-video",
      input: {
        prompt: "The cat slowly turns its head and blinks",
        image_urls: [
          "https://tempfile.redpandaai.co/kieai/136592/uploads/1774674979704_cat1.jpg/1774674980049-nm7k3g86rt.jpg",
        ],
        duration: "6",
      },
    });

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const taskId = task.data!.taskId!;
    const deadline = Date.now() + 5 * 60 * 1000;
    const pollIntervalMs = ctx.mode === "record" ? 10_000 : 0;
    let finalState: string | undefined;
    let resultJson: string | undefined;

    // Step 3: Poll recordInfo until success or fail
    while (Date.now() < deadline) {
      const info = await provider.get.api.v1.jobs.recordInfo(taskId);

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

    // Step 4: Assert final result has a video URL
    expect(finalState).toBe("success");
    expect(resultJson).toBeTruthy();

    const result = JSON.parse(resultJson!);
    expect(result.resultUrls).toBeInstanceOf(Array);
    expect(result.resultUrls.length).toBeGreaterThan(0);
    expect(result.resultUrls[0]).toMatch(/^https?:\/\/.+\.mp4$/);
  }, 330_000);
});
