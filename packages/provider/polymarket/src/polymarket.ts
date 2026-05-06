import {
  PolymarketOptions,
  PolymarketServerTime,
  PolymarketProvider,
  PolymarketError,
} from "./types";

export function polymarket(opts: PolymarketOptions = {}): PolymarketProvider {
  // PR 1 only ships CLOB endpoints, so a single `baseURL` covers the
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

  // GET https://clob.polymarket.com/time
  // Docs: https://docs.polymarket.com/api-reference/clob/get-server-time
  async function clobTime(signal?: AbortSignal): Promise<PolymarketServerTime> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(`${baseURL}/time`, {
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
      const text = (await res.text()).trim();
      const n = Number(text);
      if (!Number.isFinite(n)) {
        throw new PolymarketError(
          `Polymarket /time response was not a finite number: ${text}`,
          200,
          text
        );
      }
      return n;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PolymarketError) throw error;
      throw new PolymarketError(`Polymarket request failed: ${error}`, 500);
    }
  }

  return {
    get: {
      clob: {
        time: clobTime,
      },
    },
    post: {},
  };
}
