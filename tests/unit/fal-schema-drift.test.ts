import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createFal } from "../../packages/provider/fal/src";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "../../packages/provider/fal/src/zod";
import {
  DRIFT_CLASSES,
  DRIFT_USER_AGENT,
  exitCodeFor,
  fetchDocuments,
  liveStates,
  oursJsonSchema,
  pairEndpoints,
  queueOpenApiUrl,
  schemaDrift,
} from "../../scripts/lib/fal-schema-drift.mjs";

// scripts/fal-schema-drift.mjs compares our fal request schemas with fal's live
// queue OpenAPI documents, which CI cannot fetch. These hold the comparer to
// small documents shaped like fal's (an input component behind a $ref, Optional
// fields as anyOf [T, null]), with our side built from real zod schemas.

interface Diff {
  class: string;
  endpoint: string;
  field?: string;
  facet?: string;
  ours?: unknown;
  live?: unknown;
  reason?: string;
  status?: number | null;
  detail?: Record<string, unknown>;
}

interface Report {
  counts: Record<string, number>;
  endpoints: { total: number; compared: number; same: number };
  differences: Diff[];
}

const ID = "vendor/model/text-to-video";

function falDocument(
  input: Record<string, unknown>,
  components: Record<string, unknown> = {},
  endpointId = ID
) {
  return {
    openapi: "3.1.0",
    paths: {
      [`/${endpointId}/requests/{request_id}`]: { get: {} },
      [`/${endpointId}`]: {
        post: {
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ModelInput" },
              },
            },
          },
        },
      },
    },
    components: { schemas: { ModelInput: input, ...components } },
  };
}

function drift(
  ours: z.ZodType,
  doc: unknown,
  status = 200,
  unmapped: Diff[] = []
): Report {
  return schemaDrift({
    endpoints: [{ id: ID, ours: oursJsonSchema(ours) }],
    documents: new Map([[ID, { status, body: doc }]]),
    unmapped,
  }) as unknown as Report;
}

const pick = (report: Report, cls: string) =>
  report.differences
    .filter((diff) => diff.class === cls)
    .map(({ endpoint: _endpoint, ...rest }) => rest);

