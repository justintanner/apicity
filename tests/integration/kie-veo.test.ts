import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie veo integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should submit a veo generate request", async () => {
    ctx = setupPolly("kie/veo-generate");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });
    const result = await provider.veo.api.v1.veo.generate({
      prompt: "A cat walking across a sunlit garden path",
      model: "veo3",
      aspectRatio: "16:9",
    });
    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });
});
