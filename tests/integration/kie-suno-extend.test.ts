import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

// Kie defers audioId validation to the worker, so submit returns 200 with a
// taskId even for an unknown audioId. The recording captures that response
// shape stably; downstream failure surfaces later in record-info polling.
describe("kie suno generate.extend (submit, deferred validation)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/extend-bogus-audio-id");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns 200 with a taskId even when audioId is bogus", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.generate.extend({
      defaultParamFlag: true,
      audioId: "apicity-test-bogus-audio-id",
      prompt: "extend with a bridge",
      model: "V5",
      callBackUrl: "https://example.com/cb",
      style: "Synthwave",
      title: "Side B",
      continueAt: 30,
    });

    expect(result.code).toBe(200);
    expect(result.data?.taskId).toBeTruthy();
    expect(typeof result.data?.taskId).toBe("string");
  });
});
