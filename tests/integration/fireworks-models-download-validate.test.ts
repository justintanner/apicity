import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

describe("fireworks models download endpoint and validate upload", () => {
  let ctx: PollyContext;
  const accountId = "fireworks";
  const modelId = "llama-v3p3-70b-instruct";

  // TODO: re-record missing "fireworks/models-download-endpoint" and
  // "fireworks/models-validate-upload" HARs. Skipped because the recording
  // directories were never committed alongside the tests.
  describe.skip("get download endpoint", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-download-endpoint");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get download endpoint for a model", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.models.getDownloadEndpoint(
        accountId,
        modelId
      );

      expect(result).toBeDefined();
      expect(result.url).toBeTruthy();
    });

    it("should get download endpoint with read mask", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.models.getDownloadEndpoint(
        accountId,
        modelId,
        { readMask: "url,expiration" }
      );

      expect(result).toBeDefined();
      expect(result.url).toBeTruthy();
    });
  });

  describe.skip("validate upload", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-validate-upload");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should validate model upload", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.models.validateUpload(
        accountId,
        modelId
      );

      expect(result).toBeDefined();
    });

    it("should validate upload with specific fields", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const result = await provider.v1.accounts.models.validateUpload(
        accountId,
        modelId,
        { readMask: "status,errors" }
      );

      expect(result).toBeDefined();
    });
  });

  describe("payload validation", () => {
    it("should validate getDownloadEndpoint request", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.models.getDownloadEndpoint.validatePayload({
          readMask: "url,expiration",
        });
      expect(valid.valid).toBe(true);

      const empty =
        provider.v1.accounts.models.getDownloadEndpoint.validatePayload({});
      expect(empty.valid).toBe(true);
    });

    it("should validate validateUpload request", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.models.validateUpload.validatePayload({
        readMask: "status",
      });
      expect(valid.valid).toBe(true);

      const empty = provider.v1.accounts.models.validateUpload.validatePayload(
        {}
      );
      expect(empty.valid).toBe(true);
    });
  });

  describe("namespace structure", () => {
    it("should expose getDownloadEndpoint and validateUpload methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const models = provider.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint).toBe("function");
      expect(typeof models.validateUpload).toBe("function");
    });

    it("should expose payload schemas on methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const models = provider.v1.accounts.models;

      expect(models.getDownloadEndpoint.payloadSchema).toBeDefined();
      expect(models.validateUpload.payloadSchema).toBeDefined();
    });

    it("should expose validatePayload on methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const models = provider.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint.validatePayload).toBe(
        "function"
      );
      expect(typeof models.validateUpload.validatePayload).toBe("function");
    });

    it("should have correct HTTP methods in schemas", () => {
      const provider = fireworks({ apiKey: "test" });
      const models = provider.v1.accounts.models;

      expect(models.getDownloadEndpoint.payloadSchema.method).toBe("GET");
      expect(models.validateUpload.payloadSchema.method).toBe("GET");
    });
  });
});
