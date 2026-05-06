import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { polymarket } from "@apicity/polymarket";

// Active "Yes" outcome token from the Reya FDV market — chosen at record time
// because it had a populated orderbook. Replay reads the recorded HAR, so the
// token doesn't need to remain active forever.
const TOKEN_ID =
  "78433024518676680431174478322854148606578065650008220678402966840627347604025";

describe("polymarket clob book", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should return bids and asks for an active token", async () => {
    ctx = setupPolly("polymarket/clob-book");
    const provider = polymarket();

    const book = await provider.get.clob.book({ token_id: TOKEN_ID });

    expect(book.asset_id).toBe(TOKEN_ID);
    expect(typeof book.market).toBe("string");
    expect(typeof book.timestamp).toBe("string");
    expect(typeof book.hash).toBe("string");
    expect(Array.isArray(book.bids)).toBe(true);
    expect(Array.isArray(book.asks)).toBe(true);
    if (book.bids.length > 0) {
      expect(typeof book.bids[0].price).toBe("string");
      expect(typeof book.bids[0].size).toBe("string");
    }
  });
});
