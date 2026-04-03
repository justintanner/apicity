import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI image edits integration", () => {
  describe("schema validation", () => {
    it("should have images edits under post.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.images.edits).toBeDefined();
      expect(provider.post.v1.images.edits).toBeTypeOf("function");
    });
  });
});
