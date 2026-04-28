import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

// Uses bogus IDs to avoid spending credits (separate_vocal=10, split_stem=50).
describe("kie suno vocalRemoval.generate (error envelope)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/vocal-removal-bogus-ids");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns a recognizable envelope when taskId/audioId do not exist", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.vocalRemoval.generate({
      taskId: "apicity-test-bogus-task-id",
      audioId: "apicity-test-bogus-audio-id",
      callBackUrl: "https://example.com/cb",
      type: "separate_vocal",
    });

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([400, 404, 422, 500]).toContain(result.code);
  });
});
