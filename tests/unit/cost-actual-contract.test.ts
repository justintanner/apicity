import { describe, expect, it } from "vitest";
import {
  compareCost,
  extractActual,
  mergeActuals,
  type ActualBasis,
  type ActualUsage,
  type CostActual,
  type CostComparison,
  type EndpointBilling,
  type EndpointBillingKind,
  type EndpointEstimate,
  type ProviderExchange,
} from "@apicity/cost";
import {
  entryToProviderExchange,
  type HarEntry,
  type ProviderExchange as HarProviderExchange,
} from "@apicity/har";

// The names decision record section 4 binds. Later children and videobook read
// them, so a rename fails `typecheck:tests` here. The two functions it also
// names, endpointBilling and estimateEndpoint, land with the billing registry.
const everyKey: Required<Record<keyof ActualUsage, number>> = {
  inputTokens: 1,
  outputTokens: 1,
  cacheReadInputTokens: 0,
  cacheWriteInputTokens: 0,
  cacheWrite1hInputTokens: 0,
  reasoningTokens: 0,
  audioInputTokens: 0,
  imageInputTokens: 0,
  audioOutputTokens: 0,
  imageOutputTokens: 0,
  characters: 0,
  seconds: 0,
  images: 0,
  billableUnits: 0,
  credits: 0,
};

const bases: ActualBasis[] = ["stated", "derived", "usage-only", "none"];

const kinds: EndpointBillingKind[] = [
  "metered",
  "free",
  "followup",
  "subscription",
  "accrual",
  "unpriced",
];

const billing: EndpointBilling = {
  provider: "telegram",
  method: "GET",
  dotPath: "getMe",
  kind: "free",
  reason: "documented free",
};

const estimate: EndpointEstimate = {
  usd: 0,
  currency: "USD",
  source: "free",
  breakdown: {},
  rateAsOf: null,
  warnings: [],
  status: "zero",
  billing,
  zeroReason: "documented free",
};

const verdicts: CostComparison["verdict"][] = [
  "match",
  "over",
  "under",
  "no-estimate",
  "no-actual",
  "free",
];

describe("the cost contract", () => {
  it("exports the record's names with these shapes", () => {
    const exchange: ProviderExchange = {
      provider: "s3",
      method: "GET",
      url: "https://s3.us-east-1.amazonaws.com/b/k",
      status: 200,
      requestBody: null,
      responseHeaders: {},
      responseBody: null,
    };
    const actual: CostActual = extractActual(exchange);
    const merged: CostActual = mergeActuals([actual]);
    const comparison: CostComparison = compareCost(estimate, merged);
    expect(bases).toContain(comparison.basis);
    expect(verdicts).toContain(comparison.verdict);
    expect(kinds).toContain(billing.kind);
    expect(Object.keys(everyKey)).toHaveLength(15);
  });

  it("takes the HAR adapter's return as an exchange, with neither importing the other", () => {
    const entry = {
      request: { method: "GET", url: "https://api.openai.com/v1/models" },
      response: {
        status: 200,
        headers: [],
        content: { text: "{}", mimeType: "application/json" },
      },
    } as unknown as HarEntry;
    const fromHar: HarProviderExchange = entryToProviderExchange(entry);
    const exchange: ProviderExchange = fromHar;
    expect(extractActual(exchange).provider).toBe("openai");
  });
});
