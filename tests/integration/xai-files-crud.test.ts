import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI files CRUD integration", () => {
  describe("schema validation", () => {
    it("should have files namespace under get.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.files).toBeDefined();
      expect(provider.get.v1.files).toBeTypeOf("function");
    });

    it("should have files delete under delete.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.delete.v1.files).toBeDefined();
      expect(provider.delete.v1.files).toBeTypeOf("function");
    });
  });
});
