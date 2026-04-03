import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI batches CRUD integration", () => {
  describe("schema validation", () => {
    it("should have batches namespace under post.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.batches).toBeDefined();
      expect(provider.post.v1.batches).toBeTypeOf("function");
    });

    it("should have batches namespace under get.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.batches).toBeDefined();
      expect(provider.get.v1.batches).toBeTypeOf("function");
    });

    it("should have batches cancel under post.v1.batches", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.batches.cancel).toBeDefined();
      expect(provider.post.v1.batches.cancel).toBeTypeOf("function");
    });
  });
});
