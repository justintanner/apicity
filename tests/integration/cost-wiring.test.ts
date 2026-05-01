import { describe, it, expect } from "vitest";
import { cost } from "@apicity/cost";

describe("cost wiring", () => {
  it("exposes only an estimate() method", () => {
    const c = cost({ openai: { apiKey: "sk-test" } });
    expect(typeof c.estimate).toBe("function");
  });

  it("estimate() works with no provider opts for table-only routes", async () => {
    const c = cost({});
    const r = await c.estimate({ provider: "free" });
    expect(r.usd).toBe(0);
  });

  it("estimate() throws when upstream-using provider is called without opts", async () => {
    const c = cost({});
    await expect(
      c.estimate({
        provider: "openai",
        payload: {
          model: "gpt-5",
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 10,
        },
      })
    ).rejects.toThrow(/openai opts required/);
  });
});
