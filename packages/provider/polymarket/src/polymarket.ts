import {
  PolymarketOptions,
  PolymarketServerTime,
  PolymarketClobBook,
  PolymarketClobPriceResponse,
  PolymarketClobMidpointResponse,
  PolymarketClobSpreadResponse,
  PolymarketClobLastTradePriceResponse,
  PolymarketClobTickSizeResponse,
  PolymarketClobFeeRateResponse,
  PolymarketClobTokenQuery,
  PolymarketClobPriceQuery,
  PolymarketProvider,
  PolymarketError,
} from "./types";

export function polymarket(opts: PolymarketOptions = {}): PolymarketProvider {
  // PR 1 + C1 only ship CLOB endpoints, so a single `baseURL` covers the
  // factory's needs and lets the endpoint-walker resolve full URLs against
  // it. When subsequent PRs add Gamma and Data endpoints, this factory will
  // be split into sub-factories (one per host) following the pattern in
  // packages/provider/kie/src/kie.ts.
  const baseURL = opts.clobBaseURL ?? "https://clob.polymarket.com";
  // Reserve the option keys so the public surface is stable from day one
  // even though no endpoint reads them yet.
  void opts.gammaBaseURL;
  void opts.dataBaseURL;
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // Polymarket's APIs return errors with several shapes — Gamma typically
  // returns `{ error }` or `{ message }`, CLOB returns `{ error }` or a plain
  // string, Data API returns `{ message }`. Surface whatever string the
  // server provided rather than a generic "Polymarket API error: 500".
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "string" && body.length > 0) {
      return `Polymarket API error ${status}: ${body}`;
    }
    if (typeof body === "object" && body !== null) {
      const b = body as { error?: string; message?: string };
      if (typeof b.error === "string" && b.error.length > 0) {
        return `Polymarket API error ${status}: ${b.error}`;
      }
      if (typeof b.message === "string" && b.message.length > 0) {
        return `Polymarket API error ${status}: ${b.message}`;
      }
    }
    return `Polymarket API error: ${status}`;
  }

  async function readErrorBody(res: Response): Promise<unknown> {
    const ct = res.headers.get("content-type") ?? "";
    try {
      if (ct.includes("application/json")) {
        return await res.json();
      }
      return await res.text();
    } catch {
      return null;
    }
  }

  async function makeGetRequest<T>(
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

  async function makeGetTextRequest(
    url: string,
    signal?: AbortSignal
  ): Promise<string> {
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
      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  // GET https://clob.polymarket.com/time
  // Docs: https://docs.polymarket.com/api-reference/clob/get-server-time
  async function clobTime(signal?: AbortSignal): Promise<PolymarketServerTime> {
    const text = (await makeGetTextRequest(`${baseURL}/time`, signal)).trim();
    const n = Number(text);
    if (!Number.isFinite(n)) {
      throw new PolymarketError(
        `Polymarket /time response was not a finite number: ${text}`,
        200,
        text
      );
    }
    return n;
  }

  // GET https://clob.polymarket.com/book{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-order-book
  async function clobBook(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobBook> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobBook>(
      `${baseURL}/book${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/price{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-market-price
  async function clobPrice(
    params: PolymarketClobPriceQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobPriceResponse> {
    const query =
      `?token_id=${encodeURIComponent(params.token_id)}` +
      `&side=${encodeURIComponent(params.side)}`;
    return makeGetRequest<PolymarketClobPriceResponse>(
      `${baseURL}/price${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/midpoint{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-midpoint
  async function clobMidpoint(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobMidpointResponse> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobMidpointResponse>(
      `${baseURL}/midpoint${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/spread{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-spread
  async function clobSpread(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobSpreadResponse> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobSpreadResponse>(
      `${baseURL}/spread${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/last-trade-price{query}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-last-trade-price
  async function clobLastTradePrice(
    params: PolymarketClobTokenQuery,
    signal?: AbortSignal
  ): Promise<PolymarketClobLastTradePriceResponse> {
    const query = `?token_id=${encodeURIComponent(params.token_id)}`;
    return makeGetRequest<PolymarketClobLastTradePriceResponse>(
      `${baseURL}/last-trade-price${query}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/tick-size/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-tick-size
  async function clobTickSize(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobTickSizeResponse> {
    return makeGetRequest<PolymarketClobTickSizeResponse>(
      `${baseURL}/tick-size/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  // GET https://clob.polymarket.com/fee-rate/{tokenId}
  // Docs: https://docs.polymarket.com/api-reference/clob/get-fee-rate
  async function clobFeeRate(
    tokenId: string,
    signal?: AbortSignal
  ): Promise<PolymarketClobFeeRateResponse> {
    return makeGetRequest<PolymarketClobFeeRateResponse>(
      `${baseURL}/fee-rate/${encodeURIComponent(tokenId)}`,
      signal
    );
  }

  return {
    get: {
      clob: {
        time: clobTime,
        book: clobBook,
        price: clobPrice,
        midpoint: clobMidpoint,
        spread: clobSpread,
        lastTradePrice: clobLastTradePrice,
        tickSize: clobTickSize,
        feeRate: clobFeeRate,
      },
    },
    post: {},
  };
}
