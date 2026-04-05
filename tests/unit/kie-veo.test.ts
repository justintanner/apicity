import { describe, it, expect } from "vitest";

import { createVeoProvider } from "../../packages/provider/kie/src/veo";
import {
  veoGenerateSchema,
  veoExtendSchema,
} from "../../packages/provider/kie/src/schemas";
import { validatePayload } from "../../packages/provider/kie/src/validate";

describe("KIE Veo provider", () => {
  const mockFetch = () => Promise.resolve(new Response());
  const createProvider = () =>
    createVeoProvider("https://api.kie.ai", "test-api-key", mockFetch, 30000);

  describe("namespace structure", () => {
    it("should have correct namespace structure", () => {
      const provider = createProvider();

      expect(provider.post).toBeDefined();
      expect(provider.post.api).toBeDefined();
      expect(provider.post.api.v1).toBeDefined();
      expect(provider.post.api.v1.veo).toBeDefined();
      expect(provider.post.api.v1.veo.generate).toBeDefined();
      expect(provider.post.api.v1.veo.extend).toBeDefined();
    });

    it("should have callable generate method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.generate).toBe("function");
    });

    it("should have callable extend method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.extend).toBe("function");
    });
  });

  describe("veoGenerateSchema", () => {
    it("should have correct method and path", () => {
      expect(veoGenerateSchema.method).toBe("POST");
      expect(veoGenerateSchema.path).toBe("/api/v1/veo/generate");
      expect(veoGenerateSchema.contentType).toBe("application/json");
    });

    it("should define correct fields", () => {
      const fields = veoGenerateSchema.fields;

      expect(fields.prompt).toBeDefined();
      expect(fields.prompt.type).toBe("string");
      expect(fields.prompt.required).toBe(true);

      expect(fields.model).toBeDefined();
      expect(fields.model.type).toBe("string");
      expect(fields.model.enum).toEqual(["veo3", "veo3_fast"]);

      expect(fields.aspectRatio).toBeDefined();
      expect(fields.aspectRatio.enum).toEqual(["16:9", "9:16", "Auto"]);

      expect(fields.generationType).toBeDefined();
      expect(fields.generationType.enum).toEqual([
        "TEXT_2_VIDEO",
        "REFERENCE_2_VIDEO",
        "FIRST_AND_LAST_FRAMES_2_VIDEO",
      ]);

      expect(fields.imageUrls).toBeDefined();
      expect(fields.imageUrls.type).toBe("array");

      expect(fields.seeds).toBeDefined();
      expect(fields.seeds.type).toBe("number");

      expect(fields.watermark).toBeDefined();
      expect(fields.watermark.type).toBe("string");

      expect(fields.enableTranslation).toBeDefined();
      expect(fields.enableTranslation.type).toBe("boolean");
    });
  });

  describe("veoExtendSchema", () => {
    it("should have correct method and path", () => {
      expect(veoExtendSchema.method).toBe("POST");
      expect(veoExtendSchema.path).toBe("/api/v1/veo/extend");
      expect(veoExtendSchema.contentType).toBe("application/json");
    });

    it("should define correct fields", () => {
      const fields = veoExtendSchema.fields;

      expect(fields.taskId).toBeDefined();
      expect(fields.taskId.type).toBe("string");
      expect(fields.taskId.required).toBe(true);

      expect(fields.prompt).toBeDefined();
      expect(fields.prompt.type).toBe("string");
      expect(fields.prompt.required).toBe(true);

      expect(fields.model).toBeDefined();
      expect(fields.model.enum).toEqual(["fast", "quality"]);

      expect(fields.seeds).toBeDefined();
      expect(fields.seeds.type).toBe("number");

      expect(fields.watermark).toBeDefined();
      expect(fields.watermark.type).toBe("string");
    });
  });

  describe("generate payload validation", () => {
    it("should validate valid generate payload", () => {
      const payload = {
        prompt: "A cat playing piano",
        model: "veo3",
        aspectRatio: "16:9",
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate minimal generate payload", () => {
      const payload = {
        prompt: "A beautiful sunset",
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(true);
    });

    it("should reject payload without required prompt", () => {
      const payload = {
        model: "veo3",
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("should reject invalid model enum", () => {
      const payload = {
        prompt: "Test",
        model: "invalid_model",
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("model must be one of");
    });

    it("should reject invalid aspectRatio enum", () => {
      const payload = {
        prompt: "Test",
        aspectRatio: "4:3",
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("aspectRatio must be one of");
    });

    it("should reject invalid generationType enum", () => {
      const payload = {
        prompt: "Test",
        generationType: "INVALID_TYPE",
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("generationType must be one of");
    });

    it("should validate with all optional fields", () => {
      const payload = {
        prompt: "A dog running",
        model: "veo3_fast",
        aspectRatio: "9:16",
        generationType: "TEXT_2_VIDEO",
        imageUrls: ["https://example.com/image1.jpg"],
        seeds: 12345,
        watermark: "Sample",
        enableTranslation: true,
      };

      const result = validatePayload(payload, veoGenerateSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe("extend payload validation", () => {
    it("should validate valid extend payload", () => {
      const payload = {
        taskId: "task-123",
        prompt: "Extend the video",
      };

      const result = validatePayload(payload, veoExtendSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject payload without taskId", () => {
      const payload = {
        prompt: "Extend the video",
      };

      const result = validatePayload(payload, veoExtendSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("taskId is required");
    });

    it("should reject payload without prompt", () => {
      const payload = {
        taskId: "task-123",
      };

      const result = validatePayload(payload, veoExtendSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("should validate with model option", () => {
      const payload = {
        taskId: "task-123",
        prompt: "Extend",
        model: "quality",
      };

      const result = validatePayload(payload, veoExtendSchema);
      expect(result.valid).toBe(true);
    });

    it("should reject invalid model option", () => {
      const payload = {
        taskId: "task-123",
        prompt: "Extend",
        model: "invalid",
      };

      const result = validatePayload(payload, veoExtendSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("model must be one of");
    });
  });

  describe("provider method validation", () => {
    it("generate should have payloadSchema attached", () => {
      const provider = createProvider();
      expect(provider.post.api.v1.veo.generate.payloadSchema).toBe(
        veoGenerateSchema
      );
    });

    it("generate should have validatePayload method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.generate.validatePayload).toBe(
        "function"
      );
    });

    it("generate validatePayload should validate correctly", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.veo.generate.validatePayload({
        prompt: "Test",
      });
      expect(result.valid).toBe(true);
    });

    it("generate validatePayload should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.veo.generate.validatePayload({});
      expect(result.valid).toBe(false);
    });

    it("extend should have payloadSchema attached", () => {
      const provider = createProvider();
      expect(provider.post.api.v1.veo.extend.payloadSchema).toBe(
        veoExtendSchema
      );
    });

    it("extend should have validatePayload method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.veo.extend.validatePayload).toBe(
        "function"
      );
    });

    it("extend validatePayload should validate correctly", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.veo.extend.validatePayload({
        taskId: "task-123",
        prompt: "Extend",
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("VeoModel type", () => {
    it("should accept valid model values", () => {
      const provider = createProvider();
      const validModels = ["veo3", "veo3_fast"];

      for (const model of validModels) {
        const result = provider.post.api.v1.veo.generate.validatePayload({
          prompt: "Test",
          model,
        });
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("VeoGenerationType", () => {
    it("should accept valid generation types", () => {
      const provider = createProvider();
      const validTypes = [
        "TEXT_2_VIDEO",
        "REFERENCE_2_VIDEO",
        "FIRST_AND_LAST_FRAMES_2_VIDEO",
      ];

      for (const generationType of validTypes) {
        const result = provider.post.api.v1.veo.generate.validatePayload({
          prompt: "Test",
          generationType,
        });
        expect(result.valid).toBe(true);
      }
    });
  });
});
