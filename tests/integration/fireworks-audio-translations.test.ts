import { describe, it, expect } from "vitest";
import { fireworks } from "@apicity/fireworks";

describe("fireworks audio translations integration", () => {
  describe("schema validation", () => {
    it("should have audio translations namespace", () => {
      const provider = fireworks({ apiKey: "test-key" });
      expect(provider.inference.v1.audio.translations).toBeDefined();
      expect(provider.inference.v1.audio.translations).toBeTypeOf("function");
    });
  });
});
