import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  classifyEndpoint,
  computeEstimate,
  endpointBilling,
  estimateEndpoint,
  MODEL_DISPLAY,
  MODEL_SLUGS,
  PRICING,
} from "@apicity/cost";

const estimate = (method: string, dotPath: string, payload = {}) =>
  estimateEndpoint({ provider: "s3", method, dotPath, payload });
const exceptions = [
  "POST objects.restore",
  "POST objects.selectContent",
  "POST objectLambda.writeGetObjectResponse",
  "GET buckets.createSession",
  "POST buckets.createMetadataConfiguration",
  "POST buckets.createMetadataTableConfiguration",
  "PUT buckets.updateMetadataInventoryTable",
  "PUT buckets.updateMetadataJournalTable",
];

describe("AWS S3 request classes", () => {
  it.each([
    ["PUT", "objects.put", 0.000005],
    ["PUT", "objects.copy", 0.000005],
    ["POST", "objects.createMultipartUpload", 0.000005],
    ["GET", "objects.list", 0.000005],
    ["GET", "buckets.list", 0.000005],
    ["GET", "objects.get", 0.0000004],
    ["HEAD", "objects.head", 0.0000004],
    ["PUT", "objects.rename", 0.00000113],
  ])("prices %s %s per request", (method, path, usd) => {
    const result = estimate(method, path);
    expect(result.status).toBe("priced");
    expect(result.usd).toBe(usd);
    expect(result.usd).toBeLessThan(0.01);
    expect(result.breakdown).toMatchObject({ unit: "requests", units: 1 });
    expect(result.rateAsOf).toBe("2026-11-04");
    expect(result.notes?.join(" ")).toContain("us-east-1");
    expect(result.notes?.join(" ")).toContain(
      path === "objects.rename" ? "Express One Zone" : "Standard"
    );
  });

  it.each([
    "DELETE objects.del",
    "DELETE objects.abortMultipartUpload",
    "POST objects.delMany",
  ])("returns justified zero for %s", (key) => {
    const [method, path] = key.split(" ");
    const result = estimate(method, path, {
      objects: [{ key: "a" }, { key: "b" }],
    });
    expect(result.status).toBe("zero");
    expect(result.usd).toBe(0);
    expect(result.zeroReason).toContain("free");
  });

  it.each(exceptions)("keeps %s unavailable and prohibitive", (key) => {
    const [method, path] = key.split(" ");
    const result = estimate(method, path);
    expect(result.status).toBe("unavailable");
    expect(result.zeroReason).toBeUndefined();
    expect(result.billing.kind).toBe("unpriced");
    expect(result.warnings).toContain(result.billing.reason);
    expect(classifyEndpoint("s3", method, path)).toBe("prohibitive");
  });

  it.each([
    [{ region: "eu-west-1" }, "region"],
    [{ region: null }, "region"],
    [{ storageClass: "GLACIER" }, "storageClass"],
    [{ storageClass: "EXPRESS_ONEZONE" }, "storageClass"],
    [{ storageClass: null }, "storageClass"],
  ])("fails closed on unsupported settings %j", (payload, field) => {
    const result = estimate("PUT", "objects.put", payload);
    expect(result.status).toBe("unavailable");
    expect(result.breakdown.perUnitUsd).toBeUndefined();
    expect(result.warnings.join(" ")).toContain(field);
  });

  it("accepts the documented baseline and the rename-specific class", () => {
    expect(
      estimate("PUT", "objects.put", {
        region: "us-east-1",
        storageClass: "STANDARD",
      }).usd
    ).toBe(0.000005);
    expect(
      estimate("PUT", "objects.rename", {
        region: "us-east-1",
        storageClass: "EXPRESS_ONEZONE",
      }).usd
    ).toBe(0.00000113);
    expect(
      estimate("PUT", "objects.rename", { storageClass: "STANDARD" }).status
    ).toBe("unavailable");
  });

  it("pins all 112 rows, the eight exceptions and the sub-cent tier exception", () => {
    const rows = readFileSync("scripts/endpoint-docs.tsv", "utf8")
      .trim()
      .split("\n")
      .slice(1)
      .map((line) => line.split("\t"))
      .filter(([provider]) => provider === "s3");
    expect(rows).toHaveLength(112);
    const unpriced: string[] = [];
    for (const [, path, method] of rows) {
      const result = estimate(method, path);
      expect(result.warnings.join(" ")).toContain(
        "storage, egress and non-AWS endpoints are excluded"
      );
      if (endpointBilling("s3", method, path).kind === "unpriced") {
        unpriced.push(`${method} ${path}`);
      } else {
        expect(["priced", "zero"]).toContain(result.status);
        expect(result.usd).toBeLessThan(0.01);
        expect(classifyEndpoint("s3", method, path)).toBe("cheap");
      }
    }
    expect(unpriced.sort()).toEqual([...exceptions].sort());
  });

  it("exposes dated pricing, slugs, display names and a direct route", () => {
    for (const key of Object.keys(PRICING.s3)) {
      expect(MODEL_SLUGS.s3).toHaveProperty(key);
      expect(MODEL_DISPLAY.s3).toHaveProperty(key);
      const result = computeEstimate({
        provider: "s3",
        endpoint: key,
        payload: {},
      });
      expect(result.usd).toBeGreaterThan(0);
      expect(result.warnings.join(" ")).toContain("non-AWS");
    }
    expect(
      computeEstimate({ provider: "s3", payload: {} }).breakdown.perUnitUsd
    ).toBeUndefined();
  });
});