describe("fal schema drift comparer", () => {
  it("agrees when both sides state the same limits", () => {
    const ours = z.object({
      prompt: z.string().min(1).max(20000),
      duration: z.number().int().min(2).max(30).nullable().optional(),
      resolution: z.enum(["480p", "720p"]).default("720p"),
      seed: z.number().int().optional(),
    });
    const report = drift(
      ours,
      falDocument({
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: { type: "string", minLength: 1, maxLength: 20000 },
          duration: {
            anyOf: [
              { type: "integer", minimum: 2, maximum: 30 },
              { type: "null" },
            ],
          },
          resolution: { type: "string", enum: ["480p", "720p"] },
          // zod's .int() exports the safe-integer range; fal states none.
          seed: { anyOf: [{ type: "integer" }, { type: "null" }] },
        },
      })
    );
    expect(report.differences).toEqual([]);
    expect(report.endpoints).toEqual({ total: 1, compared: 1, same: 1 });
    expect(exitCodeFor(report)).toBe(0);
  });

  it("reports STRICTER where we reject what fal accepts", () => {
    const ours = z.object({
      prompt: z.string().min(1).max(5000),
      duration: z.number().int().min(1).max(15),
      resolution: z.enum(["720p", "1080p"]),
      image_urls: z.array(z.string()).min(1).max(3),
      count: z.number().int(),
    });
    const report = drift(
      ours,
      falDocument({
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: {
            description: "Prompt. Max 5,000 characters.",
            type: "string",
            minLength: 1,
          },
          duration: { type: "integer", minimum: 1, maximum: 30 },
          // Names our members, but its enum is a closed superset: no hint.
          resolution: {
            description: "One of 720p, 1080p or 4k.",
            type: "string",
            enum: ["720p", "1080p", "4k"],
          },
          image_urls: { type: "array", items: { type: "string" } },
          count: { type: "number" },
        },
      })
    );
    expect(pick(report, "STRICTER")).toEqual([
      {
        class: "STRICTER",
        field: "count",
        facet: "required",
        ours: "required",
        live: "optional",
      },
      {
        class: "STRICTER",
        field: "count",
        facet: "type",
        ours: "integer",
        live: "number",
      },
      {
        class: "STRICTER",
        field: "duration",
        facet: "maximum",
        ours: 15,
        live: 30,
      },
      {
        class: "STRICTER",
        field: "duration",
        facet: "required",
        ours: "required",
        live: "optional",
      },
      {
        class: "STRICTER",
        field: "image_urls",
        facet: "maxItems",
        ours: 3,
        live: null,
      },
      {
        class: "STRICTER",
        field: "image_urls",
        facet: "minItems",
        ours: 1,
        live: 0,
      },
      {
        class: "STRICTER",
        field: "image_urls",
        facet: "required",
        ours: "required",
        live: "optional",
      },
      {
        class: "STRICTER",
        field: "prompt",
        facet: "maxLength",
        ours: 5000,
        live: null,
        // fal's prose states the limit its schema omits.
        detail: { liveDescriptionStates: true },
      },
      {
        class: "STRICTER",
        field: "resolution",
        facet: "enum",
        ours: ["720p", "1080p"],
        live: ["720p", "1080p", "4k"],
        detail: { liveOnly: ["4k"] },
      },
      {
        class: "STRICTER",
        field: "resolution",
        facet: "required",
        ours: "required",
        live: "optional",
      },
    ]);
    expect(pick(report, "LOOSER")).toEqual([]);
    expect(exitCodeFor(report)).toBe(1);
  });

  it("reports LOOSER where we accept what fal rejects", () => {
    const ours = z.object({
      prompt: z.string(),
      guidance: z.number().min(1),
      mode: z.enum(["low", "medium"]),
      duration: z.number(),
      size: z.string().optional(),
    });
    const report = drift(
      ours,
      falDocument({
        type: "object",
        required: ["prompt", "guidance", "mode", "duration", "size"],
        properties: {
          prompt: { type: "string", minLength: 3, maxLength: 2500 },
          guidance: { type: "number", exclusiveMinimum: 1 },
          mode: { type: "string", enum: ["medium", "high"] },
          duration: { type: "integer" },
          size: { type: "string" },
        },
      })
    );
    expect(pick(report, "LOOSER")).toEqual([
      {
        class: "LOOSER",
        field: "duration",
        facet: "type",
        ours: "number",
        live: "integer",
      },
      {
        class: "LOOSER",
        field: "guidance",
        facet: "minimum",
        ours: 1,
        live: "exclusive 1",
      },
      {
        class: "LOOSER",
        field: "mode",
        facet: "enum",
        ours: ["low", "medium"],
        live: ["medium", "high"],
        detail: { oursOnly: ["low"] },
      },
      {
        class: "LOOSER",
        field: "prompt",
        facet: "maxLength",
        ours: null,
        live: 2500,
      },
      {
        class: "LOOSER",
        field: "prompt",
        facet: "minLength",
        ours: 0,
        live: 3,
      },
      {
        class: "LOOSER",
        field: "size",
        facet: "required",
        ours: "optional",
        live: "required",
      },
    ]);
    expect(pick(report, "STRICTER")).toEqual([
      {
        class: "STRICTER",
        field: "mode",
        facet: "enum",
        ours: ["low", "medium"],
        live: ["medium", "high"],
        detail: { liveOnly: ["high"] },
      },
    ]);
  });

  it("reports MISSING and EXTRA fields, nested ones included", () => {
    const ours = z
      .object({
        prompt: z.string(),
        legacy_flag: z.boolean(),
        elements: z.array(z.object({ image_url: z.string() })).optional(),
      })
      .strict();
    const report = drift(
      ours,
      falDocument(
        {
          type: "object",
          required: ["prompt", "aspect_ratio"],
          properties: {
            prompt: { type: "string" },
            aspect_ratio: { type: "string", enum: ["16:9", "9:16"] },
            enable_safety_checker: { type: "boolean", default: true },
            elements: {
              anyOf: [
                {
                  type: "array",
                  items: { $ref: "#/components/schemas/Element" },
                },
                { type: "null" },
              ],
            },
          },
        },
        {
          Element: {
            type: "object",
            required: ["image_url"],
            properties: {
              image_url: { type: "string" },
              voice_id: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
          },
        }
      )
    );
    expect(pick(report, "MISSING")).toEqual([
      {
        class: "MISSING",
        field: "aspect_ratio",
        facet: "field",
        ours: null,
        live: "string",
        detail: { liveRequired: true, oursRejectsUnknownFields: true },
      },
      {
        class: "MISSING",
        field: "elements[].voice_id",
        facet: "field",
        ours: null,
        live: "string",
      },
      {
        class: "MISSING",
        field: "enable_safety_checker",
        facet: "field",
        ours: null,
        live: "boolean",
        detail: { oursRejectsUnknownFields: true },
      },
    ]);
    expect(pick(report, "EXTRA")).toEqual([
      {
        class: "EXTRA",
        field: "legacy_flag",
        facet: "field",
        ours: "boolean",
        live: null,
        detail: { oursRequired: true },
      },
    ]);
  });

  it("reports GONE when fal serves no schema", () => {
    const report = drift(z.object({ prompt: z.string() }), null, 404);
    expect(report.differences).toEqual([
      {
        class: "GONE",
        endpoint: ID,
        status: 404,
        reason: "HTTP 404, no schema served",
      },
    ]);
    expect(report.endpoints.compared).toBe(0);
    expect(exitCodeFor(report)).toBe(1);
  });

  it("reports UNMAPPED when the document has no input for the endpoint", () => {
    const report = drift(
      z.object({ prompt: z.string() }),
      falDocument({ type: "object" }, {}, "vendor/other-model")
    );
    expect(report.differences).toHaveLength(1);
    expect(report.differences[0]).toMatchObject({
      class: "UNMAPPED",
      endpoint: ID,
    });
    expect(report.differences[0].reason).toContain(
      `no POST /${ID} JSON request body`
    );
    // UNMAPPED is a census line: it never changes the exit code.
    expect(exitCodeFor(report)).toBe(0);
  });

  it("compares enum members by acceptance, not by spelling", () => {
    const ours = z.object({
      // An integer range is the same set as fal's enum of its members.
      duration: z.number().int().min(5).max(8),
      // An open model-id enum: its pattern accepts the id we do not list.
      model: z.enum(["model-1"]).or(z.string().regex(/^model-\d+$/)),
      // Both booleans are fal's whole enum.
      audio: z.boolean(),
    });
    const report = drift(
      ours,
      falDocument({
        type: "object",
        properties: {
          duration: { type: "number", enum: [5, 6, 7, 8] },
          model: { type: "string", enum: ["model-1", "model-2"] },
          audio: { type: "boolean", enum: [true, false] },
        },
      })
    );
    expect(report.differences.map((diff) => [diff.class, diff.field])).toEqual([
      ["STRICTER", "audio"],
      ["STRICTER", "duration"],
      ["STRICTER", "model"],
      ["LOOSER", "model"],
    ]);
    expect(
      report.differences.filter((diff) => diff.facet !== "required")
    ).toEqual([
      expect.objectContaining({
        class: "LOOSER",
        field: "model",
        facet: "enum",
        ours: "1 listed values | string matching /^model-\\d+$/",
        live: ["model-1", "model-2"],
      }),
    ]);
  });

  it("resolves $ref, allOf and multi-type fields", () => {
    const ours = z.object({
      image_size: z
        .enum(["square", "landscape"])
        .or(
          z.object({
            width: z.number().int().max(4096),
            height: z.number().int(),
          })
        )
        .optional(),
    });
    const report = drift(
      ours,
      falDocument(
        {
          type: "object",
          properties: {
            image_size: {
              anyOf: [
                { allOf: [{ $ref: "#/components/schemas/ImageSize" }] },
                { type: "string", enum: ["square", "landscape"] },
              ],
            },
          },
        },
        {
          ImageSize: {
            type: "object",
            properties: {
              width: { type: "integer", exclusiveMinimum: 0, maximum: 14142 },
              height: { type: ["integer", "null"], maximum: 14142 },
            },
          },
        }
      )
    );
    expect(report.differences).toEqual([
      expect.objectContaining({
        class: "STRICTER",
        field: "image_size.height",
        facet: "required",
      }),
      expect.objectContaining({
        class: "STRICTER",
        field: "image_size.width",
        facet: "maximum",
        ours: 4096,
        live: 14142,
      }),
      expect.objectContaining({
        class: "STRICTER",
        field: "image_size.width",
        facet: "required",
      }),
      expect.objectContaining({
        class: "LOOSER",
        field: "image_size.height",
        facet: "maximum",
        ours: null,
        live: 14142,
      }),
      expect.objectContaining({
        class: "LOOSER",
        field: "image_size.width",
        facet: "minimum",
        ours: null,
        live: 1,
      }),
    ]);
  });

  it("orders every class and counts each one", () => {
    const report = schemaDrift({
      endpoints: [
        { id: "a/gone", ours: oursJsonSchema(z.object({})) },
        { id: ID, ours: oursJsonSchema(z.object({ extra: z.string() })) },
      ],
      documents: new Map<string, unknown>([
        ["a/gone", { status: 404, body: null }],
        [
          ID,
          {
            status: 200,
            body: falDocument({
              type: "object",
              properties: { missing: { type: "string" } },
            }),
          },
        ],
      ]),
      unmapped: [
        { class: "UNMAPPED", endpoint: "storage.upload", reason: "platform" },
      ],
    }) as unknown as Report;
    expect(Object.keys(report.counts)).toEqual([...DRIFT_CLASSES]);
    expect(report.counts).toEqual({
      STRICTER: 0,
      LOOSER: 0,
      MISSING: 1,
      EXTRA: 1,
      GONE: 1,
      UNMAPPED: 1,
    });
    expect(report.differences.map((diff) => diff.class)).toEqual([
      "MISSING",
      "EXTRA",
      "GONE",
      "UNMAPPED",
    ]);
  });
});

