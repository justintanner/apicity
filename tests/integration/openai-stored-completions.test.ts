import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";
import type {
  OpenAiStoredCompletionDeleteResponse,
  OpenAiStoredCompletionListResponse,
  OpenAiStoredCompletionMessageListResponse,
} from "@nakedapi/openai";

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
      await provider.v1.chat.completions.list();

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.has_more).toBe("boolean");
  });

  it("should list stored completions with limit", async () => {
    ctx = setupPolly("openai/stored-completions-list-limit");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.v1.chat.completions.list({ limit: 1 });

    expect(result.object).toBe("list");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeLessThanOrEqual(1);
  });

  it("should create, retrieve, update, and delete a stored completion", async () => {
    ctx = setupPolly("openai/stored-completions-crud");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored completion
    const created = await provider.v1.chat.completions({
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
    const retrieved = await provider.v1.chat.completions.retrieve(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.object).toBe("chat.completion");

    // Update metadata
    const updated = await provider.v1.chat.completions.update(created.id, {
      metadata: { test_key: "updated_value" },
    });
    expect(updated.id).toBe(created.id);
    expect(updated.metadata?.test_key).toBe("updated_value");

    // Delete it
    const deleted: OpenAiStoredCompletionDeleteResponse =
      await provider.v1.chat.completions.del(created.id);
    expect(deleted.id).toBe(created.id);
    expect(deleted.object).toBe("chat.completion.deleted");
    expect(deleted.deleted).toBe(true);
  });

  it("should list messages of a stored completion", async () => {
    ctx = setupPolly("openai/stored-completions-messages");
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    // Create a stored completion
    const created = await provider.v1.chat.completions({
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
      await provider.v1.chat.completions.messages.list(created.id);

    expect(messages.object).toBe("list");
    expect(Array.isArray(messages.data)).toBe(true);
    expect(messages.data.length).toBeGreaterThan(0);

    // Clean up
    await provider.v1.chat.completions.del(created.id);
  });

  describe("payload validation", () => {
    it("should expose payloadSchema on update method", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const schema = provider.v1.chat.completions.update.payloadSchema;
      expect(schema.method).toBe("POST");
      expect(schema.path).toBe("/chat/completions/{completion_id}");
      expect(schema.fields.metadata.required).toBe(true);
    });

    it("should validate a valid update payload", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const result = provider.v1.chat.completions.update.validatePayload({
        metadata: { key: "value" },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject update payload missing metadata", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const result = provider.v1.chat.completions.update.validatePayload({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should expose payloadSchema on del method", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const schema = provider.v1.chat.completions.del.payloadSchema;
      expect(schema.method).toBe("DELETE");
      expect(schema.path).toBe("/chat/completions/{completion_id}");
    });

    it("should expose store field in chat completions schema", () => {
      const provider = openai({ apiKey: "sk-test-key" });
      const schema = provider.v1.chat.completions.payloadSchema;
      expect(schema.fields.store.type).toBe("boolean");
      expect(schema.fields.metadata.type).toBe("object");
    });
  });
});
