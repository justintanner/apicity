import { describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  createFal,
  type FalXaiGrokVoiceRequest,
  type FalXaiGrokVoiceResponse,
  type FalRunXaiGrokVoiceNamespace,
} from "@apicity/fal";
import {
  FalXaiGrokVoiceRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
const endpoint = "xai/grok-voice";
const payload = {
  audio_url: "data:audio/mpeg;base64,YXVkaW8=",
  prompt: "You are a concise Apicity route-test assistant.",
} satisfies FalXaiGrokVoiceRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Grok Voice", () => {
  it("exports the callable namespace, request schema, registry and aliases", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(typeof p.run.xai.grokVoice).toBe("function");
    expect(p.run.xai.grokVoice).toBe(p.post.run.xai.grokVoice);
    expect(p.run.xai.grokVoice.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.xai.grokVoice
    ).toEqualTypeOf<FalRunXaiGrokVoiceNamespace>();
    expectTypeOf(p.run.xai.grokVoice)
      .parameter(0)
      .toEqualTypeOf<FalXaiGrokVoiceRequest>();
    expectTypeOf(
      p.run.xai.grokVoice
    ).returns.resolves.toEqualTypeOf<FalXaiGrokVoiceResponse>();
  });
  it("posts the exact body and returns the documented response without runtime defaults", async () => {
    const response: FalXaiGrokVoiceResponse = {
      audio: {
        url: "https://example.com/reply.wav",
        content_type: null,
        file_size: null,
        file_name: null,
      },
      duration: 1,
      text: "Hello",
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(await p.run.xai.grokVoice(payload)).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://fal.run/xai/grok-voice");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });
  it("requires audio_url and defaults safety and all tools off", () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(valid({ audio_url: {} })).toBe(false);
    const parsed = schema.parse(payload);
    expect(parsed.enable_safety_checker).toBe(true);
    expect(parsed.tools.web_search.enabled).toBe(false);
    expect(parsed.tools.x_search.enabled).toBe(false);
    expect(parsed.tools.mcp_servers).toEqual([]);
    expect(valid({ enable_safety_checker: false })).toBe(true);
    expect(valid({ enable_safety_checker: null })).toBe(false);
    expect(valid({ tools: null })).toBe(false);
    // No additionalProperties:false or minLength on the top-level Input.
    expect(valid({ extra: true, audio_url: "" })).toBe(true);
  });
  it("takes all 28 fixed voices, nullable voice/prompt, and caps prompt at 20000", () => {
    for (const voice of [
      "carina",
      "zagan",
      "helix",
      "orion",
      "luna",
      "iris",
      "altair",
      "zenith",
      "perseus",
      "helios",
      "lux",
      "kepler",
      "rigel",
      "cosmo",
      "celeste",
      "ursa",
      "sirius",
      "lumen",
      "castor",
      "naksh",
      "atlas",
      "aurora",
      "liora",
      "ara",
      "eve",
      "leo",
      "rex",
      "sal",
      null,
    ])
      expect(valid({ voice })).toBe(true);
    expect(valid({ voice: "INVALID_VOICE" })).toBe(false);
    for (const prompt of [null, "", "a".repeat(20000)])
      expect(valid({ prompt })).toBe(true);
    expect(valid({ prompt: "a".repeat(20001) })).toBe(false);
  });
  it("bounds domain and handle lists and rejects untyped tools", () => {
    for (const [tool, field, max] of [
      ["web_search", "allowed_domains", 5],
      ["web_search", "excluded_domains", 5],
      ["x_search", "allowed_x_handles", 20],
      ["x_search", "excluded_x_handles", 20],
    ] as const) {
      for (const n of [1, max])
        expect(
          valid({ tools: { [tool]: { [field]: Array(n).fill("example") } } })
        ).toBe(true);
      for (const n of [0, max + 1])
        expect(
          valid({ tools: { [tool]: { [field]: Array(n).fill("example") } } })
        ).toBe(false);
      expect(valid({ tools: { [tool]: { [field]: null } } })).toBe(true);
      expect(valid({ tools: { [tool]: { extra: true } } })).toBe(false);
    }
    expect(valid({ tools: { file_search: {} } })).toBe(false);
    expect(
      valid({
        tools: {
          x_search: {
            from_date: "2026-10-15",
            to_date: null,
            enable_video_understanding: true,
            enable_image_understanding: false,
          },
        },
      })
    ).toBe(true);
    expect(valid({ tools: { x_search: { from_date: "2026-02-30" } } })).toBe(
      false
    );
  });
  it("bounds search location fields and closes the object", () => {
    for (const key of ["timezone", "city", "country", "region"]) {
      for (const value of [null, "x", "x".repeat(128)])
        expect(
          valid({ tools: { web_search: { location: { [key]: value } } } })
        ).toBe(true);
      for (const value of ["", "x".repeat(129)])
        expect(
          valid({ tools: { web_search: { location: { [key]: value } } } })
        ).toBe(false);
    }
    expect(
      valid({ tools: { web_search: { location: { extra: true } } } })
    ).toBe(false);
  });
  it("requires MCP server URL and label and mirrors nested bounds and defaults", () => {
    const server = {
      server_url: "https://example.com/mcp",
      server_label: "test",
    };
    const tool = (value: Record<string, unknown>) =>
      valid({ tools: { mcp_servers: [value] } });
    expect(tool(server)).toBe(true);
    for (const bad of [
      {},
      { server_url: server.server_url },
      { server_label: "test" },
      { ...server, server_label: "" },
      { ...server, server_label: "x".repeat(129) },
      { ...server, server_url: "invalid" },
      { ...server, allowed_tools: [] },
      { ...server, server_description: "x".repeat(2001) },
      { ...server, headers: { sample: 1 } },
      { ...server, extra: 1 },
    ])
      expect(tool(bad)).toBe(false);
    expect(
      tool({
        ...server,
        server_label: "x".repeat(128),
        server_description: "x".repeat(2000),
        allowed_tools: ["search"],
        headers: { sample: "test" },
        authorization: null,
        enabled: false,
      })
    ).toBe(true);
    const parsed = schema.parse({
      ...payload,
      tools: { mcp_servers: [server] },
    });
    expect(parsed.tools.mcp_servers?.[0].enabled).toBe(true);
    expect(parsed.tools.mcp_servers?.[0].headers).toBeNull();
  });
  it("restates the search filter exclusions and HTTP(S) constraint from free probes", () => {
    expect(
      valid({
        tools: {
          web_search: {
            allowed_domains: ["example.com"],
            excluded_domains: ["example.org"],
          },
        },
      })
    ).toBe(false);
    expect(
      valid({
        tools: {
          x_search: {
            allowed_x_handles: ["example"],
            excluded_x_handles: ["other"],
          },
        },
      })
    ).toBe(false);
    expect(
      valid({
        tools: {
          mcp_servers: [
            { server_label: "test", server_url: "ftp://example.com/mcp" },
          ],
        },
      })
    ).toBe(false);
  });
  it("rejects domain protocols/paths and reversed date ranges from free probes", () => {
    for (const domain of ["https://example.com", "example.com/path"])
      expect(
        valid({ tools: { web_search: { allowed_domains: [domain] } } })
      ).toBe(false);
    expect(
      valid({
        tools: { x_search: { from_date: "2026-10-16", to_date: "2026-10-15" } },
      })
    ).toBe(false);
    expect(
      valid({
        tools: { x_search: { from_date: "2026-10-15", to_date: "2026-10-15" } },
      })
    ).toBe(true);
  });
  it("keeps unknown session/reply seconds dynamically priced", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(0);
  });
});
