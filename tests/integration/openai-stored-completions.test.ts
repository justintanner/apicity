import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";
import type {
  OpenAiStoredCompletionDeleteResponse,
  OpenAiStoredCompletionListResponse,
  OpenAiStoredCompletionMessageListResponse,
} from "@nakedapi/openai";

describe("openai stored completions integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("openai/stored-completions-crud");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skip("should list stored completions", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result: OpenAiStoredCompletionListResponse =
      await provider.get.v1.chat.completions();

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.has_more).toBe("boolean");
  });

  it.skip("should list stored completions with limit", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.get.v1.chat.completions({ limit: 1 });

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(1);
  });

  it.skip("should create, retrieve, update, and delete a stored completion", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored completion
    const created = await provider.post.v1.chat.completions({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello." }],
      store: true,
      metadata: { test_key: "test_value" },
    });
    expect(created.id).toBeTruthy();
    expect(created.object).toBe("chat.completion");

    // Brief delay for stored completion indexing
    await new Promise((r) => setTimeout(r, 2000));

    // Retrieve it
    const retrieved = await provider.get.v1.chat.completions(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.object).toBe("chat.completion");

    // Update metadata
    const updated = await provider.post.v1.chat.completions(created.id, {
      metadata: { test_key: "updated_value" },
    });
    expect(updated.id).toBe(created.id);
    expect(updated.metadata?.test_key).toBe("updated_value");

    // Delete it
    const deleted: OpenAiStoredCompletionDeleteResponse =
      await provider.delete.v1.chat.completions(created.id);
    expect(deleted.id).toBe(created.id);
    expect(deleted.object).toBe("chat.completion.deleted");
    expect(deleted.deleted).toBe(true);
  });

  it.skip("should list messages of a stored completion", async () => {
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
      await provider.get.v1.chat.completionsMessages(created.id);

    expect(messages.object).toBe("list");
    expect(Array.isArray(messages.data)).toBe(true);
    expect(messages.data.length).toBeGreaterThan(0);

    // Clean up
    await provider.delete.v1.chat.completions(created.id);
  });
});

describe("openai stored completions payload validation", () => {
  it("should expose payloadSchema on post method", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const schema = provider.post.v1.chat.completions.payloadSchema;
    expect(schema.method).toBe("POST");
    expect(schema.path).toBe("/chat/completions");
    expect(schema.fields.metadata.type).toBe("object");
  });

  it("should validate a valid chat completion payload", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const result = provider.post.v1.chat.completions.validatePayload({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject payload missing messages", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const result = provider.post.v1.chat.completions.validatePayload({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should expose payloadSchema on del method", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const schema = provider.delete.v1.chat.completions.payloadSchema;
    expect(schema.method).toBe("DELETE");
    expect(schema.path).toBe("/chat/completions/{completion_id}");
  });

  it("should expose store field in chat completions schema", () => {
    const provider = openai({ apiKey: "sk-test-key" });
    const schema = provider.post.v1.chat.completions.payloadSchema;
    expect(schema.fields.store.type).toBe("boolean");
    expect(schema.fields.metadata.type).toBe("object");
  });
});
