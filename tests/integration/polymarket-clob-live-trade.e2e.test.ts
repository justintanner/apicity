import { describe, expect, it } from "vitest";
import {
  Chain,
  ClobClient,
  OrderType,
  Side,
  isV2Order,
  orderToJsonV2,
  type SignedOrder,
  type TickSize,
} from "@polymarket/clob-client-v2";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  createPolymarket,
  type PolymarketClobOrderType,
  type PolymarketClobSide,
  type PolymarketClobSignatureType,
  type PolymarketClobSignedOrder,
  type PolymarketGammaMarket,
} from "@apicity/polymarket";

const DEFAULT_MARKET_SLUG = "btc-updown-5m-1780834800";
const DEFAULT_OUTCOME = "Up";
const DEFAULT_BUY_USDC = 2;
const DEFAULT_MAX_NOTIONAL_USDC = 2;
const DEFAULT_MIN_SIZE = 5;
const CLOB_HOST = "https://clob.polymarket.com";
const POLYGON_RPC_URL = "https://polygon-rpc.com";
const GEOBLOCK_URL = "https://polymarket.com/api/geoblock";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const LIVE_TRADE_TIMEOUT_MS = 90_000;
const TICK_SIZES = ["0.1", "0.01", "0.001", "0.0001"] as const;
const CONDITION_TOKEN_SIZE_DECIMALS = 2;

type LiveSignedOrder = PolymarketClobSignedOrder & {
  taker: string;
};

interface LiveTradeConfig {
  address: string;
  privateKey: Hex;
  funderAddress: string;
  clobApiKey: string;
  clobApiSecret: string;
  clobApiPassphrase: string;
  signatureType: PolymarketClobSignatureType;
  slug: string;
  outcome: string;
  size?: number;
  price?: number;
  buyUsdc: number;
  maxNotional: number;
  rpcUrl: string;
}

interface SelectedMarket {
  market: PolymarketGammaMarket;
  conditionId: string;
  tokenId: string;
  outcome: string;
}

interface NumericBookLevel {
  price: number;
  size: number;
}

interface FillPlan {
  limitPrice: number;
  shares: number;
  notional: number;
}

const liveIt = process.env.POLYMARKET_E2E_LIVE_TRADE === "1" ? it : it.skip;
const roundTripIt =
  process.env.POLYMARKET_E2E_LIVE_ROUND_TRIP === "1" ? it : it.skip;
const sellExistingIt =
  process.env.POLYMARKET_E2E_LIVE_SELL_EXISTING === "1" ? it : it.skip;

