import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models upload endpoint integration", () => {
  describe("payload validation", () => {
    it("should validate getUploadEndpoint payload with required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.v1.accounts.models.getUploadEndpoint.validatePayload({
          filenameToSize: { "model.safetensors": 4096000 },
        });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject getUploadEndpoint payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const invalid =
        provider.v1.accounts.models.getUploadEndpoint.validatePayload({});
      expect(invalid.valid).toBe(false);
      expect(invalid.errors).toContain("filenameToSize is required");
    });

    it("should validate getUploadEndpoint payload with optional fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.v1.accounts.models.getUploadEndpoint.validatePayload({
          filenameToSize: {
            "model.safetensors": 4096000,
            "config.json": 512,
          },
          enableResumableUpload: true,
          readMask: "*",
        });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should expose getUploadEndpoint payload schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema =
        provider.v1.accounts.models.getUploadEndpoint.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe(
        "/v1/accounts/{account_id}/models/{model_id}:getUploadEndpoint"
      );
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.filenameToSize.required).toBe(true);
    });
  });

  describe("namespace structure", () => {
    it("should expose upload and download endpoint methods on models", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.models.getUploadEndpoint).toBeTypeOf(
        "function"
      );
      expect(provider.v1.accounts.models.getDownloadEndpoint).toBeTypeOf(
        "function"
      );
      expect(provider.v1.accounts.models.validateUpload).toBeTypeOf("function");
    });
  });
});
