import {
  FalOptions,
  FalProvider,
  FalError,
  FalErrorType,
  FalModelSearchParams,
  FalModelSearchResponse,
  FalPricingParams,
  FalPricingResponse,
  FalEstimateRequest,
  FalEstimateResponse,
  FalUsageParams,
  FalUsageResponse,
  FalAnalyticsParams,
  FalAnalyticsResponse,
  FalRequestsParams,
  FalRequestsResponse,
  FalDeletePayloadsParams,
  FalDeletePayloadsResponse,
  FalQueueSubmitParams,
  FalQueueSubmitResponse,
  FalQueueStatusParams,
  FalQueueStatusResponse,
  FalQueueResultParams,
  FalQueueResultResponse,
  FalQueueCancelParams,
  FalQueueCancelResponse,
  FalLogsHistoryParams,
  FalLogsHistoryResponse,
  FalLogsStreamParams,
  FalLabelFilter,
  FalLogEntry,
  FalFileItem,
  FalFilesListParams,
  FalFilesDownloadParams,
  FalFilesUploadUrlParams,
  FalFilesUploadLocalParams,
  FalWorkflowListParams,
  FalWorkflowListResponse,
  FalWorkflowGetParams,
  FalWorkflowGetResponse,
  FalComputeInstancesListParams,
  FalComputeInstancesListResponse,
  FalComputeInstanceGetParams,
  FalComputeInstance,
  FalComputeInstanceCreateParams,
  FalComputeInstanceDeleteParams,
  FalAppsQueueParams,
  FalAppsQueueResponse,
  FalAppsFlushQueueParams,
} from "./types";
import type { ValidationResult } from "./types";
import {
  pricingEstimateSchema,
  deletePayloadsSchema,
  queueSubmitSchema,
  logsHistorySchema,
  logsStreamSchema,
  filesUploadUrlSchema,
  filesUploadLocalSchema,
  computeInstanceCreateSchema,
  appsFlushQueueSchema,
} from "./schemas";
import { validatePayload } from "./validate";

// Build query string from parameters (no case conversion)
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, String(item));
      }
    } else {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Error response from fal API
interface FalApiErrorResponse {
  error: {
    type: FalErrorType;
    message: string;
    docs_url?: string;
    request_id?: string;
  };
}

function isFalApiErrorResponse(data: unknown): data is FalApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as Record<string, unknown>).error === "object" &&
    (data as Record<string, unknown>).error !== null
  );
}

// SSE stream parser: yields parsed data payloads from an SSE Response
async function* sseToIterable<T>(res: Response): AsyncIterable<T> {
  if (!res.body) return;
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\r?\n\r?\n/);
    for (let i = 0; i < parts.length - 1; i++) {
      const chunk = parts[i];
      const lines = chunk.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("data:")) {
          const payload = trimmed.slice(5).trim();
          if (payload) {
            yield JSON.parse(payload) as T;
          }
        }
      }
    }
    buffer = parts[parts.length - 1];
  }

  const trailing = buffer.trim();
  if (trailing.length) {
    const lines = trailing.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trim();
        if (payload) {
          yield JSON.parse(payload) as T;
        }
      }
    }
  }
}

