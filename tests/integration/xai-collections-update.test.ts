import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI collections update integration", () => {
  describe("schema validation", () => {
    it("should have collections update under put.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.put.v1.collections).toBeDefined();
      expect(provider.put.v1.collections).toBeTypeOf("function");
    });
  });
});
