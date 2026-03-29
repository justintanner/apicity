import {
  CohereOptions,
  CohereChatV2Request,
  CohereChatV2Response,
  CohereChatV1Request,
  CohereChatV1Response,
  CohereEmbedRequest,
  CohereEmbedResponse,
  CohereRerankRequest,
  CohereRerankResponse,
  CohereClassifyRequest,
  CohereClassifyResponse,
  CohereSummarizeRequest,
  CohereSummarizeResponse,
  CohereModelsListParams,
  CohereModelsListResponse,
  CohereModel,
  CohereTokenizeRequest,
  CohereTokenizeResponse,
  CohereDetokenizeRequest,
  CohereDetokenizeResponse,
  CohereCheckApiKeyResponse,
  CohereDatasetListParams,
  CohereDatasetListResponse,
  CohereDatasetCreateParams,
  CohereDatasetCreateResponse,
  CohereDatasetGetResponse,
  CohereDatasetUsageResponse,
  CohereConnectorListParams,
  CohereConnectorListResponse,
  CohereConnectorCreateRequest,
  CohereConnectorCreateResponse,
  CohereConnectorGetResponse,
  CohereConnectorUpdateRequest,
  CohereConnectorUpdateResponse,
  CohereEmbedJobListResponse,
  CohereEmbedJobCreateRequest,
  CohereEmbedJobCreateResponse,
  CohereEmbedJob,
  CohereFineTunedModelListParams,
  CohereFineTunedModelListResponse,
  CohereFineTunedModelCreateRequest,
  CohereFineTunedModelCreateResponse,
  CohereFineTunedModelGetResponse,
  CohereFineTunedModelUpdateRequest,
  CohereFineTunedModelUpdateResponse,
  CohereFineTuneEventListParams,
  CohereFineTuneEventListResponse,
  CohereTrainingStepMetricListParams,
  CohereTrainingStepMetricListResponse,
  CohereProvider,
  CohereError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  chatV2Schema,
  chatV1Schema,
  embedSchema,
  rerankSchema,
  classifySchema,
  summarizeSchema,
  tokenizeSchema,
  detokenizeSchema,
  connectorCreateSchema,
  connectorUpdateSchema,
  embedJobCreateSchema,
  fineTunedModelCreateSchema,
  fineTunedModelUpdateSchema,
  datasetCreateSchema,
} from "./schemas";
import { validatePayload } from "./validate";

