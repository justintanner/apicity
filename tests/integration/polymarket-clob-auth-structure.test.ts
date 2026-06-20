import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  createPolymarket,
  PolymarketError,
  type PolymarketClobL2HeaderArgs,
} from "@apicity/polymarket";
import {
  PolymarketClobBalanceAllowanceQuerySchema,
  PolymarketClobDropNotificationsQuerySchema,
  PolymarketClobNotificationsQuerySchema,
  PolymarketClobOrderScoringQuerySchema,
  PolymarketClobOrdersScoringQuerySchema,
  PolymarketClobRewardPercentagesQuerySchema,
  PolymarketClobRewardsUserMarketsQuerySchema,
  PolymarketClobRewardsUserQuerySchema,
  PolymarketClobRewardsUserTotalQuerySchema,
  PolymarketClobUserOrdersQuerySchema,
  PolymarketClobUserTradesQuerySchema,
} from "@apicity/polymarket/zod";
import { privateKeyToAccount } from "viem/accounts";

const SIGNED_ORDER = {
  maker: "0x1234567890123456789012345678901234567890",
  signer: "0x1234567890123456789012345678901234567890",
  tokenId: "123",
  makerAmount: "1000000",
  takerAmount: "500000",
  side: "BUY" as const,
  expiration: "0",
  timestamp: "1700000000000",
  metadata: "",
  builder: "0x0000000000000000000000000000000000000000000000000000000000000000",
  signature: "0xsignature",
  salt: 1234567890,
  signatureType: 3 as const,
};

