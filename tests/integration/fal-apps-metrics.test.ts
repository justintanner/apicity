import { describe, it, expect } from "vitest";
import { fal } from "@apicity/fal";

describe("fal serverless apps queue", () => {
  it("should expose apps.queue as callable function", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.serverless.apps.queue).toBe("function");
  });
});

describe("fal serverless metrics", () => {
  it("should expose metrics as a function", () => {
    const provider = fal({ apiKey: "fal-test-key" });
    expect(typeof provider.v1.serverless.metrics).toBe("function");
  });
});
