import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalOpenrouterRouterDecisionsRequest,
  type FalOpenrouterRouterDecisionsRequestInput,
  type FalOpenrouterRouterDecisionsParsedRequest,
  type FalOpenrouterRouterDecisionsResponse,
  type FalRunOpenrouterNamespace,
  type FalRunOpenrouterRouterNamespace,
} from "@apicity/fal";
import {
  FalOpenrouterRouterDecisionsRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
const endpoint = "openrouter/router/decisions";
const question = {
  type: "noul",
  instructions: "Is this message a greeting?",
} as const;
const payload = {
  state: "Hello from Apicity. Have a wonderful day.",
  questions: { is_greeting: question },
} satisfies FalOpenrouterRouterDecisionsRequest;
const record = (n: number) =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => [String(i), "option"])
  );
describe("OpenRouter Router decisions", () => {
  it("exports the nested namespace, request types, aliases and registry", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.openrouter)).toEqual(["router"]);
    expect(Object.keys(p.run.openrouter.router)).toEqual(["decisions"]);
    expect(p.run.openrouter.router.decisions).toBe(
      p.post.run.openrouter.router.decisions
    );
    expect(p.run.openrouter.router.decisions.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(p.run.openrouter).toEqualTypeOf<FalRunOpenrouterNamespace>();
    expectTypeOf(
      p.run.openrouter.router
    ).toEqualTypeOf<FalRunOpenrouterRouterNamespace>();
    expectTypeOf(p.run.openrouter.router.decisions)
      .parameter(0)
      .toEqualTypeOf<FalOpenrouterRouterDecisionsRequest>();
    expectTypeOf(
      p.run.openrouter.router.decisions
    ).returns.resolves.toEqualTypeOf<FalOpenrouterRouterDecisionsResponse>();
    expectTypeOf<FalOpenrouterRouterDecisionsRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalOpenrouterRouterDecisionsParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("posts the exact request body and returns the documented answer union", async () => {
    const response: FalOpenrouterRouterDecisionsResponse = {
      model: "typesafe/jev-1.13",
      answers: {
        is_greeting: { type: "noul", noul: 0.9 },
        choice: {
          type: "choice",
          choice: "a",
          confidence: null,
          probabilities: { a: 1 },
        },
        score: { type: "score", score: 2, legend: { one: "low" } },
      },
      usage: { input_tokens: 1, output_tokens: 1 },
      provider: null,
      id: null,
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(await p.run.openrouter.router.decisions(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/openrouter/router/decisions");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });
  it("requires state and nonempty questions and applies defaults strictly", () => {
    expect(schema.parse(payload)).toEqual({
      ...payload,
      model: "typesafe/jev-1.13",
      enable_safety_checker: true,
    });
    for (const body of [
      {},
      { state: "x" },
      { questions: payload.questions },
      { ...payload, questions: {} },
      { ...payload, extra: 1 },
    ])
      expect(schema.safeParse(body).success).toBe(false);
  });
  it.each([
    "text",
    {},
    [],
    [
      "text",
      { type: "image_url", image_url: { url: "data:image/png;base64,YQ==" } },
    ],
  ])("accepts live structured state/instructions", (value) => {
    expect(
      schema.safeParse({
        ...payload,
        state: value,
        questions: { q: { ...question, instructions: value } },
      }).success
    ).toBe(true);
  });
  it.each([null, 1, true])(
    "rejects unsupported state/instructions",
    (value) => {
      expect(schema.safeParse({ ...payload, state: value }).success).toBe(
        false
      );
      expect(
        schema.safeParse({
          ...payload,
          questions: { q: { ...question, instructions: value } },
        }).success
      ).toBe(false);
    }
  );
  it("accepts live image_urls and optional nullable session", () => {
    for (const image_urls of [
      null,
      [],
      ["https://example.com/a.png", "data:image/png;base64,YQ=="],
    ])
      expect(schema.safeParse({ ...payload, image_urls }).success).toBe(true);
    for (const image_urls of ["url", [1]])
      expect(schema.safeParse({ ...payload, image_urls }).success).toBe(false);
    for (const session_id of [null, "", "x".repeat(256)])
      expect(schema.safeParse({ ...payload, session_id }).success).toBe(true);
    expect(
      schema.safeParse({ ...payload, session_id: "x".repeat(257) }).success
    ).toBe(false);
    expect(
      schema.safeParse({ ...payload, enable_safety_checker: false }).success
    ).toBe(true);
    expect(
      schema.safeParse({ ...payload, enable_safety_checker: "true" }).success
    ).toBe(false);
  });
  it("supports vendor/model aliases while rejecting malformed model identifiers", () => {
    for (const model of [
      "typesafe/jev-1.13",
      "typesafe/jev-1.14",
      "vendor/new-model-v2",
    ])
      expect(schema.safeParse({ ...payload, model }).success).toBe(true);
    for (const model of [
      "",
      "typo",
      "/model",
      "vendor/",
      "vendor/model with spaces",
    ])
      expect(schema.safeParse({ ...payload, model }).success).toBe(false);
  });
  it("requires a supported question discriminator and instructions", () => {
    for (const q of [
      { type: "bad", instructions: "x" },
      { type: "noul" },
      { instructions: "x" },
      { type: "choice", instructions: "x" },
      { type: "score", instructions: "x" },
    ])
      expect(schema.safeParse({ ...payload, questions: { q } }).success).toBe(
        false
      );
  });
  it("validates noul outcome criteria", () => {
    for (const criteria of [
      null,
      { true: "yes", false: "no" },
      { true: { x: 1 }, false: [] },
    ])
      expect(
        schema.safeParse({
          ...payload,
          questions: { q: { ...question, criteria } },
        }).success
      ).toBe(true);
    for (const criteria of [{}, { true: "yes" }, { true: 1, false: false }])
      expect(
        schema.safeParse({
          ...payload,
          questions: { q: { ...question, criteria } },
        }).success
      ).toBe(false);
  });
  it("validates choice count and structured option values", () => {
    for (const n of [2, 255])
      expect(
        schema.safeParse({
          ...payload,
          questions: {
            q: {
              type: "choice",
              instructions: { text: "choose" },
              criteria: record(n),
            },
          },
        }).success
      ).toBe(true);
    for (const n of [0, 1, 256])
      expect(
        schema.safeParse({
          ...payload,
          questions: {
            q: { type: "choice", instructions: "choose", criteria: record(n) },
          },
        }).success
      ).toBe(false);
    expect(
      schema.safeParse({
        ...payload,
        questions: {
          q: {
            type: "choice",
            instructions: [],
            criteria: { a: null, b: { x: 1 }, c: [] },
          },
        },
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...payload,
        questions: {
          q: {
            type: "choice",
            instructions: "choose",
            criteria: { a: 1, b: true },
          },
        },
      }).success
    ).toBe(false);
  });
  it("validates score level count and structured descriptions", () => {
    for (const n of [2, 10])
      expect(
        schema.safeParse({
          ...payload,
          questions: {
            q: {
              type: "score",
              instructions: [],
              criteria: Array(n).fill("level"),
            },
          },
        }).success
      ).toBe(true);
    for (const criteria of [
      [],
      ["one"],
      Array(11).fill("level"),
      [null, "x"],
      [1, "x"],
    ])
      expect(
        schema.safeParse({
          ...payload,
          questions: { q: { type: "score", instructions: "score", criteria } },
        }).success
      ).toBe(false);
  });
  it("keeps token-billed decisions dynamically priced", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(0);
  });
});
