import {
  AnthropicOptions,
  AnthropicMessageRequest,
  AnthropicMessageResponse,
  AnthropicCountTokensRequest,
  AnthropicCountTokensResponse,
  AnthropicBatchCreateRequest,
  AnthropicBatch,
  AnthropicBatchListResponse,
  AnthropicBatchDeleteResponse,
  AnthropicModel,
  AnthropicModelListResponse,
  AnthropicFile,
  AnthropicFileListResponse,
  AnthropicFileDeleteResponse,
  AnthropicSkillFile,
  AnthropicSkill,
  AnthropicSkillsListParams,
  AnthropicSkillsListResponse,
  AnthropicSkillDeleteResponse,
  AnthropicSkillVersion,
  AnthropicSkillVersionsListParams,
  AnthropicSkillVersionsListResponse,
  AnthropicSkillVersionDeleteResponse,
  AnthropicListParams,
  AnthropicStreamEvent,
  AnthropicOauthUsageResponse,
  AnthropicProvider,
  AnthropicError,
} from "./types";
import {
  AnthropicMessageRequestSchema,
  AnthropicCountTokensRequestSchema,
  AnthropicBatchCreateRequestSchema,
  AnthropicFileUploadRequestSchema,
  AnthropicSkillsCreateRequestSchema,
  AnthropicSkillVersionsCreateRequestSchema,
} from "./zod";
import { parseAnthropicStream } from "./anthropic-stream";
import { attachExamples } from "./example";
import { createTransport } from "./transport";

interface AnthropicErrorBody {
  error?: {
    message?: string;
    type?: string;
  };
}

function isAnthropicErrorBody(x: unknown): x is AnthropicErrorBody {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as { error?: unknown }).error === "object"
  );
}

function parseAnthropicErrorBody(
  status: number,
  body: unknown
): { message: string; code?: string } {
  let message = `Anthropic API error: ${status}`;
  let code: string | undefined;

  if (
    isAnthropicErrorBody(body) &&
    typeof body.error?.message === "string" &&
    body.error.message.length > 0
  ) {
    message = `Anthropic API error ${status}: ${body.error.message}`;
    code = typeof body.error.type === "string" ? body.error.type : undefined;
  }

  return code ? { message, code } : { message };
}

