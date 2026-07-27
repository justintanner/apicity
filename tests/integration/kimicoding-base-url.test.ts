import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKimiCoding } from "@apicity/kimicoding";

interface CapturedRequest {
  url: string;
  authorization?: string;
  apiKey?: string;
}

describe("kimicoding dual Base URL handling", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("targets single-v1 absolute URLs with both auth headers", async () => {
    ctx = setupPolly("kimicoding/openai-base-url");
    const requests: CapturedRequest[] = [];
    ctx.polly.server.any().on("request", (req) => {
      const headers = req.headers as Record<string, string | undefined>;
      requests.push({
        url: req.url,
        authorization: headers.authorization,
        apiKey: headers["x-api-key"],
      });
    });

    const provider = createKimiCoding({
      apiKey: process.env.KIMI_CODING_API_KEY ?? "sk-test-key",
      baseURL: "https://api.kimi.com/coding/v1",
    });

    const completion = await provider.post.coding.v1.chat.completions({
      model: "k3-256k",
      messages: [{ role: "user", content: "Say OK." }],
    });
    expect(completion.object).toBe("chat.completion");

    const message = await provider.post.coding.v1.messages({
      model: "k3-256k",
      max_tokens: 256,
      messages: [{ role: "user", content: "Say OK." }],
    });
    expect(message.content).toBeTruthy();

    // REQ-005 / AC-5: the OpenAI-compatible Base URL keeps exactly one v1
    // segment on both protocol surfaces — no `v1/v1` duplication and no
    // missing separator — and both auth headers ride every request.
    expect(requests.map((request) => request.url)).toEqual([
      "https://api.kimi.com/coding/v1/chat/completions",
      "https://api.kimi.com/coding/v1/messages",
    ]);
    for (const request of requests) {
      expect(request.url.match(/\/v1\//g)?.length ?? 0).toBe(1);
      expect(request.authorization).toMatch(/^Bearer .+/);
      expect(request.apiKey).toBeTruthy();
    }
  });
});