describe("liveStates", () => {
  it("finds a limit fal states only in prose", () => {
    expect(liveStates("Max 5,000 characters.", "maxLength", 5000)).toBe(true);
    expect(liveStates("Seed (0-2147483647).", "maximum", 2147483647)).toBe(
      true
    );
    expect(liveStates("Up to 50000 characters.", "maxLength", 5000)).toBe(
      false
    );
    expect(liveStates("Version 2.5000 notes.", "maxLength", 5000)).toBe(false);
    // One digit is too common to count.
    expect(liveStates("Use 1 image.", "minItems", 1)).toBe(false);
    expect(
      liveStates("One of disabled, fast or quality.", "enum", [
        "disabled",
        "fast",
        "quality",
      ])
    ).toBe(true);
    expect(
      liveStates("One of disabled or fast.", "enum", ["disabled", "quality"])
    ).toBe(false);
  });
});

describe("pairEndpoints", () => {
  it("pairs the registry and lists the platform leaves as UNMAPPED", () => {
    const shared = z.object({ prompt: z.string() });
    const platform = z.object({ endpoint_id: z.string() });
    const provider = {
      run: Object.assign(() => undefined, { schema: shared }),
      v1: {
        queue: { submit: Object.assign(() => undefined, { schema: platform }) },
      },
      post: {
        v1: {
          queue: {
            submit: Object.assign(() => undefined, { schema: platform }),
          },
        },
      },
    };
    const { endpoints, unmapped } = pairEndpoints({
      registry: { "b/model": shared, "a/model": shared },
      provider,
    });
    expect(endpoints.map((endpoint: { id: string }) => endpoint.id)).toEqual([
      "a/model",
      "b/model",
    ]);
    expect(unmapped).toEqual([
      expect.objectContaining({
        class: "UNMAPPED",
        endpoint: "v1.queue.submit",
        dotPaths: ["v1.queue.submit", "post.v1.queue.submit"],
      }),
    ]);
  });

  it("pairs every fal registry endpoint and every schema leaf of the factory", () => {
    const { endpoints, unmapped } = pairEndpoints({
      registry: FAL_ENDPOINT_REQUEST_SCHEMAS,
      provider: createFal({ apiKey: "unused" }),
    });
    expect(endpoints).toHaveLength(
      Object.keys(FAL_ENDPOINT_REQUEST_SCHEMAS).length
    );
    // The platform APIs, which have no endpoint id: never a model endpoint.
    for (const entry of unmapped as Diff[]) {
      expect(entry.endpoint).toMatch(/^(v1|storage)\./);
    }
    expect(unmapped.length).toBeGreaterThan(0);
    // Every registry schema converts to an object JSON Schema.
    for (const { id, schema } of endpoints as Array<{
      id: string;
      schema: z.ZodType;
    }>) {
      expect(oursJsonSchema(schema).type, id).toBe("object");
    }
  });
});

