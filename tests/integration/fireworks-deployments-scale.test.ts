import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks deployments scale integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fireworks/deployments-scale");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should scale a deployment", async () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const result = await provider.patch.v1.accounts.deployments.scale({
      accountId: process.env.FIREWORKS_ACCOUNT_ID ?? "test-account",
      deploymentId: process.env.FIREWORKS_DEPLOYMENT_ID ?? "test-deployment-id",
      minWorkers: 2,
      maxWorkers: 10,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.minWorkers).toBeDefined();
    expect(result.maxWorkers).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.patch.v1.accounts.deployments.scale.validatePayload({
        accountId: "test-account",
        deploymentId: "test-deployment-id",
        minWorkers: 1,
        maxWorkers: 5,
      });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fireworks({
      apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
    });

    const validation =
      provider.patch.v1.accounts.deployments.scale.validatePayload({
        minWorkers: 1,
      });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("accountId is required");
    expect(validation.errors).toContain("deploymentId is required");
    expect(validation.errors).toContain("minWorkers is required");
    expect(validation.errors).toContain("maxWorkers is required");
  });
});
