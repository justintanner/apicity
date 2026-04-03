import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI video get integration", () => {
  describe("schema validation", () => {
    it("should have videos under get.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.get.v1.videos).toBeDefined();
      expect(provider.get.v1.videos).toBeTypeOf("function");
    });
  });
});
