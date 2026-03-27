import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("kie veo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should generate a video and poll until complete", async () => {
    ctx = setupPolly("kie/veo-generate");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    // Submit the generation task
    const task = await provider.veo.api.v1.veo.generate({
      prompt: "A cat walking across a sunlit garden path",
      model: "veo3",
      aspectRatio: "16:9",
    });
    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const taskId = task.data!.taskId!;
    const deadline = Date.now() + 5 * 60 * 1000;
    const pollIntervalMs = ctx.mode === "record" ? 5000 : 0;
    let finalState: string | undefined;
    let resultJson: string | undefined;

    // Poll recordInfo every few seconds until success, fail, or timeout
    while (Date.now() < deadline) {
      const info = await provider.api.v1.jobs.recordInfo(taskId);
      expect(info.data?.taskId).toBe(taskId);
      finalState = info.data?.state;

      if (finalState === "success") {
        resultJson = info.data?.resultJson;
        break;
      }
      if (finalState === "fail") {
        break;
      }

      if (pollIntervalMs > 0) {
        await sleep(pollIntervalMs);
      }
    }

    expect(finalState).toBe("success");
    expect(resultJson).toBeTruthy();

    const result = JSON.parse(resultJson!);
    expect(result.works).toBeInstanceOf(Array);
    expect(result.works.length).toBeGreaterThan(0);
    expect(result.works[0].resource).toBeTruthy();
  }, 330_000);
});