export function cohere(opts: CohereOptions): CohereProvider {
  const baseURL = opts.baseURL ?? "https://api.cohere.com";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function buildQuery(params: Record<string, unknown>): string {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          parts.push(
            `${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`
          );
        }
      } else {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  }

  async function makeRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
      };

      let reqBody: BodyInit | undefined;
      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        reqBody = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, {
        method,
        headers,
        body: reqBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Cohere API error: ${res.status}`;
        let errorBody: unknown;
        let code: string | undefined;
        try {
          errorBody = await res.json();
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "message" in errorBody
          ) {
            message = (errorBody as { message: string }).message;
          }
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "id" in errorBody
          ) {
            code = (errorBody as { id: string }).id;
          }
        } catch {
          /* ignore parse errors */
        }
        throw new CohereError(message, res.status, errorBody, code);
      }

      return (await res.json()) as T;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof CohereError) throw e;
      throw e;
    }
  }

  async function makeFormRequest<T>(
    path: string,
    form: FormData,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let message = `Cohere API error: ${res.status}`;
        let errorBody: unknown;
        let code: string | undefined;
        try {
          errorBody = await res.json();
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "message" in errorBody
          ) {
            message = (errorBody as { message: string }).message;
          }
          if (
            typeof errorBody === "object" &&
            errorBody !== null &&
            "id" in errorBody
          ) {
            code = (errorBody as { id: string }).id;
          }
        } catch {
          /* ignore */
        }
        throw new CohereError(message, res.status, errorBody, code);
      }

      return (await res.json()) as T;
    } catch (e) {
      clearTimeout(timeoutId);
      if (e instanceof CohereError) throw e;
      throw e;
    }
  }

  // -----------------------------------------------------------------------
  // v1.models — callable for list, with .retrieve for single model
  // -----------------------------------------------------------------------

  const models = Object.assign(
    async function models(
      params?: CohereModelsListParams,
      signal?: AbortSignal
    ): Promise<CohereModelsListResponse> {
      const query = params ? buildQuery(params as Record<string, unknown>) : "";
      return await makeRequest<CohereModelsListResponse>(
        "GET",
        `/v1/models${query}`,
        undefined,
        signal
      );
    },
    {
      async retrieve(
        model: string,
        signal?: AbortSignal
      ): Promise<CohereModel> {
        return await makeRequest<CohereModel>(
          "GET",
          `/v1/models/${encodeURIComponent(model)}`,
          undefined,
          signal
        );
      },
    }
  );

  // -----------------------------------------------------------------------
  // v1.datasets — callable for list, with CRUD + usage
  // -----------------------------------------------------------------------

  const datasets = Object.assign(
    async function datasets(
      params?: CohereDatasetListParams,
      signal?: AbortSignal
    ): Promise<CohereDatasetListResponse> {
      const query = params ? buildQuery(params as Record<string, unknown>) : "";
      return await makeRequest<CohereDatasetListResponse>(
        "GET",
        `/v1/datasets${query}`,
        undefined,
        signal
      );
    },
    {
      create: Object.assign(
        async function create(
          data: Blob | File,
          params: CohereDatasetCreateParams,
          evalData?: Blob | File,
          signal?: AbortSignal
        ): Promise<CohereDatasetCreateResponse> {
          const form = new FormData();
          form.append("data", data);
          if (evalData) {
            form.append("eval_data", evalData);
          }
          const query = buildQuery(
            params as unknown as Record<string, unknown>
          );
          return await makeFormRequest<CohereDatasetCreateResponse>(
            `/v1/datasets${query}`,
            form,
            signal
          );
        },
        {
          payloadSchema: datasetCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, datasetCreateSchema);
          },
        }
      ),

      async retrieve(
        id: string,
        signal?: AbortSignal
      ): Promise<CohereDatasetGetResponse> {
        return await makeRequest<CohereDatasetGetResponse>(
          "GET",
          `/v1/datasets/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },

      async del(
        id: string,
        signal?: AbortSignal
      ): Promise<Record<string, never>> {
        return await makeRequest<Record<string, never>>(
          "DELETE",
          `/v1/datasets/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },

      async usage(signal?: AbortSignal): Promise<CohereDatasetUsageResponse> {
        return await makeRequest<CohereDatasetUsageResponse>(
          "GET",
          "/v1/datasets/usage",
          undefined,
          signal
        );
      },
    }
  );

  // -----------------------------------------------------------------------
  // v1.connectors — callable for list, with CRUD
  // -----------------------------------------------------------------------

  const connectors = Object.assign(
    async function connectors(
      params?: CohereConnectorListParams,
      signal?: AbortSignal
    ): Promise<CohereConnectorListResponse> {
      const query = params ? buildQuery(params as Record<string, unknown>) : "";
      return await makeRequest<CohereConnectorListResponse>(
        "GET",
        `/v1/connectors${query}`,
        undefined,
        signal
      );
    },
    {
      create: Object.assign(
        async function create(
          req: CohereConnectorCreateRequest,
          signal?: AbortSignal
        ): Promise<CohereConnectorCreateResponse> {
          return await makeRequest<CohereConnectorCreateResponse>(
            "POST",
            "/v1/connectors",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: connectorCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, connectorCreateSchema);
          },
        }
      ),

      async retrieve(
        id: string,
        signal?: AbortSignal
      ): Promise<CohereConnectorGetResponse> {
        return await makeRequest<CohereConnectorGetResponse>(
          "GET",
          `/v1/connectors/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },

      update: Object.assign(
        async function update(
          id: string,
          req: CohereConnectorUpdateRequest,
          signal?: AbortSignal
        ): Promise<CohereConnectorUpdateResponse> {
          return await makeRequest<CohereConnectorUpdateResponse>(
            "PATCH",
            `/v1/connectors/${encodeURIComponent(id)}`,
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: connectorUpdateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, connectorUpdateSchema);
          },
        }
      ),

      async del(
        id: string,
        signal?: AbortSignal
      ): Promise<Record<string, never>> {
        return await makeRequest<Record<string, never>>(
          "DELETE",
          `/v1/connectors/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },
    }
  );

  // -----------------------------------------------------------------------
  // v1["embed-jobs"] — callable for list, with create/retrieve/cancel
  // -----------------------------------------------------------------------

  const embedJobs = Object.assign(
    async function embedJobs(
      signal?: AbortSignal
    ): Promise<CohereEmbedJobListResponse> {
      return await makeRequest<CohereEmbedJobListResponse>(
        "GET",
        "/v1/embed-jobs",
        undefined,
        signal
      );
    },
    {
      create: Object.assign(
        async function create(
          req: CohereEmbedJobCreateRequest,
          signal?: AbortSignal
        ): Promise<CohereEmbedJobCreateResponse> {
          return await makeRequest<CohereEmbedJobCreateResponse>(
            "POST",
            "/v1/embed-jobs",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: embedJobCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, embedJobCreateSchema);
          },
        }
      ),

      async retrieve(
        id: string,
        signal?: AbortSignal
      ): Promise<CohereEmbedJob> {
        return await makeRequest<CohereEmbedJob>(
          "GET",
          `/v1/embed-jobs/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },

      async cancel(
        id: string,
        signal?: AbortSignal
      ): Promise<Record<string, never>> {
        return await makeRequest<Record<string, never>>(
          "POST",
          `/v1/embed-jobs/${encodeURIComponent(id)}/cancel`,
          undefined,
          signal
        );
      },
    }
  );

  // -----------------------------------------------------------------------
  // v1.finetuning["finetuned-models"]
  // -----------------------------------------------------------------------

  const finetunedModels = Object.assign(
    async function finetunedModels(
      params?: CohereFineTunedModelListParams,
      signal?: AbortSignal
    ): Promise<CohereFineTunedModelListResponse> {
      const query = params ? buildQuery(params as Record<string, unknown>) : "";
      return await makeRequest<CohereFineTunedModelListResponse>(
        "GET",
        `/v1/finetuning/finetuned-models${query}`,
        undefined,
        signal
      );
    },
    {
      create: Object.assign(
        async function create(
          req: CohereFineTunedModelCreateRequest,
          signal?: AbortSignal
        ): Promise<CohereFineTunedModelCreateResponse> {
          return await makeRequest<CohereFineTunedModelCreateResponse>(
            "POST",
            "/v1/finetuning/finetuned-models",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: fineTunedModelCreateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, fineTunedModelCreateSchema);
          },
        }
      ),

      async retrieve(
        id: string,
        signal?: AbortSignal
      ): Promise<CohereFineTunedModelGetResponse> {
        return await makeRequest<CohereFineTunedModelGetResponse>(
          "GET",
          `/v1/finetuning/finetuned-models/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },

      update: Object.assign(
        async function update(
          id: string,
          req: CohereFineTunedModelUpdateRequest,
          signal?: AbortSignal
        ): Promise<CohereFineTunedModelUpdateResponse> {
          return await makeRequest<CohereFineTunedModelUpdateResponse>(
            "PATCH",
            `/v1/finetuning/finetuned-models/${encodeURIComponent(id)}`,
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: fineTunedModelUpdateSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, fineTunedModelUpdateSchema);
          },
        }
      ),

      async del(
        id: string,
        signal?: AbortSignal
      ): Promise<Record<string, never>> {
        return await makeRequest<Record<string, never>>(
          "DELETE",
          `/v1/finetuning/finetuned-models/${encodeURIComponent(id)}`,
          undefined,
          signal
        );
      },

      async events(
        id: string,
        params?: CohereFineTuneEventListParams,
        signal?: AbortSignal
      ): Promise<CohereFineTuneEventListResponse> {
        const query = params
          ? buildQuery(params as Record<string, unknown>)
          : "";
        return await makeRequest<CohereFineTuneEventListResponse>(
          "GET",
          `/v1/finetuning/finetuned-models/${encodeURIComponent(id)}/events${query}`,
          undefined,
          signal
        );
      },

      async trainingStepMetrics(
        id: string,
        params?: CohereTrainingStepMetricListParams,
        signal?: AbortSignal
      ): Promise<CohereTrainingStepMetricListResponse> {
        const query = params
          ? buildQuery(params as Record<string, unknown>)
          : "";
        return await makeRequest<CohereTrainingStepMetricListResponse>(
          "GET",
          `/v1/finetuning/finetuned-models/${encodeURIComponent(id)}/training-step-metrics${query}`,
          undefined,
          signal
        );
      },
    }
  );

  // -----------------------------------------------------------------------
  // Assemble and return the provider
  // -----------------------------------------------------------------------

  return {
    v2: {
      chat: Object.assign(
        async function chat(
          req: CohereChatV2Request,
          signal?: AbortSignal
        ): Promise<CohereChatV2Response> {
          return await makeRequest<CohereChatV2Response>(
            "POST",
            "/v2/chat",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: chatV2Schema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, chatV2Schema);
          },
        }
      ),

      embed: Object.assign(
        async function embed(
          req: CohereEmbedRequest,
          signal?: AbortSignal
        ): Promise<CohereEmbedResponse> {
          return await makeRequest<CohereEmbedResponse>(
            "POST",
            "/v2/embed",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: embedSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, embedSchema);
          },
        }
      ),

      rerank: Object.assign(
        async function rerank(
          req: CohereRerankRequest,
          signal?: AbortSignal
        ): Promise<CohereRerankResponse> {
          return await makeRequest<CohereRerankResponse>(
            "POST",
            "/v2/rerank",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: rerankSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, rerankSchema);
          },
        }
      ),
    },

    v1: {
      chat: Object.assign(
        async function chat(
          req: CohereChatV1Request,
          signal?: AbortSignal
        ): Promise<CohereChatV1Response> {
          return await makeRequest<CohereChatV1Response>(
            "POST",
            "/v1/chat",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: chatV1Schema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, chatV1Schema);
          },
        }
      ),

      classify: Object.assign(
        async function classify(
          req: CohereClassifyRequest,
          signal?: AbortSignal
        ): Promise<CohereClassifyResponse> {
          return await makeRequest<CohereClassifyResponse>(
            "POST",
            "/v1/classify",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: classifySchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, classifySchema);
          },
        }
      ),

      summarize: Object.assign(
        async function summarize(
          req: CohereSummarizeRequest,
          signal?: AbortSignal
        ): Promise<CohereSummarizeResponse> {
          return await makeRequest<CohereSummarizeResponse>(
            "POST",
            "/v1/summarize",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: summarizeSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, summarizeSchema);
          },
        }
      ),

      models: models as CohereProvider["v1"]["models"],

      tokenize: Object.assign(
        async function tokenize(
          req: CohereTokenizeRequest,
          signal?: AbortSignal
        ): Promise<CohereTokenizeResponse> {
          return await makeRequest<CohereTokenizeResponse>(
            "POST",
            "/v1/tokenize",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: tokenizeSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, tokenizeSchema);
          },
        }
      ),

      detokenize: Object.assign(
        async function detokenize(
          req: CohereDetokenizeRequest,
          signal?: AbortSignal
        ): Promise<CohereDetokenizeResponse> {
          return await makeRequest<CohereDetokenizeResponse>(
            "POST",
            "/v1/detokenize",
            req as unknown as Record<string, unknown>,
            signal
          );
        },
        {
          payloadSchema: detokenizeSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, detokenizeSchema);
          },
        }
      ),

      "check-api-key": async function checkApiKey(
        signal?: AbortSignal
      ): Promise<CohereCheckApiKeyResponse> {
        return await makeRequest<CohereCheckApiKeyResponse>(
          "POST",
          "/v1/check-api-key",
          {},
          signal
        );
      },

      datasets: datasets as CohereProvider["v1"]["datasets"],

      connectors: connectors as CohereProvider["v1"]["connectors"],

      "embed-jobs": embedJobs as CohereProvider["v1"]["embed-jobs"],

      finetuning: {
        "finetuned-models":
          finetunedModels as CohereProvider["v1"]["finetuning"]["finetuned-models"],
      },
    },
  };
}
