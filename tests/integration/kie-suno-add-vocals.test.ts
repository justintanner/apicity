import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie suno add vocals (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/add-vocals-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits an add vocals task and returns a taskId", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.addVocals({
      uploadUrl: "https://example.com/instrumental.mp3",
      prompt: "Add soft female vocals about summer dreams",
      title: "Summer Dreams",
      style: "soft pop",
      negativeTags: "heavy metal, strong drum beats",
      callBackUrl: "https://example.com/cb",
      model: "V4_5PLUS",
    });

    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });
});
