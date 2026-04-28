import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno generate.uploadExtend (submit, deferred validation)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/upload-extend-bogus-url");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns 200 with a taskId even when uploadUrl is unreachable", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.uploadExtend({
      uploadUrl: "https://invalid-host-apicity-test.invalid/song.mp3",
      defaultParamFlag: true,
      instrumental: false,
      continueAt: 60,
      model: "V5",
      callBackUrl: "https://example.com/cb",
      prompt: "Continue the chorus then resolve",
    });

    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });
});
