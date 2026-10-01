// Regression pins for the coding-agent proxy leaves (ac-wma4p9 review R-2,
// follow-up ac-efccei): the clauses no other committed test fixes. The
// envelope rule's other clauses, the optional Messages and xai Responses
// schema fields, the caller's AbortSignal, the factory timeout and each
// leaf's .schema. Injected fetch only: no network.
import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import {
  KieAnthropicMessagesRequestSchema,
  KieXaiResponsesRequestSchema,
} from "@apicity/kie/zod";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/cli/src/schema";

const LISTING = { data: [{ id: "m-1" }], has_more: false };
const MESSAGE = {
  id: "msg_1",
  type: "message",
  role: "assistant",
  model: "claude-haiku-4-5",
  content: [{ type: "text", text: "pong" }],
  stop_reason: "end_turn",
  usage: { input_tokens: 1, output_tokens: 1 },
};
const RESPONSE = { status: "completed", output: [] };
const MSG_REQ = {
  model: "claude-haiku-4-5",
  max_tokens: 1,
  messages: [{ role: "user" as const, content: "hi" }],
};
const XAI_REQ = { model: "grok-4-6", input: "ping" };

function answering(body: unknown, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}

// Resolves with `body` unless the signal it is handed is already aborted.
function signalAware(body: unknown): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.signal?.aborted) {
      throw new DOMException("aborted", "AbortError");
    }
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

// Never answers; rejects only when its signal aborts.
function hanging(): typeof fetch {
  return ((_input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const s = init?.signal;
      const fail = () => reject(new DOMException("aborted", "AbortError"));
      if (s?.aborted) return fail();
      s?.addEventListener("abort", fail, { once: true });
    })) as typeof fetch;
}

function props(schema: unknown): Record<string, JsonSchema> {
  return (zodToJsonSchema(schema as never).properties ?? {}) as Record<
    string,
    JsonSchema
  >;
}

describe("P1 leaf .schema identity (REQ-002.2, REQ-005.2)", () => {
  it("each POST leaf exposes its own schema object", () => {
    const kie = createKie({ apiKey: "x" });
    expect(kie.post.anthropic.v1.messages.schema).toBe(
      KieAnthropicMessagesRequestSchema
    );
    expect(kie.post.xai.v1.responses.schema).toBe(KieXaiResponsesRequestSchema);
  });
});

describe("P2 messages schema fields (REQ-002.2)", () => {
  it("describes every required and optional field REQ-002 item 2 names", () => {
    const js = zodToJsonSchema(KieAnthropicMessagesRequestSchema) as JsonSchema;
    const p = props(KieAnthropicMessagesRequestSchema);
    for (const k of [
      "model",
      "max_tokens",
      "messages",
      "system",
      "temperature",
      "top_p",
      "top_k",
      "stop_sequences",
      "tools",
      "tool_choice",
      "thinking",
      "metadata",
    ]) {
      expect(Object.keys(p), k).toContain(k);
    }
    expect([...((js.required as string[]) ?? [])].sort()).toEqual(
      ["max_tokens", "messages", "model"].sort()
    );
    const tool = (p.tools.items ?? {}) as JsonSchema;
    expect(Object.keys((tool.properties ?? {}) as object).sort()).toEqual(
      ["description", "input_schema", "name"].sort()
    );
    expect((tool.required as string[]).sort()).toEqual(
      ["input_schema", "name"].sort()
    );
  });

  it("keeps the other keys of tool_choice and thinking", () => {
    const parsed = KieAnthropicMessagesRequestSchema.parse({
      ...MSG_REQ,
      tool_choice: { type: "any", disable_parallel_tool_use: true },
      thinking: { type: "enabled", budget_tokens: 1024 },
    });
    expect(parsed.tool_choice).toEqual({
      type: "any",
      disable_parallel_tool_use: true,
    });
    expect(parsed.thinking).toEqual({ type: "enabled", budget_tokens: 1024 });
  });

  it("accepts a string or text-block system prompt and a block message", () => {
    for (const system of ["be brief", [{ type: "text", text: "be brief" }]]) {
      expect(
        KieAnthropicMessagesRequestSchema.safeParse({ ...MSG_REQ, system })
          .success
      ).toBe(true);
    }
    expect(
      KieAnthropicMessagesRequestSchema.safeParse({
        ...MSG_REQ,
        messages: [
          { role: "user", content: [{ type: "text", text: "hi" }] },
          { role: "assistant", content: "pong" },
        ],
      }).success
    ).toBe(true);
    expect(
      KieAnthropicMessagesRequestSchema.safeParse({
        ...MSG_REQ,
        messages: [{ role: "system", content: "no" }],
      }).success
    ).toBe(false);
  });
});

