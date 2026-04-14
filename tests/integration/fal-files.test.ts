import { describe, it, expect } from "vitest";
import { fal } from "@apicity/fal";

describe("fal serverless files validation", () => {
  it("should expose serverless files namespace", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.v1.serverless).toBeDefined();
    expect(provider.v1.serverless.files).toBeDefined();
    expect(typeof provider.v1.serverless.files.list).toBe("function");
    expect(typeof provider.v1.serverless.files.uploadUrl).toBe("function");
    expect(typeof provider.v1.serverless.files.uploadLocal).toBe("function");
  });

  it("should expose uploadUrl schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.v1.serverless.files.uploadUrl.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should validate uploadUrl params - valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.files.uploadUrl.schema.safeParse({
      file: "datasets/image.jpg",
      url: "https://example.com/image.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("should validate uploadUrl params - missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.files.uploadUrl.schema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
    expect(result.error?.issues.some((i) => i.path.includes("url"))).toBe(true);
  });

  it("should validate uploadUrl params - wrong types", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.files.uploadUrl.schema.safeParse({
      file: 123,
      url: true,
    });
    expect(result.success).toBe(false);
  });

  it("should expose uploadLocal schema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.v1.serverless.files.uploadLocal.schema;
    expect(schema).toBeDefined();
    expect(typeof schema.safeParse).toBe("function");
  });

  it("should validate uploadLocal params - valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.files.uploadLocal.schema.safeParse({
      target_path: "datasets/image.jpg",
      file: new Blob(["test"]),
    });
    expect(result.success).toBe(true);
  });

  it("should validate uploadLocal params - missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.files.uploadLocal.schema.safeParse(
      {}
    );
    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((i) => i.path.includes("target_path"))
    ).toBe(true);
    expect(result.error?.issues.some((i) => i.path.includes("file"))).toBe(
      true
    );
  });

  it("should validate uploadLocal params - optional unzip field", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.v1.serverless.files.uploadLocal.schema.safeParse({
      target_path: "datasets/archive.zip",
      file: new Blob(["test"]),
      unzip: true,
    });
    expect(result.success).toBe(true);
  });
});
