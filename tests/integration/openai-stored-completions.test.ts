import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@apicity/openai";
import type {
  OpenAiStoredCompletionListResponse,
  OpenAiStoredCompletionMessageListResponse,
} from "@apicity/openai";

describe("openai stored completions integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list stored completions", async () => {
    ctx = setupPolly("openai/stored-completions-list");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result: OpenAiStoredCompletionListResponse =
      await provider.get.v1.chat.completions();

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.has_more).toBe("boolean");
  });

  it("should list stored completions with limit", async () => {
    ctx = setupPolly("openai/stored-completions-list-limit");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.get.v1.chat.completions({ limit: 1 });

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(1);
  });

  it("should list messages of a stored completion", async () => {
    ctx = setupPolly("openai/stored-completions-messages");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored completion
    const created = await provider.post.v1.chat.completions({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say the word test." },
      ],
      store: true,
    });
    expect(created.id).toBeTruthy();

    // Brief delay for stored completion indexing
    await new Promise((r) => setTimeout(r, 5000));

    // List messages
    const messages: OpenAiStoredCompletionMessageListResponse =
      await provider.get.v1.chat.completions.messages(created.id);

    expect(messages.object).toBe("list");
    expect(Array.isArray(messages.data)).toBe(true);
    expect(messages.data.length).toBeGreaterThan(0);

    // Clean up
    await provider.delete.v1.chat.completions(created.id);
  });
});

describe("openai stored completions payload validation", () => {
  it("should expose schema on post method", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    expect(provider.post.v1.chat.completions.schema).toBeDefined();
    expect(typeof provider.post.v1.chat.completions.schema.safeParse).toBe(
      "function"
    );
  });

  it("should validate a valid chat completion payload", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const result = provider.post.v1.chat.completions.schema.safeParse({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.success).toBe(true);
  });

  it("should reject payload missing messages", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const result = provider.post.v1.chat.completions.schema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThan(0);
  });

  it("should expose delete endpoint as a plain function", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    expect(typeof provider.delete.v1.chat.completions).toBe("function");
  });
});
