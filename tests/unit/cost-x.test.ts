import { describe, expect, it } from "vitest";
import {
  classifyEndpoint,
  computeEstimate,
  endpointBilling,
  estimateEndpoint,
  MODEL_DISPLAY,
  MODEL_SLUGS,
  PRICING,
  type CostHints,
} from "@apicity/cost";

const estimate = (
  method: string,
  dotPath: string,
  payload = {},
  costHints?: CostHints
) => estimateEndpoint({ provider: "x", method, dotPath, payload, costHints });

describe("X pay-per-usage pricing", () => {
  it.each([
    ["Hello world", 0.015],
    ["@user hello", 0.015],
    ["Contact me@example.com or a@sub.example.com", 0.015],
    ["Version 1.2.3 costs 3.14", 0.015],
    ["Read https://example.com/article", 0.2],
    ["HTTP://EXAMPLE.COM", 0.2],
    ["Visit www.example.com", 0.2],
    ["See (example.com/page)", 0.2],
    ["Link t.co/abc and https://example.org", 0.2],
    ["例子.中国", 0.2],
  ])("prices post text %s", (text, usd) => {
    const result = estimate("POST", "v2.tweets", { text });
    expect(result.status).toBe("priced");
    expect(result.usd).toBe(usd);
    expect(result.breakdown.unit).toBe("requests");
    expect(result.breakdown.units).toBe(1);
    expect(result.warnings).toEqual([]);
    expect(result.rateAsOf).toBe("2026-11-04");
    expect(result.notes?.join(" ")).toContain("summoned");
  });

  it("prices a media-only post at the ordinary write rate", () => {
    expect(
      estimate("POST", "v2.tweets", { media: { media_ids: ["123"] } }).usd
    ).toBe(0.015);
    expect(
      computeEstimate({
        provider: "x",
        endpoint: "post",
        payload: { text: "https://example.com" },
      }).usd
    ).toBe(0.2);
  });

  it.each([
    ["v2.tweets", 0.005, "posts-read"],
    ["v2.users.me", 0.01, "users-read"],
  ] as const)(
    "prices GET %s by returned resources, without Owned Reads discount",
    (dotPath, rate, key) => {
      const result = estimate("GET", dotPath, {}, { resources: 3 });
      expect(result.status).toBe("priced");
      expect(result.usd).toBeCloseTo(3 * rate, 12);
      expect(result.breakdown).toMatchObject({
        units: 3,
        unit: "resources",
        perUnitUsd: rate,
      });
      expect(result.warnings).toEqual([]);
      expect(result.notes?.join(" ")).toContain("upper bound");
      expect(result.notes?.join(" ")).toContain("Owned Reads");
      expect(
        computeEstimate({
          provider: "x",
          endpoint: key,
          payload: {},
          costHints: { resources: 3 },
        }).usd
      ).toBe(result.usd);
    }
  );

  it.each([
    undefined,
    0,
    -1,
    1.5,
    Infinity,
    NaN,
    "3",
    null,
    Number.MAX_SAFE_INTEGER + 1,
  ])("requires a positive integral count, refusing %s", (resources) => {
    for (const dotPath of ["v2.tweets", "v2.users.me"]) {
      const result = estimate("GET", dotPath, {}, {
        resources,
      } as unknown as CostHints);
      expect(result.status).toBe("unavailable");
      expect(result.warnings.join(" ")).toContain("costHints.resources");
    }
  });

  it("does not infer resource counts from a request id or mutate the payload", () => {
    const payload = Object.freeze({ id: "123", resources: 5 });
    expect(estimate("GET", "v2.tweets", payload).status).toBe("unavailable");
    expect(estimate("GET", "v2.tweets", payload, { resources: 2 }).usd).toBe(
      0.01
    );
    expect(payload).toEqual({ id: "123", resources: 5 });
  });

  it.each([
    ["GET", "v2.media.upload"],
    ["POST", "v2.media.upload.initialize"],
    ["POST", "v2.media.upload.append"],
    ["POST", "v2.media.upload.finalize"],
  ])(
    "leaves %s %s unavailable until a console rate is known",
    (method, dotPath) => {
      const result = estimate(method, dotPath);
      expect(result.status).toBe("unavailable");
      expect(result.billing.kind).toBe("unpriced");
      expect(result.warnings.join(" ").toLowerCase()).toContain(
        "console rate needed"
      );
      expect(classifyEndpoint("x", method, dotPath)).toBe("prohibitive");
    }
  );

  it("does not borrow the Media Metadata rate for media uploads", () => {
    const result = computeEstimate({
      provider: "x",
      endpoint: "media-upload",
      payload: {},
    });
    expect(result.warnings.join(" ")).toContain("console rate needed");
    expect(result.breakdown.perUnitUsd).toBeUndefined();
    expect(PRICING.x["media-upload"]).toBeUndefined();
  });

  it("gates all three metered routes, including posts with no URL", () => {
    for (const [method, dotPath] of [
      ["POST", "v2.tweets"],
      ["GET", "v2.tweets"],
      ["GET", "v2.users.me"],
    ]) {
      expect(classifyEndpoint("x", method, dotPath)).toBe("expensive");
      expect(endpointBilling("x", method, dotPath).kind).toBe("metered");
    }
  });

  it("registers every X pricing key for display", () => {
    expect(Object.keys(MODEL_SLUGS.x).sort()).toEqual(
      Object.keys(PRICING.x).sort()
    );
    expect(Object.keys(MODEL_DISPLAY.x).sort()).toEqual(
      Object.keys(PRICING.x).sort()
    );
  });

  it("preserves B2 class-D and Dropbox plan qualifications", () => {
    expect(endpointBilling("b2", "PUT", "buckets.create")).toMatchObject({
      kind: "free",
      reason: expect.stringContaining("no row here is class D"),
    });
    expect(endpointBilling("dropbox", "POST", "files.copyV2")).toMatchObject({
      kind: "free",
      reason: expect.stringContaining("Dropbox plans are flat"),
    });
  });
});
