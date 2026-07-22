import { describe, it, expect } from "vitest";

import { createClobProvider } from "../../packages/provider/polymarket/src/clob";

// The CLOB `/balance-allowance` endpoints resolve which wallet's balance to
// return from `signature_type`. Omitting it makes the server assume type 0 (the
// EOA signer in POLY_ADDRESS), which for proxy/funder wallets (types 1/2/3)
// reads the empty signer instead of the funded proxy — the bug that reported a
// $0 balance for a funded account. The provider must default `signature_type`
// to the configured `clobSignatureType`, while still honoring an explicit value.
function clobWithCapture(
  captured: string[],
  clobSignatureType?: 0 | 1 | 2 | 3
) {
  const stubFetch = (async (url: string | URL) => {
    captured.push(String(url));
    return new Response(JSON.stringify({ balance: "0", allowances: {} }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;

  return createClobProvider({
    clobSignatureType,
    clobAddress: "0x1Fc3329De0e4d2037169c5b06dc299a3519e8977",
    clobFunderAddress: "0x83b4eb6daa1da188d8cC046a4EA01b2BE56Aca10",
    clobApiKey: "key",
    clobApiSecret: "c2VjcmV0",
    clobApiPassphrase: "pass",
    fetch: stubFetch,
  });
}

function sigType(url: string): string | null {
  return new URL(url).searchParams.get("signature_type");
}

describe("clob balance-allowance signature_type defaulting", () => {
  it("defaults signature_type to the configured clobSignatureType", async () => {
    const urls: string[] = [];
    const clob = clobWithCapture(urls, 3);
    await clob.get.clob.balanceAllowance({ asset_type: "COLLATERAL" });
    expect(sigType(urls[0])).toBe("3");
  });

  it("lets an explicit signature_type win over the default", async () => {
    const urls: string[] = [];
    const clob = clobWithCapture(urls, 3);
    await clob.get.clob.balanceAllowance({
      asset_type: "COLLATERAL",
      signature_type: 1,
    });
    expect(sigType(urls[0])).toBe("1");
  });

  it("omits signature_type when none is configured or passed", async () => {
    const urls: string[] = [];
    const clob = clobWithCapture(urls, undefined);
    await clob.get.clob.balanceAllowance({ asset_type: "COLLATERAL" });
    expect(sigType(urls[0])).toBeNull();
  });

  it("also defaults for the /update and PUT variants", async () => {
    const urls: string[] = [];
    const clob = clobWithCapture(urls, 3);
    await clob.get.clob.balanceAllowance.update({ asset_type: "COLLATERAL" });
    await clob.put.clob.balanceAllowance({ asset_type: "COLLATERAL" });
    expect(sigType(urls[0])).toBe("3");
    expect(sigType(urls[1])).toBe("3");
  });
});
