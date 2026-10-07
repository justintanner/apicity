import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import { KIE_ANTHROPIC_MESSAGES_MODELS } from "@apicity/kie/zod";

// KIE can answer /claude/v1/messages, like /anthropic/v1/messages, with its
// own `{ code, msg }` envelope at HTTP 200 instead of a message (ac-f257zk).
// Both leaves now reject that body through kieRequest's hasPayload guard,
// and /claude still resolves a message and parses a non-2xx error as before.

// KIE's auth-failure msg, verbatim from the recorded agent-proxy 401 answers.
const HAR_MSG =
  "Unauthorized – Authentication failed. Please check that your Authorization and Content-Type headers are correctly set.";

const REQUEST = {
  model: "claude-sonnet-4-6",
  messages: [{ role: "user" as const, content: "Hello" }],
};

const MESSAGE = {
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "claude-sonnet-4-6",
  content: [{ type: "text", text: "pong" }],
  stop_reason: "end_turn",
  usage: { input_tokens: 3, output_tokens: 1 },
  credits_consumed: 0.5,
};

interface Seen {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  aborted: boolean;
}

function kieAnswering(body: unknown, status = 200) {
  const seen: Seen[] = [];
  const kie = createKie({
    apiKey: "test-key",
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
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
        aborted: init?.signal?.aborted ?? false,
      });
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch,
  });
  return { kie, seen };
}

type Kie = ReturnType<typeof createKie>;

const claude = (kie: Kie) => kie.claude.post.v1.messages(REQUEST);

const anthropic = (kie: Kie) =>
  kie.post.anthropic.v1.messages({
    model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
    max_tokens: 1,
    messages: [{ role: "user", content: "Hello" }],
  });

/** How a call settled: its value, or its error's KieError fields. */
async function settle(call: Promise<unknown>) {
  try {
    return { resolved: await call };
  } catch (error) {
    const { name, status, code, message, body } = error as KieError;
    const kieError = error instanceof KieError;
    return { rejected: { kieError, name, status, code, message, body } };
  }
}

describe("claude.post.v1.messages: KIE's HTTP 200 envelope (ac-f257zk)", () => {
  it("rejects the envelope with its code as status and code", async () => {
    const body = { code: 401, msg: HAR_MSG };
    const error = await claude(kieAnswering(body).kie).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(KieError);
    expect(error).toMatchObject({
      name: "KieError",
      status: 401,
      code: "401",
      message: `Kie API error 401: ${HAR_MSG}`,
      body,
    } satisfies Partial<KieError>);
  });

  it("resolves an Anthropic message unchanged", async () => {
    const { kie, seen } = kieAnswering(MESSAGE);
    await expect(claude(kie)).resolves.toEqual(MESSAGE);
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe("POST");
    expect(seen[0].url).toBe("https://api.kie.ai/claude/v1/messages");
    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(JSON.parse(seen[0].body)).toEqual(REQUEST);
    expect(seen[0].aborted).toBe(false);
  });

  it("passes the caller's abort signal to fetch", async () => {
    const { kie, seen } = kieAnswering(MESSAGE);
    const controller = new AbortController();
    controller.abort();
    await kie.claude.post.v1.messages(REQUEST, controller.signal);
    expect(seen).toHaveLength(1);
    expect(seen[0].aborted).toBe(true);
  });

  it("still parses an Anthropic-shaped error answer as before", async () => {
    const body = {
      type: "error",
      error: { type: "invalid_request_error", message: "bad max_tokens" },
    };
    const error = await claude(kieAnswering(body, 400).kie).catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(KieError);
    expect(error).toMatchObject({
      name: "KieError",
      status: 400,
      code: "invalid_request_error",
      message: "Kie Claude API error 400: bad max_tokens",
      body,
    } satisfies Partial<KieError>);
  });
});

describe("an HTTP 200 body settles /claude as it settles /anthropic (ac-f257zk)", () => {
  it.each([
    ["KIE's recorded 401 envelope", { code: 401, msg: HAR_MSG }, "rejected"],
    ["a 500 envelope", { code: 500, msg: "Internal error" }, "rejected"],
    ["an envelope with an empty msg", { code: 422, msg: "" }, "rejected"],
    ["an Anthropic message", MESSAGE, "resolved"],
    [
      "an envelope beside a content array",
      { code: 401, msg: "Unauthorized", content: [] },
      "resolved",
    ],
    [
      'an envelope beside type "message"',
      { code: 401, msg: "Unauthorized", type: "message" },
      "resolved",
    ],
    ["code 200 with a msg", { code: 200, msg: "success" }, "resolved"],
    ["a string code", { code: "401", msg: "Unauthorized" }, "resolved"],
    ["a msg that is not a string", { code: 401, msg: 42 }, "resolved"],
  ])("%s", async (_label, body, outcome) => {
    const fromClaude = await settle(claude(kieAnswering(body).kie));
    const fromAnthropic = await settle(anthropic(kieAnswering(body).kie));
    expect(Object.keys(fromClaude)).toEqual([outcome]);
    expect(fromClaude).toEqual(fromAnthropic);
  });
});