export function fal(opts: FalOptions): FalProvider {
  const baseURL = opts.baseURL ?? "https://api.fal.ai/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    method: "GET" | "POST" | "DELETE" | "PUT",
    path: string,
    paramsOrBody?: Record<string, unknown>,
    signal?: AbortSignal,
    headers?: Record<string, string>,
    customBaseURL?: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const base = customBaseURL ?? baseURL;
    const url =
      method === "GET" && paramsOrBody
        ? `${base}${path}${buildQueryString(paramsOrBody)}`
        : `${base}${path}`;

    const requestInit: RequestInit = {
      method,
      headers: {
        Authorization: `Key ${opts.apiKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
    };

    if (method !== "GET" && paramsOrBody) {
      requestInit.body = JSON.stringify(paramsOrBody);
    }

    try {
      const res = await doFetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorData: unknown;
        try {
          errorData = await res.json();
        } catch {
          errorData = null;
        }

        if (isFalApiErrorResponse(errorData)) {
          throw new FalError(
            errorData.error.message,
            res.status,
            errorData.error.type,
            errorData.error.request_id,
            errorData.error.docs_url,
            errorData
          );
        }

        throw new FalError(
          `Fal API error: ${res.status}`,
          res.status,
          "server_error",
          undefined,
          undefined,
          errorData
        );
      }

      if (res.status === 204) {
        return undefined as T;
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FalError) throw error;
      throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
    }
  }

  async function makePostWithQuery<T>(
    path: string,
    queryParams: Record<string, unknown>,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const qs = buildQueryString(queryParams);
    const url = `${baseURL}${path}${qs}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Key ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    try {
      const res = await doFetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorData: unknown;
        try {
          errorData = await res.json();
        } catch {
          errorData = null;
        }

        if (isFalApiErrorResponse(errorData)) {
          throw new FalError(
            errorData.error.message,
            res.status,
            errorData.error.type,
            errorData.error.request_id,
            errorData.error.docs_url,
            errorData
          );
        }

        throw new FalError(
          `Fal API error: ${res.status}`,
          res.status,
          "server_error",
          undefined,
          undefined,
          errorData
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FalError) throw error;
      throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
    }
  }

  async function makeStreamPostWithQuery(
    path: string,
    queryParams: Record<string, unknown>,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<Response> {
    const qs = buildQueryString(queryParams);
    const url = `${baseURL}${path}${qs}`;

    const controller = new AbortController();
    // No timeout for stream — connections are long-lived

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const requestInit: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Key ${opts.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      signal: controller.signal,
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    const res = await doFetch(url, requestInit);

    if (!res.ok) {
      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = null;
      }

      if (isFalApiErrorResponse(errorData)) {
        throw new FalError(
          errorData.error.message,
          res.status,
          errorData.error.type,
          errorData.error.request_id,
          errorData.error.docs_url,
          errorData
        );
      }

      throw new FalError(
        `Fal API error: ${res.status}`,
        res.status,
        "server_error",
        undefined,
        undefined,
        errorData
      );
    }

    return res;
  }

  async function makeRawRequest(
    method: "GET" | "POST",
    path: string,
    body?: FormData,
    signal?: AbortSignal,
    queryParams?: Record<string, unknown>
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    let url = `${baseURL}${path}`;
    if (queryParams) {
      url += buildQueryString(queryParams);
    }

    const requestInit: RequestInit = {
      method,
      headers: {
        Authorization: `Key ${opts.apiKey}`,
      },
      signal: controller.signal,
    };

    if (body) {
      requestInit.body = body;
    }

    try {
      const res = await doFetch(url, requestInit);
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorData: unknown;
        try {
          errorData = await res.json();
        } catch {
          errorData = null;
        }

        if (isFalApiErrorResponse(errorData)) {
          throw new FalError(
            errorData.error.message,
            res.status,
            errorData.error.type,
            errorData.error.request_id,
            errorData.error.docs_url,
            errorData
          );
        }

        throw new FalError(
          `Fal API error: ${res.status}`,
          res.status,
          "server_error",
          undefined,
          undefined,
          errorData
        );
      }

      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FalError) throw error;
      throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
    }
  }

  const pricing = Object.assign(
    async function pricing(
      params: FalPricingParams,
      signal?: AbortSignal
    ): Promise<FalPricingResponse> {
      return makeRequest<FalPricingResponse>(
        "GET",
        "/models/pricing",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      estimate: Object.assign(
        async function estimate(
          req: FalEstimateRequest,
          signal?: AbortSignal
        ): Promise<FalEstimateResponse> {
          return makeRequest<FalEstimateResponse>(
            "POST",
            "/models/pricing/estimate",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: pricingEstimateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, pricingEstimateSchema);
          },
        }
      ),
    }
  );

  const requests = {
    async byEndpoint(
      params: FalRequestsParams,
      signal?: AbortSignal
    ): Promise<FalRequestsResponse> {
      return makeRequest<FalRequestsResponse>(
        "GET",
        "/models/requests/by-endpoint",
        params as unknown as Record<string, unknown>,
        signal
      );
    },

    payloads: Object.assign(
      async function payloads(
        params: FalDeletePayloadsParams,
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }
        return makeRequest<FalDeletePayloadsResponse>(
          "DELETE",
          `/models/requests/${params.request_id}/payloads`,
          undefined,
          signal,
          headers
        );
      },
      {
        payloadSchema: deletePayloadsSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, deletePayloadsSchema);
        },
      }
    ),
  };

  const models = Object.assign(
    async function models(
      params?: FalModelSearchParams,
      signal?: AbortSignal
    ): Promise<FalModelSearchResponse> {
      return makeRequest<FalModelSearchResponse>(
        "GET",
        "/models",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      pricing,

      async usage(
        params?: FalUsageParams,
        signal?: AbortSignal
      ): Promise<FalUsageResponse> {
        return makeRequest<FalUsageResponse>(
          "GET",
          "/models/usage",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      async analytics(
        params: FalAnalyticsParams,
        signal?: AbortSignal
      ): Promise<FalAnalyticsResponse> {
        return makeRequest<FalAnalyticsResponse>(
          "GET",
          "/models/analytics",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      requests,
    }
  );

  const queueBaseURL = opts.queueBaseURL ?? "https://queue.fal.run";

  const queue = {
    submit: Object.assign(
      async function submit(
        params: FalQueueSubmitParams,
        signal?: AbortSignal
      ): Promise<FalQueueSubmitResponse> {
        const headers: Record<string, string> = {};
        if (params.priority) {
          headers["X-Fal-Queue-Priority"] = params.priority;
        }
        if (params.timeout !== undefined) {
          headers["X-Fal-Request-Timeout"] = String(params.timeout);
        }
        if (params.no_retry) {
          headers["X-Fal-No-Retry"] = "1";
        }
        if (params.runner_hint) {
          headers["X-Fal-Runner-Hint"] = params.runner_hint;
        }
        if (params.store_io) {
          headers["X-Fal-Store-IO"] = params.store_io;
        }
        if (params.object_lifecycle_preference) {
          headers["X-Fal-Object-Lifecycle-Preference"] =
            params.object_lifecycle_preference;
        }

        const path = params.webhook
          ? `/${params.endpoint_id}?fal_webhook=${encodeURIComponent(params.webhook)}`
          : `/${params.endpoint_id}`;

        return makeRequest<FalQueueSubmitResponse>(
          "POST",
          path,
          params.input,
          signal,
          headers,
          queueBaseURL
        );
      },
      {
        payloadSchema: queueSubmitSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, queueSubmitSchema);
        },
      }
    ),

    async status(
      params: FalQueueStatusParams,
      signal?: AbortSignal
    ): Promise<FalQueueStatusResponse> {
      const queryParams: Record<string, unknown> = {};
      if (params.logs) {
        queryParams.logs = "1";
      }
      return makeRequest<FalQueueStatusResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}/status`,
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },

    async result(
      params: FalQueueResultParams,
      signal?: AbortSignal
    ): Promise<FalQueueResultResponse> {
      return makeRequest<FalQueueResultResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}`,
        undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },

    async cancel(
      params: FalQueueCancelParams,
      signal?: AbortSignal
    ): Promise<FalQueueCancelResponse> {
      return makeRequest<FalQueueCancelResponse>(
        "PUT",
        `/${params.endpoint_id}/requests/${params.request_id}/cancel`,
        undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },
  };

  function buildLogsQueryParams(
    params?: Record<string, unknown>
  ): Record<string, unknown> {
    if (!params) return {};
    const query: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query[key] = value;
      }
    }
    return query;
  }

  const serverless = {
    logs: {
      history: Object.assign(
        async function history(
          params?: FalLogsHistoryParams,
          body?: FalLabelFilter[],
          signal?: AbortSignal
        ): Promise<FalLogsHistoryResponse> {
          return makePostWithQuery<FalLogsHistoryResponse>(
            "/serverless/logs/history",
            buildLogsQueryParams(params as unknown as Record<string, unknown>),
            body,
            signal
          );
        },
        {
          payloadSchema: logsHistorySchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, logsHistorySchema);
          },
        }
      ),

      stream: Object.assign(
        async function stream(
          params?: FalLogsStreamParams,
          body?: FalLabelFilter[],
          signal?: AbortSignal
        ): Promise<AsyncIterable<FalLogEntry>> {
          const res = await makeStreamPostWithQuery(
            "/serverless/logs/stream",
            buildLogsQueryParams(params as unknown as Record<string, unknown>),
            body,
            signal
          );
          return sseToIterable<FalLogEntry>(res);
        },
        {
          payloadSchema: logsStreamSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, logsStreamSchema);
          },
        }
      ),
    },

    files: {
      async list(
        params?: FalFilesListParams,
        signal?: AbortSignal
      ): Promise<FalFileItem[]> {
        const path = params?.dir
          ? `/serverless/files/list/${params.dir}`
          : "/serverless/files/list";
        return makeRequest<FalFileItem[]>("GET", path, undefined, signal);
      },

      async download(
        params: FalFilesDownloadParams,
        signal?: AbortSignal
      ): Promise<Response> {
        return makeRawRequest(
          "GET",
          `/serverless/files/file/${params.file}`,
          undefined,
          signal
        );
      },

      uploadUrl: Object.assign(
        async function uploadUrl(
          params: FalFilesUploadUrlParams,
          signal?: AbortSignal
        ): Promise<boolean> {
          return makeRequest<boolean>(
            "POST",
            `/serverless/files/file/url/${params.file}`,
            { url: params.url },
            signal
          );
        },
        {
          payloadSchema: filesUploadUrlSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, filesUploadUrlSchema);
          },
        }
      ),

      uploadLocal: Object.assign(
        async function uploadLocal(
          params: FalFilesUploadLocalParams,
          signal?: AbortSignal
        ): Promise<boolean> {
          const formData = new FormData();
          formData.append(
            "file_upload",
            params.file,
            params.filename ?? "upload"
          );

          const queryParams: Record<string, unknown> = {};
          if (params.unzip) {
            queryParams.unzip = "true";
          }

          const res = await makeRawRequest(
            "POST",
            `/serverless/files/file/local/${params.target_path}`,
            formData,
            signal,
            Object.keys(queryParams).length > 0 ? queryParams : undefined
          );
          return (await res.json()) as boolean;
        },
        {
          payloadSchema: filesUploadLocalSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, filesUploadLocalSchema);
          },
        }
      ),
    },

    apps: {
      queue: Object.assign(
        async function queue(
          params: FalAppsQueueParams,
          signal?: AbortSignal
        ): Promise<FalAppsQueueResponse> {
          return makeRequest<FalAppsQueueResponse>(
            "GET",
            `/serverless/apps/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.name)}/queue`,
            undefined,
            signal
          );
        },
        {
          flush: Object.assign(
            async function flush(
              params: FalAppsFlushQueueParams,
              signal?: AbortSignal
            ): Promise<void> {
              const headers: Record<string, string> = {};
              if (params.idempotency_key) {
                headers["Idempotency-Key"] = params.idempotency_key;
              }

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);

              if (signal) {
                signal.addEventListener("abort", () => controller.abort());
              }

              const url = `${baseURL}/serverless/apps/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.name)}/queue`;

              try {
                const res = await doFetch(url, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Key ${opts.apiKey}`,
                    ...headers,
                  },
                  signal: controller.signal,
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                  let errorData: unknown;
                  try {
                    errorData = await res.json();
                  } catch {
                    errorData = null;
                  }

                  if (isFalApiErrorResponse(errorData)) {
                    throw new FalError(
                      errorData.error.message,
                      res.status,
                      errorData.error.type,
                      errorData.error.request_id,
                      errorData.error.docs_url,
                      errorData
                    );
                  }

                  throw new FalError(
                    `Fal API error: ${res.status}`,
                    res.status,
                    "server_error",
                    undefined,
                    undefined,
                    errorData
                  );
                }
              } catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof FalError) throw error;
                throw new FalError(
                  `Fal request failed: ${error}`,
                  500,
                  "server_error"
                );
              }
            },
            {
              payloadSchema: appsFlushQueueSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, appsFlushQueueSchema);
              },
            }
          ),
        }
      ),
    },

    async metrics(signal?: AbortSignal): Promise<string> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      const url = `${baseURL}/serverless/metrics`;

      try {
        const res = await doFetch(url, {
          method: "GET",
          headers: {
            Authorization: `Key ${opts.apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorData: unknown;
          try {
            errorData = await res.json();
          } catch {
            errorData = null;
          }

          if (isFalApiErrorResponse(errorData)) {
            throw new FalError(
              errorData.error.message,
              res.status,
              errorData.error.type,
              errorData.error.request_id,
              errorData.error.docs_url,
              errorData
            );
          }

          throw new FalError(
            `Fal API error: ${res.status}`,
            res.status,
            "server_error",
            undefined,
            undefined,
            errorData
          );
        }

        return await res.text();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof FalError) throw error;
        throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
      }
    },
  };
  const workflows = Object.assign(
    async function workflows(
      params?: FalWorkflowListParams,
      signal?: AbortSignal
    ): Promise<FalWorkflowListResponse> {
      return makeRequest<FalWorkflowListResponse>(
        "GET",
        "/workflows",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      async get(
        params: FalWorkflowGetParams,
        signal?: AbortSignal
      ): Promise<FalWorkflowGetResponse> {
        return makeRequest<FalWorkflowGetResponse>(
          "GET",
          `/workflows/${encodeURIComponent(params.username)}/${encodeURIComponent(params.workflow_name)}`,
          undefined,
          signal
        );
      },
    }
  );

  const computeInstances = Object.assign(
    async function instances(
      params?: FalComputeInstancesListParams,
      signal?: AbortSignal
    ): Promise<FalComputeInstancesListResponse> {
      return makeRequest<FalComputeInstancesListResponse>(
        "GET",
        "/compute/instances",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      async get(
        params: FalComputeInstanceGetParams,
        signal?: AbortSignal
      ): Promise<FalComputeInstance> {
        return makeRequest<FalComputeInstance>(
          "GET",
          `/compute/instances/${encodeURIComponent(params.id)}`,
          undefined,
          signal
        );
      },

      create: Object.assign(
        async function create(
          params: FalComputeInstanceCreateParams,
          signal?: AbortSignal
        ): Promise<FalComputeInstance> {
          return makeRequest<FalComputeInstance>(
            "POST",
            "/compute/instances",
            params as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: computeInstanceCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, computeInstanceCreateSchema);
          },
        }
      ),

      async terminate(
        params: FalComputeInstanceDeleteParams,
        signal?: AbortSignal
      ): Promise<void> {
        return makeRequest<void>(
          "DELETE",
          `/compute/instances/${encodeURIComponent(params.id)}`,
          undefined,
          signal
        );
      },
      // Verb accessor for POST on /compute/instances
      post: async function create(
        params: FalComputeInstanceCreateParams,
        signal?: AbortSignal
      ): Promise<FalComputeInstance> {
        return makeRequest<FalComputeInstance>(
          "POST",
          "/compute/instances",
          params as unknown as Record<string, unknown>,
          signal
        );
      },
    }
  );

  const compute = {
    instances: computeInstances,
  };

  // ==================== Verb-Prefixed API Surface ====================

  // GET v1 namespace
  const getV1ModelsPricing = Object.assign(
    async function pricing(
      params: FalPricingParams,
      signal?: AbortSignal
    ): Promise<FalPricingResponse> {
      return makeRequest<FalPricingResponse>(
        "GET",
        "/models/pricing",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      estimate: Object.assign(
        async function estimate(
          req: FalEstimateRequest,
          signal?: AbortSignal
        ): Promise<FalEstimateResponse> {
          return makeRequest<FalEstimateResponse>(
            "POST",
            "/models/pricing/estimate",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: pricingEstimateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, pricingEstimateSchema);
          },
        }
      ),
    }
  );

  const getV1ModelsRequests = {
    async byEndpoint(
      params: FalRequestsParams,
      signal?: AbortSignal
    ): Promise<FalRequestsResponse> {
      return makeRequest<FalRequestsResponse>(
        "GET",
        "/models/requests/by-endpoint",
        params as unknown as Record<string, unknown>,
        signal
      );
    },

    payloads: Object.assign(
      async function payloads(
        params: FalDeletePayloadsParams,
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }
        return makeRequest<FalDeletePayloadsResponse>(
          "DELETE",
          `/models/requests/${params.request_id}/payloads`,
          undefined,
          signal,
          headers
        );
      },
      {
        payloadSchema: deletePayloadsSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, deletePayloadsSchema);
        },
      }
    ),
  };

  const getV1Models = Object.assign(
    async function models(
      params?: FalModelSearchParams,
      signal?: AbortSignal
    ): Promise<FalModelSearchResponse> {
      return makeRequest<FalModelSearchResponse>(
        "GET",
        "/models",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      pricing: getV1ModelsPricing,

      async usage(
        params?: FalUsageParams,
        signal?: AbortSignal
      ): Promise<FalUsageResponse> {
        return makeRequest<FalUsageResponse>(
          "GET",
          "/models/usage",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      async analytics(
        params: FalAnalyticsParams,
        signal?: AbortSignal
      ): Promise<FalAnalyticsResponse> {
        return makeRequest<FalAnalyticsResponse>(
          "GET",
          "/models/analytics",
          params as unknown as Record<string, unknown>,
          signal
        );
      },

      requests: getV1ModelsRequests,
    }
  );

  const getV1Queue = {
    async status(
      params: FalQueueStatusParams,
      signal?: AbortSignal
    ): Promise<FalQueueStatusResponse> {
      const queryParams: Record<string, unknown> = {};
      if (params.logs) {
        queryParams.logs = "1";
      }
      return makeRequest<FalQueueStatusResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}/status`,
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },

    async result(
      params: FalQueueResultParams,
      signal?: AbortSignal
    ): Promise<FalQueueResultResponse> {
      return makeRequest<FalQueueResultResponse>(
        "GET",
        `/${params.endpoint_id}/requests/${params.request_id}`,
        undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },
  };

  const getV1ServerlessLogs = {
    history: Object.assign(
      async function history(
        params?: FalLogsHistoryParams,
        body?: FalLabelFilter[],
        signal?: AbortSignal
      ): Promise<FalLogsHistoryResponse> {
        return makePostWithQuery<FalLogsHistoryResponse>(
          "/serverless/logs/history",
          buildLogsQueryParams(params as unknown as Record<string, unknown>),
          body,
          signal
        );
      },
      {
        payloadSchema: logsHistorySchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, logsHistorySchema);
        },
      }
    ),
  };

  const getV1ServerlessFiles = {
    async list(
      params?: FalFilesListParams,
      signal?: AbortSignal
    ): Promise<FalFileItem[]> {
      const path = params?.dir
        ? `/serverless/files/list/${params.dir}`
        : "/serverless/files/list";
      return makeRequest<FalFileItem[]>("GET", path, undefined, signal);
    },

    async download(
      params: FalFilesDownloadParams,
      signal?: AbortSignal
    ): Promise<Response> {
      return makeRawRequest(
        "GET",
        `/serverless/files/file/${params.file}`,
        undefined,
        signal
      );
    },
  };

  const getV1ServerlessApps = {
    async queue(
      params: FalAppsQueueParams,
      signal?: AbortSignal
    ): Promise<FalAppsQueueResponse> {
      return makeRequest<FalAppsQueueResponse>(
        "GET",
        `/serverless/apps/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.name)}/queue`,
        undefined,
        signal
      );
    },
  };

  const getV1Serverless = {
    logs: getV1ServerlessLogs,
    files: getV1ServerlessFiles,
    apps: getV1ServerlessApps,

    async metrics(signal?: AbortSignal): Promise<string> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      const url = `${baseURL}/serverless/metrics`;

      try {
        const res = await doFetch(url, {
          method: "GET",
          headers: {
            Authorization: `Key ${opts.apiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorData: unknown;
          try {
            errorData = await res.json();
          } catch {
            errorData = null;
          }

          if (isFalApiErrorResponse(errorData)) {
            throw new FalError(
              errorData.error.message,
              res.status,
              errorData.error.type,
              errorData.error.request_id,
              errorData.error.docs_url,
              errorData
            );
          }

          throw new FalError(
            `Fal API error: ${res.status}`,
            res.status,
            "server_error",
            undefined,
            undefined,
            errorData
          );
        }

        return await res.text();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof FalError) throw error;
        throw new FalError(`Fal request failed: ${error}`, 500, "server_error");
      }
    },
  };

  const getV1Workflows = Object.assign(
    async function workflows(
      params?: FalWorkflowListParams,
      signal?: AbortSignal
    ): Promise<FalWorkflowListResponse> {
      return makeRequest<FalWorkflowListResponse>(
        "GET",
        "/workflows",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      async get(
        params: FalWorkflowGetParams,
        signal?: AbortSignal
      ): Promise<FalWorkflowGetResponse> {
        return makeRequest<FalWorkflowGetResponse>(
          "GET",
          `/workflows/${encodeURIComponent(params.username)}/${encodeURIComponent(params.workflow_name)}`,
          undefined,
          signal
        );
      },
    }
  );

  const getV1ComputeInstances = Object.assign(
    async function instances(
      params?: FalComputeInstancesListParams,
      signal?: AbortSignal
    ): Promise<FalComputeInstancesListResponse> {
      return makeRequest<FalComputeInstancesListResponse>(
        "GET",
        "/compute/instances",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      async get(
        params: FalComputeInstanceGetParams,
        signal?: AbortSignal
      ): Promise<FalComputeInstance> {
        return makeRequest<FalComputeInstance>(
          "GET",
          `/compute/instances/${encodeURIComponent(params.id)}`,
          undefined,
          signal
        );
      },
    }
  );

  const getV1Compute = {
    instances: getV1ComputeInstances,
  };

  const getV1 = {
    models: getV1Models,
    queue: getV1Queue,
    serverless: getV1Serverless,
    workflows: getV1Workflows,
    compute: getV1Compute,
  };

  // POST v1 namespace
  const postV1ModelsPricing = {
    estimate: Object.assign(
      async function estimate(
        req: FalEstimateRequest,
        signal?: AbortSignal
      ): Promise<FalEstimateResponse> {
        return makeRequest<FalEstimateResponse>(
          "POST",
          "/models/pricing/estimate",
          req as unknown as Record<string, unknown>,
          signal
        );
      },
      {
        payloadSchema: pricingEstimateSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, pricingEstimateSchema);
        },
      }
    ),
  };

  const postV1Models = {
    pricing: postV1ModelsPricing,
  };

  const postV1Queue = {
    submit: Object.assign(
      async function submit(
        params: FalQueueSubmitParams,
        signal?: AbortSignal
      ): Promise<FalQueueSubmitResponse> {
        const headers: Record<string, string> = {};
        if (params.priority) {
          headers["X-Fal-Queue-Priority"] = params.priority;
        }
        if (params.timeout !== undefined) {
          headers["X-Fal-Request-Timeout"] = String(params.timeout);
        }
        if (params.no_retry) {
          headers["X-Fal-No-Retry"] = "1";
        }
        if (params.runner_hint) {
          headers["X-Fal-Runner-Hint"] = params.runner_hint;
        }
        if (params.store_io) {
          headers["X-Fal-Store-IO"] = params.store_io;
        }
        if (params.object_lifecycle_preference) {
          headers["X-Fal-Object-Lifecycle-Preference"] =
            params.object_lifecycle_preference;
        }

        const path = params.webhook
          ? `/${params.endpoint_id}?fal_webhook=${encodeURIComponent(params.webhook)}`
          : `/${params.endpoint_id}`;

        return makeRequest<FalQueueSubmitResponse>(
          "POST",
          path,
          params.input,
          signal,
          headers,
          queueBaseURL
        );
      },
      {
        payloadSchema: queueSubmitSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, queueSubmitSchema);
        },
      }
    ),
  };

  const postV1ServerlessLogs = {
    history: Object.assign(
      async function history(
        params?: FalLogsHistoryParams,
        body?: FalLabelFilter[],
        signal?: AbortSignal
      ): Promise<FalLogsHistoryResponse> {
        return makePostWithQuery<FalLogsHistoryResponse>(
          "/serverless/logs/history",
          buildLogsQueryParams(params as unknown as Record<string, unknown>),
          body,
          signal
        );
      },
      {
        payloadSchema: logsHistorySchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, logsHistorySchema);
        },
      }
    ),

    stream: Object.assign(
      async function stream(
        params?: FalLogsStreamParams,
        body?: FalLabelFilter[],
        signal?: AbortSignal
      ): Promise<AsyncIterable<FalLogEntry>> {
        const res = await makeStreamPostWithQuery(
          "/serverless/logs/stream",
          buildLogsQueryParams(params as unknown as Record<string, unknown>),
          body,
          signal
        );
        return sseToIterable<FalLogEntry>(res);
      },
      {
        payloadSchema: logsStreamSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, logsStreamSchema);
        },
      }
    ),
  };

  const postV1ServerlessFiles = {
    uploadUrl: Object.assign(
      async function uploadUrl(
        params: FalFilesUploadUrlParams,
        signal?: AbortSignal
      ): Promise<boolean> {
        return makeRequest<boolean>(
          "POST",
          `/serverless/files/file/url/${params.file}`,
          { url: params.url },
          signal
        );
      },
      {
        payloadSchema: filesUploadUrlSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, filesUploadUrlSchema);
        },
      }
    ),

    uploadLocal: Object.assign(
      async function uploadLocal(
        params: FalFilesUploadLocalParams,
        signal?: AbortSignal
      ): Promise<boolean> {
        const formData = new FormData();
        formData.append(
          "file_upload",
          params.file,
          params.filename ?? "upload"
        );

        const queryParams: Record<string, unknown> = {};
        if (params.unzip) {
          queryParams.unzip = "true";
        }

        const res = await makeRawRequest(
          "POST",
          `/serverless/files/file/local/${params.target_path}`,
          formData,
          signal,
          Object.keys(queryParams).length > 0 ? queryParams : undefined
        );
        return (await res.json()) as boolean;
      },
      {
        payloadSchema: filesUploadLocalSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, filesUploadLocalSchema);
        },
      }
    ),
  };

  const postV1Serverless = {
    logs: postV1ServerlessLogs,
    files: postV1ServerlessFiles,
  };

  const postV1ComputeInstancesCreate = Object.assign(
    async function create(
      params: FalComputeInstanceCreateParams,
      signal?: AbortSignal
    ): Promise<FalComputeInstance> {
      return makeRequest<FalComputeInstance>(
        "POST",
        "/compute/instances",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      payloadSchema: computeInstanceCreateSchema,
      validatePayload(data: unknown): ValidationResult {
        return validatePayload(data, computeInstanceCreateSchema);
      },
    }
  );

  const postV1ComputeInstances = Object.assign(
    async function instances(
      params: FalComputeInstanceCreateParams,
      signal?: AbortSignal
    ): Promise<FalComputeInstance> {
      return makeRequest<FalComputeInstance>(
        "POST",
        "/compute/instances",
        params as unknown as Record<string, unknown>,
        signal
      );
    },
    {
      create: postV1ComputeInstancesCreate,
    }
  );

  const postV1Compute = {
    instances: postV1ComputeInstances,
  };

  const postV1 = {
    models: postV1Models,
    queue: postV1Queue,
    serverless: postV1Serverless,
    compute: postV1Compute,
  };

  // PUT v1 namespace
  const putV1Queue = {
    async cancel(
      params: FalQueueCancelParams,
      signal?: AbortSignal
    ): Promise<FalQueueCancelResponse> {
      return makeRequest<FalQueueCancelResponse>(
        "PUT",
        `/${params.endpoint_id}/requests/${params.request_id}/cancel`,
        undefined,
        signal,
        undefined,
        queueBaseURL
      );
    },
  };

  const putV1 = {
    queue: putV1Queue,
  };

  // DELETE v1 namespace
  const deleteV1ModelsRequests = {
    payloads: Object.assign(
      async function payloads(
        params: FalDeletePayloadsParams,
        signal?: AbortSignal
      ): Promise<FalDeletePayloadsResponse> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }
        return makeRequest<FalDeletePayloadsResponse>(
          "DELETE",
          `/models/requests/${params.request_id}/payloads`,
          undefined,
          signal,
          headers
        );
      },
      {
        payloadSchema: deletePayloadsSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, deletePayloadsSchema);
        },
      }
    ),
  };

  const deleteV1Models = {
    requests: deleteV1ModelsRequests,
  };

  const deleteV1ServerlessAppsQueue = {
    flush: Object.assign(
      async function flush(
        params: FalAppsFlushQueueParams,
        signal?: AbortSignal
      ): Promise<void> {
        const headers: Record<string, string> = {};
        if (params.idempotency_key) {
          headers["Idempotency-Key"] = params.idempotency_key;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        if (signal) {
          signal.addEventListener("abort", () => controller.abort());
        }

        const url = `${baseURL}/serverless/apps/${encodeURIComponent(params.owner)}/${encodeURIComponent(params.name)}/queue`;

        try {
          const res = await doFetch(url, {
            method: "DELETE",
            headers: {
              Authorization: `Key ${opts.apiKey}`,
              ...headers,
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            let errorData: unknown;
            try {
              errorData = await res.json();
            } catch {
              errorData = null;
            }

            if (isFalApiErrorResponse(errorData)) {
              throw new FalError(
                errorData.error.message,
                res.status,
                errorData.error.type,
                errorData.error.request_id,
                errorData.error.docs_url,
                errorData
              );
            }

            throw new FalError(
              `Fal API error: ${res.status}`,
              res.status,
              "server_error",
              undefined,
              undefined,
              errorData
            );
          }
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof FalError) throw error;
          throw new FalError(
            `Fal request failed: ${error}`,
            500,
            "server_error"
          );
        }
      },
      {
        payloadSchema: appsFlushQueueSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, appsFlushQueueSchema);
        },
      }
    ),
  };

  const deleteV1ComputeInstances = {
    async terminate(
      params: FalComputeInstanceDeleteParams,
      signal?: AbortSignal
    ): Promise<void> {
      return makeRequest<void>(
        "DELETE",
        `/compute/instances/${encodeURIComponent(params.id)}`,
        undefined,
        signal
      );
    },
  };

  const deleteV1Compute = {
    instances: deleteV1ComputeInstances,
  };

  const deleteV1Serverless = {
    apps: {
      queue: deleteV1ServerlessAppsQueue,
    },
  };

  const deleteV1 = {
    models: deleteV1Models,
    serverless: deleteV1Serverless,
    compute: deleteV1Compute,
  };

  return {
    // Backward compatibility - old structure
    v1: {
      models,
      queue,
      serverless,
      workflows,
      compute,
    },
    // New verb-prefix API surface
    get: { v1: getV1 },
    post: { v1: postV1 },
    put: { v1: putV1 },
    delete: { v1: deleteV1 },
  };
}
