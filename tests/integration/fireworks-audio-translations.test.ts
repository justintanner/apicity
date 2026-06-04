import { describe, it, expect } from "vitest";
import { createFireworks } from "@apicity/fireworks";

describe("fireworks audio translations integration", () => {
  describe("schema validation", () => {
    it("should have audio translations namespace", () => {
      const provider = createFireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.audio.translations).toBeDefined();
      expect(provider.inference.v1.audio.translations).toBeTypeOf("function");
    });
  });
});
