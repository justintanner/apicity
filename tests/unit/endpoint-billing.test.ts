import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ENDPOINT_BILLING,
  endpointBilling,
  resolveEndpointBillingPolicy,
  PAID_ENDPOINTS,
  estimateEndpoint,
  computeEstimate,
} from "@apicity/cost";
import unpriced from "./endpoint-billing-unpriced.json";

const root = new URL("../../", import.meta.url);
const surface = readFileSync(new URL("scripts/endpoint-docs.tsv", root), "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [provider, dotPath, method] = line.split("\t");
    return { provider, dotPath, method };
  });
const key = (e: { provider: string; method: string; dotPath: string }) =>
  `${e.provider} ${e.method} ${e.dotPath}`;
const knownFreePaid = new Set([
  "kie POST api.v1.voice.validate",
  "kie POST api.v1.voice.generate",
  "kie POST api.v1.voice.regenerate",
  "kie POST api.v1.omni.audio.create",
  "kie POST api.v1.omni.character.create",
]); // Mayor ruling on ac-qky8c5: documented free; preserve the paygate list.

function missingRecords(rows = surface, policies = ENDPOINT_BILLING) {
  return rows
    .filter(
      (e) =>
        !policies.some(
          ({ match }) =>
            match.provider === e.provider &&
            match.method === e.method &&
            match.dotPath === e.dotPath
        )
    )
    .map(key);
}

describe("endpoint billing inventory", () => {
  it("requires an exact reviewed record for every row, not just a provider default", () => {
    expect(surface.length).toBeGreaterThan(1800);
    expect(missingRecords()).toEqual([]);
    const removed = surface[0];
    expect(
      missingRecords(
        surface,
        ENDPOINT_BILLING.filter(
          ({ match }) =>
            !(
              match.provider === removed.provider &&
              match.method === removed.method &&
              match.dotPath === removed.dotPath
            )
        )
      )
    ).toContain(key(removed));
    expect(
      missingRecords([
        ...surface,
        { provider: "telegram", method: "POST", dotPath: "newPaidCall" },
      ])
    ).toEqual(["telegram POST newPaidCall"]);
  });
  it("rejects stale or duplicate policies and missing reasons", () => {
    const seen = new Set<string>();
    for (const policy of ENDPOINT_BILLING) {
      const m = policy.match;
      expect(
        surface.some(
          (e) =>
            m.provider === e.provider &&
            (m.method === undefined || m.method === e.method) &&
            (m.dotPath === undefined || m.dotPath === e.dotPath)
        ),
        JSON.stringify(m)
      ).toBe(true);
      const id = JSON.stringify(m);
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
      if (policy.billing.kind !== "metered")
        expect(policy.billing.reason, id).toBeTruthy();
    }
  });
  it("requires an owned unpriced exception, and rejects stale exceptions", () => {
    const actual = surface
      .filter(
        (e) =>
          endpointBilling(e.provider, e.method, e.dotPath).kind === "unpriced"
      )
      .map(key)
      .sort();
    expect(actual).toEqual(Object.keys(unpriced).sort());
    for (const owner of Object.values(unpriced))
      expect(owner).toMatch(
        /P(?:10|[1-9]) ac-|Mayor exception: paid in bot Stars, no USD rate/
      );
  });
  it("every paid endpoint is metered except the five documented-free KIE operations", () => {
    const exceptions: string[] = [];
    for (const { key: e } of PAID_ENDPOINTS) {
      const kind = endpointBilling(e.provider, e.method, e.dotPath).kind;
      if (knownFreePaid.has(key(e))) {
        expect(kind).toBe("free");
        exceptions.push(key(e));
      } else expect(kind, key(e)).toBe("metered");
    }
    expect(exceptions.sort()).toEqual([...knownFreePaid].sort());
  });
  it("generates the complete stable billing artifact", () => {
    const rows = surface
      .map((e) => endpointBilling(e.provider, e.method, e.dotPath))
      .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    const text =
      "provider\tdotPath\tmethod\tkind\tunit\treason\tsourceUrl\tsourceDate\n" +
      rows
        .map((r) =>
          [
            r.provider,
            r.dotPath,
            r.method,
            r.kind,
            r.unit ?? "",
            r.reason ?? "",
            r.source?.url ?? "",
            r.source?.asOf ?? "",
          ].join("\t")
        )
        .join("\n") +
      "\n";
    const target = fileURLToPath(new URL("scripts/endpoint-billing.tsv", root));
    if (process.env.UPDATE_ENDPOINT_BILLING === "1")
      writeFileSync(target, text);
    expect(
      readFileSync(target, "utf8"),
      "Regenerate with UPDATE_ENDPOINT_BILLING=1 pnpm run test:run tests/unit/endpoint-billing.test.ts"
    ).toBe(text);
  });
});

