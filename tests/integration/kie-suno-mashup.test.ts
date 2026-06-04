import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie suno mashup (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/mashup-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a mashup task and returns a taskId", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.mashup({
      uploadUrlList: [
        "https://example.com/audio1.mp3",
        "https://example.com/audio2.mp3",
      ],
      customMode: false,
      model: "V4",
      callBackUrl: "https://example.com/cb",
    });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
