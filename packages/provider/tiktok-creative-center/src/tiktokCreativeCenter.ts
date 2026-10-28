import { attachExamples } from "./example";
import { TiktokCreativeCenterError } from "./types";
import type {
  TiktokCreativeCenterGetTopContentsListRequest,
  TiktokCreativeCenterGetTopContentsListResponse,
  TiktokCreativeCenterGetTopContentsOverviewResponse,
  TiktokCreativeCenterOptions,
  TiktokCreativeCenterProvider,
} from "./types";
import { TiktokCreativeCenterGetTopContentsListRequestSchema } from "./zod";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

// The page whose data these endpoints serve; Creative Center expects the
// browser headers that page sends.
const TRENDS_PAGE =
  "https://ads.tiktok.com/creative/creativeCenter/trends/video";

// TikTok sends these ids as JSON numbers above 2^53, which JSON.parse rounds.
// Quoting them in the raw text keeps every digit. Inside a JSON string the
// key's quotes are escaped, so only real keys match.
const LARGE_ID_FIELDS = /"(itemID|authorID|creatorID)"(\s*):(\s*)(-?\d+)/g;

// A fixed key order, so equal requests build equal URLs.
const LIST_QUERY_KEYS = [
  "countryCode",
  "periodDimension",
  "periodEndTimestamp",
  "orderByMetric",
  "organicOnly",
  "contentLabelIDs",
  "page",
  "limit",
] as const;

interface CreativeCenterEnvelope {
  BaseResp?: { StatusCode?: unknown; StatusMessage?: unknown };
}

function isEnvelope(value: unknown): value is CreativeCenterEnvelope {
  return typeof value === "object" && value !== null;
}

function parseKeepingIds(text: string): unknown {
  return JSON.parse(text.replace(LARGE_ID_FIELDS, '"$1"$2:$3"$4"'));
}

function listQuery(
  request: TiktokCreativeCenterGetTopContentsListRequest
): string {
  const params = new URLSearchParams();
  for (const key of LIST_QUERY_KEYS) {
    const value = request[key];
    if (value !== undefined) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function createTiktokCreativeCenter(
  options: TiktokCreativeCenterOptions = {}
): TiktokCreativeCenterProvider {
  const baseURL = (options.baseURL ?? "https://ads.tiktok.com").replace(
    /\/+$/,
    ""
  );
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 30000;
  const headers = {
    "User-Agent": options.userAgent ?? DEFAULT_USER_AGENT,
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: TRENDS_PAGE,
  };

  async function getRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", relayAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      const raw = await response.text();
      let body: unknown = raw;
      try {
        body = parseKeepingIds(raw);
      } catch {
        /* Keep non-JSON answers as text. */
      }
      if (!response.ok) {
        throw new TiktokCreativeCenterError(
          `TikTok Creative Center error ${response.status}: ${raw.slice(0, 200)}`,
          response.status,
          body
        );
      }
      const base = isEnvelope(body) ? body.BaseResp : undefined;
      if (typeof base?.StatusCode !== "number") {
        throw new TiktokCreativeCenterError(
          "TikTok Creative Center answered without BaseResp.StatusCode",
          response.status,
          body
        );
      }
      if (base.StatusCode !== 0) {
        throw new TiktokCreativeCenterError(
          `TikTok Creative Center error ${base.StatusCode}: ${String(base.StatusMessage)}`,
          response.status,
          body,
          base.StatusCode
        );
      }
      return body as T;
    } catch (error) {
      if (error instanceof TiktokCreativeCenterError) throw error;
      if (signal?.aborted)
        throw new TiktokCreativeCenterError(
          "TikTok Creative Center request aborted by caller",
          499
        );
      if (controller.signal.aborted)
        throw new TiktokCreativeCenterError(
          "TikTok Creative Center request timed out",
          408
        );
      throw new TiktokCreativeCenterError(
        `TikTok Creative Center request failed: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    ads: {
      creativeOne: {
        report: {
          // sig-ok: Creative Center's PascalCase path segments become camelCase keys.
          // GET https://ads.tiktok.com/CreativeOne/Report/CreativeCenterGetTopContentsList{query}
          // Docs: https://ads.tiktok.com/creative/creativeCenter/trends/video
          creativeCenterGetTopContentsList: Object.assign(
            async (
              request: TiktokCreativeCenterGetTopContentsListRequest,
              signal?: AbortSignal
            ) => {
              const query = listQuery(request);
              return getRequest<TiktokCreativeCenterGetTopContentsListResponse>(
                `/CreativeOne/Report/CreativeCenterGetTopContentsList${query}`,
                signal
              );
            },
            { schema: TiktokCreativeCenterGetTopContentsListRequestSchema }
          ),
          // sig-ok: Creative Center's PascalCase path segments become camelCase keys.
          // GET https://ads.tiktok.com/CreativeOne/Report/GetTopContentsOverview
          // Docs: https://ads.tiktok.com/creative/creativeCenter/trends/video
          getTopContentsOverview: async (signal?: AbortSignal) => {
            return getRequest<TiktokCreativeCenterGetTopContentsOverviewResponse>(
              "/CreativeOne/Report/GetTopContentsOverview",
              signal
            );
          },
        },
      },
    },
  });
}
