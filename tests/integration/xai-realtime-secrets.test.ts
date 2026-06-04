import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xAI realtime secrets integration", () => {
  describe("schema validation", () => {
    it("should have realtime client secrets under post.v1.realtime", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.post.v1.realtime.clientSecrets).toBeDefined();
      expect(provider.post.v1.realtime.clientSecrets).toBeTypeOf("function");
    });
  });
});
