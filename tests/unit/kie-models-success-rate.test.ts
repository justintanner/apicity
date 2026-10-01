import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import { KieModelIdRequestSchema } from "@apicity/kie/zod";

/**
 * `get.api.v1.models.successRate` with an injected fetch: no network, no
 * recording (ac-cygxx7 REQ-004, REQ-006, REQ-007 item 5).
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

// Two buckets of the probe's answer: one with traffic, one without.
const RATES = {
  code: 200,
  msg: "success",
  data: {
    model: MODEL,
    points: [
      {
        start: "2026-09-29T21:30:00Z",
        end: "2026-09-29T21:40:00Z",
        successRate: 91.0,
        errorRate: 9.0,
        isNormal: true,
      },
      {
        start: "2026-09-29T21:40:00Z",
        end: "2026-09-29T21:50:00Z",
        successRate: null,
        errorRate: null,
        isNormal: true,
      },
    ],
  },
};

const NO_DATA = {
  code: 200,
  msg: "success",
  data: { model: MODEL, points: [] },
};

describe("kie get.api.v1.models.successRate (injected fetch)", () => {
  it("keeps a two-segment id's slash literal", async () => {
    const { seen, provider } = stub(json(RATES));
    await provider.get.api.v1.models.successRate(MODEL);

    expect(seen.map((call) => [call.method, call.url])).toEqual([
      [
        "GET",
        "https://api.kie.ai/api/v1/models/kling/v2-1-master-text-to-video/success-rate",
      ],
    ]);
  });

  it("shares the catalog-id schema of the per-model leaves", () => {
    const models = createKie({ apiKey: "x" }).get.api.v1.models;

    expect(models.successRate.schema).toBe(KieModelIdRequestSchema);
  });

  it("carries the key only as `Authorization: Bearer`", async () => {
    const { seen, provider } = stub(json(RATES));
    await provider.get.api.v1.models.successRate(MODEL);

    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
  });

  it("resolves points whose rates are null in a bucket with no traffic", async () => {
    const { provider } = stub(json(RATES));
    const res = await provider.get.api.v1.models.successRate(MODEL);

    expect(res).toEqual(RATES);
    expect(res.data.points[1].successRate).toBeNull();
    expect(res.data.points[1].errorRate).toBeNull();
  });

  it("resolves an empty points list: no monitoring data", async () => {
    const { provider } = stub(json(NO_DATA));
    const res = await provider.get.api.v1.models.successRate(MODEL);

    expect(res.data.points).toEqual([]);
  });

  it("rejects an unknown model's 404 envelope", async () => {
    const { provider } = stub(json(UNKNOWN_MODEL));
    await expect(
      provider.get.api.v1.models.successRate("no-such-model")
    ).rejects.toMatchObject({
      name: "KieError",
      status: 404,
    } satisfies Partial<KieError>);
  });

  it("rejects a success envelope that is missing its payload", async () => {
    const { provider } = stub(
      json({ code: 200, msg: "success", data: { model: MODEL } })
    );
    const error = await provider.get.api.v1.models
      .successRate(MODEL)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KieError);
    expect((error as KieError).message).toContain("missing its payload");
  });
});
