// ac-ekevvn: the latency note on kie.post.anthropic.v1.messages. The README
// note, the JSDoc on KieAnthropicMessagesV1Namespace.messages and the
// schema's describe text tell callers that this method uses the createKie
// timeout, 30 s by default, and how to raise it. These pins fail if the
// default or the describe text changes without the docs. Injected fetch and
// fake timers only: no network.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import { KieAnthropicMessagesRequestSchema } from "@apicity/kie/zod";
import { zodToJsonSchema } from "../../packages/cli/src/schema";

const MSG_REQ = {
  model: "claude-haiku-4-5",
  max_tokens: 1,
  messages: [{ role: "user" as const, content: "hi" }],
};

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

// Records how a call settles, without awaiting it.
function watch(p: Promise<unknown>): { value: unknown } {
  const state: { value: unknown } = { value: "pending" };
  void p.then(
    () => {
      state.value = "resolved";
    },
    (e: unknown) => {
      state.value = e;
    }
  );
  return state;
}

// Only setTimeout and clearTimeout are faked, so a real setImmediate turn
// runs every microtask the abort set off.
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

async function advance(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("post.anthropic.v1.messages on a default client", () => {
  it("gives up at the 30 s factory default", async () => {
    const kie = createKie({ apiKey: "k", fetch: hanging() });
    const call = watch(kie.post.anthropic.v1.messages(MSG_REQ));
    await advance(29_999);
    expect(call.value).toBe("pending");
    await advance(1);
    expect(call.value).toBeInstanceOf(KieError);
  });
});

describe("the apicity describe text", () => {
  it("names the 30 s default and --timeout", () => {
    const { description } = zodToJsonSchema(KieAnthropicMessagesRequestSchema);
    expect(description).toContain("30000 ms");
    expect(description).toContain("--timeout");
  });
});
