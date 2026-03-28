import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { fireworks } from "@nakedapi/fireworks";

const ACCOUNT_ID = process.env.FIREWORKS_ACCOUNT_ID ?? "test-account";
const SHAPE_ID = "llama-v3p1-8b-instruct-a100-80gb-1x";

describe("fireworks deployment shapes integration", () => {
  describe("get deployment shape", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/deployment-shapes-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get a deployment shape by id", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.deploymentShapes.get(
        ACCOUNT_ID,
        SHAPE_ID
      );
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("baseModel");
      expect(result).toHaveProperty("acceleratorType");
      expect(result).toHaveProperty("acceleratorCount");
    });
  });

  describe("list deployment shape versions", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/deployment-shapes-versions-list");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should list deployment shape versions", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.deploymentShapes.versions.list(
        ACCOUNT_ID,
        SHAPE_ID,
        { pageSize: 5 }
      );
      expect(result).toHaveProperty("deploymentShapeVersions");
      expect(Array.isArray(result.deploymentShapeVersions)).toBe(true);
    });
  });

  describe("get deployment shape version", () => {
    let ctx: PollyContext;

    beforeEach(() => {
      ctx = setupPolly("fireworks/deployment-shapes-version-get");
    });

    afterEach(async () => {
      await teardownPolly(ctx);
    });

    it("should get a specific deployment shape version", async () => {
      const provider = fireworks({
        apiKey: process.env.FIREWORKS_API_KEY ?? "fw-test-key",
      });
      const result = await provider.v1.accounts.deploymentShapes.versions.get(
        ACCOUNT_ID,
        SHAPE_ID,
        "1"
      );
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("validated");
    });
  });

  describe("namespace structure", () => {
    it("should have deployment shapes namespace", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.v1.accounts.deploymentShapes).toBeDefined();
      expect(provider.v1.accounts.deploymentShapes.get).toBeTypeOf("function");
      expect(provider.v1.accounts.deploymentShapes.versions).toBeDefined();
      expect(provider.v1.accounts.deploymentShapes.versions.list).toBeTypeOf(
        "function"
      );
      expect(provider.v1.accounts.deploymentShapes.versions.get).toBeTypeOf(
        "function"
      );
    });
  });
});
