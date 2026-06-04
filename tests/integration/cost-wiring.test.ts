import { describe, it, expect } from "vitest";
import { createCost } from "@apicity/cost";

describe("cost wiring", () => {
  it("exposes only an estimate() method", () => {
    const c = createCost();
    expect(typeof c.estimate).toBe("function");
  });

  it("estimate() works without any opts (pure-table)", () => {
    const c = createCost();
    const r = c.estimate({ provider: "free-media-upload" });
    expect(r.usd).toBe(0);
  });
});
