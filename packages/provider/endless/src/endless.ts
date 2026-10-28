import { attachExamples } from "./example";
import { EndlessError } from "./types";
import type {
  EndlessOptions,
  EndlessProvider,
  EndlessTikTokTrendsPublicRequest,
  EndlessTikTokTrendsPublicResponse,
} from "./types";
import { EndlessTikTokTrendsPublicRequestSchema } from "./zod";

// Every Endless failure answers `{ code, status, message, data }`, whatever
// the status; `data.code` is the specific reason to branch on.
interface EndlessErrorBody {
  message: string;
  data?: { code?: unknown };
}

function isEndlessErrorBody(value: unknown): value is EndlessErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export function createEndless(options: EndlessOptions = {}): EndlessProvider {
  const baseURL = (options.baseURL ?? "https://api.endless.app").replace(
    /\/+$/,
    ""
  );
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 30000;
  const apiVersion = options.apiVersion ?? "1";

  async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", relayAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers: { "Endless-Api-Version": apiVersion },
        signal: controller.signal,
      });
      if (!response.ok) {
        const raw = await response.text();
        let body: unknown = raw;
        try {
          body = JSON.parse(raw) as unknown;
        } catch {
          /* Keep non-JSON upstream errors. */
        }
        const known = isEndlessErrorBody(body) ? body : undefined;
        const reason = known?.data?.code;
        throw new EndlessError(
          `Endless API error ${response.status}: ${known?.message ?? raw}`,
          response.status,
          body,
          typeof reason === "string" ? reason : undefined
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof EndlessError) throw error;
      if (signal?.aborted)
        throw new EndlessError("Endless request aborted by caller", 499);
      if (controller.signal.aborted)
        throw new EndlessError("Endless request timed out", 408);
      throw new EndlessError(
        `Endless request failed: ${error instanceof Error ? error.message : String(error)}`,
        500
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    social: {
      tiktokTrends: {
        // GET https://api.endless.app/social/tiktok-trends/public/{region}
        // Docs: https://endless.app/docs/api/social/public-tiktok-trends
        public: Object.assign(
          async (
            request: EndlessTikTokTrendsPublicRequest,
            signal?: AbortSignal
          ) =>
            get<EndlessTikTokTrendsPublicResponse>(
              `/social/tiktok-trends/public/${encodeURIComponent(request.region)}`,
              signal
            ),
          { schema: EndlessTikTokTrendsPublicRequestSchema }
        ),
      },
    },
  });
}