describe("fetchDocuments", () => {
  let cacheDir: string | undefined;
  afterEach(async () => {
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
    cacheDir = undefined;
  });

  it("GETs keyless, pauses between requests, and reuses the cache", async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), "fal-schema-drift-"));
    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    const waits: number[] = [];
    const responses: Record<
      string,
      Array<{ status: number; body: unknown }>
    > = {
      "a/ok": [{ status: 200, body: { openapi: "3.1.0" } }],
      "b/gone": [{ status: 404, body: null }],
      "c/flaky": [
        { status: 503, body: null },
        { status: 200, body: { openapi: "3.1.0" } },
      ],
      "d/down": [
        { status: 500, body: null },
        { status: 500, body: null },
        { status: 500, body: null },
      ],
    };
    const fetchImpl = async (
      url: string,
      init: { headers: Record<string, string> }
    ) => {
      calls.push({ url, headers: init.headers });
      const id = new URL(url).searchParams.get("endpoint_id") as string;
      const next = responses[id].shift() as { status: number; body: unknown };
      return {
        status: next.status,
        text: async () => JSON.stringify(next.body),
      };
    };
    const endpointIds = ["a/ok", "b/gone", "c/flaky", "d/down"];
    const first = await fetchDocuments({
      endpointIds,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      cacheDir,
      delayMs: 7,
      wait: async (ms: number) => {
        waits.push(ms);
      },
      now: () => "2026-11-27T00:00:00.000Z",
    });
    expect(calls.map((call) => call.url)).toEqual([
      queueOpenApiUrl("a/ok"),
      queueOpenApiUrl("b/gone"),
      queueOpenApiUrl("c/flaky"),
      queueOpenApiUrl("c/flaky"),
      queueOpenApiUrl("d/down"),
      queueOpenApiUrl("d/down"),
      queueOpenApiUrl("d/down"),
    ]);
    expect(queueOpenApiUrl("a/ok")).toBe(
      "https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=a%2Fok"
    );
    for (const { headers } of calls) {
      expect(headers).toEqual({
        "user-agent": DRIFT_USER_AGENT,
        accept: "application/json",
      });
    }
    // No pause before the first request; retries back off.
    expect(waits).toEqual([7, 7, 2000, 7, 2000, 5000]);
    expect(first.fetched).toBe(4);
    expect(first.documents.get("c/flaky")).toMatchObject({ status: 200 });
    expect(first.documents.get("d/down")).toMatchObject({ status: 500 });
    // A server error is not cached, so a rerun asks again.
    expect((await readdir(cacheDir)).sort()).toEqual([
      "a%2Fok.json",
      "b%2Fgone.json",
      "c%2Fflaky.json",
    ]);
    expect(
      JSON.parse(await readFile(path.join(cacheDir, "b%2Fgone.json"), "utf8"))
    ).toMatchObject({ endpointId: "b/gone", status: 404, body: null });

    calls.length = 0;
    const second = await fetchDocuments({
      endpointIds: ["a/ok", "b/gone", "c/flaky"],
      fetchImpl: fetchImpl as unknown as typeof fetch,
      cacheDir,
      wait: async () => undefined,
    });
    expect(calls).toEqual([]);
    expect(second).toMatchObject({ fetched: 0, cached: 3 });
    expect(second.documents.get("b/gone")).toMatchObject({ status: 404 });
  });

  it("records a network failure after its retries", async () => {
    let attempts = 0;
    const { documents } = await fetchDocuments({
      endpointIds: ["a/model"],
      fetchImpl: async () => {
        attempts += 1;
        throw new Error("getaddrinfo ENOTFOUND fal.ai");
      },
      wait: async () => undefined,
    });
    expect(attempts).toBe(3);
    const report = schemaDrift({
      endpoints: [{ id: "a/model", ours: oursJsonSchema(z.object({})) }],
      documents,
    }) as unknown as Report;
    expect(report.differences).toEqual([
      {
        class: "GONE",
        endpoint: "a/model",
        status: null,
        reason: "fetch failed: getaddrinfo ENOTFOUND fal.ai",
      },
    ]);
  });
});

describe("dated evidence", () => {
  // One full live run, kept as evidence: its counts must tally its lines.
  it("tallies its counts from its own differences", async () => {
    const evidence = JSON.parse(
      await readFile(
        "tests/fixtures/fal-schema-evidence/schema-drift-2026-11-27.json",
        "utf8"
      )
    ) as Report & { documentsFetched: { first: string; last: string } };
    expect(evidence.documentsFetched.first.slice(0, 10)).toBe("2026-11-27");
    for (const cls of DRIFT_CLASSES) {
      expect(evidence.counts[cls], cls).toBe(
        evidence.differences.filter((diff) => diff.class === cls).length
      );
    }
    expect(
      evidence.differences.every((diff) => DRIFT_CLASSES.includes(diff.class))
    ).toBe(true);
  });
});