describe("P3 xai responses schema fields (REQ-005.2)", () => {
  it("describes model, input, stream, reasoning, tools and tool_choice", () => {
    expect(Object.keys(props(KieXaiResponsesRequestSchema)).sort()).toEqual(
      ["input", "model", "reasoning", "stream", "tool_choice", "tools"].sort()
    );
  });

  it("accepts a message-array input and stream: true", () => {
    expect(
      KieXaiResponsesRequestSchema.safeParse({
        model: "grok-4-6",
        input: [
          { role: "user", content: [{ type: "input_text", text: "ping" }] },
        ],
      }).success
    ).toBe(true);
    expect(
      KieXaiResponsesRequestSchema.safeParse({ ...XAI_REQ, stream: true })
        .success
    ).toBe(true);
    expect(
      KieXaiResponsesRequestSchema.safeParse({
        ...XAI_REQ,
        reasoning: { effort: "low" },
      }).success
    ).toBe(true);
  });
});

describe("P4 the caller's AbortSignal reaches fetch", () => {
  const aborted = () => {
    const c = new AbortController();
    c.abort();
    return c.signal;
  };

  it("anthropic.v1.models", async () => {
    const kie = createKie({ apiKey: "k", fetch: signalAware(LISTING) });
    await expect(
      kie.get.anthropic.v1.models({}, aborted())
    ).rejects.toBeInstanceOf(KieError);
    await expect(kie.get.anthropic.v1.models({})).resolves.toEqual(LISTING);
  });

  it("anthropic.v1.messages", async () => {
    const kie = createKie({ apiKey: "k", fetch: signalAware(MESSAGE) });
    await expect(
      kie.post.anthropic.v1.messages(MSG_REQ, aborted())
    ).rejects.toBeInstanceOf(KieError);
    await expect(kie.post.anthropic.v1.messages(MSG_REQ)).resolves.toEqual(
      MESSAGE
    );
  });

  it("xai.v1.responses", async () => {
    const kie = createKie({ apiKey: "k", fetch: signalAware(RESPONSE) });
    await expect(
      kie.post.xai.v1.responses(XAI_REQ, aborted())
    ).rejects.toBeInstanceOf(KieError);
    await expect(kie.post.xai.v1.responses(XAI_REQ)).resolves.toEqual(RESPONSE);
  });
});

describe("P5 the factory timeout reaches each new leaf (REQ-006.1)", () => {
  const calls: [
    string,
    (k: ReturnType<typeof createKie>) => Promise<unknown>,
  ][] = [
    ["anthropic.v1.models", (k) => k.get.anthropic.v1.models()],
    ["openai.v1.models", (k) => k.get.openai.v1.models()],
    ["xai.v1.models", (k) => k.get.xai.v1.models()],
    ["anthropic.v1.messages", (k) => k.post.anthropic.v1.messages(MSG_REQ)],
    ["xai.v1.responses", (k) => k.post.xai.v1.responses(XAI_REQ)],
  ];
  it.each(calls)("%s gives up after timeout: 25", async (_name, call) => {
    const kie = createKie({ apiKey: "k", fetch: hanging(), timeout: 25 });
    const t0 = Date.now();
    const error = await Promise.race([
      call(kie).then(
        () => "resolved",
        (e: unknown) => e
      ),
      new Promise((r) => setTimeout(() => r("still waiting at 3 s"), 3000)),
    ]);
    expect(error).toBeInstanceOf(KieError);
    expect(Date.now() - t0).toBeLessThan(3000);
  });
});

describe("P6 the envelope rule's other clauses (REQ-006.4, OQ-10)", () => {
  it("a code-200 body with a msg and no payload resolves", async () => {
    const body = { code: 200, msg: "success" };
    const kie = createKie({ apiKey: "k", fetch: answering(body) });
    await expect(kie.get.xai.v1.models()).resolves.toEqual(body);
    await expect(kie.post.anthropic.v1.messages(MSG_REQ)).resolves.toEqual(
      body
    );
  });

  it("a numeric code with no string msg resolves", async () => {
    const body = { code: 401 };
    const kie = createKie({ apiKey: "k", fetch: answering(body) });
    await expect(kie.get.openai.v1.models()).resolves.toEqual(body);
  });

  it("the KieError status is the envelope's code, not only 401", async () => {
    const kie = createKie({
      apiKey: "k",
      fetch: answering({ code: 500, msg: "server exception" }),
    });
    await expect(kie.get.anthropic.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 500,
    });
    await expect(kie.post.anthropic.v1.messages(MSG_REQ)).rejects.toMatchObject(
      {
        name: "KieError",
        status: 500,
      }
    );
  });

  it("messages: a body with only one of type/content still resolves", async () => {
    for (const body of [
      { code: 401, msg: "x", type: "message" },
      { code: 401, msg: "x", content: [] },
    ]) {
      const kie = createKie({ apiKey: "k", fetch: answering(body) });
      await expect(kie.post.anthropic.v1.messages(MSG_REQ)).resolves.toEqual(
        body
      );
    }
  });
});
