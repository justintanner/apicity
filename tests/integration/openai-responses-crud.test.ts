import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { openai } from "@nakedapi/openai";

describe("openai responses CRUD integration", () => {
  let ctx: PollyContext;
  let createdResponseId: string | null = null;

  beforeEach(() => {
    ctx = setupPolly("openai/responses-crud");
  });

  afterEach(async () => {
    // Cleanup
    if (createdResponseId) {
      try {
        const provider = openai({
          apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
        });
        await provider.delete.v1.responses(createdResponseId);
      } catch {
        // Ignore cleanup errors
      }
      createdResponseId = null;
    }
    await teardownPolly(ctx);
  });

  it("should create a response", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    const result = await provider.post.v1.responses({
      model: "gpt-5.4-2026-03-05",
      input: [{ role: "user", content: "Hello!" }],
    });
    expect(result.id).toBeTruthy();
    expect(result.output).toBeDefined();
    createdResponseId = result.id;
  });

  it("should get a response by id", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.responses({
      model: "gpt-5.4-2026-03-05",
      input: [{ role: "user", content: "Get this" }],
    });
    createdResponseId = created.id;

    // Get
    const result = await provider.get.v1.responses(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should cancel a response", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // Create a streaming response
    const created = await provider.post.v1.responses({
      model: "gpt-5.4-2026-03-05",
      input: [{ role: "user", content: "Cancel this" }],
      stream: true,
    });
    createdResponseId = created.id;

    // Cancel
    const result = await provider.post.v1.responses.cancel(created.id);
    expect(result.id).toBe(created.id);
  });

  it("should get response input items", async () => {
    const provider = openai({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });
    // Create
    const created = await provider.post.v1.responses({
      model: "gpt-5.4-2026-03-05",
      input: [{ role: "user", content: "Input items test" }],
    });
    createdResponseId = created.id;

    // Get input items
    const result = await provider.get.v1.responses.inputItems(created.id);
    expect(result.data).toBeDefined();
  });
});
