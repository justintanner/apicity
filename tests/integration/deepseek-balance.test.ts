import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { deepseek } from "@nakedapi/deepseek";

describe("deepseek user balance", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("deepseek/user-balance");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should retrieve user balance", async () => {
    const provider = deepseek({
      apiKey: process.env.DEEPSEEK_API_KEY ?? "sk-test-key",
    });
    const result = await provider.user.balance();
    expect(typeof result.is_available).toBe("boolean");
    expect(result.balance_infos).toBeDefined();
    expect(result.balance_infos.length).toBeGreaterThan(0);
    expect(result.balance_infos[0].currency).toBeTruthy();
    expect(result.balance_infos[0].total_balance).toBeTruthy();
  });
});
