import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import {
  KIE_ANTHROPIC_MESSAGES_MODELS,
  KieAnthropicMessagesRequestSchema,
} from "@apicity/kie/zod";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/cli/src/schema";

// The committed listing the enum is filled from (REQ-007 of ac-wma4p9).
// Only HTTP-200 entries whose body carries a `data` array count.
const LISTING = path.resolve(
  __dirname,
  "../recordings/kie_2079838932/anthropic-models_3079786156/recording.har"
);

function listingIds(): string[] {
  const har = JSON.parse(readFileSync(LISTING, "utf8")) as {
    log: {
      entries: {
        response: { status: number; content: { text?: string } };
      }[];
    };
  };
  const ids: string[] = [];
  const add = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  for (const entry of har.log.entries) {
    if (entry.response.status !== 200) continue;
    const body = JSON.parse(entry.response.content.text ?? "null") as {
      data?: { id: string }[];
    } | null;
    if (!body || !Array.isArray(body.data)) continue;
    for (const model of body.data) add(model.id);
  }
  return ids;
}

function modelBranches(schema: JsonSchema): JsonSchema[] {
  const properties = schema.properties as Record<string, JsonSchema>;
  return properties.model.anyOf as JsonSchema[];
}

const REQUEST = {
  model: "claude-synth-placeholder",
  max_tokens: 1,
  messages: [{ role: "user", content: "hi" }],
};

function parse(overrides: Record<string, unknown>) {
  return KieAnthropicMessagesRequestSchema.safeParse({
    ...REQUEST,
    model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
    ...overrides,
  });
}

interface Seen {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

function stub(respond: () => Response) {
  const seen: Seen[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(
      (init?.headers ?? {}) as Record<string, string>
    )) {
      headers[name.toLowerCase()] = value;
    }
    seen.push({
      url: String(input),
      method: init?.method ?? "GET",
      headers,
      body: String(init?.body ?? ""),
    });
    return respond();
  }) as typeof fetch;
  return {
    seen,
    provider: createKie({ apiKey: "test-key", fetch: fetchImpl }),
  };
}

function json(body: unknown, status = 200): () => Response {
  return () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

const MESSAGE = {
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "claude-test-1-0",
  content: [{ type: "text", text: "pong" }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 3, output_tokens: 1 },
};

describe("anthropic.v1.messages model enum (REQ-007)", () => {
  it("holds exactly the listing ids, in listing order", () => {
    expect([...KIE_ANTHROPIC_MESSAGES_MODELS]).toEqual(listingIds());
  });

  it("accepts every listed id", () => {
    for (const model of listingIds()) {
      expect(parse({ model }).success, model).toBe(true);
    }
  });

  it("admits a later versioned Claude id through the alias", () => {
    expect(parse({ model: "claude-opus-9-9" }).success).toBe(true);
  });

  it.each(["claude-sonnet", "claude-4-6", "claude", "gpt-5-5", "grok-4-6"])(
    "rejects %s",
    (model) => {
      expect(parse({ model }).success).toBe(false);
    }
  );

  it("keeps the enum + pattern pair in the `apicity describe` JSON Schema", () => {
    const branches = modelBranches(
      zodToJsonSchema(KieAnthropicMessagesRequestSchema)
    );
    expect(branches).toHaveLength(2);
    expect(branches[0]).toMatchObject({ enum: listingIds() });
    expect(typeof branches[1].pattern).toBe("string");
  });
});

describe("anthropic.v1.messages request schema (REQ-002)", () => {
  it("requires a positive integer max_tokens and at least one message", () => {
    expect(parse({}).success).toBe(true);
    expect(parse({ max_tokens: 0 }).success).toBe(false);
    expect(parse({ max_tokens: 1.5 }).success).toBe(false);
    expect(parse({ messages: [] }).success).toBe(false);
  });

  it("never advertises streaming", () => {
    expect(parse({ stream: false }).success).toBe(true);
    expect(parse({ stream: true }).success).toBe(false);
  });

  it("keeps tool_choice and thinking open by `type`", () => {
    expect(
      parse({
        tool_choice: { type: "any", disable_parallel_tool_use: true },
        thinking: { type: "enabled", budget_tokens: 1024 },
      }).success
    ).toBe(true);
  });
});

describe("post.anthropic.v1.messages (injected fetch)", () => {
  it("posts the body to /anthropic/v1/messages with the version header", async () => {
    const { seen, provider } = stub(json(MESSAGE));
    const request = {
      model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
      max_tokens: 8,
      messages: [{ role: "user" as const, content: "hi" }],
    };
    await expect(provider.post.anthropic.v1.messages(request)).resolves.toEqual(
      MESSAGE
    );

    expect(seen[0].method).toBe("POST");
    expect(seen[0].url).toBe("https://api.kie.ai/anthropic/v1/messages");
    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers["anthropic-version"]).toBe("2023-06-01");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
    expect(JSON.parse(seen[0].body)).toEqual(request);
  });

  it("rejects KIE's HTTP-200 envelope with the envelope's code", async () => {
    const { provider } = stub(json({ code: 401, msg: "Unauthorized" }));
    await expect(
      provider.post.anthropic.v1.messages({
        model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      })
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("carries an Anthropic error message on a non-2xx answer", async () => {
    const { provider } = stub(
      json(
        {
          type: "error",
          error: { type: "invalid_request_error", message: "bad max_tokens" },
        },
        400
      )
    );
    const error = await provider.post.anthropic.v1
      .messages({
        model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      })
      .catch((e) => e);
    expect(error).toBeInstanceOf(KieError);
    expect(error.status).toBe(400);
    expect(error.message).toContain("bad max_tokens");
  });

  it("rejects a body that is not JSON with a KieError", async () => {
    const { provider } = stub(() => new Response("<html>bad gateway</html>"));
    const error = await provider.post.anthropic.v1
      .messages({
        model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      })
      .catch((e) => e);
    expect(error).toBeInstanceOf(KieError);
  });
});
