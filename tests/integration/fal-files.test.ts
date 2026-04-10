import { describe, it, expect } from "vitest";
import { fal } from "@nakedapi/fal";

describe("fal serverless files validation", () => {
  it("should expose serverless files namespace", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(provider.ai.v1.serverless).toBeDefined();
    expect(provider.ai.v1.serverless.files).toBeDefined();
    expect(typeof provider.ai.v1.serverless.files.list).toBe("function");
    expect(typeof provider.ai.v1.serverless.files.download).toBe("function");
    expect(typeof provider.ai.v1.serverless.files.uploadUrl).toBe("function");
    expect(typeof provider.ai.v1.serverless.files.uploadLocal).toBe("function");
  });

  it("should expose uploadUrl payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.ai.v1.serverless.files.uploadUrl.payloadSchema;
    expect(schema).toBeDefined();
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/serverless/files/file/url/{file}");
    expect(schema.contentType).toBe("application/json");
    expect(schema.fields.file).toBeDefined();
    expect(schema.fields.file.required).toBe(true);
    expect(schema.fields.url).toBeDefined();
    expect(schema.fields.url.required).toBe(true);
  });

  it("should validate uploadUrl params - valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.ai.v1.serverless.files.uploadUrl.validatePayload({
      file: "datasets/image.jpg",
      url: "https://example.com/image.jpg",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate uploadUrl params - missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.ai.v1.serverless.files.uploadUrl.validatePayload(
      {}
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file is required");
    expect(result.errors).toContain("url is required");
  });

  it("should validate uploadUrl params - wrong types", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.ai.v1.serverless.files.uploadUrl.validatePayload({
      file: 123,
      url: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("file must be of type string");
    expect(result.errors).toContain("url must be of type string");
  });

  it("should expose uploadLocal payloadSchema", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const schema = provider.ai.v1.serverless.files.uploadLocal.payloadSchema;
    expect(schema).toBeDefined();
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/serverless/files/file/local/{target_path}");
    expect(schema.contentType).toBe("multipart/form-data");
    expect(schema.fields.target_path).toBeDefined();
    expect(schema.fields.target_path.required).toBe(true);
    expect(schema.fields.file).toBeDefined();
    expect(schema.fields.file.required).toBe(true);
  });

  it("should validate uploadLocal params - valid", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.ai.v1.serverless.files.uploadLocal.validatePayload({
      target_path: "datasets/image.jpg",
      file: {},
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should validate uploadLocal params - missing required", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.ai.v1.serverless.files.uploadLocal.validatePayload(
      {}
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("target_path is required");
    expect(result.errors).toContain("file is required");
  });

  it("should validate uploadLocal params - optional unzip field", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    const result = provider.ai.v1.serverless.files.uploadLocal.validatePayload({
      target_path: "datasets/archive.zip",
      file: {},
      unzip: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
