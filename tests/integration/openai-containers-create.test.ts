import { afterEach, describe, expect, it } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createOpenAi } from "@apicity/openai";

const recordingName = "openai/containers-create";

describe("openai containers create integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("should create a container", async () => {
    ctx = setupPolly(recordingName);

    const provider = createOpenAi({
      apiKey: process.env.OPENAI_API_KEY ?? "sk-test-key",
    });

    const result = await provider.post.v1.containers({
      name: "apicity-container-create-test",
      expires_after: {
        anchor: "last_active_at",
        minutes: 20,
      },
      memory_limit: "1g",
      network_policy: {
        type: "disabled",
      },
    });

    expect(result.id).toMatch(/^cntr_/);
    expect(result.object).toBe("container");
    expect(result.name).toBe("apicity-container-create-test");
    expect(result.created_at).toBeGreaterThan(0);
    expect(typeof result.status).toBe("string");
  });

  it("exposes the create schema", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    expect(provider.post.v1.containers.schema).toBeDefined();
    expect(typeof provider.post.v1.containers.schema.safeParse).toBe(
      "function"
    );
  });

  it("validates create payloads", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    const result = provider.post.v1.containers.schema.safeParse({
      name: "schema-test",
      file_ids: ["file_abc123"],
      memory_limit: "4g",
      network_policy: {
        type: "allowlist",
        allowed_domains: ["api.example.com"],
        domain_secrets: [
          {
            domain: "api.example.com",
            name: "API_TOKEN",
            value: "secret",
          },
        ],
      },
      skills: [
        {
          type: "skill_reference",
          skill_id: "openai-spreadsheets",
          version: "latest",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    const result = provider.post.v1.containers.schema.safeParse({});

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes("name"))
    ).toBe(true);
  });

  it("rejects invalid enum values", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });
    const result = provider.post.v1.containers.schema.safeParse({
      name: "schema-test",
      memory_limit: "2g",
    });

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some((issue) => issue.path.includes("memory_limit"))
    ).toBe(true);
  });
});
