import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fal } from "@nakedapi/fal";

describe("fal compute instances create integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/compute-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a compute instance", async () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const result = await provider.post.v1.compute.instances.create({
      instance_type: "gpu_8x_h100_sxm5",
      ssh_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...",
      region: "us-west",
      environment: {
        CUDA_VISIBLE_DEVICES: "0,1,2,3,4,5,6,7",
      },
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it("should validate payload schema for required fields", () => {
    const provider = fal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
    });

    const validation =
      provider.post.v1.compute.instances.create.validatePayload({
        instance_type: "gpu_8x_h100_sxm5",
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