describe("polymarket clob live trade e2e", () => {
  liveIt(
    "places a capped post-only order through Apicity and cancels it",
    async () => {
      const config = readLiveTradeConfig();
      const provider = createPolymarket({
        clobAddress: config.address,
        clobApiKey: config.clobApiKey,
        clobApiSecret: config.clobApiSecret,
        clobApiPassphrase: config.clobApiPassphrase,
      });

      const event = await provider.get.gamma.events.slug(config.slug);
      expect(event.slug).toBe(config.slug);
      assertEventOpen(event);

      const selected = selectMarket(event.markets, config.outcome);
      const compact = await provider.get.clob.clobMarkets(selected.conditionId);
      if (!compact.ao) {
        throw new Error(
          `Market ${selected.conditionId} is not accepting CLOB orders`
        );
      }

      const tickSize = tickSizeFromUnknown(
        compact.mts ?? selected.market.minimumTickSize ?? "0.01"
      );
      const minOrderSize = positiveNumber(
        compact.mos ?? selected.market.minimumOrderSize ?? DEFAULT_MIN_SIZE,
        "minimum order size"
      );
      const book = await provider.get.clob.book({
        token_id: selected.tokenId,
      });
      const bestAsk = minFinite(book.asks.map((level) => Number(level.price)));
      const price =
        config.price ?? chooseNonCrossingBuyPrice(tickSize, bestAsk);
      const size = config.size ?? minOrderSize;
      const notional = price * size;

      assertBuyPriceIsSafe(price, tickSize, bestAsk, selected.outcome);
      if (notional > config.maxNotional) {
        throw new Error(
          `Refusing to place $${formatAmount(notional)} order; cap is ` +
            `$${formatAmount(config.maxNotional)}. Adjust ` +
            "POLYMARKET_E2E_MAX_NOTIONAL_USDC or POLYMARKET_E2E_SIZE."
        );
      }

      const balanceAllowance = await provider.get.clob.balanceAllowance({
        asset_type: "COLLATERAL",
        signature_type: config.signatureType,
      });
      expect(Number(balanceAllowance.balance)).toBeGreaterThan(0);

      const signer = createWalletClient({
        account: privateKeyToAccount(config.privateKey),
        transport: http(config.rpcUrl),
      });
      const clobClient = new ClobClient({
        host: CLOB_HOST,
        chain: Chain.POLYGON,
        signer,
        creds: {
          key: config.clobApiKey,
          secret: config.clobApiSecret,
          passphrase: config.clobApiPassphrase,
        },
        signatureType: config.signatureType,
        funderAddress: config.funderAddress,
      });

      const signedOrder = await clobClient.createOrder(
        {
          tokenID: selected.tokenId,
          price,
          size,
          side: Side.BUY,
        },
        {
          tickSize,
          negRisk: selected.market.negRisk ?? false,
        }
      );
      const payload = signedOrderPayload(
        signedOrder,
        config.clobApiKey,
        "GTC",
        true,
        false
      );

      let orderId: string | undefined;
      try {
        const posted = await provider.post.clob.order(payload);
        if (!posted.success) {
          throw new Error(
            `Polymarket rejected the order: ${posted.errorMsg ?? posted.status}`
          );
        }
        if (posted.status === "matched") {
          throw new Error("Post-only order unexpectedly matched immediately");
        }
        orderId = posted.orderID;
        expect(orderId).toMatch(/^0x[0-9a-fA-F]+$/);

        const openOrders = await provider.get.clob.data.orders({
          id: orderId,
        });
        expect(openOrders.data.some((order) => order.id === orderId)).toBe(
          true
        );
      } finally {
        if (orderId) {
          const canceled = await provider.delete.clob.order({
            orderID: orderId,
          });
          expect(canceled.canceled).toContain(orderId);
        }
      }
    },
    LIVE_TRADE_TIMEOUT_MS
  );

  roundTripIt(
    "buys the configured amount through Apicity and sells filled shares back",
    async () => {
      await assertOpeningTradesAllowed();

      const config = readLiveTradeConfig();
      const provider = createPolymarket({
        clobAddress: config.address,
        clobApiKey: config.clobApiKey,
        clobApiSecret: config.clobApiSecret,
        clobApiPassphrase: config.clobApiPassphrase,
      });

      if (config.buyUsdc > config.maxNotional) {
        throw new Error(
          `Refusing to buy $${formatAmount(config.buyUsdc)}; cap is ` +
            `$${formatAmount(config.maxNotional)}`
        );
      }

      const event = await provider.get.gamma.events.slug(config.slug);
      expect(event.slug).toBe(config.slug);
      assertEventOpen(event);

      const selected = selectMarket(event.markets, config.outcome);
      const compact = await provider.get.clob.clobMarkets(selected.conditionId);
      if (!compact.ao) {
        throw new Error(
          `Market ${selected.conditionId} is not accepting CLOB orders`
        );
      }

      const tickSize = tickSizeFromUnknown(
        compact.mts ?? selected.market.minimumTickSize ?? "0.01"
      );
      const minOrderSize = positiveNumber(
        compact.mos ?? selected.market.minimumOrderSize ?? DEFAULT_MIN_SIZE,
        "minimum order size"
      );
      const book = await provider.get.clob.book({
        token_id: selected.tokenId,
      });
      const buyPlan = planMarketBuy(book.asks, config.buyUsdc, minOrderSize);
      const sellPlan = planMarketSell(book.bids, buyPlan.shares);
      const balanceAllowance = await provider.get.clob.balanceAllowance({
        asset_type: "COLLATERAL",
        signature_type: config.signatureType,
      });
      if (Number(balanceAllowance.balance) < config.buyUsdc) {
        throw new Error(
          `Insufficient collateral balance for $${formatAmount(
            config.buyUsdc
          )} buy`
        );
      }

      const clobClient = createSigningClient(config);
      const buyOrder = await clobClient.createMarketOrder(
        {
          tokenID: selected.tokenId,
          amount: config.buyUsdc,
          price: buyPlan.limitPrice,
          side: Side.BUY,
          orderType: OrderType.FAK,
        },
        {
          tickSize,
          negRisk: selected.market.negRisk ?? false,
        }
      );
      const buyPayload = signedOrderPayload(
        buyOrder,
        config.clobApiKey,
        "FAK",
        false,
        false
      );
      const buyPosted = await provider.post.clob.order(buyPayload);
      if (!buyPosted.success) {
        throw new Error(
          `Polymarket rejected the buy: ${
            buyPosted.errorMsg ?? buyPosted.status
          }`
        );
      }
      const boughtShares = clobAmountToNumber(buyPosted.takingAmount);
      if (boughtShares <= 0) {
        throw new Error("Buy order did not report filled shares");
      }

      const sellShares = roundDownToDecimals(
        Math.min(boughtShares, sellPlan.shares),
        CONDITION_TOKEN_SIZE_DECIMALS
      );
      if (sellShares <= 0) {
        throw new Error("Filled share amount is too small to sell back");
      }

      const refreshedBook = await provider.get.clob.book({
        token_id: selected.tokenId,
      });
      const refreshedSellPlan = planMarketSell(refreshedBook.bids, sellShares);
      const sellOrder = await clobClient.createMarketOrder(
        {
          tokenID: selected.tokenId,
          amount: sellShares,
          price: refreshedSellPlan.limitPrice,
          side: Side.SELL,
          orderType: OrderType.FAK,
        },
        {
          tickSize,
          negRisk: selected.market.negRisk ?? false,
        }
      );
      const sellPayload = signedOrderPayload(
        sellOrder,
        config.clobApiKey,
        "FAK",
        false,
        false
      );
      const sellPosted = await provider.post.clob.order(sellPayload);
      if (!sellPosted.success) {
        throw new Error(
          `Polymarket rejected the sell: ${
            sellPosted.errorMsg ?? sellPosted.status
          }`
        );
      }

      expect(clobAmountToNumber(sellPosted.makingAmount)).toBeGreaterThan(0);
    },
    LIVE_TRADE_TIMEOUT_MS
  );

  sellExistingIt(
    "sells existing configured-outcome shares through Apicity",
    async () => {
      await assertOpeningTradesAllowed();

      const config = readLiveTradeConfig();
      const provider = createPolymarket({
        clobAddress: config.address,
        clobApiKey: config.clobApiKey,
        clobApiSecret: config.clobApiSecret,
        clobApiPassphrase: config.clobApiPassphrase,
      });

      const event = await provider.get.gamma.events.slug(config.slug);
      expect(event.slug).toBe(config.slug);
      assertEventOpen(event);

      const selected = selectMarket(event.markets, config.outcome);
      const compact = await provider.get.clob.clobMarkets(selected.conditionId);
      if (!compact.ao) {
        throw new Error(
          `Market ${selected.conditionId} is not accepting CLOB orders`
        );
      }

      const tickSize = tickSizeFromUnknown(
        compact.mts ?? selected.market.minimumTickSize ?? "0.01"
      );
      const balanceAllowance = await provider.get.clob.balanceAllowance({
        asset_type: "CONDITIONAL",
        token_id: selected.tokenId,
        signature_type: config.signatureType,
      });
      const availableShares = baseUnitAmountToNumber(balanceAllowance.balance);
      const requestedShares = optionalPositiveEnvNumber(
        "POLYMARKET_E2E_SELL_SHARES"
      );
      const sellShares = roundDownToDecimals(
        Math.min(requestedShares ?? availableShares, availableShares),
        CONDITION_TOKEN_SIZE_DECIMALS
      );
      if (sellShares <= 0) {
        throw new Error(`No ${selected.outcome} shares available to sell`);
      }

      const book = await provider.get.clob.book({
        token_id: selected.tokenId,
      });
      const sellPlan = planMarketSell(book.bids, sellShares);
      const clobClient = createSigningClient(config);
      const sellOrder = await clobClient.createMarketOrder(
        {
          tokenID: selected.tokenId,
          amount: sellShares,
          price: sellPlan.limitPrice,
          side: Side.SELL,
          orderType: OrderType.FAK,
        },
        {
          tickSize,
          negRisk: selected.market.negRisk ?? false,
        }
      );
      const sellPayload = signedOrderPayload(
        sellOrder,
        config.clobApiKey,
        "FAK",
        false,
        false
      );
      const sellPosted = await provider.post.clob.order(sellPayload);
      if (!sellPosted.success) {
        throw new Error(
          `Polymarket rejected the sell: ${
            sellPosted.errorMsg ?? sellPosted.status
          }`
        );
      }

      expect(clobAmountToNumber(sellPosted.makingAmount)).toBeGreaterThan(0);
    },
    LIVE_TRADE_TIMEOUT_MS
  );
});

