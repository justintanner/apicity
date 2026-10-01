import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import { KieModelIdRequestSchema } from "@apicity/kie/zod";

/**
 * `get.api.v1.models.price` with an injected fetch: no network, no recording
 * (ac-cygxx7 REQ-003, REQ-006, REQ-007 item 5).
 */
interface Seen {
  url: string;
  method: string;
  headers: Record<string, string>;
}

// Answers the i-th call with the i-th responder (the last one repeats).
function stub(...responders: Array<() => Response>) {
  const seen: Seen[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(
      (init?.headers ?? {}) as Record<string, string>
    )) {
      headers[name.toLowerCase()] = value;
    }
    seen.push({ url: String(input), method: init?.method ?? "GET", headers });
    return responders[Math.min(seen.length, responders.length) - 1]();
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

// KIE's answer for an id the catalog does not hold (probe, 2026-09-30).
const UNKNOWN_MODEL = {
  code: 404,
  msg: "The model name you specified is not supported. Please verify your input and use one of the supported models provided by KIE.",
  data: null,
};

const MODEL = "kling/v2-1-master-text-to-video";

const PRICE = {
  code: 200,
  msg: "success",
  data: {
    model: MODEL,
    pricingDesc:
      "A 5-second video costs 160 credits ($0.80), and a 10-second video costs 320 credits ($1.60).",
  },
};

// KIE has no pricing text for this model (probe, 2026-09-30).
const NO_PRICING = {
  code: 200,
  msg: "success",
  data: { model: "ideogram/v3-remix", pricingDesc: null },
};

const RATE_LIMITED = {
  code: 429,
  msg: "Your call frequency is too high. Please try again later.",
  data: null,
};

describe("kie get.api.v1.models.price (injected fetch)", () => {
  it("keeps a two-segment id's slash literal", async () => {
    const { seen, provider } = stub(json(PRICE));
    await provider.get.api.v1.models.price(MODEL);
    await provider.get.api.v1.models.price("veo-3-1");

    expect(seen.map((call) => [call.method, call.url])).toEqual([
      [
        "GET",
        "https://api.kie.ai/api/v1/models/kling/v2-1-master-text-to-video/price",
      ],
      ["GET", "https://api.kie.ai/api/v1/models/veo-3-1/price"],
    ]);
  });

  it("shares the catalog-id schema of the per-model leaves", () => {
    const models = createKie({ apiKey: "x" }).get.api.v1.models;

    expect(models.price.schema).toBe(KieModelIdRequestSchema);
    expect(models.price.schema).toBe(models.modelSchema.schema);
  });

  it("carries the key only as `Authorization: Bearer`", async () => {
    const { seen, provider } = stub(json(PRICE));
    await provider.get.api.v1.models.price(MODEL);

    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
  });

  it("resolves the pricing text unchanged", async () => {
    const { provider } = stub(json(PRICE));
    await expect(provider.get.api.v1.models.price(MODEL)).resolves.toEqual(
      PRICE
    );
  });

  it("resolves a model with no pricing text", async () => {
    const { provider } = stub(json(NO_PRICING));
    const res = await provider.get.api.v1.models.price("ideogram/v3-remix");

    expect(res.data.pricingDesc).toBeNull();
  });

  it("rejects an unknown model's 404 envelope", async () => {
    const { provider } = stub(json(UNKNOWN_MODEL));
    await expect(
      provider.get.api.v1.models.price("no-such-model")
    ).rejects.toMatchObject({
      name: "KieError",
      status: 404,
    } satisfies Partial<KieError>);
  });

  it("rejects the 429 envelope with status 429", async () => {
    const { provider } = stub(json(RATE_LIMITED));
    await expect(provider.get.api.v1.models.price(MODEL)).rejects.toMatchObject(
      {
        name: "KieError",
        status: 429,
      } satisfies Partial<KieError>
    );
  });

  it("rejects a success envelope that is missing its payload", async () => {
    const { provider } = stub(
      json({ code: 200, msg: "success", data: { model: MODEL } })
    );
    const error = await provider.get.api.v1.models
      .price(MODEL)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KieError);
    expect((error as KieError).message).toContain("missing its payload");
  });
});
