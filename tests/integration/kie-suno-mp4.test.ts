import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno mp4.generate (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/mp4-bogus-ids");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope when taskId/audioId do not exist", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.mp4.generate({
      taskId: "apicity-test-bogus-task-id",
      audioId: "apicity-test-bogus-audio-id",
      callBackUrl: "https://example.com/cb",
    });

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([400, 404, 422, 500]).toContain(result.code);
  });
});
