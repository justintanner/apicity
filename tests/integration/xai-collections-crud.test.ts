import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI collections CRUD integration", () => {
  describe("schema validation", () => {
    it("should have collections namespace under post.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.post.managementApi.v1.collections).toBeDefined();
      expect(provider.post.managementApi.v1.collections).toBeTypeOf("function");
    });

    it("should have collections namespace under get.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.get.managementApi.v1.collections).toBeDefined();
      expect(provider.get.managementApi.v1.collections).toBeTypeOf("function");
    });

    it("should have collections under put.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.put.managementApi.v1.collections).toBeDefined();
      expect(provider.put.managementApi.v1.collections).toBeTypeOf("function");
    });

    it("should have collections under delete.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.delete.managementApi.v1.collections).toBeDefined();
      expect(provider.delete.managementApi.v1.collections).toBeTypeOf(
        "function"
      );
    });
  });
});
