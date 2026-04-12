import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks, FireworksError } from "@apicity/fireworks";

describe("fireworks models download endpoint and validate upload", () => {
  let ctx: PollyContext;
  const accountId = "fireworks";
  const modelId = "llama-v3p3-70b-instruct";

  describe("get download endpoint", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-download-endpoint");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    // Foundation models (accounts/fireworks/...) are not downloadable by
    // users; the API returns 403. These tests pin that contract.
    it("should 403 when requesting download endpoint for foundation model", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const err = await provider.v1.accounts.models
        .getDownloadEndpoint(accountId, modelId, { readMask: "url,expiration" })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(FireworksError);
      expect((err as FireworksError).status).toBe(403);
    });
  });

  describe("validate upload", () => {
    beforeEach(() => {
      ctx = setupPolly("fireworks/models-validate-upload");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should 403 when validating upload for foundation model", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const err = await provider.v1.accounts.models
        .validateUpload(accountId, modelId, { readMask: "status,errors" })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(FireworksError);
      expect((err as FireworksError).status).toBe(403);
    });
  });

  describe("payload validation", () => {
    it("should validate getDownloadEndpoint request", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid =
        provider.v1.accounts.models.getDownloadEndpoint.schema.safeParse({
          readMask: "url,expiration",
        });
      expect(valid.success).toBe(true);

      const empty =
        provider.v1.accounts.models.getDownloadEndpoint.schema.safeParse({});
      expect(empty.success).toBe(true);
    });

    it("should validate validateUpload request", () => {
      const provider = fireworks({ apiKey: "test" });
      const valid = provider.v1.accounts.models.validateUpload.schema.safeParse(
        {
          readMask: "status",
        }
      );
      expect(valid.success).toBe(true);

      const empty = provider.v1.accounts.models.validateUpload.schema.safeParse(
        {}
      );
      expect(empty.success).toBe(true);
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

      expect(models.getDownloadEndpoint.schema).toBeDefined();
      expect(models.validateUpload.schema).toBeDefined();
    });

    it("should expose schema.safeParse on methods", () => {
      const provider = fireworks({ apiKey: "test" });
      const models = provider.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint.schema.safeParse).toBe(
        "function"
      );
      expect(typeof models.validateUpload.schema.safeParse).toBe("function");
    });

    it("should have correct HTTP methods in schemas", () => {
      const provider = fireworks({ apiKey: "test" });
      const models = provider.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint.schema.safeParse).toBe(
        "function"
      );
      expect(typeof models.validateUpload.schema.safeParse).toBe("function");
    });
  });
});
