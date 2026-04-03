import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie recordInfo", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skip("should return task status for a completed task", async () => {
    ctx = setupPolly("kie/record-info-completed");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const result =
      await provider.get.api.v1.jobs.recordInfo("task-completed-001");
    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data).toBeDefined();
    expect(result.data!.taskId).toBe("task-completed-001");
    expect(result.data!.state).toBe("success");
    expect(result.data!.progress).toBe(100);
  });
});
