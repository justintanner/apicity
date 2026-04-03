import { describe, it, expect } from "vitest";
import { xai } from "@nakedapi/xai";

describe("xAI realtime integration", () => {
  describe("schema validation", () => {
    it("should have realtime client secrets under post.v1", () => {
      const provider = xai({ apiKey: "test-key" });
      expect(provider.post.v1.realtime.clientSecrets).toBeDefined();
      expect(provider.post.v1.realtime.clientSecrets).toBeTypeOf("function");
    });
  });
});