function readLiveTradeConfig(): LiveTradeConfig {
  return {
    address: requiredEnv("POLYMARKET_ADDRESS"),
    privateKey: privateKeyFromEnv(requiredEnv("POLYMARKET_PRIVATE_KEY")),
    funderAddress: requiredEnv("POLYMARKET_FUNDER_ADDRESS"),
    clobApiKey: requiredEnv("POLYMARKET_CLOB_API_KEY"),
    clobApiSecret: requiredEnv("POLYMARKET_CLOB_API_SECRET"),
    clobApiPassphrase: requiredEnv("POLYMARKET_CLOB_API_PASSPHRASE"),
    signatureType: signatureTypeFromEnv(
      requiredEnv("POLYMARKET_SIGNATURE_TYPE")
    ),
    slug: process.env.POLYMARKET_E2E_MARKET_SLUG ?? DEFAULT_MARKET_SLUG,
    outcome: process.env.POLYMARKET_E2E_OUTCOME ?? DEFAULT_OUTCOME,
    size: optionalPositiveEnvNumber("POLYMARKET_E2E_SIZE"),
    price: optionalPositiveEnvNumber("POLYMARKET_E2E_PRICE"),
    buyUsdc:
      optionalPositiveEnvNumber("POLYMARKET_E2E_BUY_USDC") ?? DEFAULT_BUY_USDC,
    maxNotional:
      optionalPositiveEnvNumber("POLYMARKET_E2E_MAX_NOTIONAL_USDC") ??
      DEFAULT_MAX_NOTIONAL_USDC,
    rpcUrl: process.env.POLYMARKET_RPC_URL ?? POLYGON_RPC_URL,
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith("op://")) {
    throw new Error(`${name} must resolve before running the live trade test`);
  }
  return value;
}

