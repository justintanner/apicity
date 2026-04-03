import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI collections documents patch integration", () => {
  describe("schema validation", () => {
    it("should have collections documents patch under patch.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.patch.v1.collections.documents).toBeDefined();
      expect(provider.patch.v1.collections.documents).toBeTypeOf("function");
    });
  });
});
