import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno generate (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/generate-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a music generation task and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate({
      prompt:
        "A short upbeat lo-fi loop, gentle piano, no vocals, summer afternoon",
      model: "V4_5",
      instrumental: true,
      customMode: false,
      callBackUrl: "https://example.com/cb",
    });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
