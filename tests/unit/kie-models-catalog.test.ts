import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createKie, KieError, withRetry } from "@apicity/kie";
import { KIE_MODEL_TASK_TYPES, KieModelsRequestSchema } from "@apicity/kie/zod";

/**
 * `get.api.v1.models` with an injected fetch: no network, no recording. Pins
 * the request line, the credential header and each way the leaf must reject
 * rather than resolve (ac-cygxx7 REQ-001, REQ-006, REQ-007 item 5). The
 * envelopes are the ones KIE returned to the requirements-stage probes.
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

const CATALOG = {
  code: 200,
  msg: "success",
  data: {
    total: 1,
    models: [
      {
        model: "kling/v2-1-master-text-to-video",
        slug: "kling/v2-1-master-text-to-video",
        title: "Kling 2.1 Master",
        provider: "Kling",
        taskType: ["Text to Video"],
        description: null,
        pricingDesc: "A 5-second video costs 160 credits ($0.80).",
      },
    ],
  },
};

const NO_MATCH = { code: 200, msg: "success", data: { total: 0, models: [] } };

const UNAUTHORIZED = {
  code: 401,
  msg: "Unauthorized – Authentication failed. Please check that your Authorization and Content-Type headers are correctly set.",
};

const RATE_LIMITED = {
  code: 429,
  msg: "Your call frequency is too high. Please try again later.",
  data: null,
};

// The committed recording KIE_MODEL_TASK_TYPES was filled from (OQ-4).
const CATALOG_HAR =
  "tests/recordings/kie_2079838932/models-catalog_3489975681/recording.har";

describe("kie get.api.v1.models (injected fetch)", () => {
  it("sends a bare GET with no query string without a filter", async () => {
    const { seen, provider } = stub(json(CATALOG));
    await provider.get.api.v1.models();
    await provider.get.api.v1.models({});
    await provider.get.api.v1.models({ taskType: [], provider: "", q: "" });

    expect(seen.map((call) => [call.method, call.url])).toEqual([
      ["GET", "https://api.kie.ai/api/v1/models"],
      ["GET", "https://api.kie.ai/api/v1/models"],
      ["GET", "https://api.kie.ai/api/v1/models"],
    ]);
  });

  it("sends one comma-joined taskType, then provider and q, encoded", async () => {
    const { seen, provider } = stub(json(CATALOG));
    await provider.get.api.v1.models({ taskType: "Text to Video" });
    await provider.get.api.v1.models({
      q: "master & more",
      provider: "Black Forest Labs",
      taskType: ["Text to Video", "Image to Video"],
    });

    expect(seen.map((call) => call.url)).toEqual([
      "https://api.kie.ai/api/v1/models?taskType=Text%20to%20Video",
      "https://api.kie.ai/api/v1/models?taskType=Text%20to%20Video,Image%20to%20Video&provider=Black%20Forest%20Labs&q=master%20%26%20more",
    ]);
    for (const call of seen) expect(call.url).not.toContain(" ");
  });

  it("describes the three filters, taskType from the recorded vocabulary", () => {
    const schema = createKie({ apiKey: "x" }).get.api.v1.models.schema;

    expect(schema).toBe(KieModelsRequestSchema);
    expect(schema.safeParse({}).success).toBe(true);
    expect(
      schema.safeParse({
        taskType: "Text to Video",
        provider: "Kling",
        q: "master",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ taskType: ["Text to Video", "Chat"] }).success
    ).toBe(true);
    // A category KIE adds later parses through the title-case alias.
    expect(schema.safeParse({ taskType: "Image to Music" }).success).toBe(true);
    expect(schema.safeParse({ taskType: "text to video" }).success).toBe(false);
    expect(schema.safeParse({ taskType: "" }).success).toBe(false);
    expect(schema.safeParse({ provider: 5 }).success).toBe(false);
  });

  it("enumerates the recorded catalog's task types in first-appearance order", () => {
    const har = JSON.parse(readFileSync(CATALOG_HAR, "utf8")) as {
      log: { entries: Array<{ response: { content: { text: string } } }> };
    };
    const body = JSON.parse(har.log.entries[0].response.content.text) as {
      data: { models: Array<{ taskType: string[] }> };
    };
    const recorded: string[] = [];
    for (const model of body.data.models) {
      for (const type of model.taskType) {
        if (!recorded.includes(type)) recorded.push(type);
      }
    }

    expect([...KIE_MODEL_TASK_TYPES]).toEqual(recorded);
  });

  it("carries the key only as `Authorization: Bearer`", async () => {
    const { seen, provider } = stub(json(CATALOG));
    await provider.get.api.v1.models();

    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
  });

  it("resolves the catalog envelope unchanged", async () => {
    const { provider } = stub(json(CATALOG));
    await expect(provider.get.api.v1.models()).resolves.toEqual(CATALOG);
  });

  it("resolves a filter that matches nothing", async () => {
    const { provider } = stub(json(NO_MATCH));
    const res = await provider.get.api.v1.models({ q: "zzzz-no-such-model" });

    expect(res.data.total).toBe(0);
    expect(res.data.models).toEqual([]);
  });

  it("rejects KIE's 401 envelope with the envelope's code", async () => {
    const { provider } = stub(json(UNAUTHORIZED));
    await expect(provider.get.api.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 401,
      code: "401",
      body: UNAUTHORIZED,
    } satisfies Partial<KieError>);
  });

  it("rejects the 429 envelope, which withRetry retries", async () => {
    const { provider } = stub(json(RATE_LIMITED));
    await expect(provider.get.api.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 429,
    } satisfies Partial<KieError>);

    const retried = stub(json(RATE_LIMITED), json(CATALOG));
    const models = withRetry(retried.provider.get.api.v1.models, {
      retries: 1,
      baseMs: 0,
      jitter: false,
    });
    await expect(models({})).resolves.toEqual(CATALOG);
    expect(retried.seen).toHaveLength(2);
  });

  it("rejects a non-200 envelope even beside a models array", async () => {
    const { provider } = stub(json({ ...CATALOG, code: 503, msg: "partial" }));
    await expect(provider.get.api.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 503,
    } satisfies Partial<KieError>);
  });

  it("rejects a success envelope that is missing its payload", async () => {
    const { provider } = stub(json({ code: 200, msg: "success", data: null }));
    const error = await provider.get.api.v1.models().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KieError);
    expect((error as KieError).message).toContain("missing its payload");

    const codeless = stub(json({ msg: "success", data: CATALOG.data }));
    await expect(codeless.provider.get.api.v1.models()).rejects.toBeInstanceOf(
      KieError
    );
  });

  it("rejects an HTTP 500 with its status", async () => {
    const { provider } = stub(json({ code: 500, msg: "Server error" }, 500));
    await expect(provider.get.api.v1.models()).rejects.toMatchObject({
      name: "KieError",
      status: 500,
    } satisfies Partial<KieError>);
  });

  it("rejects a body that is not JSON with a KieError", async () => {
    const { provider } = stub(() => new Response("<html>bad gateway</html>"));
    const error = await provider.get.api.v1.models().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(KieError);
  });
});