function privateKeyFromEnv(value: string): Hex {
  const privateKey = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("POLYMARKET_PRIVATE_KEY must be a 32-byte hex key");
  }
  return privateKey as Hex;
}

function signatureTypeFromEnv(value: string): PolymarketClobSignatureType {
  const signatureType = Number(value);
  if (![0, 1, 2, 3].includes(signatureType)) {
    throw new Error("POLYMARKET_SIGNATURE_TYPE must be one of 0, 1, 2, or 3");
  }
  return signatureType as PolymarketClobSignatureType;
}

function optionalPositiveEnvNumber(name: string): number | undefined {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  return positiveNumber(value, name);
}

function positiveNumber(value: unknown, label: string): number {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return numberValue;
}

function assertEventOpen(event: {
  active?: boolean;
  archived?: boolean;
  closed?: boolean;
  endDate?: string;
  slug: string;
}): void {
  if (event.active === false || event.closed || event.archived) {
    throw new Error(`Event ${event.slug} is not open for trading`);
  }
  if (event.endDate && Date.parse(event.endDate) <= Date.now()) {
    throw new Error(`Event ${event.slug} ended at ${event.endDate}`);
  }
}

function selectMarket(
  markets: PolymarketGammaMarket[],
  requestedOutcome: string
): SelectedMarket {
  for (const market of markets) {
    if (
      market.active === false ||
      market.closed ||
      market.archived ||
      market.acceptingOrders === false
    ) {
      continue;
    }

    const outcomes = parseStringArray(market.outcomes, "outcomes");
    const tokenIds = parseStringArray(market.clobTokenIds, "clobTokenIds");
    const outcomeIndex = outcomes.findIndex(
      (outcome) => outcome.toLowerCase() === requestedOutcome.toLowerCase()
    );
    const tokenId = tokenIds[outcomeIndex];
    if (outcomeIndex >= 0 && tokenId && market.conditionId) {
      return {
        market,
        conditionId: market.conditionId,
        tokenId,
        outcome: outcomes[outcomeIndex],
      };
    }
  }

  throw new Error(
    `No open CLOB market found with outcome ${JSON.stringify(requestedOutcome)}`
  );
}

