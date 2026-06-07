import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI collections documents integration", () => {
  describe("schema validation", () => {
    it("should have collections documents under post.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(
        provider.post.managementApi.v1.collections.documents
      ).toBeDefined();
      expect(provider.post.managementApi.v1.collections.documents).toBeTypeOf(
        "function"
      );
    });
  });
});
