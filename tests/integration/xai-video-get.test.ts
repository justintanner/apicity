import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI video get integration", () => {
  describe("schema validation", () => {
    it("should have videos under get.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.get.v1.videos).toBeDefined();
      expect(provider.get.v1.videos).toBeTypeOf("function");
    });
  });
});