function parseStringArray(value: unknown, label: string): readonly string[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (
    !Array.isArray(parsed) ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error(`${label} must be a string array`);
  }
  return parsed;
}

function tickSizeFromUnknown(value: unknown): TickSize {
  const tickSize = String(value);
  if (!isTickSize(tickSize)) {
    throw new Error(`Unsupported tick size: ${tickSize}`);
  }
  return tickSize;
}

function isTickSize(value: string): value is TickSize {
  return TICK_SIZES.includes(value as TickSize);
}

function chooseNonCrossingBuyPrice(
  tickSize: TickSize,
  bestAsk: number | undefined
): number {
  const tickValue = Number(tickSize);
  if (bestAsk === undefined) return tickValue;
  return roundDownToTick(bestAsk - tickValue, tickSize);
}

function assertBuyPriceIsSafe(
  price: number,
  tickSize: TickSize,
  bestAsk: number | undefined,
  outcome: string
): void {
  const tickValue = Number(tickSize);
  if (price < tickValue || price > 1 - tickValue) {
    throw new Error(
      `Price ${price} is outside the ${tickSize} tick-size bounds`
    );
  }
  if (bestAsk !== undefined && price >= bestAsk) {
    throw new Error(
      `Refusing to submit BUY ${outcome} at ${price}; best ask is ` +
        `${bestAsk}, so the order could cross. Set POLYMARKET_E2E_PRICE lower.`
    );
  }
}

function roundDownToTick(value: number, tickSize: TickSize): number {
  const tickValue = Number(tickSize);
  const decimals = tickSize.includes(".") ? tickSize.split(".")[1].length : 0;
  const steps = Math.floor(value / tickValue);
  return Number((steps * tickValue).toFixed(decimals));
}

function minFinite(values: number[]): number | undefined {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return undefined;
  return Math.min(...finiteValues);
}

async function assertOpeningTradesAllowed(): Promise<void> {
  if (process.env.POLYMARKET_E2E_ATTEST_ELIGIBLE !== "1") {
    throw new Error(
      "Set POLYMARKET_E2E_ATTEST_ELIGIBLE=1 only if you are legally " +
        "eligible to place Polymarket opening orders from this environment."
    );
  }

  const response = await fetch(GEOBLOCK_URL);
  const body = asRecord(await response.json(), "geoblock response");
  if (body.blocked === true) {
    throw new Error(
      `Polymarket geoblock rejected this environment: ${String(
        body.country ?? "unknown"
      )}/${String(body.region ?? "unknown")}`
    );
  }
}

function createSigningClient(config: LiveTradeConfig): ClobClient {
  const signer = createWalletClient({
    account: privateKeyToAccount(config.privateKey),
    transport: http(config.rpcUrl),
  });
  return new ClobClient({
    host: CLOB_HOST,
    chain: Chain.POLYGON,
    signer,
    creds: {
      key: config.clobApiKey,
      secret: config.clobApiSecret,
      passphrase: config.clobApiPassphrase,
    },
    signatureType: config.signatureType,
    funderAddress: config.funderAddress,
  });
}

function planMarketBuy(
  askLevels: readonly { price: string; size: string }[],
  usdcAmount: number,
  minOrderSize: number
): FillPlan {
  const asks = numericLevels(askLevels, "asc");
  if (asks.length === 0) {
    throw new Error("Cannot buy: order book has no asks");
  }

  let remainingUsdc = usdcAmount;
  let shares = 0;
  let limitPrice = asks[0].price;
  for (const ask of asks) {
    const levelNotional = ask.price * ask.size;
    const spend = Math.min(remainingUsdc, levelNotional);
    shares += spend / ask.price;
    remainingUsdc -= spend;
    limitPrice = ask.price;
    if (remainingUsdc <= Number.EPSILON) break;
  }

  if (remainingUsdc > Number.EPSILON) {
    throw new Error(
      `Cannot buy $${formatAmount(usdcAmount)}: insufficient ask liquidity`
    );
  }
  if (shares < minOrderSize) {
    throw new Error(
      `$${formatAmount(usdcAmount)} only buys about ${formatAmount(
        shares
      )} shares, below the market minimum order size of ${formatAmount(
        minOrderSize
      )}`
    );
  }

  return { limitPrice, shares, notional: usdcAmount };
}

