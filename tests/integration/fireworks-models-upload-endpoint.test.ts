import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks models upload endpoint integration", () => {
  describe("payload validation", () => {
    it("should validate getUploadEndpoint payload with required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.models.getUploadEndpoint.schema.safeParse(
          {
            filenameToSize: { "model.safetensors": 4096000 },
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject getUploadEndpoint payload missing required fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const invalid =
        provider.inference.v1.accounts.models.getUploadEndpoint.schema.safeParse(
          {}
        );
      expect(invalid.success).toBe(false);
      expect(invalid.success).toBe(false);
    });

    it("should validate getUploadEndpoint payload with optional fields", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const valid =
        provider.inference.v1.accounts.models.getUploadEndpoint.schema.safeParse(
          {
            filenameToSize: {
              "model.safetensors": 4096000,
              "config.json": 512,
            },
            enableResumableUpload: true,
            readMask: "*",
          }
        );
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose getUploadEndpoint payload schema", () => {
      const provider = fireworks({ apiKey: "test-key" });
      const schema =
        provider.inference.v1.accounts.models.getUploadEndpoint.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose upload and download endpoint methods on models", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(
        provider.inference.v1.accounts.models.getUploadEndpoint
      ).toBeTypeOf("function");
      expect(
        provider.inference.v1.accounts.models.getDownloadEndpoint
      ).toBeTypeOf("function");
      expect(provider.inference.v1.accounts.models.validateUpload).toBeTypeOf(
        "function"
      );
    });
  });
});
