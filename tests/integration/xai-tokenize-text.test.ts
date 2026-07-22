import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXaiProvider } from "../xai-provider";

describe("xai tokenize-text integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // POST /v1/tokenize-text
  it("should tokenize text and return token details", async () => {
    ctx = setupPolly("xai/tokenize-text");
    const provider = createXaiProvider();
    const result = await provider.post.v1.tokenizeText({
      model: "grok-3",
      text: "Hello world!",
    });
    expect(Array.isArray(result.token_ids)).toBe(true);
    expect(result.token_ids.length).toBeGreaterThan(0);
    const token = result.token_ids[0];
    expect(typeof token.token_id).toBe("number");
    expect(typeof token.string_token).toBe("string");
    expect(Array.isArray(token.token_bytes)).toBe(true);
    expect(token.token_bytes.length).toBeGreaterThan(0);
    expect(typeof token.token_bytes[0]).toBe("number");
  });

  // Payload validation
  it("should expose schema with safeParse", () => {
    const provider = createXaiProvider();
    const endpoint = provider.post.v1.tokenizeText;
    expect(endpoint.schema).toBeDefined();
    expect(typeof endpoint.schema.safeParse).toBe("function");

    const valid = endpoint.schema.safeParse({
      model: "grok-3",
      text: "test",
    });
    expect(valid.success).toBe(true);

    const invalid = endpoint.schema.safeParse({});
    expect(invalid.success).toBe(false);
    if (invalid.success) throw new Error("expected safeParse failure");
    expect(invalid.error?.issues.length).toBeGreaterThan(0);
  });
});
