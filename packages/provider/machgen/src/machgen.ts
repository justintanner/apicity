import { attachExamples } from "./example";
import { MachGenError } from "./types";
import type {
  MachGenOptions,
  MachGenProvider,
  MachGenGenerateRequest,
  MachGenGenerateResponse,
  MachGenTaskBillingResponse,
  MachGenTaskStatusResponse,
  MachGenUpscaleQuoteRequest,
  MachGenUpscaleQuoteResponse,
} from "./types";
import {
  MachGenGenerateRequestSchema,
  MachGenUpscaleQuoteRequestSchema,
} from "./zod";

export function createMachGen(options: MachGenOptions = {}): MachGenProvider {
  const baseURL = (options.baseURL ?? "https://api.machgen.ai").replace(
    /\/+$/,
    ""
  );
  const doFetch = options.fetch ?? fetch;
  const timeout = options.timeout ?? 30000;

  async function request<T>(
    method: "GET" | "POST",
    path: string,
    body?: MachGenGenerateRequest,
    signal?: AbortSignal,
    binary = false
  ): Promise<T> {
    const key = options.apiKey ?? process.env.MACHGEN_API_KEY;
    if (!key)
      throw new MachGenError(
        "MachGen API key is required. Pass apiKey or set MACHGEN_API_KEY.",
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
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
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
        const detail =
          errorBody && typeof errorBody === "object" && "detail" in errorBody
            ? errorBody.detail
            : errorBody;
        throw new MachGenError(
          `MachGen API error ${response.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`,
          response.status,
          errorBody,
          detail
        );
      }
      return (
        binary ? await response.arrayBuffer() : await response.json()
      ) as T;
    } catch (error) {
      if (error instanceof MachGenError) throw error;
      if (signal?.aborted)
        throw new MachGenError("MachGen request aborted by caller", 499);
      if (controller.signal.aborted)
        throw new MachGenError("MachGen request timed out", 408);
      throw new MachGenError("MachGen request failed", 500);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", relayAbort);
    }
  }

  return attachExamples({
    api: {
      v0: {
        // POST https://api.machgen.ai/api/v0/generate
        // Docs: https://www.machgen.ai/docs/rest_api#submit-a-task
        generate: Object.assign(
          async (body: MachGenGenerateRequest, signal?: AbortSignal) =>
            request<MachGenGenerateResponse>(
              "POST",
              "/api/v0/generate",
              body,
              signal
            ),
          { schema: MachGenGenerateRequestSchema }
        ),
        // GET https://api.machgen.ai/api/v0/tasks/{taskId}
        // Docs: https://www.machgen.ai/docs/reference#taskstatusresponse
        tasks: Object.assign(
          async (taskId: string, signal?: AbortSignal) =>
            request<MachGenTaskStatusResponse>(
              "GET",
              `/api/v0/tasks/${encodeURIComponent(taskId)}`,
              undefined,
              signal
            ),
          {
            // GET https://api.machgen.ai/api/v0/tasks/{taskId}/billing
            // Docs: https://www.machgen.ai/docs/rest_api#check-what-a-task-cost
            billing: async (taskId: string, signal?: AbortSignal) =>
              request<MachGenTaskBillingResponse>(
                "GET",
                `/api/v0/tasks/${encodeURIComponent(taskId)}/billing`,
                undefined,
                signal
              ),
          }
        ),
        // GET https://api.machgen.ai/api/v0/assets/{taskId}
        // Docs: https://www.machgen.ai/docs/rest_api#check-status-and-download
        assets: async (taskId: string, signal?: AbortSignal) =>
          request<ArrayBuffer>(
            "GET",
            `/api/v0/assets/${encodeURIComponent(taskId)}`,
            undefined,
            signal,
            true
          ),
        upscale: {
          // Not in MachGen's REST docs (read 2026-10-26). MachGen's web app
          // prices an upscale with it before submitting, and the MCP server's
          // quote_video_upscale tool is the documented form of the same check.
          // POST https://api.machgen.ai/api/v0/upscale/quote
          // Docs: https://www.machgen.ai/docs/mcp#tools
          quote: Object.assign(
            async (body: MachGenUpscaleQuoteRequest, signal?: AbortSignal) =>
              request<MachGenUpscaleQuoteResponse>(
                "POST",
                "/api/v0/upscale/quote",
                body,
                signal
              ),
            { schema: MachGenUpscaleQuoteRequestSchema }
          ),
        },
      },
    },
  });
}
