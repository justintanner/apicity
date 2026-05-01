import { describe, it, expect } from "vitest";
import { cost } from "@apicity/cost";

describe("cost wiring", () => {
  it("exposes only an estimate() method", () => {
    const c = cost();
    expect(typeof c.estimate).toBe("function");
  });

  it("estimate() works without any opts (pure-table)", () => {
    const c = cost();
    const r = c.estimate({ provider: "free" });
    expect(r.usd).toBe(0);
  });
});
