import { describe, it, expect } from "vitest";

import { createSunoProvider } from "../../packages/provider/kie/src/suno";
import { sunoGenerateSchema } from "../../packages/provider/kie/src/schemas";
import { validatePayload } from "../../packages/provider/kie/src/validate";

describe("KIE Suno provider", () => {
  const mockFetch = () => Promise.resolve(new Response());
  const createProvider = () =>
    createSunoProvider("https://api.kie.ai", "test-api-key", mockFetch, 30000);

  describe("namespace structure", () => {
    it("should have correct namespace structure", () => {
      const provider = createProvider();

      expect(provider.post).toBeDefined();
      expect(provider.post.api).toBeDefined();
      expect(provider.post.api.v1).toBeDefined();
      expect(provider.post.api.v1.generate).toBeDefined();
    });

    it("should have callable generate method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.generate).toBe("function");
    });
  });

  describe("sunoGenerateSchema", () => {
    it("should have correct method and path", () => {
      expect(sunoGenerateSchema.method).toBe("POST");
      expect(sunoGenerateSchema.path).toBe("/api/v1/generate");
      expect(sunoGenerateSchema.contentType).toBe("application/json");
    });

    it("should define correct fields", () => {
      const fields = sunoGenerateSchema.fields;

      expect(fields.prompt).toBeDefined();
      expect(fields.prompt.type).toBe("string");
      expect(fields.prompt.required).toBe(true);

      expect(fields.model).toBeDefined();
      expect(fields.model.type).toBe("string");
      expect(fields.model.required).toBe(true);
      expect(fields.model.enum).toEqual([
        "V4",
        "V4_5",
        "V4_5PLUS",
        "V4_5ALL",
        "V5",
      ]);

      expect(fields.instrumental).toBeDefined();
      expect(fields.instrumental.type).toBe("boolean");
      expect(fields.instrumental.required).toBe(true);

      expect(fields.customMode).toBeDefined();
      expect(fields.customMode.type).toBe("boolean");
      expect(fields.customMode.required).toBe(true);

      expect(fields.style).toBeDefined();
      expect(fields.style.type).toBe("string");
      expect(fields.style.required).toBeUndefined();

      expect(fields.negativeTags).toBeDefined();
      expect(fields.negativeTags.type).toBe("string");

      expect(fields.title).toBeDefined();
      expect(fields.title.type).toBe("string");
    });
  });

  describe("generate payload validation", () => {
    it("should validate valid generate payload", () => {
      const payload = {
        prompt: "A happy pop song about summer",
        model: "V4",
        instrumental: false,
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate minimal required payload", () => {
      const payload = {
        prompt: "A rock song",
        model: "V5",
        instrumental: true,
        customMode: false,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(true);
    });

    it("should reject payload without required prompt", () => {
      const payload = {
        model: "V4",
        instrumental: false,
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("prompt is required");
    });

    it("should reject payload without required model", () => {
      const payload = {
        prompt: "A song",
        instrumental: false,
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("model is required");
    });

    it("should reject payload without required instrumental", () => {
      const payload = {
        prompt: "A song",
        model: "V4",
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("instrumental is required");
    });

    it("should reject payload without required customMode", () => {
      const payload = {
        prompt: "A song",
        model: "V4",
        instrumental: false,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("customMode is required");
    });

    it("should reject invalid model enum", () => {
      const payload = {
        prompt: "A song",
        model: "V6",
        instrumental: false,
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("model must be one of");
    });

    it("should validate with all valid model versions", () => {
      const validModels = ["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5"];

      for (const model of validModels) {
        const payload = {
          prompt: "A song",
          model,
          instrumental: false,
          customMode: true,
        };

        const result = validatePayload(payload, sunoGenerateSchema);
        expect(result.valid).toBe(true);
      }
    });

    it("should validate with optional fields", () => {
      const payload = {
        prompt: "A jazz song",
        model: "V4_5",
        instrumental: true,
        customMode: true,
        style: "Jazz Fusion",
        negativeTags: "rock, pop",
        title: "My Jazz Song",
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(true);
    });

    it("should validate with only required fields", () => {
      const payload = {
        prompt: "Simple song",
        model: "V5",
        instrumental: false,
        customMode: false,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(true);
    });

    it("should reject non-boolean instrumental", () => {
      const payload = {
        prompt: "A song",
        model: "V4",
        instrumental: "yes",
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("instrumental must be of type");
    });

    it("should reject non-boolean customMode", () => {
      const payload = {
        prompt: "A song",
        model: "V4",
        instrumental: false,
        customMode: "no",
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("customMode must be of type");
    });

    it("should reject non-string prompt", () => {
      const payload = {
        prompt: 123,
        model: "V4",
        instrumental: false,
        customMode: true,
      };

      const result = validatePayload(payload, sunoGenerateSchema);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("prompt must be of type");
    });
  });

  describe("provider method validation", () => {
    it("generate should have payloadSchema attached", () => {
      const provider = createProvider();
      expect(provider.post.api.v1.generate.payloadSchema).toBe(
        sunoGenerateSchema
      );
    });

    it("generate should have validatePayload method", () => {
      const provider = createProvider();
      expect(typeof provider.post.api.v1.generate.validatePayload).toBe(
        "function"
      );
    });

    it("generate validatePayload should validate correctly", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.generate.validatePayload({
        prompt: "Test song",
        model: "V4",
        instrumental: true,
        customMode: false,
      });
      expect(result.valid).toBe(true);
    });

    it("generate validatePayload should reject invalid payload", () => {
      const provider = createProvider();
      const result = provider.post.api.v1.generate.validatePayload({
        prompt: "Test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("SunoModel type validation", () => {
    it("should accept all valid SunoModel values", () => {
      const provider = createProvider();
      const validModels = ["V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5"];

      for (const model of validModels) {
        const result = provider.post.api.v1.generate.validatePayload({
          prompt: "Test",
          model,
          instrumental: false,
          customMode: true,
        });
        expect(result.valid).toBe(true);
      }
    });
  });
});
