import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

describe("xai responses delete", () => {
  it("should expose delete method on delete.v1 namespace", () => {
    const provider = createXai({
      apiKey: "sk-test-key",
    });
    expect(typeof provider.delete.v1.responses).toBe("function");
  });
});
