import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import { KieAnthropicModelsRequestSchema } from "@apicity/kie/zod";

/**
 * `get.anthropic.v1.models` with an injected fetch: no network, no recording.
 * Pins the request line and the credential header, and each way the leaf must
 * reject rather than resolve (REQ-006 of ac-wma4p9).
 */
interface Seen {
  url: string;
  method: string;
  headers: Record<string, string>;
}

function stub(respond: () => Response) {
  const seen: Seen[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(
      (init?.headers ?? {}) as Record<string, string>
    )) {
      headers[name.toLowerCase()] = value;
    }
    seen.push({ url: String(input), method: init?.method ?? "GET", headers });
    return respond();
  }) as typeof fetch;
  return {
    seen,
    provider: createKie({ apiKey: "test-key", fetch: fetchImpl }),
  };
}

function json(body: unknown, status = 200): () => Response {
  return () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

const LISTING = {
  data: [{ id: "claude-test-1-0", type: "model" }],
  has_more: false,
  first_id: "claude-test-1-0",
  last_id: "claude-test-1-0",
};

describe("kie get.anthropic.v1.models (injected fetch)", () => {
  it("sends a bare GET with no query string without after_id", async () => {
    const { seen, provider } = stub(json(LISTING));
    await provider.get.anthropic.v1.models();
    await provider.get.anthropic.v1.models({});

    expect(seen.map((call) => [call.method, call.url])).toEqual([
      ["GET", "https://api.kie.ai/anthropic/v1/models"],
      ["GET", "https://api.kie.ai/anthropic/v1/models"],
    ]);
  });

  it("pages with an encoded after_id", async () => {
    const { seen, provider } = stub(json(LISTING));
    await provider.get.anthropic.v1.models({ after_id: "abc" });
    await provider.get.anthropic.v1.models({ after_id: "a b/c" });

    expect(seen.map((call) => call.url)).toEqual([
      "https://api.kie.ai/anthropic/v1/models?after_id=abc",
      "https://api.kie.ai/anthropic/v1/models?after_id=a%20b%2Fc",
    ]);
  });

  it("describes after_id as its only request field", () => {
    const schema = createKie({ apiKey: "x" }).get.anthropic.v1.models.schema;

    expect(schema).toBe(KieAnthropicModelsRequestSchema);
    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ after_id: "abc" }).success).toBe(true);
    expect(schema.safeParse({ after_id: "" }).success).toBe(false);
  });

  it("carries the key only as `Authorization: Bearer`", async () => {
    const { seen, provider } = stub(json(LISTING));
    await provider.get.anthropic.v1.models();

    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
  });

  it("resolves a listing unchanged", async () => {
    const { provider } = stub(json(LISTING));
    await expect(provider.get.anthropic.v1.models()).resolves.toEqual(LISTING);
  });

  it("rejects KIE's HTTP-200 envelope with the envelope's code", async () => {
    const { provider } = stub(json({ code: 401, msg: "Unauthorized" }));
    await expect(provider.get.anthropic.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("resolves a body that carries a code beside its data array", async () => {
    const body = { ...LISTING, code: 500, msg: "partial" };
    const { provider } = stub(json(body));
    await expect(provider.get.anthropic.v1.models()).resolves.toEqual(body);
  });

  it("rejects a non-2xx answer with its HTTP status", async () => {
    const { provider } = stub(
      json({ error: { type: "permission_error", message: "no" } }, 403)
    );
    await expect(provider.get.anthropic.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 403,
    } satisfies Partial<KieError>);
  });

  it("rejects a body that is not JSON with a KieError", async () => {
    const { provider } = stub(() => new Response("<html>bad gateway</html>"));
    const error = await provider.get.anthropic.v1.models().catch((e) => e);
    expect(error).toBeInstanceOf(KieError);
  });
});