function queryString(
  query?: Record<string, string | string[] | boolean | undefined>
): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          params.append(`${key}[]`, v);
        }
      } else {
        params.append(key, String(value));
      }
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function createAnthropic(opts: AnthropicOptions): AnthropicProvider {
  const baseURL = (opts.baseURL ?? "https://api.anthropic.com") + "/v1";
  // Root host (no /v1 suffix) for non-versioned surfaces like /api/oauth/usage.
  const apiBase = opts.baseURL ?? "https://api.anthropic.com";
  const timeout = opts.timeout ?? 30000;
  const version = opts.defaultVersion ?? "2023-06-01";
  const defaultBeta = opts.defaultBeta;

  function commonHeaders(
    apiKey: string,
    extra?: Record<string, string>,
    additionalBeta?: string[]
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "anthropic-version": version,
      ...extra,
    };
    const allBeta = [...(defaultBeta ?? []), ...(additionalBeta ?? [])];
    if (allBeta.length > 0) {
      headers["anthropic-beta"] = allBeta.join(",");
    }
    return headers;
  }

  function overrideHeaders(
    apiKey?: string,
    beta?: string[]
  ): Record<string, string> | undefined {
    return apiKey !== undefined || beta !== undefined
      ? commonHeaders(apiKey ?? opts.apiKey, undefined, beta)
      : undefined;
  }

  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => commonHeaders(opts.apiKey),
    parseErrorBody: parseAnthropicErrorBody,
    errorClass: AnthropicError,
  });

  const oauthTransport = createTransport({
    baseUrl: apiBase,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({
      Authorization: `Bearer ${opts.oauthToken ?? opts.apiKey}`,
      "anthropic-version": version,
      "anthropic-beta": "oauth-2025-04-20",
    }),
    parseErrorBody: parseAnthropicErrorBody,
    errorClass: AnthropicError,
  });

  // --- Core request methods ---

  async function makeJsonRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    return await transport.postJson<T>(path, body, {
      signal,
      headers: overrideHeaders(apiKey),
    });
  }

  async function makeStreamRequest(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<Response> {
    return await transport.raw(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(body as Record<string, unknown>),
        stream: true,
      }),
      signal,
    });
  }

  async function makeGetRequest<T>(
    path: string,
    query?: Record<string, string | string[] | boolean | undefined>,
    signal?: AbortSignal,
    apiKey?: string,
    beta?: string[]
  ): Promise<T> {
    return await transport.getJson<T>(`${path}${queryString(query)}`, {
      signal,
      headers: overrideHeaders(apiKey, beta),
    });
  }

  async function makeGetBinaryRequest(
    path: string,
    signal?: AbortSignal,
    apiKey?: string,
    beta?: string[]
  ): Promise<ArrayBuffer> {
    return await transport.getBinary(path, {
      signal,
      headers: overrideHeaders(apiKey, beta),
    });
  }

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<string> {
    return await transport.getText(path, {
      signal,
      headers: overrideHeaders(apiKey),
    });
  }

  async function makeDeleteRequest<T>(
    path: string,
    signal?: AbortSignal,
    apiKey?: string,
    beta?: string[]
  ): Promise<T> {
    return await transport.del<T>(path, {
      signal,
      headers: overrideHeaders(apiKey, beta),
    });
  }

  async function makeEmptyPostRequest<T>(
    path: string,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    try {
      const res = await transport.raw(path, {
        method: "POST",
        signal,
        headers: overrideHeaders(apiKey),
      });
      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeFormRequest<T>(
    path: string,
    form: FormData,
    signal?: AbortSignal,
    apiKey?: string,
    beta?: string[]
  ): Promise<T> {
    return await transport.postForm<T>(path, form, {
      signal,
      headers: overrideHeaders(apiKey, beta),
    });
  }

  // --- Helper for pagination query params ---
  function listQuery(
    params?: AnthropicListParams
  ): Record<string, string | undefined> {
    if (!params) return {};
    return {
      after_id: params.after_id,
      before_id: params.before_id,
      limit: params.limit !== undefined ? String(params.limit) : undefined,
    };
  }

  // Beta flags
  const FILES_BETA = ["files-api-2025-04-14"];
  const SKILLS_BETA = ["skills-2025-10-02"];

  // --- Define POST methods ---

  // POST https://api.anthropic.com/v1/messages
  // Docs: https://docs.anthropic.com/en/api
  const postMessages = Object.assign(
    async function messages(
      req: AnthropicMessageRequest,
      signal?: AbortSignal
    ): Promise<AnthropicMessageResponse> {
      return await makeJsonRequest<AnthropicMessageResponse>(
        "/messages",
        req,
        signal
      );
    },
    {
      schema: AnthropicMessageRequestSchema,
      // POST https://api.anthropic.com/v1/messages/count_tokens
      // Docs: https://docs.anthropic.com/en/api
      countTokens: Object.assign(
        async function countTokens(
          req: AnthropicCountTokensRequest,
          signal?: AbortSignal
        ): Promise<AnthropicCountTokensResponse> {
          return await makeJsonRequest<AnthropicCountTokensResponse>(
            "/messages/count_tokens",
            req,
            signal
          );
        },
        {
          schema: AnthropicCountTokensRequestSchema,
        }
      ),
      // POST https://api.anthropic.com/v1/messages/batches
      // Docs: https://docs.anthropic.com/en/api
      batches: Object.assign(
        async function batches(
          req: AnthropicBatchCreateRequest,
          signal?: AbortSignal
        ): Promise<AnthropicBatch> {
          return await makeJsonRequest<AnthropicBatch>(
            "/messages/batches",
            req,
            signal
          );
        },
        {
          schema: AnthropicBatchCreateRequestSchema,
          // POST https://api.anthropic.com/v1/messages/batches/{batchId}/cancel
          // Docs: https://docs.anthropic.com/en/api
          cancel: async function cancel(
            batchId: string,
            signal?: AbortSignal
          ): Promise<AnthropicBatch> {
            return await makeEmptyPostRequest<AnthropicBatch>(
              `/messages/batches/${encodeURIComponent(batchId)}/cancel`,
              signal
            );
          },
        }
      ),
    }
  );

  // POST https://api.anthropic.com/v1/files
  // Docs: https://docs.anthropic.com/en/api
  const postFiles = Object.assign(
    async function upload(
      file: Blob,
      signal?: AbortSignal
    ): Promise<AnthropicFile> {
      const form = new FormData();
      form.append("file", file);
      return await makeFormRequest<AnthropicFile>(
        "/files",
        form,
        signal,
        undefined,
        FILES_BETA
      );
    },
    {
      schema: AnthropicFileUploadRequestSchema,
    }
  );

  // POST https://api.anthropic.com/v1/messages
  // Docs: https://docs.anthropic.com/en/api
  const postMessagesStream = Object.assign(
    async function stream(
      req: AnthropicMessageRequest,
      signal?: AbortSignal
    ): Promise<AsyncIterable<AnthropicStreamEvent>> {
      const res = await makeStreamRequest("/messages", req, signal);
      return parseAnthropicStream(res);
    },
    {
      schema: AnthropicMessageRequestSchema,
    }
  );

  // POST https://api.anthropic.com/v1/skills
  // Docs: https://docs.anthropic.com/en/api
  const postSkillsCreate = Object.assign(
    async function create(
      displayTitle: string,
      files: AnthropicSkillFile[],
      signal?: AbortSignal
    ): Promise<AnthropicSkill> {
      const form = new FormData();
      form.append("display_title", displayTitle);
      for (const f of files) {
        form.append("files[]", f.data, f.path);
      }
      return await makeFormRequest<AnthropicSkill>(
        "/skills",
        form,
        signal,
        undefined,
        SKILLS_BETA
      );
    },
    {
      schema: AnthropicSkillsCreateRequestSchema,
    }
  );

  // POST https://api.anthropic.com/v1/skills/{skillId}/versions
  // Docs: https://docs.anthropic.com/en/api
  const postSkillVersionsCreate = Object.assign(
    async function create(
      skillId: string,
      files: AnthropicSkillFile[],
      signal?: AbortSignal
    ): Promise<AnthropicSkillVersion> {
      const form = new FormData();
      for (const f of files) {
        form.append("files[]", f.data, f.path);
      }
      return await makeFormRequest<AnthropicSkillVersion>(
        `/skills/${encodeURIComponent(skillId)}/versions`,
        form,
        signal,
        undefined,
        SKILLS_BETA
      );
    },
    {
      schema: AnthropicSkillVersionsCreateRequestSchema,
    }
  );

  // --- Define GET methods ---

  // GET https://api.anthropic.com/v1/messages/batches
  // Docs: https://docs.anthropic.com/en/api
  async function getBatchesList(
    params?: AnthropicListParams,
    signal?: AbortSignal
  ): Promise<AnthropicBatchListResponse> {
    return await makeGetRequest<AnthropicBatchListResponse>(
      "/messages/batches",
      listQuery(params),
      signal
    );
  }

  // GET https://api.anthropic.com/v1/messages/batches/{batchId}
  // Docs: https://docs.anthropic.com/en/api
  async function getBatchesRetrieve(
    batchId: string,
    signal?: AbortSignal
  ): Promise<AnthropicBatch> {
    return await makeGetRequest<AnthropicBatch>(
      `/messages/batches/${encodeURIComponent(batchId)}`,
      undefined,
      signal
    );
  }

  // GET https://api.anthropic.com/v1/messages/batches/{batchId}/results
  // Docs: https://docs.anthropic.com/en/api
  async function getBatchesResults(
    batchId: string,
    signal?: AbortSignal
  ): Promise<string> {
    return await makeGetTextRequest(
      `/messages/batches/${encodeURIComponent(batchId)}/results`,
      signal
    );
  }

  // GET https://api.anthropic.com/v1/models
  // Docs: https://docs.anthropic.com/en/api
  async function getModelsList(
    params?: AnthropicListParams,
    signal?: AbortSignal
  ): Promise<AnthropicModelListResponse> {
    return await makeGetRequest<AnthropicModelListResponse>(
      "/models",
      listQuery(params),
      signal
    );
  }

  // GET https://api.anthropic.com/v1/models/{modelId}
  // Docs: https://docs.anthropic.com/en/api
  async function getModelsRetrieve(
    modelId: string,
    signal?: AbortSignal
  ): Promise<AnthropicModel> {
    return await makeGetRequest<AnthropicModel>(
      `/models/${encodeURIComponent(modelId)}`,
      undefined,
      signal
    );
  }

  // GET https://api.anthropic.com/v1/files
  // Docs: https://docs.anthropic.com/en/api
  async function getFilesList(
    params?: AnthropicListParams,
    signal?: AbortSignal
  ): Promise<AnthropicFileListResponse> {
    return await makeGetRequest<AnthropicFileListResponse>(
      "/files",
      listQuery(params),
      signal,
      undefined,
      FILES_BETA
    );
  }

  // GET https://api.anthropic.com/v1/files/{fileId}
  // Docs: https://docs.anthropic.com/en/api
  async function getFilesRetrieve(
    fileId: string,
    signal?: AbortSignal
  ): Promise<AnthropicFile> {
    return await makeGetRequest<AnthropicFile>(
      `/files/${encodeURIComponent(fileId)}`,
      undefined,
      signal,
      undefined,
      FILES_BETA
    );
  }

  // GET https://api.anthropic.com/v1/files/{fileId}/content
  // Docs: https://docs.anthropic.com/en/api
  async function getFilesContent(
    fileId: string,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    return await makeGetBinaryRequest(
      `/files/${encodeURIComponent(fileId)}/content`,
      signal,
      undefined,
      FILES_BETA
    );
  }

  // GET https://api.anthropic.com/v1/skills
  // Docs: https://docs.anthropic.com/en/api
  async function getSkillsList(
    params?: AnthropicSkillsListParams,
    signal?: AbortSignal
  ): Promise<AnthropicSkillsListResponse> {
    const query: Record<string, string | undefined> = {};
    if (params?.limit !== undefined) query.limit = String(params.limit);
    if (params?.page) query.page = params.page;
    if (params?.source) query.source = params.source;
    return await makeGetRequest<AnthropicSkillsListResponse>(
      "/skills",
      query,
      signal,
      undefined,
      SKILLS_BETA
    );
  }

  // GET https://api.anthropic.com/v1/skills/{skillId}
  // Docs: https://docs.anthropic.com/en/api
  async function getSkillsRetrieve(
    skillId: string,
    signal?: AbortSignal
  ): Promise<AnthropicSkill> {
    return await makeGetRequest<AnthropicSkill>(
      `/skills/${encodeURIComponent(skillId)}`,
      undefined,
      signal,
      undefined,
      SKILLS_BETA
    );
  }

  // GET https://api.anthropic.com/v1/skills/{skillId}/versions
  // Docs: https://docs.anthropic.com/en/api
  async function getSkillVersionsList(
    skillId: string,
    params?: AnthropicSkillVersionsListParams,
    signal?: AbortSignal
  ): Promise<AnthropicSkillVersionsListResponse> {
    const query: Record<string, string | undefined> = {};
    if (params?.limit !== undefined) query.limit = String(params.limit);
    if (params?.page) query.page = params.page;
    return await makeGetRequest<AnthropicSkillVersionsListResponse>(
      `/skills/${encodeURIComponent(skillId)}/versions`,
      query,
      signal,
      undefined,
      SKILLS_BETA
    );
  }

  // --- Define DELETE methods ---

  // DELETE https://api.anthropic.com/v1/messages/batches/{batchId}
  // Docs: https://docs.anthropic.com/en/api
  async function deleteBatchesDel(
    batchId: string,
    signal?: AbortSignal
  ): Promise<AnthropicBatchDeleteResponse> {
    return await makeDeleteRequest<AnthropicBatchDeleteResponse>(
      `/messages/batches/${encodeURIComponent(batchId)}`,
      signal
    );
  }

  // DELETE https://api.anthropic.com/v1/files/{fileId}
  // Docs: https://docs.anthropic.com/en/api
  async function deleteFilesDel(
    fileId: string,
    signal?: AbortSignal
  ): Promise<AnthropicFileDeleteResponse> {
    return await makeDeleteRequest<AnthropicFileDeleteResponse>(
      `/files/${encodeURIComponent(fileId)}`,
      signal,
      undefined,
      FILES_BETA
    );
  }

  // DELETE https://api.anthropic.com/v1/skills/{skillId}
  // Docs: https://docs.anthropic.com/en/api
  async function deleteSkillsDel(
    skillId: string,
    signal?: AbortSignal
  ): Promise<AnthropicSkillDeleteResponse> {
    return await makeDeleteRequest<AnthropicSkillDeleteResponse>(
      `/skills/${encodeURIComponent(skillId)}`,
      signal,
      undefined,
      SKILLS_BETA
    );
  }

  // DELETE https://api.anthropic.com/v1/skills/{skillId}/versions/{version}
  // Docs: https://docs.anthropic.com/en/api
  async function deleteSkillVersionsDel(
    skillId: string,
    version: string,
    signal?: AbortSignal
  ): Promise<AnthropicSkillVersionDeleteResponse> {
    return await makeDeleteRequest<AnthropicSkillVersionDeleteResponse>(
      `/skills/${encodeURIComponent(skillId)}/versions/${encodeURIComponent(version)}`,
      signal,
      undefined,
      SKILLS_BETA
    );
  }

  // GET https://api.anthropic.com/api/oauth/usage
  // Docs: https://docs.anthropic.com/en/api
  async function getOauthUsage(
    signal?: AbortSignal
  ): Promise<AnthropicOauthUsageResponse> {
    // Subscription usage lives off the un-versioned root and authenticates with
    // an OAuth bearer token (the same call Claude's usage/limits UI makes),
    // not the x-api-key header the rest of the factory uses.
    return await oauthTransport.getJson<AnthropicOauthUsageResponse>(
      "/api/oauth/usage",
      { signal }
    );
  }

  // --- Build namespaces ---

  const postV1 = {
    messages: postMessages,
    files: postFiles,
    skills: {
      create: postSkillsCreate,
      versions: {
        create: postSkillVersionsCreate,
      },
    },
  };

  const postStreamV1 = {
    messages: postMessagesStream,
  };

  const getV1 = {
    messages: {
      batches: {
        list: getBatchesList,
        retrieve: getBatchesRetrieve,
        results: getBatchesResults,
      },
    },
    models: {
      list: getModelsList,
      retrieve: getModelsRetrieve,
    },
    files: {
      list: getFilesList,
      retrieve: getFilesRetrieve,
      content: getFilesContent,
    },
    skills: {
      list: getSkillsList,
      retrieve: getSkillsRetrieve,
      versions: {
        list: getSkillVersionsList,
      },
    },
  };

  const deleteV1 = {
    messages: {
      batches: {
        del: deleteBatchesDel,
      },
    },
    files: {
      del: deleteFilesDel,
    },
    skills: {
      del: deleteSkillsDel,
      versions: {
        del: deleteSkillVersionsDel,
      },
    },
  };

  // --- Build legacy v1 namespace (URL-mirroring; canonical user-facing) ---

  const legacyV1 = {
    // POST https://api.anthropic.com/v1/messages
    // Docs: https://docs.anthropic.com/en/api
    messages: Object.assign(
      async function messages(
        req: AnthropicMessageRequest,
        signal?: AbortSignal
      ): Promise<AnthropicMessageResponse> {
        return await postMessages(req, signal);
      },
      {
        schema: AnthropicMessageRequestSchema,
        stream: postMessagesStream,
        // POST https://api.anthropic.com/v1/messages/count_tokens
        // Docs: https://docs.anthropic.com/en/api
        countTokens: Object.assign(
          async function countTokens(
            req: AnthropicCountTokensRequest,
            signal?: AbortSignal
          ): Promise<AnthropicCountTokensResponse> {
            return await postMessages.countTokens(req, signal);
          },
          {
            schema: AnthropicCountTokensRequestSchema,
          }
        ),
        // POST https://api.anthropic.com/v1/messages/batches
        // Docs: https://docs.anthropic.com/en/api
        batches: Object.assign(
          async function batches(
            req: AnthropicBatchCreateRequest,
            signal?: AbortSignal
          ): Promise<AnthropicBatch> {
            return await postMessages.batches(req, signal);
          },
          {
            schema: AnthropicBatchCreateRequestSchema,
            list: getBatchesList,
            retrieve: getBatchesRetrieve,
            cancel: postMessages.batches.cancel,
            results: getBatchesResults,
            del: deleteBatchesDel,
          }
        ),
      }
    ),

    models: {
      list: getModelsList,
      retrieve: getModelsRetrieve,
    },

    files: {
      upload: postFiles,
      list: getFilesList,
      retrieve: getFilesRetrieve,
      content: getFilesContent,
      del: deleteFilesDel,
    },

    skills: {
      create: postSkillsCreate,
      list: getSkillsList,
      retrieve: getSkillsRetrieve,
      del: deleteSkillsDel,
      versions: {
        create: postSkillVersionsCreate,
        list: getSkillVersionsList,
        del: deleteSkillVersionsDel,
      },
    },
  };

  // --- Build provider ---

  // Un-versioned subscription surface (mirrors the /api/oauth/* URL path).
  const api = {
    oauth: {
      usage: getOauthUsage,
    },
  };

  return attachExamples({
    post: { v1: postV1, stream: { v1: postStreamV1 } },
    get: { v1: getV1 },
    delete: { v1: deleteV1 },
    v1: legacyV1,
    api,
  });
}
