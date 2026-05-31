import { describe, it, expect } from "vitest";
import {
  gateCheck,
  gateCheckBatch,
  getTier,
  lookupTier,
  TIERED_ENDPOINTS,
  DEFAULT_POLICY,
  STRICT_POLICY,
  PERMISSIVE_POLICY,
  createTokenBucket,
  GateError,
  resolveAction,
} from "@apicity/cost";

describe("cost gate system", () => {
  describe("tier lookup", () => {
    it("returns exact tier for known endpoints", () => {
      expect(lookupTier("openai", "v1.chat.completions", "POST")).toBe(
        "expensive"
      );
      expect(lookupTier("openai", "v1.models", "GET")).toBe("free");
      expect(lookupTier("openai", "v1.embeddings", "POST")).toBe("cheap");
    });

    it("defaults GET to free and POST to cheap for unknown endpoints", () => {
      expect(lookupTier("unknown", "v1.foo", "GET")).toBe("free");
      expect(lookupTier("unknown", "v1.foo", "POST")).toBe("cheap");
    });

    it("returns correct tier for all providers in TIERED_ENDPOINTS", () => {
      const expensive = TIERED_ENDPOINTS.filter((e) => e.tier === "expensive");
      const prohibitive = TIERED_ENDPOINTS.filter(
        (e) => e.tier === "prohibitive"
      );
      const free = TIERED_ENDPOINTS.filter((e) => e.tier === "free");
      const cheap = TIERED_ENDPOINTS.filter((e) => e.tier === "cheap");

      expect(expensive.length).toBeGreaterThan(0);
      expect(prohibitive.length).toBeGreaterThan(0);
      expect(free.length).toBeGreaterThan(0);
      expect(cheap.length).toBeGreaterThan(0);
    });
  });

  describe("getTier", () => {
    it("is an alias for lookupTier", () => {
      expect(getTier("openai", "v1.chat.completions", "POST")).toBe(
        "expensive"
      );
    });
  });

  describe("gateCheck with default policy", () => {
    it("allows free endpoints", () => {
      const result = gateCheck("openai", "v1.models", "GET");
      expect(result.allowed).toBe(true);
      expect(result.action).toBe("allow");
      expect(result.tier).toBe("free");
    });

    it("allows cheap endpoints", () => {
      const result = gateCheck("openai", "v1.embeddings", "POST");
      expect(result.allowed).toBe(true);
      expect(result.action).toBe("allow");
      expect(result.tier).toBe("cheap");
    });

    it("requires token for expensive endpoints", () => {
      const result = gateCheck("openai", "v1.chat.completions", "POST");
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("requireToken");
      expect(result.tier).toBe("expensive");
      expect(result.error).toBeInstanceOf(GateError);
    });

    it("blocks prohibitive endpoints", () => {
      const result = gateCheck("openai", "v1.batches", "POST");
      expect(result.allowed).toBe(false);
      expect(result.action).toBe("block");
      expect(result.tier).toBe("prohibitive");
      expect(result.error).toBeInstanceOf(GateError);
    });
  });

  describe("gateCheck with token bucket", () => {
    it("allows expensive endpoints when tokens are available", () => {
      const bucket = createTokenBucket(5);
      const result = gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        DEFAULT_POLICY,
        bucket
      );
      expect(result.allowed).toBe(true);
      expect(result.tokenConsumed).toBe(true);
      expect(bucket.balance()).toBe(4);
    });

    it("blocks expensive endpoints when tokens are exhausted", () => {
      const bucket = createTokenBucket(0);
      const result = gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        DEFAULT_POLICY,
        bucket
      );
      expect(result.allowed).toBe(false);
      expect(result.error).toBeInstanceOf(GateError);
    });

    it("consumes tokens for each expensive call", () => {
      const bucket = createTokenBucket(3);
      gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        DEFAULT_POLICY,
        bucket
      );
      gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        DEFAULT_POLICY,
        bucket
      );
      gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        DEFAULT_POLICY,
        bucket
      );
      expect(bucket.balance()).toBe(0);

      const blocked = gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        DEFAULT_POLICY,
        bucket
      );
      expect(blocked.allowed).toBe(false);
    });
  });

  describe("policies", () => {
    it("strict policy blocks expensive and prohibitive", () => {
      const expensive = gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        STRICT_POLICY
      );
      expect(expensive.allowed).toBe(false);
      expect(expensive.action).toBe("block");

      const prohibitive = gateCheck(
        "openai",
        "v1.batches",
        "POST",
        STRICT_POLICY
      );
      expect(prohibitive.allowed).toBe(false);
      expect(prohibitive.action).toBe("block");
    });

    it("permissive policy warns on expensive and prohibitive", () => {
      const expensive = gateCheck(
        "openai",
        "v1.chat.completions",
        "POST",
        PERMISSIVE_POLICY
      );
      expect(expensive.allowed).toBe(true);
      expect(expensive.action).toBe("warn");
      expect(expensive.warning).toContain("Cost warning");

      const prohibitive = gateCheck(
        "openai",
        "v1.batches",
        "POST",
        PERMISSIVE_POLICY
      );
      expect(prohibitive.allowed).toBe(true);
      expect(prohibitive.action).toBe("warn");
    });
  });

  describe("resolveAction with overrides", () => {
    it("uses endpoint override when present", () => {
      const policy = {
        ...DEFAULT_POLICY,
        endpoints: {
          "openai.v1.chat.completions.POST": "block",
        },
      };
      const action = resolveAction(
        policy,
        "openai",
        "v1.chat.completions",
        "POST",
        "expensive"
      );
      expect(action).toBe("block");
    });

    it("uses provider override when present", () => {
      const policy = {
        ...DEFAULT_POLICY,
        providers: {
          openai: { expensive: "allow" },
        },
      };
      const action = resolveAction(
        policy,
        "openai",
        "v1.chat.completions",
        "POST",
        "expensive"
      );
      expect(action).toBe("allow");
    });

    it("falls back to global default", () => {
      const action = resolveAction(
        DEFAULT_POLICY,
        "openai",
        "v1.chat.completions",
        "POST",
        "expensive"
      );
      expect(action).toBe("requireToken");
    });
  });

  describe("GateError", () => {
    it("has correct fields", () => {
      const error = new GateError(
        "openai",
        "v1.chat.completions",
        "POST",
        "expensive",
        "requireToken",
        "No tokens"
      );
      expect(error.name).toBe("GateError");
      expect(error.status).toBe(403);
      expect(error.provider).toBe("openai");
      expect(error.dotPath).toBe("v1.chat.completions");
      expect(error.method).toBe("POST");
      expect(error.tier).toBe("expensive");
      expect(error.action).toBe("requireToken");
      expect(error.message).toBe("No tokens");
    });
  });

  describe("batch gate check", () => {
    it("checks multiple requests", () => {
      const results = gateCheckBatch([
        { provider: "openai", dotPath: "v1.models", method: "GET" },
        { provider: "openai", dotPath: "v1.chat.completions", method: "POST" },
        { provider: "openai", dotPath: "v1.batches", method: "POST" },
      ]);
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(false);
      expect(results[2].allowed).toBe(false);
    });
  });
});
