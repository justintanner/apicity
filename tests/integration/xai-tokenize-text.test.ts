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
  it("should expose payloadSchema and validatePayload", () => {
    const provider = createXaiProvider();
    const endpoint = provider.post.v1.tokenizeText;
    expect(endpoint.payloadSchema).toBeDefined();
    expect(endpoint.payloadSchema.method).toBe("POST");
    expect(endpoint.payloadSchema.path).toBe("/tokenize-text");

    const valid = endpoint.validatePayload({
      model: "grok-3",
      text: "test",
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = endpoint.validatePayload({});
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });
});
