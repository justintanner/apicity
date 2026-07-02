import { describe, it, expect } from "vitest";
import {
  PAID_ENDPOINTS,
  lookupPaidEndpoint,
  isPaidEndpoint,
} from "../../packages/provider/cost/src/paid-endpoints";

describe("paid-endpoint registry", () => {
  it("has the expected paid entries for KIE media generation", () => {
    const entries = [
      { method: "POST", dotPath: "api.v1.jobs.createTask" },
      { method: "POST", dotPath: "api.v1.veo.generate" },
      { method: "POST", dotPath: "api.v1.veo.extend" },
      { method: "GET", dotPath: "api.v1.veo.get1080pVideo" },
    ];
    for (const { method, dotPath } of entries) {
      const entry = PAID_ENDPOINTS.find(
        (e) =>
          e.key.provider === "kie" &&
          e.key.method === method &&
          e.key.dotPath === dotPath
      );
      expect(entry).toBeDefined();
      expect(entry!.info.reason).toMatch(/direct marginal compute cost/);
      expect(entry!.info.estimatorId).toBe("kie-per-unit");
      expect(entry!.info.costNotes).toMatch(/Billed per/);
    }
  });

  it("registry is small and reviewable", () => {
    expect(PAID_ENDPOINTS.length).toBeGreaterThanOrEqual(1);
    // Every entry must have a human-readable reason.
    for (const entry of PAID_ENDPOINTS) {
      expect(entry.info.reason).toBeTruthy();
      expect(typeof entry.info.reason).toBe("string");
    }
  });

  it("lookupPaidEndpoint returns info for exact match", () => {
    const info = lookupPaidEndpoint("kie", "POST", "api.v1.jobs.createTask");
    expect(info).toBeDefined();
    expect(info!.reason).toMatch(/direct marginal compute cost/);
    expect(info!.estimatorId).toBe("kie-per-unit");

    expect(
      lookupPaidEndpoint("kie", "POST", "api.v1.veo.generate")
    ).toBeDefined();
    expect(
      lookupPaidEndpoint("kie", "POST", "api.v1.veo.extend")
    ).toBeDefined();
    expect(
      lookupPaidEndpoint("kie", "GET", "api.v1.veo.get1080pVideo")
    ).toBeDefined();
    expect(
      lookupPaidEndpoint("xai", "POST", "v1.videos.generations.imageToVideo")
    ).toBeDefined();
    expect(
      lookupPaidEndpoint("kie", "POST", "api.v1.elevenlabs.textToSpeechTurbo25")
    ).toBeUndefined();
  });

  it("lookupPaidEndpoint returns undefined for unlisted endpoints", () => {
    expect(
      lookupPaidEndpoint("openai", "POST", "v1.chat.completions")
    ).toBeUndefined();
    expect(
      lookupPaidEndpoint("kie", "GET", "api.v1.jobs.recordInfo")
    ).toBeUndefined();
    expect(
      lookupPaidEndpoint("xai", "POST", "v1.chat.completions")
    ).toBeUndefined();
  });

  it("lookupPaidEndpoint returns undefined for nearby endpoint names", () => {
    // Same provider, different method
    expect(
      lookupPaidEndpoint("kie", "GET", "api.v1.jobs.createTask")
    ).toBeUndefined();
    // Same provider, different dotPath (sibling)
    expect(
      lookupPaidEndpoint("kie", "POST", "api.v1.jobs.recordInfo")
    ).toBeUndefined();
    // Same provider, dotPath prefix (must NOT match)
    expect(lookupPaidEndpoint("kie", "POST", "api.v1.jobs")).toBeUndefined();
    // Same provider, dotPath suffix
    expect(
      lookupPaidEndpoint("kie", "POST", "v1.jobs.createTask")
    ).toBeUndefined();
    // Different provider, same method and dotPath
    expect(
      lookupPaidEndpoint("xai", "POST", "api.v1.jobs.createTask")
    ).toBeUndefined();
  });

  it("isPaidEndpoint returns true for exact match", () => {
    expect(isPaidEndpoint("kie", "POST", "api.v1.jobs.createTask")).toBe(true);
    expect(
      isPaidEndpoint("kie", "POST", "api.v1.elevenlabs.textToDialogueV3")
    ).toBe(false);
    expect(isPaidEndpoint("kie", "POST", "api.v1.veo.generate")).toBe(true);
    expect(isPaidEndpoint("kie", "POST", "api.v1.veo.extend")).toBe(true);
    expect(isPaidEndpoint("kie", "GET", "api.v1.veo.get1080pVideo")).toBe(true);
    expect(
      isPaidEndpoint("xai", "POST", "v1.videos.generations.imageToVideo")
    ).toBe(true);
  });

  it("isPaidEndpoint returns false for unlisted endpoints", () => {
    expect(isPaidEndpoint("openai", "POST", "v1.chat.completions")).toBe(false);
    expect(isPaidEndpoint("kie", "GET", "api.v1.jobs.recordInfo")).toBe(false);
    expect(isPaidEndpoint("kie", "POST", "api.v1.jobs")).toBe(false);
  });
});
