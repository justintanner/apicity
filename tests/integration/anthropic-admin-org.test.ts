import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin organization", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-org");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should get current organization", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.me();
    expect(result.id).toBeTruthy();
    expect(result.type).toBe("organization");
    expect(result.name).toBeTruthy();
  });
});
