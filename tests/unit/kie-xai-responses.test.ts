import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKie,
  KieError,
  type KieResponsesStreamEvent,
} from "@apicity/kie";
import {
  KIE_XAI_RESPONSES_MODELS,
  KieGrokResponsesRequestSchema,
  KieXaiResponsesRequestSchema,
} from "@apicity/kie/zod";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/cli/src/schema";

// The committed listing the enum is filled from (REQ-007 of ac-wma4p9).
// Only HTTP-200 entries whose body carries a `data` array count.
const LISTING = path.resolve(
  __dirname,
  "../recordings/kie_2079838932/xai-models_454940422/recording.har"
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

function parse(model: unknown) {
  return KieXaiResponsesRequestSchema.safeParse({ model, input: "ping" });
}

describe("xai.v1.responses model enum (REQ-007)", () => {
  it("holds exactly the listing ids, in listing order", () => {
    expect([...KIE_XAI_RESPONSES_MODELS]).toEqual(listingIds());
  });

  it("accepts every listed id", () => {
    for (const model of listingIds()) {
      expect(parse(model).success, model).toBe(true);
    }
  });

  it("admits a later hyphenated Grok id through the alias", () => {
    expect(parse("grok-5").success).toBe(true);
    expect(parse("grok-4-6-fast").success).toBe(true);
  });

  it.each(["grok-4.6", "grok", "grok-four", "gpt-5-5", "claude-opus-5"])(
    "rejects %s",
    (model) => {
      expect(parse(model).success).toBe(false);
    }
  );

  it("leaves the shipped /grok schema accepting the dotted spelling", () => {
    expect(
      KieGrokResponsesRequestSchema.safeParse({
        model: "grok-4.6",
        input: "ping",
      }).success
    ).toBe(true);
  });

  it("keeps the enum + pattern pair in the `apicity describe` JSON Schema", () => {
    const branches = modelBranches(
      zodToJsonSchema(KieXaiResponsesRequestSchema)
    );
    expect(branches).toHaveLength(2);
    expect(branches[0]).toMatchObject({ enum: listingIds() });
    expect(typeof branches[1].pattern).toBe("string");
  });
});

describe("post.xai.v1.responses (injected fetch)", () => {
  it("posts to /xai/v1/responses through the shared Responses path", async () => {
    const seen: { url: string; method: string; body: string }[] = [];
    const provider = createKie({
      apiKey: "test-key",
      fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
        seen.push({
          url: String(input),
          method: init?.method ?? "GET",
          body: String(init?.body ?? ""),
        });
        return new Response(
          JSON.stringify({ status: "completed", output: [] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch,
    });

    await provider.post.xai.v1.responses({
      model: KIE_XAI_RESPONSES_MODELS[0],
      input: "ping",
    });

    expect(seen).toEqual([
      {
        url: "https://api.kie.ai/xai/v1/responses",
        method: "POST",
        body: JSON.stringify({
          model: KIE_XAI_RESPONSES_MODELS[0],
          input: "ping",
        }),
      },
    ]);
  });
});

// REQ-005 item 1 and REQ-006 items 2 to 5 on this leaf itself: the shared
// sendResponsesRequest path, not only its URL. The shipped siblings prove the
// same paths in tests/integration/kie-grok-responses.test.ts.
function kieAnswering(respond: () => Response, seen: Headers[] = []) {
  return createKie({
    apiKey: "test-key",
    fetch: (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(new Headers(init?.headers));
      return respond();
    }) as typeof fetch,
  });
}

function jsonAnswer(body: unknown, status = 200): () => Response {
  return () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

const PING = { model: KIE_XAI_RESPONSES_MODELS[0], input: "ping" };

describe("post.xai.v1.responses shares the Responses handling (REQ-005, REQ-006)", () => {
  it("sends Authorization Bearer as its only credential header", async () => {
    const seen: Headers[] = [];
    await kieAnswering(
      jsonAnswer({ status: "completed", output: [] }),
      seen
    ).post.xai.v1.responses(PING);

    expect(seen).toHaveLength(1);
    expect(seen[0].get("authorization")).toBe("Bearer test-key");
    expect(seen[0].get("apikey")).toBeNull();
    expect(seen[0].get("x-api-key")).toBeNull();
  });

  it("resolves stream: true to the shared SSE event iterable", async () => {
    const seen: Headers[] = [];
    const stream = await kieAnswering(
      () =>
        new Response(
          'data: {"type":"response.output_text.delta","delta":"pong"}\n\n' +
            "data: [DONE]\n\n",
          { headers: { "Content-Type": "text/event-stream" } }
        ),
      seen
    ).post.xai.v1.responses({ ...PING, stream: true });

    const events: KieResponsesStreamEvent[] = [];
    for await (const event of stream) events.push(event);

    expect(seen[0].get("accept")).toBe("text/event-stream");
    expect(events).toEqual([
      { type: "response.output_text.delta", delta: "pong" },
      { type: "done" },
    ]);
  });

  it("rejects KIE's HTTP-200 envelope with the envelope's code", async () => {
    await expect(
      kieAnswering(
        jsonAnswer({ code: 401, msg: "Unauthorized" })
      ).post.xai.v1.responses(PING)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("rejects a non-2xx answer with its HTTP status", async () => {
    await expect(
      kieAnswering(
        jsonAnswer({ error: { message: "Forbidden" } }, 403)
      ).post.xai.v1.responses(PING)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 403,
    } satisfies Partial<KieError>);
  });

  it("rejects a body that is not JSON with a KieError", async () => {
    await expect(
      kieAnswering(
        () => new Response("<html>bad gateway</html>")
      ).post.xai.v1.responses(PING)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 500,
    } satisfies Partial<KieError>);
  });
});
