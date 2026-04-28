import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

// Kie defers uploadUrl reachability checks to the worker, so submit returns
// 200 with a taskId even for an unreachable URL.
describe("kie suno generate.uploadCover (submit, deferred validation)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/upload-cover-bogus-url");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns 200 with a taskId even when uploadUrl is unreachable", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.uploadCover({
      uploadUrl: "https://invalid-host-apicity-test.invalid/song.mp3",
      prompt: "Cover this in a synthwave style",
      customMode: true,
      instrumental: false,
      model: "V5",
      callBackUrl: "https://example.com/cb",
      style: "Synthwave",
      title: "Cover Take",
    });

    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });
});
