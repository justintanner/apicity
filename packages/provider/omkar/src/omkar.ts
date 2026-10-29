import { attachExamples } from "./example";
import { OmkarError } from "./types";
import type {
  OmkarFeedExploreRequest,
  OmkarFeedExploreResponse,
  OmkarFeedTrendingRequest,
  OmkarFeedTrendingResponse,
  OmkarOptions,
  OmkarProvider,
} from "./types";
import {
  OmkarFeedExploreRequestSchema,
  OmkarFeedTrendingRequestSchema,
} from "./zod";

interface OmkarErrorDetails {
  code?: string;
  message?: string;
}

// Every gateway error is JSON with a stable `code` and a readable `message`.
function errorDetails(body: unknown): OmkarErrorDetails {
  if (body === null || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

// Keys in the order given, so equal requests build equal URLs.
function queryString(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function createOmkar(options: OmkarOptions = {}): OmkarProvider {
  const baseURL = (
    options.baseURL ?? "https://tiktok-scraper.omkar.cloud"
  ).replace(/\/+$/, "");
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 60000;

  function apiKey(): string {
    const key = options.apiKey ?? process.env.OMKAR_API_KEY;
    if (!key) {
      throw new OmkarError(
        "Omkar API key is required. Pass apiKey or set OMKAR_API_KEY.",
        401
      );
    }
    return key;
  }

  async function getRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
    const key = apiKey();
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", relayAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers: { "API-Key": key },
        signal: controller.signal,
      });
      const raw = (await response.text()).replaceAll(key, "[REDACTED]");
      let body: unknown = raw;
      try {
        body = JSON.parse(raw) as unknown;
      } catch {
        /* Keep non-JSON answers as text. */
      }
      if (!response.ok) {
        const { code, message } = errorDetails(body);
        throw new OmkarError(
          `Omkar API error ${response.status}: ${message ?? code ?? raw.slice(0, 200)}`,
          response.status,
          body,
          code
        );
      }
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new OmkarError(
          "Omkar API returned invalid JSON",
          response.status,
          body
        );
      }
      return body as T;
    } catch (error) {
      if (error instanceof OmkarError) throw error;
      if (signal?.aborted)
        throw new OmkarError("Omkar request aborted by caller", 499);
      if (controller.signal.aborted)
        throw new OmkarError("Omkar request timed out", 408);
      throw new OmkarError(
        `Omkar request failed: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    feed: {
      // GET https://tiktok-scraper.omkar.cloud/feed/trending{query}
      // Docs: https://www.omkar.cloud/tools/tiktok-scraper/trending-feed
      trending: Object.assign(
        async (
          request: OmkarFeedTrendingRequest = {},
          signal?: AbortSignal
        ) => {
          const query = queryString({ country: request.country });
          return getRequest<OmkarFeedTrendingResponse>(
            `/feed/trending${query}`,
            signal
          );
        },
        { schema: OmkarFeedTrendingRequestSchema }
      ),
      // GET https://tiktok-scraper.omkar.cloud/feed/explore{query}
      // Docs: https://www.omkar.cloud/tools/tiktok-scraper/explore-feed
      explore: Object.assign(
        async (request: OmkarFeedExploreRequest = {}, signal?: AbortSignal) => {
          const query = queryString({
            country: request.country,
            category: request.category,
          });
          return getRequest<OmkarFeedExploreResponse>(
            `/feed/explore${query}`,
            signal
          );
        },
        { schema: OmkarFeedExploreRequestSchema }
      ),
    },
  });
}
