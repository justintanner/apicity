import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";

/**
 * `get.xai.v1.models` with an injected fetch: no network, no recording.
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
  object: "list",
  data: [{ id: "grok-test-1", object: "model", aliases: [] }],
};

describe("kie get.xai.v1.models (injected fetch)", () => {
  it("sends a bare GET to /xai/v1/models", async () => {
    const { seen, provider } = stub(json(LISTING));
    await provider.get.xai.v1.models();

    expect(seen.map((call) => [call.method, call.url])).toEqual([
      ["GET", "https://api.kie.ai/xai/v1/models"],
    ]);
  });

  it("carries the key only as `Authorization: Bearer`", async () => {
    const { seen, provider } = stub(json(LISTING));
    await provider.get.xai.v1.models();

    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
  });

  it("resolves a listing unchanged", async () => {
    const { provider } = stub(json(LISTING));
    await expect(provider.get.xai.v1.models()).resolves.toEqual(LISTING);
  });

  it("rejects KIE's HTTP-200 envelope with the envelope's code", async () => {
    const { provider } = stub(json({ code: 401, msg: "Unauthorized" }));
    await expect(provider.get.xai.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 401,
    } satisfies Partial<KieError>);
  });

  it("resolves a body that carries a code beside its data array", async () => {
    const body = { ...LISTING, code: 500, msg: "partial" };
    const { provider } = stub(json(body));
    await expect(provider.get.xai.v1.models()).resolves.toEqual(body);
  });

  it("rejects a non-2xx answer with its HTTP status", async () => {
    const { provider } = stub(
      json({ error: { type: "permission_error", message: "no" } }, 403)
    );
    await expect(provider.get.xai.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 403,
    } satisfies Partial<KieError>);
  });

  it("rejects a body that is not JSON with a KieError", async () => {
    const { provider } = stub(() => new Response("<html>bad gateway</html>"));
    const error = await provider.get.xai.v1.models().catch((e) => e);
    expect(error).toBeInstanceOf(KieError);
  });
});
