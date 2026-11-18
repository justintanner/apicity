import { attachExamples } from "./example";
import { NunchuxError, isNunchuxErrorBody } from "./types";
import type {
  NunchuxAlibabaTaskResponse,
  NunchuxOptions,
  NunchuxCreditsResponse,
  NunchuxProvider,
} from "./types";

function errorEnvelope(body: unknown): { code?: string; message?: string } {
  if (!isNunchuxErrorBody(body)) return {};
  const record = body as Record<string, unknown>;
  const detail = record.error ?? record.detail ?? record;
  if (typeof detail === "string") return { message: detail };
  const envelope = detail as { code: string; message: string };
  return { code: envelope.code, message: envelope.message };
}

export function createNunchux(options: NunchuxOptions = {}): NunchuxProvider {
  const baseURL = (options.baseURL ?? "https://api.nunchux.com").replace(
    /\/+$/,
    ""
  );
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 60000;

  async function request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const key = options.apiKey ?? process.env.NUNCHUX_API_KEY;
    if (!key)
      throw new NunchuxError(
        "Nunchux API key is required. Pass apiKey or set NUNCHUX_API_KEY.",
        401
      );
    const controller = new AbortController();
    const relayAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", relayAbort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await doFetch(`${baseURL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const raw = (await response.text()).replaceAll(key, "[REDACTED]");
        let errorBody: unknown = raw;
        try {
          errorBody = JSON.parse(raw) as unknown;
        } catch {
          /* Keep non-JSON upstream errors. */
        }
        const { code, message } = errorEnvelope(errorBody);
        throw new NunchuxError(
          `Nunchux API error ${response.status}: ${message ?? raw.slice(0, 200)}`,
          response.status,
          errorBody,
          code
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof NunchuxError) throw error;
      if (signal?.aborted)
        throw new NunchuxError("Nunchux request aborted by caller", 499);
      if (controller.signal.aborted)
        throw new NunchuxError("Nunchux request timed out", 408);
      throw new NunchuxError(
        `Nunchux request failed: ${(error instanceof Error ? error.message : String(error)).replaceAll(key, "[REDACTED]")}`,
        500
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    v1: {
      alibaba: {
        // GET https://api.nunchux.com/v1/alibaba/tasks/{task_id}
        // Docs: https://docs.nunchux.ai/partner-models/wan
        tasks: async (taskId: string, signal?: AbortSignal) => {
          const task_id = taskId;
          return request<NunchuxAlibabaTaskResponse>(
            "GET",
            `/v1/alibaba/tasks/${encodeURIComponent(task_id)}`,
            undefined,
            signal
          );
        },
      },
      // GET https://api.nunchux.com/v1/credits
      // Docs: https://docs.nunchux.ai/credits-pricing
      credits: async (signal?: AbortSignal) => {
        return request<NunchuxCreditsResponse>(
          "GET",
          "/v1/credits",
          undefined,
          signal
        );
      },
    },
  });
}
