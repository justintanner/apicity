import { describe, it, expect } from "vitest";
import {
  classifyEndpoint,
  isEndpointExplicitlyClassified,
  shouldRunEndpointByDefault,
  GATED_COST_TIERS,
  isPaidEndpoint,
  PAID_ENDPOINTS,
  PRICING,
} from "@apicity/cost";
import { loadCostHelpers } from "../../packages/mcp-server/src/cost";

/**
 * Stage 3 (REQ-005 / AC-5) — KIE/MCP per-model cost gates + registry drift.
 *
 * DECISION RECORDED (do-work source anchor ac-f1ral):
 *
 * The six named KIE model families — Suno, Omni, Claude, Gemini, Gemini31,
 * Codex — are, in the current tree, distinct dedicated endpoints (distinct
 * dotPaths on `scripts/endpoint-docs.tsv`), NOT model VALUES of the umbrella
 * `api.v1.jobs.createTask` endpoint. The one exception is Omni's *video* model
 * `gemini-omni-video`, which is a `createTask` model value (and is priced).
 *
 * SAFETY (already satisfied): the provider-wide cost policy
 * `{ match: { provider: "kie" } } -> "prohibitive"` classifies EVERY KIE
 * endpoint — the createTask umbrella and all six named families — as
 * `prohibitive`. `prohibitive` is a gated tier, so each family is example-gated
 * and fail-closed; no KIE endpoint can silently run as free/cheap. The "add six
 * gates" work is therefore a gating/pricing-GRANULARITY enhancement, not a
 * safety hole (plan review BF-3).
 *
 * REGISTRY DRIFT (already closed): the canonical
 * `packages/provider/cost/src/paid-endpoints.ts` is kept in lockstep with its
 * generated copies (`packages/provider/{kie,xai}/src/paid-endpoints.ts`) by
 * `pnpm run gen:shared` and verified by `gen:shared:check` (part of
 * `pnpm run lint`). `@apicity/mcp-server` holds NO static cost registry — it
 * imports `@apicity/cost` at runtime via `loadCostHelpers()`, so it cannot
 * drift by construction. The final block below asserts that runtime view agrees
 * with `@apicity/cost` for these endpoints (the MCP-registry drift check).
 *
 * SCOPE DECISION (option b, accurately reframed): the six dedicated LLM/music
 * endpoints stay cost-gated (`prohibitive`) but are intentionally NOT added to
 * the OTP pay-gate (`PAID_ENDPOINTS`) — they are not per-unit media-billing
 * endpoints, and OTP-gating them would break their existing un-OTP integration
 * tests. Per-model token pricing for the four token-billed families (Claude,
 * Codex, Gemini, Gemini31) plus Omni audio/character is deferred: KIE has only a
 * per-unit pricing path today and authoritative per-model token rates are not
 * available in this (headless) context, so no rates are fabricated. Suno and
 * `gemini-omni-video` are already fully priced.
 *
 * This test converts the implicit provider-wide gate into an EXPLICIT,
 * enumerated, tested contract for the six named families so a future change
 * (e.g. removing the provider-wide `kie` policy, or newly OTP-gating one of
 * these endpoints) is a deliberate, reviewed decision rather than a silent
 * regression.
 */

/** The six named families, keyed to their live KIE dotPaths (all POST). */
const KIE_MODEL_FAMILY_ENDPOINTS: Record<string, readonly string[]> = {
  Suno: [
    "api.v1.generate",
    "api.v1.generate.addInstrumental",
    "api.v1.generate.addVocals",
    "api.v1.generate.mashup",
    "api.v1.generate.replaceSection",
    "api.v1.generate.sounds",
  ],
  Omni: ["api.v1.omni.audio.create", "api.v1.omni.character.create"],
  Claude: ["claude.v1.messages"],
  Gemini: ["gemini.v1.models.gemini35Flash.streamGenerateContent"],
  Gemini31: ["gemini31Pro.v1.chat.completions"],
  Codex: ["codex.v1.responses"],
};

const ALL_FAMILY_ENDPOINTS: readonly string[] = Object.values(
  KIE_MODEL_FAMILY_ENDPOINTS
).flat();

const UMBRELLA_CREATE_TASK = "api.v1.jobs.createTask";

