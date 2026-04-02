import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@nakedapi/kie";

describe("kie credit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/credit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get user credit balance", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const result = await provider.get.api.v1.chat.credit();
    expect(result.credits).toBeDefined();
    expect(typeof result.credits).toBe("number");
  });

  it("should return credit info with valid structure", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const result = await provider.get.api.v1.chat.credit();
    expect(result).toHaveProperty("credits");
    expect(result).toHaveProperty("currency");
    expect(result).toHaveProperty("plan");
  });
});
