import type { CostHints } from "../types";
import type { ModelPricing, PerUnitPricing } from "./types";
import { asNumber, asString } from "./helpers";

const source = {
  url: "https://docs.x.com/x-api/getting-started/pricing.md",
  asOf: "2026-11-04",
};

// Conservatively recognize scheme, www and bare-domain links (including
// Unicode domains). Do not mistake an email address or decimal for a URL.
// The public rate card does not publish X's exact autolinking algorithm.
const URL_IN_TEXT =
  /https?:\/\/\S+|\bwww\.\S+|(?<![\p{L}\p{N}_@.-])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+(?:[\p{L}]{2,}|xn--[\p{L}\p{N}-]+)(?::\d+)?(?:[/?#][^\s]*)?/iu;

const resourceCount = (
  _payload: Record<string, unknown>,
  hints?: CostHints
): number | undefined => {
  const count = asNumber(hints?.resources);
  return count !== undefined && Number.isSafeInteger(count) && count > 0
    ? count
    : undefined;
};

const read = (usd: number): PerUnitPricing => ({
  kind: "perUnit",
  unit: "resources",
  units: resourceCount,
  select: [],
  rates: { "": usd },
  source,
  warn: (payload, hints) =>
    resourceCount(payload, hints) === undefined
      ? [
          "x: pass costHints.resources as a positive integer count of returned resources",
        ]
      : [],
});

export const x: Record<string, ModelPricing> = {
  post: {
    kind: "perUnit",
    unit: "requests",
    units: () => 1,
    select: [
      {
        name: "URL in text",
        pick: (payload) =>
          URL_IN_TEXT.test(asString(payload.text) ?? "") ? "with-url" : "plain",
      },
    ],
    rates: { plain: 0.015, "with-url": 0.2 },
    source,
  },
  "posts-read": read(0.005),
  "users-read": read(0.01),
};
