import { describe, expect, it } from "vitest";

import {
  KIE_RESPONSES_MODELS,
  KieApiResponsesRequestSchema,
  KieResponsesRequestSchema,
} from "@apicity/kie/zod";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../../packages/mcp-server/src/schema";

// The four kie Responses catalogue ids confirmed live on 2026-08-28: each was
// posted to both Responses surfaces, `POST /codex/v1/responses` streamed
// `event: response.created` for all four, and `POST /api/v1/responses`
// answered `422 "The model is not supported"` for all four. The surfaces carry
// disjoint model vocabularies, so every id belongs to exactly one of them.
const CODEX_CATALOGUE_IDS = [
  "gpt-5-4",
  "gpt-5-6-luna",
  "gpt-5-6-sol",
  "gpt-5-6-terra",
] as const;

// In the enum on the *other* surface, and served there — the control that keeps
// the cross-surface rejection below from being vacuous.
const API_SURFACE_CONTROL = "gpt-5.4-codex";

function modelBranches(schema: JsonSchema): JsonSchema[] {
  const properties = schema.properties as Record<string, JsonSchema>;
  return properties.model.anyOf as JsonSchema[];
}

function codexParse(model: string) {
  return KieResponsesRequestSchema.safeParse({
    model,
    input: "summarize this thread",
  });
}

function apiParse(model: string) {
  return KieApiResponsesRequestSchema.safeParse({
    model,
    input: "summarize this thread",
  });
}

// `KieResponsesModelSchema` is `z.enum(KIE_RESPONSES_MODELS)` unioned with
// `KieOpenAiModelAliasSchema`, and all four ids satisfy that alias grammar —
// so `safeParse` succeeded for every one of them before they were enumerated,
// and a success still cannot say which branch matched. A positive assertion
// written through safeParse alone would therefore have been green against an
// unchanged tree. Enum membership is asserted directly instead, against the
// exported backing array and against the enum branch MCP clients read.
describe("kie codex Responses catalogue ids", () => {
  it.each(CODEX_CATALOGUE_IDS)(
    "enumerates %s in KIE_RESPONSES_MODELS",
    (model) => {
      expect(KIE_RESPONSES_MODELS).toContain(model);
    }
  );

  it("keeps the four ids in the MCP autocomplete enum branch", () => {
    const branches = modelBranches(zodToJsonSchema(KieResponsesRequestSchema));

    expect(branches).toHaveLength(2);
    expect(branches[0]).toMatchObject({
      type: "string",
      enum: [...KIE_RESPONSES_MODELS],
    });
    for (const model of CODEX_CATALOGUE_IDS) {
      expect(branches[0].enum as string[]).toContain(model);
    }
  });

  // Why the assertions above cannot be replaced by safeParse: the alias branch
  // accepts every one of these ids on its own. This pins that fact rather than
  // leaving it to the reader, so a future "the enum is redundant" cleanup has
  // to confront the autocomplete pin instead of a green suite.
  it("would accept all four through the alias hatch alone", () => {
    const branches = modelBranches(zodToJsonSchema(KieResponsesRequestSchema));
    const alias = new RegExp(String(branches[1].pattern));

    expect(CODEX_CATALOGUE_IDS.filter((id) => !alias.test(id))).toEqual([]);
  });

  it.each(CODEX_CATALOGUE_IDS)("still parses %s on the codex path", (model) => {
    expect(codexParse(model).success).toBe(true);
  });

  // The cross-surface negative. `/api/v1/responses` rejected all four live, and
  // KieApiCodexModelAliasSchema requires a `-codex` suffix none of them carries,
  // so adding them to the codex path must not make them parse here.
  it.each(CODEX_CATALOGUE_IDS)(
    "rejects %s on the /api/v1/responses schema",
    (model) => {
      const result = apiParse(model);

      expect(result.success).toBe(false);
      expect(
        (result.error?.issues ?? []).some((issue) =>
          issue.path.includes("model")
        )
      ).toBe(true);
    }
  );

  it("still accepts the api-surface control the codex path does not serve", () => {
    expect(apiParse(API_SURFACE_CONTROL).success).toBe(true);
    expect(KIE_RESPONSES_MODELS).not.toContain(API_SURFACE_CONTROL);
  });
});
