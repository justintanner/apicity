import { describe, it, expect } from "vitest";
import { validatePayload } from "../../../packages/provider/fal/src/validate";
import {
  pricingEstimateSchema,
  queueSubmitSchema,
  logsHistorySchema,
  filesUploadUrlSchema,
  workflowCreateSchema,
} from "../../../packages/provider/fal/src/schemas";

describe("fal validatePayload", () => {
  describe("basic validation", () => {
    it("should reject non-object payload", () => {
      const result = validatePayload(null, pricingEstimateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject array as payload", () => {
      const result = validatePayload([], pricingEstimateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject string as payload", () => {
      const result = validatePayload("invalid", pricingEstimateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });

    it("should reject number as payload", () => {
      const result = validatePayload(123, pricingEstimateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("payload must be a non-null object");
    });
  });

  describe("required field validation", () => {
    it("should reject missing required fields", () => {
      const result = validatePayload(
        {
          estimate_type: "unit_price",
          // Missing required 'endpoints' field
        },
        pricingEstimateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("endpoints is required");
    });

    it("should reject null for required field", () => {
      const result = validatePayload(
        {
          estimate_type: null,
          endpoints: {},
        },
        pricingEstimateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("estimate_type is required");
    });

    it("should accept undefined for optional fields", () => {
      const result = validatePayload(
        {
          estimate_type: "unit_price",
          endpoints: { "fal-ai/flux/dev": { unit_quantity: 100 } },
          // 'extra' is not a defined field, but schema ignores extra fields
        },
        pricingEstimateSchema
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("type checking", () => {
    it("should reject wrong string type", () => {
      const result = validatePayload(
        {
          endpoint_id: 123, // Should be string
          input: {},
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("endpoint_id must be of type string");
    });

    it("should reject wrong number type", () => {
      const result = validatePayload(
        {
          endpoint_id: "fal-ai/test",
          input: {},
          timeout: "not-a-number", // Should be number
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("timeout must be of type number");
    });

    it("should reject wrong boolean type", () => {
      const result = validatePayload(
        {
          endpoint_id: "fal-ai/test",
          input: {},
          no_retry: "yes", // Should be boolean
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("no_retry must be of type boolean");
    });

    it("should reject wrong object type", () => {
      const result = validatePayload(
        {
          endpoint_id: "fal-ai/test",
          input: "should-be-object", // Should be object
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input must be of type object");
    });

    it("should reject array when object expected", () => {
      const result = validatePayload(
        {
          endpoint_id: "fal-ai/test",
          input: [], // Array is not a plain object
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("input must be of type object");
    });
  });

  describe("enum validation", () => {
    it("should reject invalid enum value", () => {
      const result = validatePayload(
        {
          estimate_type: "invalid_type", // Not in enum
          endpoints: {},
        },
        pricingEstimateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "estimate_type must be one of: historical_api_price, unit_price"
      );
    });

    it("should accept valid enum values", () => {
      const result1 = validatePayload(
        {
          estimate_type: "historical_api_price",
          endpoints: {},
        },
        pricingEstimateSchema
      );
      expect(result1.valid).toBe(true);

      const result2 = validatePayload(
        {
          estimate_type: "unit_price",
          endpoints: {},
        },
        pricingEstimateSchema
      );
      expect(result2.valid).toBe(true);
    });
  });

  describe("array validation", () => {
    it("should validate array items with correct type", () => {
      const result = validatePayload(
        {
          limit: 10,
          app_id: ["app1", "app2"], // Array of strings
        },
        logsHistorySchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject array items with wrong type", () => {
      const result = validatePayload(
        {
          limit: 10,
          app_id: ["app1", 123, "app3"], // 123 is not a string
        },
        logsHistorySchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("app_id[1] must be of type string");
    });

    it("should reject non-array for array field", () => {
      const result = validatePayload(
        {
          limit: 10,
          app_id: "not-an-array", // Should be array
        },
        logsHistorySchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("app_id must be of type array");
    });
  });

  describe("complex schema validation", () => {
    it("should validate queue submit with all fields", () => {
      const result = validatePayload(
        {
          endpoint_id: "fal-ai/flux/schnell",
          input: { prompt: "test" },
          webhook: "https://example.com/webhook",
          priority: "normal",
          timeout: 60,
          no_retry: false,
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate queue submit with minimal fields", () => {
      const result = validatePayload(
        {
          endpoint_id: "fal-ai/flux/schnell",
          input: {},
        },
        queueSubmitSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should validate workflow create schema", () => {
      const result = validatePayload(
        {
          name: "my-workflow",
          title: "My Workflow",
          description: "Test workflow",
          tags: ["test", "demo"],
          is_public: false,
          contents: { nodes: [], edges: [] },
        },
        workflowCreateSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject workflow create without required contents", () => {
      const result = validatePayload(
        {
          name: "my-workflow",
          // Missing required 'contents' field
        },
        workflowCreateSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("contents is required");
    });

    it("should validate files upload URL", () => {
      const result = validatePayload(
        {
          file: "path/to/file.txt",
          url: "https://example.com/file.txt",
        },
        filesUploadUrlSchema
      );
      expect(result.valid).toBe(true);
    });

    it("should reject files upload URL without required file", () => {
      const result = validatePayload(
        {
          url: "https://example.com/file.txt",
          // Missing required 'file' field
        },
        filesUploadUrlSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("file is required");
    });
  });

  describe("multiple errors", () => {
    it("should collect multiple validation errors", () => {
      const result = validatePayload(
        {
          // Missing both required fields
        },
        filesUploadUrlSchema
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors).toContain("file is required");
      expect(result.errors).toContain("url is required");
    });
  });
});
