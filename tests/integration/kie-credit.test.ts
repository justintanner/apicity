import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

describe("kie credit integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/credit");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get user credit balance", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const result = await provider.get.api.v1.chat.credit();
    expect(result.code).toBe(200);
    expect(result.data).toBeDefined();
    expect(typeof result.data).toBe("number");
  });

  it("should return credit info with valid structure", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const result = await provider.get.api.v1.chat.credit();
    expect(result).toHaveProperty("code");
    expect(result).toHaveProperty("msg");
    expect(result).toHaveProperty("data");
  });
});
