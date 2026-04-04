import { describe, it, expect } from "vitest";
import { fal } from "@nakedapi/fal";

describe("fal compute instances", () => {
  it("should expose compute instances namespace methods", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.compute.instances).toBe("function");
    expect(typeof provider.v1.compute.instances.get).toBe("function");
    expect(typeof provider.v1.compute.instances.create).toBe("function");
    expect(typeof provider.v1.compute.instances.terminate).toBe("function");
  });

  it("should expose create payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.v1.compute.instances.create.payloadSchema;
    expect(schema).toBeDefined();
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/compute/instances");
    expect(schema.contentType).toBe("application/json");
    expect(schema.fields.instance_type).toBeDefined();
    expect(schema.fields.instance_type.required).toBe(true);
    expect(schema.fields.ssh_key).toBeDefined();
    expect(schema.fields.ssh_key.required).toBe(true);
    expect(schema.fields.sector).toBeDefined();
    expect(schema.fields.sector.required).toBeUndefined();
  });

  it("should validate create params — valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.compute.instances.create.validatePayload({
      instance_type: "gpu_1x_h100_sxm5",
      ssh_key: "ssh-rsa AAAAB3...",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate create params — valid with sector", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.compute.instances.create.validatePayload({
      instance_type: "gpu_8x_h100_sxm5",
      ssh_key: "ssh-rsa AAAAB3...",
      sector: "sector_1",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate create params — missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.compute.instances.create.validatePayload({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("instance_type is required");
    expect(result.errors).toContain("ssh_key is required");
  });

  it("should validate create params — wrong types", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.compute.instances.create.validatePayload({
      instance_type: 123,
      ssh_key: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("instance_type must be of type string");
    expect(result.errors).toContain("ssh_key must be of type string");
  });

  it("should validate create params — invalid instance_type enum", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.compute.instances.create.validatePayload({
      instance_type: "gpu_4x_a100",
      ssh_key: "ssh-rsa AAAAB3...",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must be one of");
  });

  it("should validate create params — invalid sector enum", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.compute.instances.create.validatePayload({
      instance_type: "gpu_8x_h100_sxm5",
      ssh_key: "ssh-rsa AAAAB3...",
      sector: "sector_99",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("must be one of");
  });

  it("should expose terminate method", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.compute.instances.terminate).toBe("function");
    expect(typeof provider.delete.v1.compute.instances.terminate).toBe(
      "function"
    );
  });
});
