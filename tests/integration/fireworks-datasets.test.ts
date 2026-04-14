import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks datasets", () => {
  describe("payload validation", () => {
    it("should validate create dataset payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.datasets.create.schema.safeParse({
          datasetId: "my-dataset",
          dataset: { displayName: "Test Dataset" },
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should reject create dataset without required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const result =
        provider.inference.v1.accounts.datasets.create.schema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should validate create dataset with source filtering", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.datasets.create.schema.safeParse({
          datasetId: "filtered-dataset",
          dataset: { displayName: "Filtered" },
          sourceDatasetId: "accounts/test/datasets/original",
          filter: "category = 'math'",
        });
      expect(valid.success).toBe(true);
      // errors checked via success;
    });

    it("should expose create dataset schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.inference.v1.accounts.datasets.create.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate update dataset payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.datasets.update.schema.safeParse({
          displayName: "Updated Name",
          format: "CHAT",
        });
      expect(valid.success).toBe(true);
    });

    it("should expose update dataset schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.inference.v1.accounts.datasets.update.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should validate getUploadEndpoint payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.datasets.getUploadEndpoint.schema.safeParse(
          {
            filenameToSize: { "data.jsonl": 1024 },
          }
        );
      expect(valid.success).toBe(true);
    });

    it("should reject getUploadEndpoint without filenameToSize", () => {
      const provider = fireworks({ apiKey: "test" });
      const result =
        provider.inference.v1.accounts.datasets.getUploadEndpoint.schema.safeParse(
          {}
        );
      expect(result.success).toBe(false);
      expect(result.success).toBe(false);
    });

    it("should expose getUploadEndpoint schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.inference.v1.accounts.datasets.getUploadEndpoint.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should expose getDownloadEndpoint schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.inference.v1.accounts.datasets.getDownloadEndpoint.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });

    it("should expose validateUpload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.inference.v1.accounts.datasets.validateUpload.schema;
      expect(typeof schema.safeParse).toBe("function");
      expect(typeof schema.safeParse).toBe("function");
    });
  });

  describe("namespace structure", () => {
    it("should expose all CRUD and utility methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const ds = provider.inference.v1.accounts.datasets;
      expect(typeof ds.list).toBe("function");
      expect(typeof ds.create).toBe("function");
      expect(typeof ds.get).toBe("function");
      expect(typeof ds.update).toBe("function");
      expect(typeof ds.delete).toBe("function");
      expect(typeof ds.getUploadEndpoint).toBe("function");
      expect(typeof ds.getDownloadEndpoint).toBe("function");
      expect(typeof ds.validateUpload).toBe("function");
    });
  });
});
