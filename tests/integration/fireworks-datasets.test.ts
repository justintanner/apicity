import { describe, it, expect } from "vitest";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks datasets", () => {
  describe("payload validation", () => {
    it("should validate create dataset payload with required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.datasets.create.validatePayload({
        datasetId: "my-dataset",
        dataset: { displayName: "Test Dataset" },
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should reject create dataset without required fields", () => {
      const provider = fireworks({ apiKey: "test" });
      const result = provider.v1.accounts.datasets.create.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("dataset is required");
      expect(result.errors).toContain("datasetId is required");
    });

    it("should validate create dataset with source filtering", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.datasets.create.validatePayload({
        datasetId: "filtered-dataset",
        dataset: { displayName: "Filtered" },
        sourceDatasetId: "accounts/test/datasets/original",
        filter: "category = 'math'",
      });
      expect(valid.valid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });

    it("should expose create dataset schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.datasets.create.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/v1/accounts/{account_id}/datasets");
      expect(schema.contentType).toBe("application/json");
      expect(schema.fields.dataset.required).toBe(true);
      expect(schema.fields.datasetId.required).toBe(true);
    });

    it("should validate update dataset payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.datasets.update.validatePayload({
        displayName: "Updated Name",
        format: "CHAT",
      });
      expect(valid.valid).toBe(true);
    });

    it("should expose update dataset schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.datasets.update.payloadSchema;
      expect(schema.method).toBe("PATCH");
      expect(schema.path).toBe(
        "/v1/accounts/{account_id}/datasets/{dataset_id}"
      );
    });

    it("should validate getUploadEndpoint payload", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.datasets.getUploadEndpoint.validatePayload({
          filenameToSize: { "data.jsonl": 1024 },
        });
      expect(valid.valid).toBe(true);
    });

    it("should reject getUploadEndpoint without filenameToSize", () => {
      const provider = fireworks({ apiKey: "test" });
      const result =
        provider.v1.accounts.datasets.getUploadEndpoint.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("filenameToSize is required");
    });

    it("should expose getUploadEndpoint schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.v1.accounts.datasets.getUploadEndpoint.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toContain(":getUploadEndpoint");
    });

    it("should expose getDownloadEndpoint schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema =
        provider.v1.accounts.datasets.getDownloadEndpoint.payloadSchema;
      expect(schema.method).toBe("GET");
      expect(schema.path).toContain(":getDownloadEndpoint");
    });

    it("should expose validateUpload schema", () => {
      const provider = fireworks({ apiKey: "test" });
      const schema = provider.v1.accounts.datasets.validateUpload.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toContain(":validateUpload");
    });
  });

  describe("namespace structure", () => {
    it("should expose all CRUD and utility methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const ds = provider.v1.accounts.datasets;
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
