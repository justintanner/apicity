import {
  encodeAbiParameters,
  keccak256,
  parseUnits,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  attachAbortHandler,
  formatErrorMessage,
  readErrorBody,
} from "./_helpers";
import type { PolymarketOptions } from "./types";
import { PolymarketError } from "./types";
import type {
  PolymarketClobPlaceOrderRequest,
  PolymarketClobPostOrderRequest,
  PolymarketClobSignedOrder,
} from "./zod";

const DEFAULT_CLOB_HOST = "https://clob.polymarket.com";
const POLYGON_CHAIN_ID = 137;
const CLOB_EXCHANGE_V2 = "0xE111180000d2663C0091e4f400237545B87B996B";
const CLOB_NEG_RISK_EXCHANGE_V2 = "0xe2222d279d744050d28e00520010520000310F59";
const CTF_EXCHANGE_V2_DOMAIN_NAME = "Polymarket CTF Exchange";
const CTF_EXCHANGE_V2_DOMAIN_VERSION = "2";
const BYTES32_ZERO =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const ORDER_TYPE_STRING =
  "Order(uint256 salt,address maker,address signer,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint8 side,uint8 signatureType,uint256 timestamp,bytes32 metadata,bytes32 builder)";
const ORDER_TYPE_HASH = keccak256(toHex(ORDER_TYPE_STRING));
const DOMAIN_TYPE_HASH = keccak256(
  toHex(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
  )
);
const CTF_EXCHANGE_NAME_HASH = keccak256(toHex(CTF_EXCHANGE_V2_DOMAIN_NAME));
const CTF_EXCHANGE_VERSION_HASH = keccak256(
  toHex(CTF_EXCHANGE_V2_DOMAIN_VERSION)
);
const DEFAULT_SIGNATURE_TYPE = 1;

const ORDER_TYPES = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
    { name: "timestamp", type: "uint256" },
    { name: "metadata", type: "bytes32" },
    { name: "builder", type: "bytes32" },
  ],
} as const;

const TYPED_DATA_SIGN_TYPES = {
  TypedDataSign: [
    { name: "contents", type: "Order" },
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
  ],
  ...ORDER_TYPES,
} as const;

const ROUNDING_CONFIG = {
  "0.1": { price: 1, size: 2, amount: 3 },
  "0.01": { price: 2, size: 2, amount: 4 },
  "0.001": { price: 3, size: 2, amount: 5 },
  "0.0001": { price: 4, size: 2, amount: 6 },
} as const;

type TickSize = keyof typeof ROUNDING_CONFIG;
type LocalAccount = ReturnType<typeof privateKeyToAccount>;

interface PolymarketClobTickSizeResponse {
  minimum_tick_size: number;
}

interface PolymarketClobNegRiskResponse {
  neg_risk: boolean;
}

export interface PolymarketClobTrader {
  placeOrder(
    req: PolymarketClobPlaceOrderRequest,
    postOrder: (
      req: PolymarketClobPostOrderRequest,
      signal?: AbortSignal
    ) => Promise<unknown>,
    signal?: AbortSignal
  ): Promise<unknown>;
}

function requireApiKey(opts: PolymarketOptions): string {
  const key = opts.clobApiCredentials?.key ?? opts.clobApiKey;
  if (!key) {
    throw new Error("Polymarket order signing requires clobApiKey");
  }
  return key;
}

function requirePrivateKey(opts: PolymarketOptions): Hex {
  if (!opts.clobPrivateKey) {
    throw new Error("Polymarket order signing requires clobPrivateKey");
  }
  return opts.clobPrivateKey as Hex;
}

function decimalPlaces(num: number): number {
  if (Number.isInteger(num)) return 0;
  const [, decimals = ""] = num.toString().split(".");
  return decimals.length;
}

function roundNormal(num: number, decimals: number): number {
  if (decimalPlaces(num) <= decimals) return num;
  return Math.round((num + Number.EPSILON) * 10 ** decimals) / 10 ** decimals;
}

function roundDown(num: number, decimals: number): number {
  if (decimalPlaces(num) <= decimals) return num;
  return Math.floor(num * 10 ** decimals) / 10 ** decimals;
}

function roundUp(num: number, decimals: number): number {
  if (decimalPlaces(num) <= decimals) return num;
  return Math.ceil(num * 10 ** decimals) / 10 ** decimals;
}

