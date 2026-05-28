import { describe, it, expect } from "vitest";
import {
  PolymarketOptionsSchema,
  PolymarketClobSideSchema,
  PolymarketClobTokenBatchRequestSchema,
  PolymarketClobPricesBatchRequestSchema,
  PolymarketClobPriceHistoryIntervalSchema,
  PolymarketClobBatchPricesHistoryRequestSchema,
} from "../../packages/provider/polymarket/src/zod";

describe("Polymarket Zod schemas", () => {
  describe("PolymarketOptionsSchema", () => {
    it("accepts valid options with all fields", () => {
      const result = PolymarketOptionsSchema.safeParse({
        gammaBaseURL: "https://gamma.example.com",
        dataBaseURL: "https://data.example.com",
        clobBaseURL: "https://clob.example.com",
        timeout: 10000,
        fetch: globalThis.fetch,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty options", () => {
      const result = PolymarketOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid timeout type", () => {
      const result = PolymarketOptionsSchema.safeParse({
        timeout: "fast",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("PolymarketClobSideSchema", () => {
    it("accepts BUY", () => {
      const result = PolymarketClobSideSchema.safeParse("BUY");
      expect(result.success).toBe(true);
    });

    it("accepts SELL", () => {
      const result = PolymarketClobSideSchema.safeParse("SELL");
      expect(result.success).toBe(true);
    });

    it("rejects invalid side", () => {
      const result = PolymarketClobSideSchema.safeParse("HOLD");
      expect(result.success).toBe(false);
    });
  });

  describe("PolymarketClobTokenBatchRequestSchema", () => {
    it("accepts valid token array", () => {
      const result = PolymarketClobTokenBatchRequestSchema.safeParse([
        { token_id: "123" },
        { token_id: "456" },
      ]);
      expect(result.success).toBe(true);
    });

    it("rejects empty array", () => {
      const result = PolymarketClobTokenBatchRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("rejects missing token_id", () => {
      const result = PolymarketClobTokenBatchRequestSchema.safeParse([
        { token_id: "123" },
        { id: "456" },
      ]);
      expect(result.success).toBe(false);
    });

    it("rejects empty token_id", () => {
      const result = PolymarketClobTokenBatchRequestSchema.safeParse([
        { token_id: "" },
      ]);
      expect(result.success).toBe(false);
    });
  });

  describe("PolymarketClobPricesBatchRequestSchema", () => {
    it("accepts valid prices batch", () => {
      const result = PolymarketClobPricesBatchRequestSchema.safeParse([
        { token_id: "123", side: "BUY" },
        { token_id: "456", side: "SELL" },
      ]);
      expect(result.success).toBe(true);
    });

    it("rejects empty array", () => {
      const result = PolymarketClobPricesBatchRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("rejects invalid side", () => {
      const result = PolymarketClobPricesBatchRequestSchema.safeParse([
        { token_id: "123", side: "HOLD" },
      ]);
      expect(result.success).toBe(false);
    });

    it("rejects empty token_id", () => {
      const result = PolymarketClobPricesBatchRequestSchema.safeParse([
        { token_id: "", side: "BUY" },
      ]);
      expect(result.success).toBe(false);
    });
  });

  describe("PolymarketClobPriceHistoryIntervalSchema", () => {
    it.each(["1m", "1h", "6h", "1d", "1w", "max"] as const)(
      "accepts %s",
      (interval) => {
        const result =
          PolymarketClobPriceHistoryIntervalSchema.safeParse(interval);
        expect(result.success).toBe(true);
      }
    );

    it("rejects invalid interval", () => {
      const result = PolymarketClobPriceHistoryIntervalSchema.safeParse("2d");
      expect(result.success).toBe(false);
    });
  });

  describe("PolymarketClobBatchPricesHistoryRequestSchema", () => {
    it("accepts valid request with markets", () => {
      const result = PolymarketClobBatchPricesHistoryRequestSchema.safeParse({
        markets: ["123", "456"],
        interval: "1d",
        startTs: 1700000000,
        endTs: 1700003600,
        fidelity: 5,
      });
      expect(result.success).toBe(true);
    });

    it("accepts minimal request", () => {
      const result = PolymarketClobBatchPricesHistoryRequestSchema.safeParse({
        markets: ["123"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty markets array", () => {
      const result = PolymarketClobBatchPricesHistoryRequestSchema.safeParse({
        markets: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty market token", () => {
      const result = PolymarketClobBatchPricesHistoryRequestSchema.safeParse({
        markets: ["123", ""],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid interval", () => {
      const result = PolymarketClobBatchPricesHistoryRequestSchema.safeParse({
        markets: ["123"],
        interval: "2d",
      });
      expect(result.success).toBe(false);
    });
  });
});
