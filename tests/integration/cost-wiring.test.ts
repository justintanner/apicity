import { describe, it, expect } from "vitest";
import { cost } from "@apicity/cost";

describe("cost wiring", () => {
  it("returns only the sub-namespaces whose options were passed", () => {
    const partial = cost({
      openai: { apiKey: "sk-test" },
      fal: { apiKey: "fal-test" },
    });
    expect(partial.openai).toBeDefined();
    expect(partial.fal).toBeDefined();
    expect(partial.anthropic).toBeUndefined();
    expect(partial.xai).toBeUndefined();
    expect(partial.kimicoding).toBeUndefined();
  });

  it("exposes estimate() on every supported provider when fully configured", () => {
    const all = cost({
      openai: { apiKey: "sk-test" },
      anthropic: { apiKey: "sk-ant-test" },
      xai: { apiKey: "xai-test" },
      kimicoding: { apiKey: "sk-kimi-test" },
      fal: { apiKey: "fal-test" },
    });
    expect(typeof all.openai?.estimate).toBe("function");
    expect(typeof all.anthropic?.estimate).toBe("function");
    expect(typeof all.xai?.estimate).toBe("function");
    expect(typeof all.kimicoding?.estimate).toBe("function");
    expect(typeof all.fal?.estimate).toBe("function");
    expect(typeof all.fal?.pricing).toBe("function");
  });

  it("returns an empty provider when no options are passed", () => {
    const none = cost({});
    expect(none.openai).toBeUndefined();
    expect(none.anthropic).toBeUndefined();
    expect(none.xai).toBeUndefined();
    expect(none.kimicoding).toBeUndefined();
    expect(none.fal).toBeUndefined();
  });
});