function decimalString(num: number, decimals: number): string {
  const s = num.toFixed(decimals).replace(/\.?0+$/, "");
  return s.length > 0 ? s : "0";
}

function canonicalTickSize(value: number): TickSize {
  const s = value.toString();
  if (s in ROUNDING_CONFIG) return s as TickSize;
  throw new Error(`Unsupported Polymarket tick size: ${s}`);
}

function assertPrice(price: number, tickSize: TickSize): void {
  const min = Number(tickSize);
  if (price < min || price > 1 - min) {
    throw new Error(`invalid price (${price}), min: ${min} - max: ${1 - min}`);
  }
}

function orderAmounts(
  req: PolymarketClobPlaceOrderRequest,
  tickSize: TickSize
): Pick<PolymarketClobSignedOrder, "makerAmount" | "takerAmount" | "side"> {
  const config = ROUNDING_CONFIG[tickSize];
  const price = roundNormal(req.price, config.price);
  assertPrice(price, tickSize);

  if (req.side === "BUY") {
    const rawTakerAmt = roundDown(req.size, config.size);
    let rawMakerAmt = rawTakerAmt * price;
    if (decimalPlaces(rawMakerAmt) > config.amount) {
      rawMakerAmt = roundUp(rawMakerAmt, config.amount + 4);
      if (decimalPlaces(rawMakerAmt) > config.amount) {
        rawMakerAmt = roundDown(rawMakerAmt, config.amount);
      }
    }
    return {
      side: "BUY",
      makerAmount: parseUnits(
        decimalString(rawMakerAmt, config.amount),
        6
      ).toString(),
      takerAmount: parseUnits(
        decimalString(rawTakerAmt, config.size),
        6
      ).toString(),
    };
  }

  const rawMakerAmt = roundDown(req.size, config.size);
  let rawTakerAmt = rawMakerAmt * price;
  if (decimalPlaces(rawTakerAmt) > config.amount) {
    rawTakerAmt = roundUp(rawTakerAmt, config.amount + 4);
    if (decimalPlaces(rawTakerAmt) > config.amount) {
      rawTakerAmt = roundDown(rawTakerAmt, config.amount);
    }
  }
  return {
    side: "SELL",
    makerAmount: parseUnits(
      decimalString(rawMakerAmt, config.size),
      6
    ).toString(),
    takerAmount: parseUnits(
      decimalString(rawTakerAmt, config.amount),
      6
    ).toString(),
  };
}

async function getJson<T>(
  doFetch: typeof fetch,
  timeout: number,
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  if (signal) attachAbortHandler(signal, controller);

  try {
    const res = await doFetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const resBody = await readErrorBody(res);
      throw new PolymarketError(
        formatErrorMessage(res.status, resBody),
        res.status,
        resBody
      );
    }
    return (await res.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof PolymarketError) throw error;
    throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
  }
}

async function marketOrderMetadata(
  opts: PolymarketOptions,
  tokenId: string,
  signal?: AbortSignal
): Promise<{ tickSize: TickSize; negRisk: boolean }> {
  const baseURL = opts.clobBaseURL ?? DEFAULT_CLOB_HOST;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const tickUrl = new URL(`${baseURL}/tick-size`);
  tickUrl.searchParams.set("token_id", tokenId);
  const negRiskUrl = new URL(`${baseURL}/neg-risk`);
  negRiskUrl.searchParams.set("token_id", tokenId);

  const [tickSize, negRisk] = await Promise.all([
    getJson<PolymarketClobTickSizeResponse>(
      doFetch,
      timeout,
      tickUrl.toString(),
      signal
    ),
    getJson<PolymarketClobNegRiskResponse>(
      doFetch,
      timeout,
      negRiskUrl.toString(),
      signal
    ),
  ]);

  return {
    tickSize: canonicalTickSize(tickSize.minimum_tick_size),
    negRisk: negRisk.neg_risk,
  };
}

function appDomainSeparator(verifyingContract: Address): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        DOMAIN_TYPE_HASH,
        CTF_EXCHANGE_NAME_HASH,
        CTF_EXCHANGE_VERSION_HASH,
        BigInt(POLYGON_CHAIN_ID),
        verifyingContract,
      ]
    )
  );
}

