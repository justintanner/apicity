import { Wallet } from "@ethersproject/wallet";
import {
  ClobClient,
  Chain,
  OrderType,
  Side,
  SignatureTypeV2,
  type ApiKeyCreds,
} from "@polymarket/clob-client-v2";
import type { PolymarketOptions } from "./types";
import type { PolymarketClobPlaceOrderRequest } from "./zod";

const DEFAULT_CLOB_HOST = "https://clob.polymarket.com";

export interface PolymarketClobTrader {
  placeOrder(req: PolymarketClobPlaceOrderRequest): Promise<unknown>;
}

function requireCreds(opts: PolymarketOptions): ApiKeyCreds {
  const { clobApiKey, clobApiSecret, clobApiPassphrase } = opts;
  if (!clobApiKey || !clobApiSecret || !clobApiPassphrase) {
    throw new Error(
      "Polymarket order signing requires clobApiKey, clobApiSecret and clobApiPassphrase"
    );
  }
  return {
    key: clobApiKey,
    secret: clobApiSecret,
    passphrase: clobApiPassphrase,
  };
}

function buildClient(opts: PolymarketOptions): ClobClient {
  if (!opts.clobPrivateKey) {
    throw new Error("Polymarket order signing requires clobPrivateKey");
  }
  const signatureType = (opts.clobSignatureType ??
    SignatureTypeV2.POLY_PROXY) as SignatureTypeV2;
  return new ClobClient({
    host: opts.clobBaseURL ?? DEFAULT_CLOB_HOST,
    chain: Chain.POLYGON,
    signer: new Wallet(opts.clobPrivateKey),
    creds: requireCreds(opts),
    signatureType,
    funderAddress: opts.clobFunderAddress,
  });
}

function toSide(side: "BUY" | "SELL"): Side {
  return side === "BUY" ? Side.BUY : Side.SELL;
}

function toLimitOrderType(
  orderType?: "GTC" | "GTD"
): OrderType.GTC | OrderType.GTD {
  return orderType === "GTD" ? OrderType.GTD : OrderType.GTC;
}

export function createClobTrader(
  opts: PolymarketOptions
): PolymarketClobTrader {
  // Construct the wallet-backed client lazily: read-only callers never pay the
  // setup cost or hit the missing-credential errors until they actually trade.
  let client: ClobClient | undefined;

  function clientFor(): ClobClient {
    if (!client) client = buildClient(opts);
    return client;
  }

  async function placeOrder(
    req: PolymarketClobPlaceOrderRequest
  ): Promise<unknown> {
    return clientFor().createAndPostOrder(
      {
        tokenID: req.tokenID,
        price: req.price,
        size: req.size,
        side: toSide(req.side),
        expiration: req.expiration,
      },
      {},
      toLimitOrderType(req.orderType)
    );
  }

  return { placeOrder };
}