function expectedHmac(
  timestamp: number,
  method: string,
  path: string,
  body?: string
): string {
  return createHmac("sha256", Buffer.from("secret"))
    .update(`${timestamp}${method}${path}${body ?? ""}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("polymarket clob authenticated structure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes trading/account namespaces and schemas", () => {
    const provider = createPolymarket();

    expect(provider.post.clob.order.schema.safeParse).toBeInstanceOf(Function);
    expect(provider.post.clob.orders.schema.safeParse).toBeInstanceOf(Function);
    expect(provider.delete.clob.order.schema.safeParse).toBeInstanceOf(
      Function
    );
    expect(provider.delete.clob.orders.schema.safeParse).toBeInstanceOf(
      Function
    );
    expect(provider.delete.clob.cancelAll).toBeInstanceOf(Function);
    expect(provider.get.clob.data.orders).toBeInstanceOf(Function);
    expect(provider.get.clob.data.trades).toBeInstanceOf(Function);
    expect(provider.get.clob.balanceAllowance.update).toBeInstanceOf(Function);
    expect(provider.put.clob.balanceAllowance).toBeInstanceOf(Function);
    expect(provider.get.clob.notifications).toBeInstanceOf(Function);
    expect(provider.delete.clob.notifications).toBeInstanceOf(Function);
    expect(provider.get.clob.orderScoring).toBeInstanceOf(Function);
    expect(provider.get.clob.ordersScoring).toBeInstanceOf(Function);
    expect(provider.post.clob.ordersScoring.schema.safeParse).toBeInstanceOf(
      Function
    );
    expect(provider.post.clob.heartbeats).toBeInstanceOf(Function);
    expect(provider.post.clob.v1.heartbeats.schema.safeParse).toBeInstanceOf(
      Function
    );
    expect(provider.get.clob.auth.builderApiKey).toBeInstanceOf(Function);
    expect(provider.post.clob.auth.builderApiKey).toBeInstanceOf(Function);
    expect(provider.delete.clob.auth.builderApiKey).toBeInstanceOf(Function);
    expect(provider.get.clob.rewards.user).toBeInstanceOf(Function);
    expect(provider.get.clob.rewards.userTotal).toBeInstanceOf(Function);
    expect(provider.get.clob.rewards.userPercentages).toBeInstanceOf(Function);
    expect(provider.get.clob.rewards.userMarkets).toBeInstanceOf(Function);
  });

  it("validates authenticated trading request and query schemas", () => {
    const provider = createPolymarket();

    expect(
      provider.post.clob.order.schema.safeParse({
        order: SIGNED_ORDER,
        owner: "owner-id",
        orderType: "GTC",
      }).success
    ).toBe(true);
    expect(
      provider.post.clob.order.schema.safeParse({
        order: { ...SIGNED_ORDER, signatureType: 99 },
        owner: "owner-id",
      }).success
    ).toBe(false);
    expect(
      provider.post.clob.orders.schema.safeParse([
        { order: SIGNED_ORDER, owner: "owner-id" },
      ]).success
    ).toBe(true);
    expect(provider.post.clob.orders.schema.safeParse([]).success).toBe(false);
    expect(
      provider.delete.clob.order.schema.safeParse({ orderID: "0xorder" })
        .success
    ).toBe(true);
    expect(
      provider.delete.clob.orders.schema.safeParse(["0xorder-1", "0xorder-2"])
        .success
    ).toBe(true);
    expect(
      provider.delete.clob.cancelMarketOrders.schema.safeParse({
        market: "0xmarket",
        asset_id: "123",
      }).success
    ).toBe(true);
    expect(
      provider.post.clob.placeOrder.schema.safeParse({
        tokenID: "123",
        side: "BUY",
        price: 0.5,
        size: 10,
        orderType: "GTC",
      }).success
    ).toBe(true);
    expect(
      provider.post.clob.placeOrder.schema.safeParse({
        tokenID: "123",
        side: "BUY",
        price: 1,
        size: 10,
      }).success
    ).toBe(false);
    expect(
      provider.post.clob.v1.heartbeats.schema.safeParse({
        heartbeat_id: "hb-1",
      }).success
    ).toBe(true);
    expect(
      provider.post.clob.ordersScoring.schema.safeParse(["0xorder"]).success
    ).toBe(true);
    expect(provider.post.clob.ordersScoring.schema.safeParse([]).success).toBe(
      false
    );

    expect(
      PolymarketClobBalanceAllowanceQuerySchema.safeParse({
        asset_type: "COLLATERAL",
        signature_type: 3,
      }).success
    ).toBe(true);
    expect(
      PolymarketClobBalanceAllowanceQuerySchema.safeParse({
        asset_type: "INVALID",
      }).success
    ).toBe(false);
    expect(
      PolymarketClobUserOrdersQuerySchema.safeParse({
        market: "0xmarket",
        next_cursor: "next",
      }).success
    ).toBe(true);
    expect(
      PolymarketClobUserTradesQuerySchema.safeParse({
        maker_address: "0xmaker",
        before: "1700000000",
      }).success
    ).toBe(true);
    expect(
      PolymarketClobNotificationsQuerySchema.safeParse({
        signature_type: 3,
      }).success
    ).toBe(true);
    expect(PolymarketClobNotificationsQuerySchema.safeParse({}).success).toBe(
      false
    );
    expect(
      PolymarketClobDropNotificationsQuerySchema.safeParse({
        ids: ["note-1"],
      }).success
    ).toBe(true);
    expect(
      PolymarketClobDropNotificationsQuerySchema.safeParse({ ids: [] }).success
    ).toBe(false);
    expect(
      PolymarketClobOrderScoringQuerySchema.safeParse({
        order_id: "0xorder",
      }).success
    ).toBe(true);
    expect(
      PolymarketClobOrdersScoringQuerySchema.safeParse({
        order_ids: ["0xorder-1", "0xorder-2"],
      }).success
    ).toBe(true);
    expect(
      PolymarketClobOrdersScoringQuerySchema.safeParse({ order_ids: [] })
        .success
    ).toBe(false);
    expect(
      PolymarketClobRewardsUserQuerySchema.safeParse({
        date: "2026-02-27",
        signature_type: 3,
      }).success
    ).toBe(true);
    expect(PolymarketClobRewardsUserQuerySchema.safeParse({}).success).toBe(
      false
    );
    expect(
      PolymarketClobRewardsUserTotalQuerySchema.safeParse({
        date: "2026-02-27",
      }).success
    ).toBe(true);
    expect(
      PolymarketClobRewardPercentagesQuerySchema.safeParse({
        maker_address: "0xmaker",
      }).success
    ).toBe(true);
    expect(
      PolymarketClobRewardsUserMarketsQuerySchema.safeParse({
        tag_slug: ["politics", "crypto"],
        favorite_markets: true,
      }).success
    ).toBe(true);
  });

  it("constructs API-key L1 auth requests with caller-provided headers", async () => {
    const captured: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      captured.push({ url: String(url), init });
      return jsonResponse({
        apiKey: "api-key",
        secret: "secret",
        passphrase: "passphrase",
      });
    };

    const provider = createPolymarket({ fetch: fetchImpl });
    const headers = {
      address: "0x1234567890123456789012345678901234567890",
      signature: "0xsig",
      timestamp: 1_700_000_000,
      nonce: 7,
    };

    await provider.post.clob.auth.apiKey(headers);
    await provider.get.clob.auth.apiKeys(headers);
    await provider.get.clob.auth.deriveApiKey(headers);

    expect(
      captured.map(({ url, init }) => ({
        method: init?.method,
        url,
        body: init?.body,
      }))
    ).toEqual([
      {
        method: "POST",
        url: "https://clob.polymarket.com/auth/api-key",
        body: undefined,
      },
      {
        method: "GET",
        url: "https://clob.polymarket.com/auth/api-keys",
        body: undefined,
      },
      {
        method: "GET",
        url: "https://clob.polymarket.com/auth/derive-api-key",
        body: undefined,
      },
    ]);

    for (const { init } of captured) {
      const requestHeaders = new Headers(init?.headers);
      expect(requestHeaders.get("POLY_ADDRESS")).toBe(headers.address);
      expect(requestHeaders.get("POLY_SIGNATURE")).toBe(headers.signature);
      expect(requestHeaders.get("POLY_TIMESTAMP")).toBe(
        String(headers.timestamp)
      );
      expect(requestHeaders.get("POLY_NONCE")).toBe(String(headers.nonce));
    }
  });

  it("constructs builder API-key and user rewards L2 requests", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const captured: Array<{ url: string; init?: RequestInit }> = [];
    const signerCalls: PolymarketClobL2HeaderArgs[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      captured.push({ url: String(url), init });
      return jsonResponse({
        key: "builder-key",
        secret: "builder-secret",
        passphrase: "builder-passphrase",
        data: [],
        limit: 0,
        count: 0,
        next_cursor: "",
      });
    };
    const provider = createPolymarket({
      fetch: fetchImpl,
      clobL2HeaderSigner: (args) => {
        signerCalls.push(args);
        return {
          address: "0x1234567890123456789012345678901234567890",
          apiKey: "signed-api-key",
          passphrase: "signed-passphrase",
          timestamp: args.timestamp,
          signature: `sig:${args.method}:${args.requestPath}`,
        };
      },
    });

    await provider.get.clob.auth.builderApiKey();
    await provider.post.clob.auth.builderApiKey();
    await provider.delete.clob.auth.builderApiKey();
    await provider.get.clob.rewards.user({
      date: "2026-02-27",
      signature_type: 3,
      maker_address: "0xmaker",
      sponsored: true,
      next_cursor: "next cursor",
    });
    await provider.get.clob.rewards.userTotal({
      date: "2026-02-27",
      signature_type: 3,
    });
    await provider.get.clob.rewards.userPercentages({
      signature_type: 3,
      maker_address: "0xmaker",
    });
    await provider.get.clob.rewards.userMarkets({
      date: "2026-02-27",
      tag_slug: ["politics", "crypto"],
      favorite_markets: true,
      page_size: 25,
    });

    expect(
      captured.map(({ url, init }) => ({
        method: init?.method,
        url,
        body: init?.body,
      }))
    ).toEqual([
      {
        method: "GET",
        url: "https://clob.polymarket.com/auth/builder-api-key",
        body: undefined,
      },
      {
        method: "POST",
        url: "https://clob.polymarket.com/auth/builder-api-key",
        body: undefined,
      },
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/auth/builder-api-key",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/rewards/user" +
          "?date=2026-02-27&signature_type=3&maker_address=0xmaker" +
          "&sponsored=true&next_cursor=next+cursor",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/rewards/user/total" +
          "?date=2026-02-27&signature_type=3",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/rewards/user/percentages" +
          "?signature_type=3&maker_address=0xmaker",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/rewards/user/markets" +
          "?date=2026-02-27&tag_slug=politics&tag_slug=crypto" +
          "&favorite_markets=true&page_size=25",
        body: undefined,
      },
    ]);

    expect(
      signerCalls.map(({ method, requestPath, body, timestamp }) => ({
        method,
        requestPath,
        body,
        timestamp,
      }))
    ).toEqual([
      {
        method: "GET",
        requestPath: "/auth/builder-api-key",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "POST",
        requestPath: "/auth/builder-api-key",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "DELETE",
        requestPath: "/auth/builder-api-key",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/rewards/user",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/rewards/user/total",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/rewards/user/percentages",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/rewards/user/markets",
        body: undefined,
        timestamp: 1_700_000_000,
      },
    ]);

    for (const { url, init } of captured) {
      const headers = new Headers(init?.headers);
      expect(headers.get("POLY_ADDRESS")).toBe(
        "0x1234567890123456789012345678901234567890"
      );
      expect(headers.get("POLY_API_KEY")).toBe("signed-api-key");
      expect(headers.get("POLY_PASSPHRASE")).toBe("signed-passphrase");
      expect(headers.get("POLY_TIMESTAMP")).toBe("1700000000");
      expect(headers.get("POLY_SIGNATURE")).toBe(
        `sig:${init?.method}:${new URL(url).pathname}`
      );
      expect(headers.get("Content-Type")).toBeNull();
    }
  });

  it("constructs authenticated reads, account updates, scoring, heartbeat, and guarded cancel requests", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const captured: Array<{ url: string; init?: RequestInit }> = [];
    const signerCalls: PolymarketClobL2HeaderArgs[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      captured.push({ url: String(url), init });
      return jsonResponse({
        status: "ok",
        balance: "0",
        allowances: {},
        data: [],
        limit: 0,
        count: 0,
        next_cursor: "",
        scoring: true,
        heartbeat_id: "hb-1",
        "0xorder-1": true,
        "0xorder-2": false,
      });
    };
    const provider = createPolymarket({
      fetch: fetchImpl,
      clobL2HeaderSigner: (args) => {
        signerCalls.push(args);
        return {
          address: "0x1234567890123456789012345678901234567890",
          apiKey: "signed-api-key",
          passphrase: "signed-passphrase",
          timestamp: args.timestamp,
          signature: `sig:${args.method}:${args.requestPath}`,
        };
      },
    });

    await provider.delete.clob.auth.apiKey();
    await provider.get.clob.auth.banStatus.closedOnly();
    await provider.get.clob.balanceAllowance({
      asset_type: "CONDITIONAL",
      token_id: "token 1",
      signature_type: 3,
    });
    await provider.get.clob.balanceAllowance.update({
      asset_type: "COLLATERAL",
      signature_type: 3,
    });
    await provider.put.clob.balanceAllowance({
      asset_type: "COLLATERAL",
      signature_type: 3,
    });
    await provider.get.clob.data.orders({
      id: "order-1",
      market: "market-1",
      asset_id: "asset-1",
      next_cursor: "next cursor",
    });
    await provider.get.clob.data.order("order/id with space");
    await provider.get.clob.data.trades({
      id: "trade-1",
      maker_address: "0xmaker",
      market: "market-1",
      asset_id: "asset-1",
      before: "1700000100",
      after: "1699999900",
      next_cursor: "next cursor",
    });
    await provider.get.clob.notifications({ signature_type: 3 });
    await provider.delete.clob.notifications({ ids: ["note-1", "note-2"] });
    await provider.get.clob.orderScoring({ order_id: "0xorder-1" });
    await provider.get.clob.ordersScoring({
      order_ids: ["0xorder-1", "0xorder-2"],
    });
    await provider.post.clob.ordersScoring(["0xorder-1", "0xorder-2"]);
    await provider.post.clob.heartbeats();
    await provider.post.clob.v1.heartbeats({ heartbeat_id: "hb-1" });
    await provider.delete.clob.order({ orderID: "0xorder-1" });
    await provider.delete.clob.orders(["0xorder-1", "0xorder-2"]);
    await provider.delete.clob.cancelAll();
    await provider.delete.clob.cancelMarketOrders({
      market: "0xmarket",
      asset_id: "asset-1",
    });

    expect(
      captured.map(({ url, init }) => ({
        method: init?.method,
        url,
        body: init?.body,
      }))
    ).toEqual([
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/auth/api-key",
        body: undefined,
      },
      {
        method: "GET",
        url: "https://clob.polymarket.com/auth/ban-status/closed-only",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/balance-allowance" +
          "?asset_type=CONDITIONAL&token_id=token+1&signature_type=3",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/balance-allowance/update" +
          "?asset_type=COLLATERAL&signature_type=3",
        body: undefined,
      },
      {
        method: "PUT",
        url:
          "https://clob.polymarket.com/balance-allowance" +
          "?asset_type=COLLATERAL&signature_type=3",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/data/orders" +
          "?id=order-1&market=market-1&asset_id=asset-1&next_cursor=next+cursor",
        body: undefined,
      },
      {
        method: "GET",
        url: "https://clob.polymarket.com/data/order/order%2Fid%20with%20space",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/data/trades" +
          "?id=trade-1&maker_address=0xmaker&market=market-1&asset_id=asset-1" +
          "&before=1700000100&after=1699999900&next_cursor=next+cursor",
        body: undefined,
      },
      {
        method: "GET",
        url: "https://clob.polymarket.com/notifications?signature_type=3",
        body: undefined,
      },
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/notifications?ids=note-1%2Cnote-2",
        body: undefined,
      },
      {
        method: "GET",
        url: "https://clob.polymarket.com/order-scoring?order_id=0xorder-1",
        body: undefined,
      },
      {
        method: "GET",
        url:
          "https://clob.polymarket.com/orders-scoring" +
          "?order_ids=0xorder-1&order_ids=0xorder-2",
        body: undefined,
      },
      {
        method: "POST",
        url: "https://clob.polymarket.com/orders-scoring",
        body: JSON.stringify(["0xorder-1", "0xorder-2"]),
      },
      {
        method: "POST",
        url: "https://clob.polymarket.com/heartbeats",
        body: undefined,
      },
      {
        method: "POST",
        url: "https://clob.polymarket.com/v1/heartbeats",
        body: JSON.stringify({ heartbeat_id: "hb-1" }),
      },
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/order",
        body: JSON.stringify({ orderID: "0xorder-1" }),
      },
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/orders",
        body: JSON.stringify(["0xorder-1", "0xorder-2"]),
      },
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/cancel-all",
        body: undefined,
      },
      {
        method: "DELETE",
        url: "https://clob.polymarket.com/cancel-market-orders",
        body: JSON.stringify({ market: "0xmarket", asset_id: "asset-1" }),
      },
    ]);

    expect(
      signerCalls.map(({ method, requestPath, body, timestamp }) => ({
        method,
        requestPath,
        body,
        timestamp,
      }))
    ).toEqual([
      {
        method: "DELETE",
        requestPath: "/auth/api-key",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/auth/ban-status/closed-only",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/balance-allowance",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/balance-allowance/update",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "PUT",
        requestPath: "/balance-allowance",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/data/orders",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/data/order/order%2Fid%20with%20space",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/data/trades",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/notifications",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "DELETE",
        requestPath: "/notifications",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/order-scoring",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "GET",
        requestPath: "/orders-scoring",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "POST",
        requestPath: "/orders-scoring",
        body: JSON.stringify(["0xorder-1", "0xorder-2"]),
        timestamp: 1_700_000_000,
      },
      {
        method: "POST",
        requestPath: "/heartbeats",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "POST",
        requestPath: "/v1/heartbeats",
        body: JSON.stringify({ heartbeat_id: "hb-1" }),
        timestamp: 1_700_000_000,
      },
      {
        method: "DELETE",
        requestPath: "/order",
        body: JSON.stringify({ orderID: "0xorder-1" }),
        timestamp: 1_700_000_000,
      },
      {
        method: "DELETE",
        requestPath: "/orders",
        body: JSON.stringify(["0xorder-1", "0xorder-2"]),
        timestamp: 1_700_000_000,
      },
      {
        method: "DELETE",
        requestPath: "/cancel-all",
        body: undefined,
        timestamp: 1_700_000_000,
      },
      {
        method: "DELETE",
        requestPath: "/cancel-market-orders",
        body: JSON.stringify({ market: "0xmarket", asset_id: "asset-1" }),
        timestamp: 1_700_000_000,
      },
    ]);

    for (const { url, init } of captured) {
      const headers = new Headers(init?.headers);
      expect(headers.get("POLY_ADDRESS")).toBe(
        "0x1234567890123456789012345678901234567890"
      );
      expect(headers.get("POLY_API_KEY")).toBe("signed-api-key");
      expect(headers.get("POLY_PASSPHRASE")).toBe("signed-passphrase");
      expect(headers.get("POLY_TIMESTAMP")).toBe("1700000000");
      expect(headers.get("POLY_SIGNATURE")).toBe(
        `sig:${init?.method}:${new URL(url).pathname}`
      );
      if (init?.body === undefined) {
        expect(headers.get("Content-Type")).toBeNull();
      } else {
        expect(headers.get("Content-Type")).toBe("application/json");
      }
    }
  });

  it("signs L2 authenticated order requests with path and body", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(
        JSON.stringify({
          success: true,
          orderID: "0xorder",
          status: "live",
          makingAmount: "1000000",
          takingAmount: "500000",
          errorMsg: "",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = createPolymarket({
      clobAddress: "0x1234567890123456789012345678901234567890",
      clobApiKey: "api-key",
      clobApiSecret: "c2VjcmV0",
      clobApiPassphrase: "passphrase",
      fetch: fetchImpl,
    });
    const request = {
      order: SIGNED_ORDER,
      owner: "owner-id",
      orderType: "GTC" as const,
      deferExec: false,
      postOnly: true,
    };

    await provider.post.clob.order(request);

    const body = JSON.stringify(request);
    const headers = new Headers(capturedInit?.headers);
    expect(capturedUrl).toBe("https://clob.polymarket.com/order");
    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.body).toBe(body);
    expect(headers.get("POLY_ADDRESS")).toBe(
      "0x1234567890123456789012345678901234567890"
    );
    expect(headers.get("POLY_API_KEY")).toBe("api-key");
    expect(headers.get("POLY_PASSPHRASE")).toBe("passphrase");
    expect(headers.get("POLY_TIMESTAMP")).toBe("1700000000");
    expect(headers.get("POLY_SIGNATURE")).toBe(
      expectedHmac(1_700_000_000, "POST", "/order", body)
    );
  });

  it("builds and posts signed placeOrder payloads without the upstream clob client", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const privateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const account = privateKeyToAccount(privateKey);
    const funder = "0x000000000000000000000000000000000000dead";
    const capturedUrls: string[] = [];
    let capturedOrderInit: RequestInit | undefined;

    const fetchImpl: typeof fetch = async (url, init) => {
      const u = String(url);
      capturedUrls.push(u);
      if (u.includes("/tick-size")) {
        return new Response(JSON.stringify({ minimum_tick_size: 0.01 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (u.includes("/neg-risk")) {
        return new Response(JSON.stringify({ neg_risk: false }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      capturedOrderInit = init;
      return new Response(
        JSON.stringify({
          success: true,
          orderID: "0xorder",
          status: "live",
          makingAmount: "6293400",
          takingAmount: "12340000",
          errorMsg: "",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = createPolymarket({
      clobAddress: account.address,
      clobApiKey: "api-key",
      clobApiSecret: "c2VjcmV0",
      clobApiPassphrase: "passphrase",
      clobPrivateKey: privateKey,
      clobFunderAddress: funder,
      fetch: fetchImpl,
    });

    await provider.post.clob.placeOrder({
      tokenID: "123456789",
      side: "BUY",
      price: 0.51,
      size: 12.34,
      orderType: "GTD",
      expiration: 1_700_003_600,
    });

    expect(capturedUrls).toEqual([
      "https://clob.polymarket.com/tick-size?token_id=123456789",
      "https://clob.polymarket.com/neg-risk?token_id=123456789",
      "https://clob.polymarket.com/order",
    ]);
    const body = String(capturedOrderInit?.body);
    const payload = JSON.parse(body) as {
      order: {
        salt: number;
        maker: string;
        signer: string;
        tokenId: string;
        makerAmount: string;
        takerAmount: string;
        side: string;
        expiration: string;
        timestamp: string;
        metadata: string;
        builder: string;
        signature: string;
        signatureType: number;
      };
      owner: string;
      orderType: string;
      deferExec: boolean;
      postOnly: boolean;
    };

    expect(payload).toMatchObject({
      owner: "api-key",
      orderType: "GTD",
      deferExec: false,
      postOnly: false,
      order: {
        salt: 850_000_000_000,
        maker: funder,
        signer: account.address,
        tokenId: "123456789",
        makerAmount: "6293400",
        takerAmount: "12340000",
        side: "BUY",
        expiration: "1700003600",
        timestamp: "1700000000000",
        metadata:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        builder:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        signatureType: 1,
      },
    });
    expect(payload.order.signature).toMatch(/^0x[0-9a-f]{130}$/i);

    const headers = new Headers(capturedOrderInit?.headers);
    expect(capturedOrderInit?.method).toBe("POST");
    expect(headers.get("POLY_SIGNATURE")).toBe(
      expectedHmac(1_700_000_000, "POST", "/order", body)
    );
  });

  it("signs L2 authenticated query requests with the path only", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    let capturedUrl = "";
    let capturedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return new Response(
        JSON.stringify({
          balance: "0",
          allowance: "0",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = createPolymarket({
      clobAddress: "0x1234567890123456789012345678901234567890",
      clobApiKey: "api-key",
      clobApiSecret: "c2VjcmV0",
      clobApiPassphrase: "passphrase",
      fetch: fetchImpl,
    });

    await provider.get.clob.balanceAllowance({
      asset_type: "COLLATERAL",
      signature_type: 3,
    });

    const headers = new Headers(capturedInit?.headers);
    expect(capturedUrl).toBe(
      "https://clob.polymarket.com/balance-allowance?asset_type=COLLATERAL&signature_type=3"
    );
    expect(capturedInit?.method).toBe("GET");
    expect(headers.get("POLY_TIMESTAMP")).toBe("1700000000");
    expect(headers.get("POLY_SIGNATURE")).toBe(
      expectedHmac(1_700_000_000, "GET", "/balance-allowance")
    );
  });

  it("forwards L1 headers for API-key derivation", async () => {
    let capturedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = async (_url, init) => {
      capturedInit = init;
      return new Response(
        JSON.stringify({
          apiKey: "api-key",
          secret: "secret",
          passphrase: "passphrase",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const provider = createPolymarket({ fetch: fetchImpl });
    await provider.get.clob.auth.deriveApiKey({
      address: "0x1234567890123456789012345678901234567890",
      signature: "0xsig",
      timestamp: 1_700_000_000,
      nonce: 7,
    });

    const headers = new Headers(capturedInit?.headers);
    expect(capturedInit?.method).toBe("GET");
    expect(headers.get("POLY_ADDRESS")).toBe(
      "0x1234567890123456789012345678901234567890"
    );
    expect(headers.get("POLY_SIGNATURE")).toBe("0xsig");
    expect(headers.get("POLY_TIMESTAMP")).toBe("1700000000");
    expect(headers.get("POLY_NONCE")).toBe("7");
  });

  it("throws a PolymarketError when L2 credentials are missing", async () => {
    const provider = createPolymarket({
      fetch: async () => new Response("{}", { status: 200 }),
    });

    await expect(provider.delete.clob.cancelAll()).rejects.toBeInstanceOf(
      PolymarketError
    );
  });
});