describe("endpoint-aware estimates", () => {
  it.each([
    ["telegram", "POST", "sendMessage", "free"],
    ["openai", "GET", "v1.models", "free"],
    ["kie", "GET", "api.v1.jobs.recordInfo", "followup"],
    [
      "zaicoding",
      "POST",
      "api.coding.paas.v4.chat.completions",
      "subscription",
    ],
  ])("%s %s %s is a justified zero", (provider, method, dotPath, kind) => {
    const result = estimateEndpoint({ provider, method, dotPath });
    expect(result.billing.kind).toBe(kind);
    expect(result).toMatchObject({ usd: 0, status: "zero", source: "free" });
    expect(result.zeroReason).toBeTruthy();
  });
  it("unknown providers and new rows of known free providers fail closed", () => {
    for (const provider of ["brand-new-provider", "telegram", "openai"]) {
      const req = { provider, method: "POST", dotPath: "brandNew" };
      expect(endpointBilling(provider, req.method, req.dotPath).kind).toBe(
        "unpriced"
      );
      expect(estimateEndpoint(req)).toMatchObject({
        usd: 0,
        status: "unavailable",
      });
    }
  });
  it("accrual has a reason and no per-call estimate", () => {
    const row = surface.find(
      (e) =>
        e.provider === "fireworks" &&
        resolveEndpointBillingPolicy(e.provider, e.method, e.dotPath)?.billing
          .kind === "accrual"
    )!;
    const result = estimateEndpoint(row);
    expect(result.status).toBe("unavailable");
    expect(result.warnings).toContain(result.billing.reason);
  });
  it("providers without a route never throw", () => {
    expect(
      estimateEndpoint({
        provider: "unknown-provider",
        method: "PUT",
        dotPath: "objects.put",
      }).status
    ).toBe("unavailable");
  });
  it.each([
    [
      "fal",
      "bytedance.seedance2p5.textToVideo",
      "bytedance/seedance-2.5/text-to-video",
      {
        prompt: "A cat",
        duration: "5",
        aspect_ratio: "16:9",
        resolution: "720p",
      },
    ],
    [
      "wavespeed",
      "api.v3.alibaba.wan3p0.textToVideo",
      "alibaba/wan-3.0/text-to-video",
      { prompt: "A cat", duration: 5, resolution: "720p" },
    ],
    ["kie", "api.v1.generate.extend", "suno/extend", { model: "V5" }],
  ] as const)(
    "resolves %s %s to its pricing key",
    (provider, dotPath, endpoint, payload) => {
      const direct = computeEstimate({ provider, endpoint, payload });
      const result = estimateEndpoint({
        provider,
        method: "POST",
        dotPath,
        payload,
      });
      expect(result.usd).toBeGreaterThan(0);
      expect(result).toMatchObject({ ...direct, status: "priced" });
    }
  );
  it("prices a KIE createTask payload and preserves strict calculation", () => {
    const payload = { model: "google/nano-banana", input: { prompt: "A cat" } };
    const result = estimateEndpoint({
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      payload,
    });
    expect(result).toMatchObject(computeEstimate({ provider: "kie", payload }));
    expect(result.status).toBe("priced");
  });
  it("forecasts cache writes separately from strict mode", () => {
    const req = {
      provider: "openai",
      method: "POST",
      dotPath: "v1.responses",
      payload: {
        model: "gpt-5.6-sol",
        input: "A small cat",
        max_output_tokens: 100,
      },
    };
    const strict = estimateEndpoint(req);
    expect(strict).toMatchObject({
      ...computeEstimate({ provider: "openai", payload: req.payload }),
      status: "unavailable",
      usd: 0,
    });
    const result = estimateEndpoint({ ...req, mode: "forecast" });
    expect(result.status).toBe("priced");
    expect(result.usd).toBeGreaterThan(0);
    expect(result.usd).toBe(result.range?.high);
    expect(result.range!.low).toBeLessThan(result.range!.high);
    expect(result.range!.low).toBeCloseTo((3 * 0.4) / 1_000_000, 12);
    expect(result.range!.high).toBeCloseTo((3 * 5 + 100 * 20) / 1_000_000, 12);
    expect(result.warnings.join(" ")).toMatch(/Forecast/);
    const anthropic = {
      provider: "anthropic",
      method: "POST",
      dotPath: "v1.messages",
      payload: {
        model: "claude-opus-4-6",
        messages: [{ role: "user", content: "A small cat" }],
        max_tokens: 100,
      },
    };
    expect(estimateEndpoint(anthropic)).toMatchObject(
      computeEstimate({ provider: "anthropic", payload: anthropic.payload })
    );
    const forecast = estimateEndpoint({ ...anthropic, mode: "forecast" });
    expect(forecast.range!.low).toBeCloseTo((3 * 0.5) / 1_000_000, 12);
    expect(forecast.range!.high).toBeCloseTo(
      (3 * 6.25 + 100 * 25) / 1_000_000,
      12
    );
  });
  it("uses the long-context rates above the boundary", () => {
    const result = estimateEndpoint({
      provider: "openai",
      method: "POST",
      dotPath: "v1.responses",
      mode: "forecast",
      payload: {
        model: "gpt-5.6-sol",
        input: "a".repeat(272001 * 4),
        max_output_tokens: 10,
      },
    });
    expect(result.range).toEqual({
      low: (272001 * 0.8) / 1_000_000,
      high: (272001 * 10 + 10 * 30) / 1_000_000,
    });
    expect(result.breakdown.contextTier).toBe("long");
  });
  it("does not forecast hidden file or image input", () => {
    for (const content of [
      { type: "input_file", file_id: "file-test" },
      { type: "input_image", image_url: "https://example.com/image.png" },
    ]) {
      const req = {
        provider: "openai",
        method: "POST",
        dotPath: "v1.responses",
        payload: {
          model: "gpt-5.6-sol",
          instructions: "Describe the input",
          input: [{ role: "user", content: [content] }],
          max_output_tokens: 100,
        },
      };
      expect(estimateEndpoint({ ...req, mode: "forecast" })).toEqual(
        estimateEndpoint(req)
      );
    }
  });
  it("forecast does not mask unsupported tiers, regional processing, or invalid declared usage", () => {
    for (const extra of [
      {
        payload: {
          model: "gpt-5.6-sol",
          input: "cat",
          max_output_tokens: 100,
          service_tier: "priority",
        },
      },
      { costHints: { regionalProcessing: true } },
      { costHints: { inputTokens: -1 } },
    ]) {
      const req = {
        provider: "openai",
        method: "POST",
        dotPath: "v1.responses",
        payload: { model: "gpt-5.6-sol", input: "cat", max_output_tokens: 100 },
        ...extra,
      };
      expect(estimateEndpoint({ ...req, mode: "forecast" })).toEqual(
        estimateEndpoint(req)
      );
    }
  });
});
