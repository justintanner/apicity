import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances post integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-instances-post");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // TODO: re-record missing "fal/compute-instances-post" HAR. Skipped because
  // the recording directory was never committed alongside the test.
  it.skip("should create a compute instance via post accessor", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.post.v1.compute.instances.create({
      instance_type: "gpu_1x_h100_sxm5",
      ssh_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.instance_type).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it("should validate create payload schema for required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.post.v1.compute.instances.create.validatePayload({
        instance_type: "gpu_1x_h100_sxm5",
        ssh_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...",
      });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should reject payload missing required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.post.v1.compute.instances.create.validatePayload({
        region: "us-west",
      });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain("instance_type is required");
    expect(validation.errors).toContain("ssh_key is required");
  });
});
