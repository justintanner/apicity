import { afterEach, describe, expect, it } from "vitest";
import { createNunchux, NunchuxError } from "@apicity/nunchux";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("nunchux v1.credits integration", () => {
  let ctx: PollyContext;
  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("reads the balance and plan caps", async () => {
    ctx = setupPolly("nunchux/credits");
    const client = createNunchux({
      apiKey: process.env.NUNCHUX_API_KEY ?? "nunchux-test-key",
    });
    const response = await client.v1.credits();
    expect(typeof response.credits_remaining).toBe("number");
    expect(typeof response.plan_level).toBe("string");
    expect(typeof response.rpm_limit).toBe("number");
    expect(typeof response.concurrent_limit).toBe("number");
  });

  it("reports an invalid key with the provider error code", async () => {
    ctx = setupPolly("nunchux/invalid-key");
    const client = createNunchux({
      apiKey:
        "sk-nunchux-invalid0000000000000000000000000000000000000000000000000",
    });
    const error = await client.v1.credits().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NunchuxError);
    expect(error).toMatchObject({ status: 401, code: "invalid_api_key" });
  });
});
