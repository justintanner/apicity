import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI collections CRUD integration", () => {
  describe("schema validation", () => {
    it("should have collections namespace under post.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.collections).toBeDefined();
      expect(provider.post.v1.collections).toBeTypeOf("function");
    });

    it("should have collections namespace under get.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.collections).toBeDefined();
      expect(provider.get.v1.collections).toBeTypeOf("function");
    });

    it("should have collections under put.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.put.v1.collections).toBeDefined();
      expect(provider.put.v1.collections).toBeTypeOf("function");
    });

    it("should have collections under delete.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.delete.v1.collections).toBeDefined();
      expect(provider.delete.v1.collections).toBeTypeOf("function");
    });
  });
});
