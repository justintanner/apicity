import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie suno add instrumental (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/add-instrumental-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits an add instrumental task and returns a taskId", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.addInstrumental({
      uploadUrl: "https://example.com/vocal.mp3",
      title: "Gentle Acoustic Backing",
      tags: "gentle acoustic guitar, piano",
      negativeTags: "distortion, harsh noise",
      callBackUrl: "https://example.com/cb",
      model: "V4_5PLUS",
    });

    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });
});
