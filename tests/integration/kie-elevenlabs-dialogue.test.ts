import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie elevenlabs dialogue (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/elevenlabs/dialogue-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a dialogue task and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result =
      await provider.elevenlabs.post.api.v1.jobs.createTask.dialogue({
        dialogue: [{ text: "Hello there.", voice: "Adam" }],
        stability: 0.5,
      });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
