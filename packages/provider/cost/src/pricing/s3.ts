import type { ModelPricing } from "./types";

export const S3_EXCLUSIONS =
  "S3 request-only estimate: storage, egress and non-AWS endpoints are excluded.";

const source = {
  url: "https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonS3/current/us-east-1/index.json",
  asOf: "2026-11-04",
};

// USD per request, not per 1,000 requests. Rename uses Express One Zone.
export const s3: Record<string, ModelPricing> = Object.fromEntries(
  Object.entries({
    "standard-write": 0.000005,
    "standard-read": 0.0000004,
    "express-rename": 0.00000113,
  }).map(([key, rate]) => [
    key,
    {
      kind: "perUnit",
      unit: "requests",
      units: () => 1,
      select: [],
      rates: { "": rate },
      source,
    },
  ])
);
