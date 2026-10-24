import { describe, expect, it } from "vitest";
import { exchangeSucceeded } from "../../scripts/lib/exchange-succeeded.mjs";

function entry(status: unknown, body?: unknown, encoding?: string) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { response: { status, content: { text, encoding } } };
}

describe("exchangeSucceeded", () => {
  it.each([200, 204, "200"])("accepts HTTP %s by default", (status) => {
    expect(exchangeSucceeded("openai", entry(status))).toBe(true);
  });
  it.each([199, 301, 404, 429, 500, undefined, "invalid"])(
    "rejects HTTP %s even with a success envelope",
    (status) => {
      expect(exchangeSucceeded("kie", entry(status, { code: 200 }))).toBe(
        false
      );
    }
  );
  it.each([
    { code: 200, msg: "success", data: {} },
    { id: "message", type: "message", content: [], usage: {} },
    { choices: [], usage: {} },
    { output: [], status: "completed", error: null },
    { candidates: [], usageMetadata: {} },
    { code: "200" },
  ])("accepts native and proxy KIE successes: %j", (body) => {
    expect(exchangeSucceeded("kie", entry(200, body))).toBe(true);
  });
  it.each([
    { code: 422, data: null },
    { code: 401 },
    { error: { message: "failed" } },
  ])("rejects a KIE failure envelope: %j", (body) => {
    expect(exchangeSucceeded("kie", entry(200, body))).toBe(false);
  });
  it.each([undefined, "data: [DONE]", "not JSON", null, [], 42])(
    "does not invent an envelope for %j",
    (body) => {
      expect(exchangeSucceeded("kie", entry(200, body))).toBe(true);
    }
  );
  it("decodes base64 JSON and tolerates binary responses", () => {
    const encoded = Buffer.from(JSON.stringify({ code: 422 })).toString(
      "base64"
    );
    expect(exchangeSucceeded("kie", entry(200, encoded, "base64"))).toBe(false);
    expect(exchangeSucceeded("kie", entry(200, "AAECAw==", "base64"))).toBe(
      true
    );
  });
  it("distinguishes xAI submit success from a failed poll", () => {
    expect(exchangeSucceeded("xai", entry(200, { request_id: "job" }))).toBe(
      true
    );
    expect(
      exchangeSucceeded(
        "xai",
        entry(200, {
          status: "failed",
          error: { code: "invalid_argument" },
        })
      )
    ).toBe(false);
  });
  it("keeps envelope rules scoped to observed providers", () => {
    expect(exchangeSucceeded("telegram", entry(200, { ok: false }))).toBe(true);
    expect(exchangeSucceeded("openai", entry(200, { error: {} }))).toBe(true);
    expect(exchangeSucceeded("constructor", entry(200, {}))).toBe(true);
  });
});
