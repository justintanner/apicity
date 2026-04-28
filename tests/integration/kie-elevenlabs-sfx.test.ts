import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie elevenlabs sfx (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/elevenlabs/sfx-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a 1-second sfx job and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.elevenlabs.post.api.v1.jobs.createTask.sfx({
      text: "soft ui click",
      duration_seconds: 1,
      prompt_influence: 0.3,
    });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
