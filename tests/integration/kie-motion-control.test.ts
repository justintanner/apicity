import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie kling-3.0 motion-control integration", () => {
  let ctx: PollyContext;

  describe("motionControl", () => {
    beforeEach(() => {
      ctx = setupPolly("kie/kling-motion-control");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a motion-control task and poll status", async () => {
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const task = await provider.api.v1.jobs.createTask({
        model: "kling-3.0/motion-control",
        input: {
          input_urls: [
            "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
          ],
          video_urls: [
            "https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4",
          ],
          prompt: "The cartoon character is dancing.",
          mode: "720p",
          character_orientation: "video",
          background_source: "input_video",
        },
      });

      expect(task.taskId).toBeTruthy();
      expect(typeof task.taskId).toBe("string");

      const info = await provider.api.v1.jobs.recordInfo(task.taskId);

      expect(info.taskId).toBe(task.taskId);
      expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
        info.state
      );
    });
  });
});
