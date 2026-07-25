import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFireworks, FireworksError } from "@apicity/fireworks";
import {
  FireworksEmptySchema,
  FireworksValidateUploadRequestSchema,
} from "@apicity/fireworks/zod";

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
      const provider = createFireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      const err = await provider.inference.v1.accounts.models
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
      const provider = createFireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });

      // `readMask` is an optional request field sent as a query param at
      // runtime and declared on the request type.
      const err = await provider.inference.v1.accounts.models
        .validateUpload(accountId, modelId, {
          readMask: "status,errors",
        })
        .catch((e: unknown) => e);

      expect(err).toBeInstanceOf(FireworksError);
      expect((err as FireworksError).status).toBe(403);
    });
  });

  describe("payload validation", () => {
    it("should validate getDownloadEndpoint request", () => {
      const provider = createFireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.models.getDownloadEndpoint.schema.safeParse(
          {
            readMask: "url,expiration",
          }
        );
      expect(valid.success).toBe(true);

      const empty =
        provider.inference.v1.accounts.models.getDownloadEndpoint.schema.safeParse(
          {}
        );
      expect(empty.success).toBe(true);
    });

    it("should validate validateUpload request", () => {
      const provider = createFireworks({ apiKey: "test" });
      const valid =
        provider.inference.v1.accounts.models.validateUpload.schema.safeParse({
          readMask: "status",
        });
      expect(valid.success).toBe(true);

      const empty =
        provider.inference.v1.accounts.models.validateUpload.schema.safeParse(
          {}
        );
      expect(empty.success).toBe(true);
    });
  });

  describe("namespace structure", () => {
    it("should expose getDownloadEndpoint and validateUpload methods", () => {
      const provider = createFireworks({ apiKey: "test" });
      const models = provider.inference.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint).toBe("function");
      expect(typeof models.validateUpload).toBe("function");
    });

    it("should expose payload schemas on methods", () => {
      const provider = createFireworks({ apiKey: "test" });
      const models = provider.inference.v1.accounts.models;

      // Bind the identity, not just presence: the MCP server derives each
      // endpoint's tool input JSON Schema from `.schema`, so attaching a
      // sibling's schema here would ship a wrong tool contract silently.
      // getDownloadEndpoint takes no payload, so it intentionally shares the
      // provider-wide FireworksEmptySchema with the other body-less GETs.
      expect(models.getDownloadEndpoint.schema).toBe(FireworksEmptySchema);
      expect(models.validateUpload.schema).toBe(
        FireworksValidateUploadRequestSchema
      );
    });

    it("should expose schema.safeParse on methods", () => {
      const provider = createFireworks({ apiKey: "test" });
      const models = provider.inference.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint.schema.safeParse).toBe(
        "function"
      );
      expect(typeof models.validateUpload.schema.safeParse).toBe("function");
    });

    it("should have correct HTTP methods in schemas", () => {
      const provider = createFireworks({ apiKey: "test" });
      const models = provider.inference.v1.accounts.models;

      expect(typeof models.getDownloadEndpoint.schema.safeParse).toBe(
        "function"
      );
      expect(typeof models.validateUpload.schema.safeParse).toBe("function");
    });
  });
});
