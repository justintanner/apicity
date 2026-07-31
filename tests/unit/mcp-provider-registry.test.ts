import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import mcpPackage from "../../packages/mcp-server/package.json";
import {
  buildRegistry,
  type Endpoint,
  extractPathParams,
} from "../../packages/mcp-server/src/registry";
import { type JsonSchema } from "../../packages/mcp-server/src/schema";
import { PROVIDERS } from "../../packages/mcp-server/src/providers";

function endpointProviders(): string[] {
  const tsv = readFileSync("scripts/endpoint-docs.tsv", "utf8");
  return [
    ...new Set(
      tsv
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => line.split("\t")[0])
    ),
  ].sort();
}

describe("apicity-mcp provider registry", () => {
  it("registers every endpoint-doc provider", () => {
    expect(Object.keys(PROVIDERS).sort()).toEqual(endpointProviders());
  });

  it("declares each registered provider package as a dependency", () => {
    const deps = mcpPackage.dependencies as Record<string, string>;
    const missing = endpointProviders().filter(
      (provider) => !deps[`@apicity/${provider}`]
    );

    expect(missing).toEqual([]);
  });

  it("resolves all Polymarket endpoint rows", async () => {
    const endpoints = await buildRegistry({ enabledProviders: ["polymarket"] });

    expect(endpoints).toHaveLength(providerEndpointCount("polymarket"));
  });

  it("exposes constrained JSON schemas in registry endpoints", async () => {
    const previous = process.env.KIE_API_KEY;
    process.env.KIE_API_KEY = "dummy-kie-key";

    try {
      const endpoints = await buildRegistry({ enabledProviders: ["kie"] });
      const endpoint = findEndpoint(
        endpoints,
        "kie",
        "POST",
        "api.v1.jobs.createTask"
      );
      const variants = endpoint.jsonSchema.anyOf as JsonSchema[];
      const grokText = variants.find((variant) =>
        schemaValues(propertiesOf(variant).model).includes(
          "grok-imagine/text-to-video"
        )
      );

      expect(grokText).toBeDefined();
      const input = propertiesOf(propertiesOf(grokText as JsonSchema).input);

      expect(input.prompt).toMatchObject({
        type: "string",
        minLength: 1,
        maxLength: 5000,
      });
      expect(input.duration).toEqual({
        anyOf: [
          { type: "integer", minimum: 6, maximum: 30 },
          { type: "string", pattern: "^(?:[6-9]|[12][0-9]|30)$" },
        ],
      });
    } finally {
      restoreEnv("KIE_API_KEY", previous);
    }
  });

  it("documents ElevenLabs' omitted-model TTS limit on all four tools", async () => {
    const previous = process.env.ELEVENLABS_API_KEY;
    process.env.ELEVENLABS_API_KEY = "dummy-elevenlabs-key";

    try {
      const endpoints = await buildRegistry({
        enabledProviders: ["elevenlabs"],
      });
      const paths = [
        "v1.textToSpeech",
        "v1.textToSpeech.stream",
        "v1.textToSpeech.withTimestamps",
        "v1.textToSpeech.stream.withTimestamps",
      ];

      for (const dotPath of paths) {
        const endpoint = findEndpoint(endpoints, "elevenlabs", "POST", dotPath);
        const description = endpoint.jsonSchema.description;

        expect(description, dotPath).toContain("10000");
        expect(description, dotPath).toContain("model_id is omitted");
        expect(propertiesOf(endpoint.jsonSchema).text).toMatchObject({
          maxLength: 40000,
        });
      }
    } finally {
      restoreEnv("ELEVENLABS_API_KEY", previous);
    }
  });

  // Regression: `{query}` is a query-string placeholder, not a path segment.
  // Treating it as a path param made the MCP call `fn(queryString, body)` instead
  // of `fn(req, signal)`, dropping every filter and crashing on a body
  // (`signal.addEventListener is not a function`). It must never be a path param.
  it("excludes the reserved {query} placeholder from path params", () => {
    expect(
      extractPathParams("https://api.binance.com/api/v3/klines{query}")
    ).toEqual([]);
    expect(
      extractPathParams("https://clob.polymarket.com/balance-allowance{query}")
    ).toEqual([]);
    // Real path params are still extracted.
    expect(
      extractPathParams("https://clob.polymarket.com/data/order/{orderID}")
    ).toEqual(["orderID"]);
  });

  it("registers no endpoint with a `query` path param", async () => {
    const tsv = readFileSync("scripts/endpoint-docs.tsv", "utf8");
    const withQueryPlaceholder = tsv
      .trim()
      .split("\n")
      .slice(1)
      .filter((line) => line.split("\t")[3]?.includes("{query}"));
    // Guard the fixture itself: this is the bug's blast radius.
    expect(withQueryPlaceholder.length).toBeGreaterThan(0);
    for (const line of withQueryPlaceholder) {
      const fullUrl = line.split("\t")[3];
      expect(extractPathParams(fullUrl)).not.toContain("query");
    }
  });

  it("resolves all DoltHub endpoint rows", async () => {
    const previous = process.env.DOLTHUB_API_KEY;
    process.env.DOLTHUB_API_KEY = "dummy";
    try {
      const endpoints = await buildRegistry({ enabledProviders: ["dolthub"] });

      expect(endpoints).toHaveLength(providerEndpointCount("dolthub"));
    } finally {
      if (previous === undefined) delete process.env.DOLTHUB_API_KEY;
      else process.env.DOLTHUB_API_KEY = previous;
    }
  });

  it("resolves all B2 endpoint rows", async () => {
    const previous = {
      accessKeyId: process.env.B2_ACCESS_KEY_ID,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
      region: process.env.B2_REGION,
    };
    process.env.B2_ACCESS_KEY_ID = "dummy-access-key";
    process.env.B2_SECRET_ACCESS_KEY = "dummy-secret-key";
    process.env.B2_REGION = "us-west-004";

    try {
      const endpoints = await buildRegistry({ enabledProviders: ["b2"] });

      expect(endpoints).toHaveLength(providerEndpointCount("b2"));
    } finally {
      restoreEnv("B2_ACCESS_KEY_ID", previous.accessKeyId);
      restoreEnv("B2_SECRET_ACCESS_KEY", previous.secretAccessKey);
      restoreEnv("B2_REGION", previous.region);
    }
  });

  it("resolves all TheSportsDB endpoint rows without credentials", async () => {
    const previous = process.env.THESPORTSDB_API_KEY;
    delete process.env.THESPORTSDB_API_KEY;

    try {
      const endpoints = await buildRegistry({
        enabledProviders: ["thesportsdb"],
      });

      expect(endpoints).toHaveLength(providerEndpointCount("thesportsdb"));
    } finally {
      restoreEnv("THESPORTSDB_API_KEY", previous);
    }
  });

  it("resolves all OpenLigaDB endpoint rows without credentials", async () => {
    const endpoints = await buildRegistry({ enabledProviders: ["openligadb"] });

    expect(endpoints).toHaveLength(providerEndpointCount("openligadb"));
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function findEndpoint(
  endpoints: Endpoint[],
  provider: string,
  method: string,
  dotPath: string
): Endpoint {
  const endpoint = endpoints.find(
    (candidate) =>
      candidate.provider === provider &&
      candidate.method === method &&
      candidate.dotPath === dotPath
  );
  expect(endpoint).toBeDefined();
  return endpoint as Endpoint;
}

function propertiesOf(schema: unknown): Record<string, JsonSchema> {
  expect(schema).toMatchObject({ type: "object" });
  const properties = (schema as JsonSchema).properties;
  expect(properties).toBeDefined();
  return properties as Record<string, JsonSchema>;
}

function schemaValues(schema: JsonSchema): unknown[] {
  if ("const" in schema) return [schema.const];
  expect(Array.isArray(schema.enum)).toBe(true);
  return schema.enum as unknown[];
}

function providerEndpointCount(provider: string): number {
  return endpointProvidersFromRows().filter((name) => name === provider).length;
}

function endpointProvidersFromRows(): string[] {
  const tsv = readFileSync("scripts/endpoint-docs.tsv", "utf8");
  return tsv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split("\t")[0]);
}