function planMarketSell(
  bidLevels: readonly { price: string; size: string }[],
  sharesToSell: number
): FillPlan {
  const bids = numericLevels(bidLevels, "desc");
  if (bids.length === 0) {
    throw new Error("Cannot sell: order book has no bids");
  }

  let remainingShares = sharesToSell;
  let notional = 0;
  let limitPrice = bids[0].price;
  for (const bid of bids) {
    const size = Math.min(remainingShares, bid.size);
    notional += size * bid.price;
    remainingShares -= size;
    limitPrice = bid.price;
    if (remainingShares <= Number.EPSILON) break;
  }

  if (remainingShares > Number.EPSILON) {
    throw new Error(
      `Cannot sell ${formatAmount(sharesToSell)} shares: insufficient bid ` +
        "liquidity"
    );
  }

  return { limitPrice, shares: sharesToSell, notional };
}

function numericLevels(
  levels: readonly { price: string; size: string }[],
  direction: "asc" | "desc"
): NumericBookLevel[] {
  return levels
    .map((level) => ({
      price: Number(level.price),
      size: Number(level.size),
    }))
    .filter(
      (level) => Number.isFinite(level.price) && Number.isFinite(level.size)
    )
    .sort((a, b) =>
      direction === "asc" ? a.price - b.price : b.price - a.price
    );
}

function clobAmountToNumber(value: string | undefined): number {
  if (!value) return 0;
  if (value.includes(".")) return positiveNumber(value, "CLOB amount");
  return baseUnitAmountToNumber(value);
}

function baseUnitAmountToNumber(value: string | undefined): number {
  if (!value) return 0;
  return positiveNumber(value, "CLOB base-unit amount") / 1_000_000;
}

function roundDownToDecimals(value: number, decimals: number): number {
  const multiplier = 10 ** decimals;
  return Math.floor(value * multiplier) / multiplier;
}

function signedOrderPayload(
  signedOrder: SignedOrder,
  owner: string,
  orderType: PolymarketClobOrderType,
  postOnly: boolean,
  deferExec: boolean
): {
  order: LiveSignedOrder;
  owner: string;
  orderType: PolymarketClobOrderType;
  postOnly: boolean;
  deferExec: boolean;
} {
  if (!isV2Order(signedOrder)) {
    throw new Error("Expected a Polymarket CLOB V2 signed order");
  }

  const payload = orderToJsonV2(
    signedOrder,
    owner,
    clobClientOrderType(orderType),
    postOnly,
    deferExec
  );
  return {
    order: toApicitySignedOrder(payload.order),
    owner: payload.owner,
    orderType,
    postOnly,
    deferExec,
  };
}

function clobClientOrderType(orderType: PolymarketClobOrderType): OrderType {
  switch (orderType) {
    case "GTC":
      return OrderType.GTC;
    case "GTD":
      return OrderType.GTD;
    case "FOK":
      return OrderType.FOK;
    case "FAK":
      return OrderType.FAK;
  }
}

function toApicitySignedOrder(value: unknown): LiveSignedOrder {
  const order = asRecord(value, "signed order");
  return {
    maker: requiredString(order, "maker"),
    signer: requiredString(order, "signer"),
    taker: requiredStringWithDefault(order, "taker", ZERO_ADDRESS),
    tokenId: requiredString(order, "tokenId"),
    makerAmount: requiredString(order, "makerAmount"),
    takerAmount: requiredString(order, "takerAmount"),
    side: sideFromUnknown(order.side),
    expiration: requiredString(order, "expiration"),
    timestamp: requiredString(order, "timestamp"),
    metadata: optionalString(order, "metadata"),
    builder: requiredString(order, "builder"),
    signature: requiredString(order, "signature"),
    salt: positiveNumber(order.salt, "salt"),
    signatureType: signatureTypeFromEnv(String(order.signatureType)),
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

function requiredStringWithDefault(
  record: Record<string, unknown>,
  key: string,
  fallback: string
): string {
  const value = record[key];
  if (value === undefined) return fallback;
  return requiredString(record, key);
}

function optionalString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${key} must be a string`);
  }
  return value;
}

function sideFromUnknown(value: unknown): PolymarketClobSide {
  if (value === "BUY" || value === "SELL") return value;
  throw new Error(`Unsupported order side: ${String(value)}`);
}

function formatAmount(value: number): string {
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}
