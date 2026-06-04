import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI documents search integration", () => {
  describe("schema validation", () => {
    it("should have documents search under post.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.post.v1.documents.search).toBeDefined();
      expect(provider.post.v1.documents.search).toBeTypeOf("function");
    });
  });
});
