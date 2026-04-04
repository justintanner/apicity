import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return credit balance", async () => {
    ctx = setupPolly("kie/credits");
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "sk-test-key",
    });
    const credits = await provider.get.api.v1.chat.credit();
    expect(credits.data).toBeGreaterThanOrEqual(0);
  });
});
