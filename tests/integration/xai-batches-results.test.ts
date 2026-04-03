import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI batches results integration", () => {
  describe("schema validation", () => {
    it("should have batches results under get.v1.batches", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.batches.results).toBeDefined();
      expect(provider.get.v1.batches.results).toBeTypeOf("function");
    });
  });
});
