import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie grok-imagine video integration", () => {
  let ctx: PollyContext;

  describe("textToVideo", () => {
    beforeEach(() => {
      ctx = setupPolly("kie/grok-text-to-video");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should create a text-to-video task and poll status", async () => {
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const task = await provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/text-to-video",
        input: {
          prompt: "A golden sunset over calm ocean waves",
          duration: "6",
        },
      });

      expect(task.data?.taskId).toBeTruthy();
      expect(typeof task.data?.taskId).toBe("string");

      const info = await provider.get.api.v1.jobs.recordInfo(task.data?.taskId);

      expect(info.data?.taskId).toBe(task.data?.taskId);
      expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
        info.data?.state
      );
    });
  });

  describe("videoExtend", () => {
    beforeEach(() => {
      ctx = setupPolly("kie/grok-video-extend");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should extend a completed video by task_id", async () => {
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Use a completed text-to-video task_id — extend requires the
      // source video to have finished generating.
      const extend = await provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/extend",
        input: {
          task_id: "c13f22cfc68d83c319043ade1c1fd401",
          prompt: "The bird lands gracefully on a tree branch",
          extend_at: 0,
          extend_times: "6",
        },
      });

      expect(extend.data?.taskId).toBeTruthy();
      expect(typeof extend.data?.taskId).toBe("string");
    });
  });

  describe("videoUpscale", () => {
    beforeEach(() => {
      ctx = setupPolly("kie/grok-video-upscale");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should upscale a completed video by task_id", async () => {
      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // Use a completed text-to-video task_id — upscale requires the
      // source video to have finished generating.
      const upscale = await provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/upscale",
        input: {
          task_id: "d43f0d0ab29f28fdfcf68a9dccbd7a42",
        },
      });

      expect(upscale.data?.taskId).toBeTruthy();
      expect(typeof upscale.data?.taskId).toBe("string");
    });
  });
});
