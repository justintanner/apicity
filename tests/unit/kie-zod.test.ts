import { describe, expect, it } from "vitest";

import {
  FluxKontextGenerateRequestSchema,
  KieClaudeRequestSchema,
  KieGrokResponsesRequestSchema,
  KieResponsesRequestSchema,
  Seedance2FastInputSchema,
  Seedance2InputSchema,
  Seedance2MiniInputSchema,
  SunoGenerateRequestSchema,
  VeoExtendRequestSchema,
  VeoGenerateRequestSchema,
} from "@apicity/kie/zod";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/mcp-server/src/schema";

const HTTPS_URL = "https://example.com/image.png";
const LOCAL_PATH = "@asset/photo.png";

function urlIssueMessages(
  result:
    | ReturnType<typeof Seedance2MiniInputSchema.safeParse>
    | ReturnType<typeof Seedance2InputSchema.safeParse>
    | ReturnType<typeof Seedance2FastInputSchema.safeParse>
): string[] {
  return (result.error?.issues ?? [])
    .filter((issue) => issue.path.includes("reference_image_urls"))
    .map((issue) => issue.message);
}

// All three seedance variants share the `.max(9)` cap, so that is asserted
// across the family. Media elements are plain strings family-wide: schemas
// validate the construction boundary, where fields may still hold local
// slugs such as `@asset/photo.png` (URL reachability is kie.ai's job at
// task-creation time). The presence axis differs: mini defaults to `[]`,
// the siblings stay `.optional()`.
const VARIANTS = [
  {
    name: "bytedance/seedance-2-mini",
    schema: Seedance2MiniInputSchema,
    base: {},
  },
  {
    name: "bytedance/seedance-2",
    schema: Seedance2InputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
  {
    name: "bytedance/seedance-2-fast",
    schema: Seedance2FastInputSchema,
    base: { prompt: "a cinematic drone shot over a canyon" },
  },
] as const;

describe("KIE Zod schema validation", () => {
  describe.each(VARIANTS)(
    "$name reference_image_urls cap",
    ({ schema, base }) => {
      it("accepts an at-cap array of 9 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(9).fill(HTTPS_URL),
        });
        expect(result.success).toBe(true);
      });

      it("rejects an over-cap array of 10 URLs", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: Array(10).fill(HTTPS_URL),
        });
        expect(result.success).toBe(false);
        expect(urlIssueMessages(result).length).toBeGreaterThan(0);
      });
    }
  );

  // Review finding R-2: an earlier revision tightened `.url()` onto reference
  // elements, which is breaking for callers currently passing non-URL strings
  // (e.g. not-yet-uploaded local slugs). Pinned family-wide so the tightening
  // cannot return without its own requirement.
  describe.each(VARIANTS)(
    "$name accepts non-URL strings",
    ({ schema, base }) => {
      it("does not enforce a URL shape on reference_image_urls", () => {
        const result = schema.safeParse({
          ...base,
          reference_image_urls: [LOCAL_PATH],
        });
        expect(result.success).toBe(true);
      });
    }
  );

  describe("bytedance/seedance-2-mini local slug acceptance", () => {
    it("accepts local slugs in all three reference arrays", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: ["@img-ref-1"],
        reference_video_urls: ["@vid-ref-1"],
        reference_audio_urls: ["not-a-url"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts a valid HTTPS URL", () => {
      const result = Seedance2MiniInputSchema.safeParse({
        reference_image_urls: [HTTPS_URL],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("seedance reference_image_urls presence semantics", () => {
    it("defaults mini's reference_image_urls to an empty array", () => {
      const result = Seedance2MiniInputSchema.safeParse({});
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toEqual([]);
    });

    it("leaves the siblings' reference_image_urls absent when omitted", () => {
      const result = Seedance2InputSchema.safeParse({
        prompt: "a cinematic drone shot over a canyon",
      });
      expect(result.success).toBe(true);
      expect(result.data?.reference_image_urls).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Model-enum escape hatches (TRI-002…TRI-008)
// ---------------------------------------------------------------------------
//
// CLAUDE.md -> Code Conventions -> "Model-identifier enums stay open": a field
// naming an upstream *model registry* is `z.enum([...known]).or(<alias>)`,
// where the alias is a named `z.string().regex(...)` matching that vendor's
// real id grammar — never a bare `.or(z.string())`, which accepts typos. The
// known ids stay enumerated so MCP clients keep autocomplete.
//
// Each opened field is asserted along four axes: BR-1 every listed id still
// parses, BR-2 a plausible not-yet-listed id that matches the family grammar
// parses, BR-3/BR-4 near-miss typos and foreign-family ids are rejected, and
// BR-6 the enum branch survives conversion to MCP tool input JSON Schema.

interface ModelParseOutcome {
  success: boolean;
  flagsModel: boolean;
}

function modelOutcome(result: {
  success: boolean;
  error?: { issues: readonly { path: readonly PropertyKey[] }[] };
}): ModelParseOutcome {
  return {
    success: result.success,
    flagsModel: (result.error?.issues ?? []).some((issue) =>
      issue.path.includes("model")
    ),
  };
}

function modelBranches(schema: JsonSchema): JsonSchema[] {
  const properties = schema.properties as Record<string, JsonSchema>;
  return properties.model.anyOf as JsonSchema[];
}

const CLAUDE_MESSAGES = [{ role: "user", content: "Hello" }];

const OPENED_MODEL_FIELDS = [
  {
    triage: "TRI-002",
    label: "FluxKontextGenerateRequestSchema.model",
    listed: ["flux-kontext-pro", "flux-kontext-max"],
    // A future Flux Kontext tier: same family prefix, new variant segment.
    aliases: ["flux-kontext-ultra"],
    // BR-3 bare family name and casing typo; BR-4 a sibling Flux family and a
    // missing separator.
    rejected: [
      "flux-kontext",
      "flux-pro",
      "fluxkontext-pro",
      "FLUX-KONTEXT-PRO",
    ],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        FluxKontextGenerateRequestSchema.safeParse({
          prompt: "a paper boat crossing a quiet pond",
          model,
        })
      ),
    jsonSchema: (): JsonSchema =>
      zodToJsonSchema(FluxKontextGenerateRequestSchema),
  },
  {
    triage: "TRI-003",
    label: "KieResponsesRequestSchema.model",
    listed: ["gpt-5-5"],
    aliases: ["gpt-6", "gpt-5-5-mini"],
    // BR-3 bare family and spelled-out/truncated versions; BR-4 a Grok id on
    // the OpenAI-only field.
    rejected: ["gpt", "gpt-five", "gpt-", "grok-4-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieResponsesRequestSchema),
  },
  {
    triage: "TRI-004",
    label: "KieGrokResponsesRequestSchema.model",
    listed: ["grok-4-5"],
    aliases: ["grok-5", "grok-4-5-fast"],
    // BR-4 `gpt-5-5` is the sibling endpoint's listed id and must not cross.
    rejected: ["grok", "grok-four", "gpt-5-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieGrokResponsesRequestSchema.safeParse({
          model,
          input: "summarize this thread",
        })
      ),
    jsonSchema: (): JsonSchema =>
      zodToJsonSchema(KieGrokResponsesRequestSchema),
  },
  {
    triage: "TRI-005",
    label: "VeoGenerateRequestSchema.model",
    listed: ["veo3", "veo3_fast"],
    aliases: ["veo4_fast"],
    // BR-3 kie's Veo grammar is underscored, so the hyphenated `veo3-fast` and
    // googleflow's dotted `veo-3.1-fast` are both typos here; BR-4 `gpt-4o`.
    rejected: ["veo3-fast", "veo-3.1-fast", "veo", "gpt-4o"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        VeoGenerateRequestSchema.safeParse({
          prompt: "a cat playing piano",
          model,
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(VeoGenerateRequestSchema),
  },
  {
    triage: "TRI-006",
    label: "SunoGenerateRequestSchema.model",
    listed: ["V3_5", "V4", "V4_5", "V4_5PLUS", "V4_5ALL", "V5", "V5_5"],
    aliases: ["V6", "V5_5PLUS"],
    // BR-3 wrong case and wrong separator on listed ids; BR-4 an ElevenLabs
    // style music id.
    rejected: ["v5", "V", "V4-5", "V4_5plus", "music_v1"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        SunoGenerateRequestSchema.safeParse({
          prompt: "a happy pop song about summer",
          model,
          instrumental: false,
          customMode: true,
          callBackUrl: "https://example.com/cb",
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(SunoGenerateRequestSchema),
  },
  {
    triage: "TRI-007",
    label: "KieClaudeRequestSchema.model",
    listed: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    aliases: ["claude-opus-5-0"],
    // BR-3 versionless and familyless near-misses of a listed id; BR-4 a GPT
    // id on a Claude-only field.
    rejected: ["claude-sonnet", "claude-4-6", "claude", "gpt-5-5"],
    parse: (model: unknown): ModelParseOutcome =>
      modelOutcome(
        KieClaudeRequestSchema.safeParse({
          model,
          messages: CLAUDE_MESSAGES,
        })
      ),
    jsonSchema: (): JsonSchema => zodToJsonSchema(KieClaudeRequestSchema),
  },
] as const;

describe.each(OPENED_MODEL_FIELDS)(
  "$triage $label",
  ({ listed, aliases, rejected, parse, jsonSchema }) => {
    it.each(listed)("accepts the listed model %s", (model) => {
      expect(parse(model).success).toBe(true);
    });

    it.each(aliases)("accepts the alias %s", (model) => {
      expect(parse(model).success).toBe(true);
    });

    it.each(rejected)("rejects the model %j", (model) => {
      const outcome = parse(model);
      expect(outcome.success).toBe(false);
      expect(outcome.flagsModel).toBe(true);
    });

    it("rejects a non-string model", () => {
      expect(parse(42).success).toBe(false);
    });

    // BR-6. Every listed id also matches the alias regex — checked here rather
    // than by eye — so the enum branch carries zero validation weight and
    // exists only for MCP client autocomplete. Nothing else pins it, so a
    // "dead code" cleanup could delete it while the suite stayed green. This
    // is that pin.
    it("keeps every listed id in the enum branch of the MCP JSON Schema", () => {
      const branches = modelBranches(jsonSchema());

      expect(branches).toHaveLength(2);
      expect(branches[0]).toMatchObject({
        type: "string",
        enum: [...listed],
      });

      const alias = new RegExp(String(branches[1].pattern));
      expect(branches[1].type).toBe("string");
      expect(listed.filter((id) => !alias.test(id))).toEqual([]);
    });
  }
);

// TRI-008. `fast | quality` is a rendering-tier vocabulary, not a model
// registry — the counterexample class CLAUDE.md names alongside `quality` and
// SimpleFunctionsModelSchema. BR-5: opening the sibling Veo generate field
// must not loosen this one, directly or through a shared alias.
describe("TRI-008 VeoExtendRequestSchema.model stays a closed set", () => {
  const extendBase = { taskId: "task-123", prompt: "extend the video" };

  it.each(["fast", "quality"])("accepts the listed tier %s", (model) => {
    const result = VeoExtendRequestSchema.safeParse({ ...extendBase, model });
    expect(result.success).toBe(true);
  });

  it.each(["veo3", "veo3_fast", "veo4_fast", "medium", "invalid"])(
    "still rejects %j",
    (model) => {
      const outcome = modelOutcome(
        VeoExtendRequestSchema.safeParse({ ...extendBase, model })
      );
      expect(outcome.success).toBe(false);
      expect(outcome.flagsModel).toBe(true);
    }
  );

  it("emits a bare enum, not an anyOf hatch, in the MCP JSON Schema", () => {
    const properties = zodToJsonSchema(VeoExtendRequestSchema)
      .properties as Record<string, JsonSchema>;

    expect(properties.model.anyOf).toBeUndefined();
    expect(properties.model).toMatchObject({
      type: "string",
      enum: ["fast", "quality"],
    });
  });
});
