import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI collections update integration", () => {
  describe("schema validation", () => {
    it("should have collections update under put.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.put.managementApi.v1.collections).toBeDefined();
      expect(provider.put.managementApi.v1.collections).toBeTypeOf("function");
    });
  });
});
