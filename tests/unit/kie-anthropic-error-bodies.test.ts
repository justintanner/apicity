import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import { KIE_ANTHROPIC_MESSAGES_MODELS } from "@apicity/kie/zod";

// The requirements' examples X1 to X18 of ac-galahj, on both leaves that share
// parseKieAnthropicErrorBody. Each expected value is that example's row in the
// requirements' rehearsal after.jsonl. A follow-up candidate for the plan's
// F-3: the two committed 401 cases pin X1 only.

const HAR_MSG =
  "Unauthorized – Authentication failed. Please check that your Authorization and Content-Type headers are correctly set.";

const ANTHROPIC_SHAPED = {
  type: "error",
  error: { type: "invalid_request_error", message: "bad max_tokens" },
};

interface Example {
  id: string;
  status: number;
  text: string;
  code: string | undefined;
  /** What follows `PREFIX <status>: `; null for the generic `PREFIX: <status>`. */
  detail: string | null;
}

const j = (value: unknown) => JSON.stringify(value);

const EXAMPLES: Example[] = [
  // KIE's envelope: the msg reaches the message, the code comes from it.
  {
    id: "X1",
    status: 401,
    text: j({ code: 401, msg: HAR_MSG }),
    code: "401",
    detail: HAR_MSG,
  },
  {
    id: "X2",
    status: 401,
    text: j({ code: 401, msg: "Unauthorized" }),
    code: "401",
    detail: "Unauthorized",
  },
  {
    id: "X3",
    status: 401,
    text: j({ msg: "Unauthorized" }),
    code: undefined,
    detail: "Unauthorized",
  },
  {
    id: "X4",
    status: 401,
    text: j({ code: "AUTH_FAILED", msg: "Unauthorized" }),
    code: "AUTH_FAILED",
    detail: "Unauthorized",
  },
  {
    id: "X5",
    status: 500,
    text: j({ code: 401, msg: "Unauthorized" }),
    code: "401",
    detail: "Unauthorized",
  },
  {
    id: "X6",
    status: 401,
    text: j({
      error: { type: "authentication_error" },
      code: 401,
      msg: "Unauthorized",
    }),
    code: "401",
    detail: "Unauthorized",
  },
  {
    id: "X7",
    status: 401,
    text: j({ error: "invalid key", code: 401, msg: "Unauthorized" }),
    code: "401",
    detail: "Unauthorized",
  },
  {
    id: "X8",
    status: 401,
    text: j({ error: null, code: 401, msg: "Unauthorized" }),
    code: "401",
    detail: "Unauthorized",
  },
  {
    id: "X9",
    status: 401,
    text: j({ code: 401, msg: "" }),
    code: "401",
    detail: "",
  },
  // Anthropic-shaped: wins, even over a msg.
  {
    id: "X10",
    status: 400,
    text: j(ANTHROPIC_SHAPED),
    code: "invalid_request_error",
    detail: "bad max_tokens",
  },
  {
    id: "X11",
    status: 400,
    text: j({ ...ANTHROPIC_SHAPED, code: 400, msg: "ignored" }),
    code: "invalid_request_error",
    detail: "bad max_tokens",
  },
  {
    id: "X12",
    status: 529,
    text: j({
      type: "error",
      error: { type: "overloaded_error", message: "Overloaded" },
    }),
    code: "overloaded_error",
    detail: "Overloaded",
  },
  // Neither: the generic message, no code.
  {
    id: "X13",
    status: 401,
    text: j({ code: 401, msg: 42 }),
    code: undefined,
    detail: null,
  },
  {
    id: "X14",
    status: 401,
    text: j({ message: "Unauthorized" }),
    code: undefined,
    detail: null,
  },
  {
    id: "X15",
    status: 401,
    text: j({ error: { type: "authentication_error" } }),
    code: undefined,
    detail: null,
  },
  {
    id: "X16",
    status: 502,
    text: "<html>bad gateway</html>",
    code: undefined,
    detail: null,
  },
  { id: "X17", status: 401, text: "null", code: undefined, detail: null },
  {
    id: "X18",
    status: 401,
    text: j([{ code: 401, msg: "Unauthorized" }]),
    code: undefined,
    detail: null,
  },
];

function kieAnswering(example: Example) {
  return createKie({
    apiKey: "test-key",
    fetch: (async () =>
      new Response(example.text, {
        status: example.status,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch,
  });
}

const LEAVES: [
  string,
  (kie: ReturnType<typeof createKie>) => Promise<unknown>,
][] = [
  [
    "Kie Anthropic API error",
    (kie) =>
      kie.post.anthropic.v1.messages({
        model: KIE_ANTHROPIC_MESSAGES_MODELS[0],
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
  ],
  [
    "Kie Claude API error",
    (kie) =>
      kie.claude.post.v1.messages({
        model: "claude-sonnet-4-6",
        messages: [{ role: "user", content: "Hello" }],
      }),
  ],
];

describe.each(LEAVES)("non-2xx error bodies: %s", (prefix, call) => {
  it.each(EXAMPLES)("$id", async (example) => {
    const error = await call(kieAnswering(example)).then(
      () => undefined,
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(KieError);
    const { status, code, message } = error as KieError;
    expect({ status, code, message }).toEqual({
      status: example.status,
      code: example.code,
      message:
        example.detail === null
          ? `${prefix}: ${example.status}`
          : `${prefix} ${example.status}: ${example.detail}`,
    });
  });
});
