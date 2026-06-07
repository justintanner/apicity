import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI collections documents patch integration", () => {
  describe("schema validation", () => {
    it("should have collections documents patch under patch.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(
        provider.patch.managementApi.v1.collections.documents
      ).toBeDefined();
      expect(provider.patch.managementApi.v1.collections.documents).toBeTypeOf(
        "function"
      );
    });
  });
});
