import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { createPolymarket, PolymarketError } from "@apicity/polymarket";
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
    expect(provider.post.clob.v1.heartbeats.schema.safeParse).toBeInstanceOf(
      Function
    );
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
