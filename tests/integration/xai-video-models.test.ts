import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI video generation models integration", () => {
  describe("schema validation", () => {
    it("should have video generation models namespace under get.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.get.v1.videoGenerationModels).toBeDefined();
      expect(provider.get.v1.videoGenerationModels).toBeTypeOf("function");
    });
  });
});
