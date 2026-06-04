import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie suno style.generate (boost style)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/style-boost");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits a style-boost request and returns a recognizable envelope", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.suno.post.api.v1.style.generate({
      content: "Pop, Mysterious",
    });

    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect([200, 422, 451]).toContain(result.code);
  });
});
