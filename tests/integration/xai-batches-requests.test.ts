import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI batches requests integration", () => {
  describe("schema validation", () => {
    it("should have batches requests under post.v1.batches", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.batches.requests).toBeDefined();
      expect(provider.post.v1.batches.requests).toBeTypeOf("function");
    });

    it("should have batches requests list under get.v1.batches", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.batches.requests).toBeDefined();
      expect(provider.get.v1.batches.requests).toBeTypeOf("function");
    });
  });
});
