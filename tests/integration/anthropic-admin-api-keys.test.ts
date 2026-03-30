import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic admin api keys", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/admin-api-keys");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should list api keys", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.api_keys.list({ limit: 5 });
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toBeTruthy();
    expect(result.data[0].type).toBe("api_key");
    expect(result.data[0].name).toBeTruthy();
    expect(result.data[0].status).toBeTruthy();
    expect(result.data[0].partial_key_hint).toBeTruthy();
  });

  it("should retrieve an api key", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.api_keys.retrieve(
      "apikey_01TestApiKey123456"
    );
    expect(result.id).toBe("apikey_01TestApiKey123456");
    expect(result.type).toBe("api_key");
    expect(result.name).toBeTruthy();
    expect(result.status).toBe("active");
  });

  it("should update an api key", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      adminApiKey:
        process.env.ANTHROPIC_ADMIN_API_KEY ?? "sk-ant-admin-test-key",
    });
    const result = await provider.v1.organizations.api_keys.update(
      "apikey_01TestApiKey123456",
      { name: "Updated Key Name", status: "inactive" }
    );
    expect(result.id).toBe("apikey_01TestApiKey123456");
    expect(result.type).toBe("api_key");
    expect(result.name).toBe("Updated Key Name");
    expect(result.status).toBe("inactive");
  });
});