function contentsHash(
  message: Omit<PolymarketClobSignedOrder, "expiration" | "signature">
): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint256" },
        { type: "bytes32" },
        { type: "bytes32" },
      ],
      [
        ORDER_TYPE_HASH,
        BigInt(message.salt),
        message.maker as Address,
        message.signer as Address,
        BigInt(message.tokenId),
        BigInt(message.makerAmount),
        BigInt(message.takerAmount),
        message.side === "BUY" ? 0 : 1,
        message.signatureType,
        BigInt(message.timestamp),
        (message.metadata ?? BYTES32_ZERO) as Hex,
        message.builder as Hex,
      ]
    )
  );
}

export function createClobTrader(
  opts: PolymarketOptions
): PolymarketClobTrader {
  let account: LocalAccount | undefined;
  let owner: string | undefined;

  function signingContext(): { account: LocalAccount; owner: string } {
    account ??= privateKeyToAccount(requirePrivateKey(opts));
    owner ??= requireApiKey(opts);
    return { account, owner };
  }

  async function signOrder(
    account: LocalAccount,
    order: Omit<PolymarketClobSignedOrder, "signature">,
    negRisk: boolean
  ): Promise<Hex> {
    const verifyingContract = (
      negRisk ? CLOB_NEG_RISK_EXCHANGE_V2 : CLOB_EXCHANGE_V2
    ) as Address;
    const typedDataDomain = {
      name: CTF_EXCHANGE_V2_DOMAIN_NAME,
      version: CTF_EXCHANGE_V2_DOMAIN_VERSION,
      chainId: POLYGON_CHAIN_ID,
      verifyingContract,
    } as const;
    const message = {
      salt: BigInt(order.salt),
      maker: order.maker as Address,
      signer: order.signer as Address,
      tokenId: BigInt(order.tokenId),
      makerAmount: BigInt(order.makerAmount),
      takerAmount: BigInt(order.takerAmount),
      side: order.side === "BUY" ? 0 : 1,
      signatureType: order.signatureType,
      timestamp: BigInt(order.timestamp),
      metadata: (order.metadata ?? BYTES32_ZERO) as Hex,
      builder: order.builder as Hex,
    };

    if (order.signatureType !== 3) {
      return account.signTypedData({
        domain: typedDataDomain,
        types: ORDER_TYPES,
        primaryType: "Order",
        message,
      });
    }

    const innerSig = await account.signTypedData({
      domain: typedDataDomain,
      types: TYPED_DATA_SIGN_TYPES,
      primaryType: "TypedDataSign",
      message: {
        contents: message,
        name: "DepositWallet",
        version: "1",
        chainId: BigInt(POLYGON_CHAIN_ID),
        verifyingContract: order.signer as Address,
        salt: BYTES32_ZERO as Hex,
      },
    });
    const encodedLength = (186).toString(16).padStart(4, "0");
    return `0x${innerSig.slice(2)}${appDomainSeparator(
      typedDataDomain.verifyingContract
    ).slice(2)}${contentsHash(order).slice(2)}${toHex(ORDER_TYPE_STRING).slice(
      2
    )}${encodedLength}`;
  }

  async function placeOrder(
    req: PolymarketClobPlaceOrderRequest,
    postOrder: (
      req: PolymarketClobPostOrderRequest,
      signal?: AbortSignal
    ) => Promise<unknown>,
    signal?: AbortSignal
  ): Promise<unknown> {
    const ctx = signingContext();
    const { tickSize, negRisk } = await marketOrderMetadata(
      opts,
      req.tokenID,
      signal
    );
    const signatureType = opts.clobSignatureType ?? DEFAULT_SIGNATURE_TYPE;
    const signer = ctx.account.address;
    const maker = (opts.clobFunderAddress ?? signer) as Address;
    const signerForOrder = signatureType === 3 ? maker : signer;
    const order: Omit<PolymarketClobSignedOrder, "signature"> = {
      salt: Math.round(Math.random() * Date.now()),
      maker,
      signer: signerForOrder,
      tokenId: req.tokenID,
      ...orderAmounts(req, tickSize),
      signatureType,
      timestamp: Date.now().toString(),
      expiration: req.expiration?.toString() ?? "0",
      metadata: BYTES32_ZERO,
      builder: BYTES32_ZERO,
    };

    return postOrder(
      {
        order: {
          ...order,
          signature: await signOrder(ctx.account, order, negRisk),
        },
        owner: ctx.owner,
        orderType: req.orderType ?? "GTC",
        deferExec: false,
        postOnly: false,
      },
      signal
    );
  }

  return { placeOrder };
}
