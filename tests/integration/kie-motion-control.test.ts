import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie kling-3.0 motion-control integration", () => {
  let ctx: PollyContext;

  describe("motionControl", () => {
    beforeEach(() => {
      ctx = setupPollyIgnoringBody("kie/kling-motion-control");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a motion-control task and poll status", async () => {
      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
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
          duration: "5s",
        },
      } as unknown as MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.data?.taskId).toBeTruthy();
      expect(typeof task.data?.taskId).toBe("string");

      const info = await provider.get.api.v1.jobs.recordInfo(
        task.data!.taskId!
      );

      expect(info.data?.taskId).toBe(task.data?.taskId);
      expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
        info.data?.state
      );
    });
  });
});
