import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno add vocals (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/add-vocals-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits an add vocals task and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.addVocals({
      uploadUrl: "https://example.com/instrumental.mp3",
      prompt: "Add soft female vocals about summer dreams",
      title: "Summer Dreams",
      style: "soft pop",
      callBackUrl: "https://example.com/cb",
      model: "V4_5PLUS",
    });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data?.taskId).toBeTruthy();
      expect(typeof result.data?.taskId).toBe("string");
    }
  });
});
