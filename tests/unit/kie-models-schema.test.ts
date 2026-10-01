import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import {
  KieCatalogModelIdSchema,
  KieModelIdRequestSchema,
} from "@apicity/kie/zod";

/**
 * `get.api.v1.models.modelSchema` with an injected fetch: no network, no
 * recording. This slice owns the `{model}` path builder and the id schema the
 * other per-model leaves reuse, so it also pins those against the committed
 * recordings (ac-cygxx7 REQ-002, REQ-005, REQ-006, REQ-007 items 2 and 5).
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

const DOCUMENT = {
  code: 200,
  msg: "success",
  data: {
    model: MODEL,
    openapi: {
      openapi: "3.1.0",
      info: { title: "Kling 2.1 Master" },
      paths: { "/api/v1/jobs/createTask": { post: {} } },
      components: { schemas: {} },
    },
  },
};

// The one model the 2026-09-30 sweep found without a synced document.
const NOT_SYNCED = {
  code: 200,
  msg: "success",
  data: { model: "google/gemini-3-8-flash-tts", openapi: null },
};

const RECORDINGS = "tests/recordings/kie_2079838932";
const CATALOG_HAR = `${RECORDINGS}/models-catalog_3489975681/recording.har`;
const PER_MODEL_DIR = /^models-(schema|price|success-rate)(-auth-error)?_\d+$/;
const PER_MODEL_URL =
  /^https:\/\/api\.kie\.ai\/api\/v1\/models\/(.+)\/(schema|price|success-rate)$/;

interface HarFile {
  log: {
    entries: Array<{
      request: { url: string };
      response: { content: { text: string } };
    }>;
  };
}

function readHar(file: string): HarFile {
  return JSON.parse(readFileSync(file, "utf8")) as HarFile;
}

function catalogIds(): string[] {
  const text = readHar(CATALOG_HAR).log.entries[0].response.content.text;
  const body = JSON.parse(text) as {
    data: { models: Array<{ model: string }> };
  };
  return body.data.models.map((entry) => entry.model);
}

describe("kie get.api.v1.models.modelSchema (injected fetch)", () => {
  it("keeps a two-segment id's slash literal and encodes the rest", async () => {
    const { seen, provider } = stub(json(DOCUMENT));
    const leaf = provider.get.api.v1.models.modelSchema;
    await leaf("gpt-image-2-text-to-image");
    await leaf(MODEL);
    await leaf("ai-music-api/timeStamped-lyrics");
    await leaf("a?b");
    await leaf(" a b ");

    expect(seen.map((call) => [call.method, call.url])).toEqual([
      [
        "GET",
        "https://api.kie.ai/api/v1/models/gpt-image-2-text-to-image/schema",
      ],
      [
        "GET",
        "https://api.kie.ai/api/v1/models/kling/v2-1-master-text-to-video/schema",
      ],
      [
        "GET",
        "https://api.kie.ai/api/v1/models/ai-music-api/timeStamped-lyrics/schema",
      ],
      ["GET", "https://api.kie.ai/api/v1/models/a%3Fb/schema"],
      ["GET", "https://api.kie.ai/api/v1/models/%20a%20b%20/schema"],
    ]);
  });

  it("describes its path input as a catalog id", () => {
    const schema = createKie({ apiKey: "x" }).get.api.v1.models.modelSchema
      .schema;

    expect(schema).toBe(KieModelIdRequestSchema);
    for (const model of [
      MODEL,
      "gpt-image-2-text-to-image",
      "ai-music-api/timeStamped-lyrics",
    ]) {
      expect(schema.safeParse({ model }).success, model).toBe(true);
    }
    for (const model of ["", "a/b/c", "/x", "x/", "a?b", "a b", "-x"]) {
      expect(schema.safeParse({ model }).success, model).toBe(false);
    }
  });

  it("accepts every id of the committed catalog recording", () => {
    const ids = catalogIds();

    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(KieCatalogModelIdSchema.safeParse(id).success, id).toBe(true);
    }
  });

  it("records every per-model call with one two-segment catalog id", () => {
    const ids = new Set<string>();
    for (const dir of readdirSync(RECORDINGS)) {
      if (!PER_MODEL_DIR.test(dir)) continue;
      for (const entry of readHar(`${RECORDINGS}/${dir}/recording.har`).log
        .entries) {
        const match = PER_MODEL_URL.exec(entry.request.url);
        expect(match, entry.request.url).not.toBeNull();
        if (match) ids.add(match[1]);
      }
    }

    expect(ids.size).toBe(1);
    const [id] = [...ids];
    expect(id.split("/")).toHaveLength(2);
    expect(catalogIds()).toContain(id);
  });

  it("carries the key only as `Authorization: Bearer`", async () => {
    const { seen, provider } = stub(json(DOCUMENT));
    await provider.get.api.v1.models.modelSchema(MODEL);

    expect(seen[0].headers.authorization).toBe("Bearer test-key");
    expect(seen[0].headers.apikey).toBeUndefined();
    expect(seen[0].headers["x-api-key"]).toBeUndefined();
  });

  it("resolves the document unchanged", async () => {
    const { provider } = stub(json(DOCUMENT));
    await expect(
      provider.get.api.v1.models.modelSchema(MODEL)
    ).resolves.toEqual(DOCUMENT);
  });

  it("resolves a model whose document is not synced yet", async () => {
    const { provider } = stub(json(NOT_SYNCED));
    const res = await provider.get.api.v1.models.modelSchema(
      "google/gemini-3-8-flash-tts"
    );

    expect(res.data.openapi).toBeNull();
  });

  it("rejects an unknown model's 404 envelope", async () => {
    const { provider } = stub(json(UNKNOWN_MODEL));
    await expect(
      provider.get.api.v1.models.modelSchema("no-such-model")
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
      .modelSchema(MODEL)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KieError);
    expect((error as KieError).message).toContain("missing its payload");
  });

  it("rejects an HTTP 500 and a body that is not JSON", async () => {
    const failed = stub(json({ code: 500, msg: "Server error" }, 500));
    await expect(
      failed.provider.get.api.v1.models.modelSchema(MODEL)
    ).rejects.toMatchObject({
      name: "KieError",
      status: 500,
    } satisfies Partial<KieError>);

    const garbled = stub(() => new Response("<html>bad gateway</html>"));
    const error = await garbled.provider.get.api.v1.models
      .modelSchema(MODEL)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(KieError);
  });
});
