import { describe, it, expect } from "vitest";
import {
  ENDPOINT_COSTS,
  getEndpointCost,
  getTier,
  isExpensiveOrWorse,
  isProhibitive,
  listByTier,
  listByProvider,
  countByTier,
} from "../../../packages/provider/cost/src/endpoint-costs";

describe("endpoint-costs", () => {
  it("has entries for all major providers", () => {
    const providers = new Set(
      Object.values(ENDPOINT_COSTS).map((e) => e.provider)
    );
    expect(providers).toContain("openai");
    expect(providers).toContain("anthropic");
    expect(providers).toContain("xai");
    expect(providers).toContain("fal");
    expect(providers).toContain("fireworks");
    expect(providers).toContain("kie");
    expect(providers).toContain("elevenlabs");
  });

  it("classifies chat completions as expensive", () => {
    const openai = getEndpointCost("openai.v1.chat.completions");
    expect(openai).toBeDefined();
    expect(openai?.tier).toBe("expensive");
    expect(openai?.pricingModel).toContain("token");
  });

  it("classifies image generation as expensive", () => {
    const openai = getEndpointCost("openai.v1.images.generations");
    expect(openai?.tier).toBe("expensive");
    const fal = getEndpointCost("fal.gptImage1p5");
    expect(fal?.tier).toBe("expensive");
  });

  it("classifies fine-tuning as prohibitive", () => {
    const openai = getEndpointCost("openai.v1.fineTuning.jobs#create");
    expect(openai?.tier).toBe("prohibitive");
    const fireworks = getEndpointCost(
      "fireworks.inference.v1.accounts.supervisedFineTuningJobs.create"
    );
    expect(fireworks?.tier).toBe("prohibitive");
  });

  it("classifies embeddings as cheap", () => {
    const openai = getEndpointCost("openai.v1.embeddings");
    expect(openai?.tier).toBe("cheap");
  });

  it("classifies free-media-upload as free", () => {
    const fmu = getEndpointCost("free-media-upload.catbox.upload");
    expect(fmu?.tier).toBe("free");
  });

  it("getTier returns undefined for unknown keys", () => {
    expect(getTier("unknown.provider.endpoint")).toBeUndefined();
  });

  it("isExpensiveOrWorse identifies expensive and prohibitive", () => {
    expect(isExpensiveOrWorse("openai.v1.chat.completions")).toBe(true);
    expect(isExpensiveOrWorse("openai.v1.fineTuning.jobs#create")).toBe(true);
    expect(isExpensiveOrWorse("openai.v1.embeddings")).toBe(false);
    expect(isExpensiveOrWorse("unknown")).toBe(false);
  });

  it("isProhibitive identifies only prohibitive", () => {
    expect(isProhibitive("openai.v1.fineTuning.jobs#create")).toBe(true);
    expect(isProhibitive("openai.v1.chat.completions")).toBe(false);
    expect(isProhibitive("unknown")).toBe(false);
  });

  it("listByTier returns correct tier entries", () => {
    const expensive = listByTier("expensive");
    expect(expensive.length).toBeGreaterThan(0);
    expect(expensive.every((e) => e.tier === "expensive")).toBe(true);
  });

  it("listByProvider filters by provider", () => {
    const openai = listByProvider("openai");
    expect(openai.length).toBeGreaterThan(0);
    expect(openai.every((e) => e.provider === "openai")).toBe(true);
  });

  it("countByTier returns non-zero counts", () => {
    const counts = countByTier();
    expect(counts.free).toBeGreaterThan(0);
    expect(counts.cheap).toBeGreaterThan(0);
    expect(counts.expensive).toBeGreaterThan(0);
    expect(counts.prohibitive).toBeGreaterThan(0);
    const total =
      counts.free + counts.cheap + counts.expensive + counts.prohibitive;
    expect(total).toBe(Object.keys(ENDPOINT_COSTS).length);
  });
});
