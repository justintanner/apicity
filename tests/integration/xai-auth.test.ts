import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI auth integration", () => {
  describe("schema validation", () => {
    it("should have auth apikeys under post.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.auth.apiKeys).toBeDefined();
      expect(provider.post.v1.auth.apiKeys).toBeTypeOf("function");
    });

    it("should have auth namespace under get.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.auth).toBeDefined();
      expect(provider.get.v1.auth.apiKeys).toBeTypeOf("function");
    });
  });
});
