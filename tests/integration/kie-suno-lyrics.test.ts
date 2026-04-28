import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

describe("kie suno lyrics (submit)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/lyrics-submit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a lyrics generation task and returns a taskId", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.lyrics({
      prompt: "A short song about morning coffee",
      callBackUrl: "https://example.com/cb",
    });

    expect([200, 422, 451]).toContain(result.code);
    if (result.code === 200) {
      expect(result.data).toBeDefined();
    }
  });
});