describe("KIE per-model cost gates (REQ-005 / AC-5)", () => {
  describe("safety gate: every named family is cost-gated (prohibitive)", () => {
    for (const [family, dotPaths] of Object.entries(
      KIE_MODEL_FAMILY_ENDPOINTS
    )) {
      for (const dotPath of dotPaths) {
        it(`${family}: kie POST ${dotPath} classifies prohibitive and is gated`, () => {
          const tier = classifyEndpoint("kie", "POST", dotPath);
          expect(tier).toBe("prohibitive");
          // Gated tiers must never run an example by default.
          expect(GATED_COST_TIERS).toContain(tier);
          expect(shouldRunEndpointByDefault("kie", "POST", dotPath)).toBe(
            false
          );
          // The gate is intentional (an explicit policy matched), not the
          // fail-closed default for an unknown endpoint.
          expect(isEndpointExplicitlyClassified("kie", "POST", dotPath)).toBe(
            true
          );
        });
      }
    }

    it("covers all six named families explicitly (AC-5 enumeration)", () => {
      expect(Object.keys(KIE_MODEL_FAMILY_ENDPOINTS).sort()).toEqual([
        "Claude",
        "Codex",
        "Gemini",
        "Gemini31",
        "Omni",
        "Suno",
      ]);
    });
  });

  describe("umbrella createTask endpoint (media models incl. gemini-omni-video)", () => {
    it("is cost-gated prohibitive", () => {
      expect(classifyEndpoint("kie", "POST", UMBRELLA_CREATE_TASK)).toBe(
        "prohibitive"
      );
    });

    it("is OTP pay-gated (per-unit media billing)", () => {
      expect(isPaidEndpoint("kie", "POST", UMBRELLA_CREATE_TASK)).toBe(true);
    });
  });

  describe("pay-gate coverage decision (ac-y1s96b / ask ac-ua82k5)", () => {
    it("keeps the umbrella createTask OTP-gated", () => {
      expect(isPaidEndpoint("kie", "POST", UMBRELLA_CREATE_TASK)).toBe(true);
    });

    // Operator ruling: these seven task-creating Suno/omni routes are OTP-paid.
    const OTP_PAID_FAMILY_ENDPOINTS = [
      "api.v1.generate",
      "api.v1.omni.audio.create",
      "api.v1.omni.character.create",
    ] as const;

    it("OTP-gates the operator-approved Suno generate and Omni create routes", () => {
      for (const dotPath of OTP_PAID_FAMILY_ENDPOINTS) {
        expect(isPaidEndpoint("kie", "POST", dotPath)).toBe(true);
      }
      for (const extra of [
        "api.v1.mp4.generate",
        "api.v1.wav.generate",
        "api.v1.vocalRemoval.generate",
        "api.v1.midi.generate",
      ] as const) {
        expect(isPaidEndpoint("kie", "POST", extra)).toBe(true);
      }
    });

    it("leaves non-task-creating family siblings free of OTP", () => {
      // Sibling generate helpers remain cost-gated prohibitive but not OTP-paid.
      const freeSiblings = ALL_FAMILY_ENDPOINTS.filter(
        (dotPath) =>
          !(OTP_PAID_FAMILY_ENDPOINTS as readonly string[]).includes(dotPath)
      );
      for (const dotPath of freeSiblings) {
        expect(isPaidEndpoint("kie", "POST", dotPath)).toBe(false);
      }
    });
  });

  describe("per-model pricing status", () => {
    it("prices the Suno music endpoints (endpoint-keyed)", () => {
      expect(PRICING.kie["suno/generate"]).toBeDefined();
      expect(PRICING.kie["suno/mashup-generate"]).toBeDefined();
      expect(PRICING.kie["suno/sounds-generate"]).toBeDefined();
    });

    it("prices the Omni video createTask model", () => {
      expect(PRICING.kie["gemini-omni-video"]).toBeDefined();
    });
  });

  describe("MCP-registry drift check", () => {
    it("mcp-server's runtime paid-endpoint view matches @apicity/cost", async () => {
      const helpers = await loadCostHelpers();

      // Same registry object surface (no static mcp-server copy to drift).
      expect(helpers.PAID_ENDPOINTS.length).toBe(PAID_ENDPOINTS.length);

      // The umbrella createTask is paid in both views.
      expect(helpers.isPaidEndpoint("kie", "POST", UMBRELLA_CREATE_TASK)).toBe(
        isPaidEndpoint("kie", "POST", UMBRELLA_CREATE_TASK)
      );
      expect(helpers.isPaidEndpoint("kie", "POST", UMBRELLA_CREATE_TASK)).toBe(
        true
      );

      // Family endpoints agree between cost package and mcp-server view.
      for (const dotPath of ALL_FAMILY_ENDPOINTS) {
        expect(helpers.isPaidEndpoint("kie", "POST", dotPath)).toBe(
          isPaidEndpoint("kie", "POST", dotPath)
        );
      }
    });
  });
});
