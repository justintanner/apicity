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
  AnthropicOrganization,
  AnthropicUser,
  AnthropicUserListResponse,
  AnthropicUserUpdateRequest,
  AnthropicUserDeleteResponse,
  AnthropicInvite,
  AnthropicInviteListResponse,
  AnthropicInviteCreateRequest,
  AnthropicInviteDeleteResponse,
  AnthropicWorkspace,
  AnthropicWorkspaceListResponse,
  AnthropicWorkspaceListParams,
  AnthropicWorkspaceCreateRequest,
  AnthropicWorkspaceUpdateRequest,
  AnthropicWorkspaceMember,
  AnthropicWorkspaceMemberListResponse,
  AnthropicWorkspaceMemberAddRequest,
  AnthropicWorkspaceMemberUpdateRequest,
  AnthropicWorkspaceMemberDeleteResponse,
  AnthropicApiKey,
  AnthropicApiKeyListResponse,
  AnthropicApiKeyListParams,
  AnthropicApiKeyUpdateRequest,
  AnthropicListParams,
  AnthropicStreamEvent,
  AnthropicProvider,
  AnthropicError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  messagesSchema,
  countTokensSchema,
  batchesCreateSchema,
  filesUploadSchema,
  inviteCreateSchema,
  workspaceCreateSchema,
  workspaceMemberAddSchema,
} from "./schemas";
import { validatePayload } from "./validate";
import { parseAnthropicStream } from "./sse";

export function anthropic(opts: AnthropicOptions): AnthropicProvider {
  const baseURL = (opts.baseURL ?? "https://api.anthropic.com") + "/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const version = opts.defaultVersion ?? "2023-06-01";
  const defaultBeta = opts.defaultBeta;

  function commonHeaders(
    apiKey: string,
    extra?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
      "anthropic-version": version,
      ...extra,
    };
    if (defaultBeta && defaultBeta.length > 0) {
      headers["anthropic-beta"] = defaultBeta.join(",");
    }
    return headers;
  }

  function makeController(signal?: AbortSignal): {
    controller: AbortController;
    timeoutId: ReturnType<typeof setTimeout>;
  } {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }
    return { controller, timeoutId };
  }

  async function handleError(res: Response): Promise<never> {
    let message = `Anthropic API error: ${res.status}`;
    let body: unknown = null;
    let errorType: string | undefined;
    try {
      body = await res.json();
      if (typeof body === "object" && body !== null && "error" in body) {
        const err = (body as { error: { message?: string; type?: string } })
          .error;
        if (err?.message) {
          message = `Anthropic API error ${res.status}: ${err.message}`;
        }
        errorType = err?.type;
      }
    } catch {
      // ignore parse errors
    }
    throw new AnthropicError(message, res.status, body, errorType);
  }

  // --- Core request methods ---

  async function makeJsonRequest<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: commonHeaders(apiKey ?? opts.apiKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeStreamRequest(
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<Response> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: commonHeaders(opts.apiKey, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ ...body as Record<string, unknown>, stream: true }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeGetRequest<T>(
    path: string,
    query?: Record<string, string | string[] | boolean | undefined>,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);

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
    const url = `${baseURL}${path}${qs ? `?${qs}` : ""}`;

    try {
      const res = await doFetch(url, {
        method: "GET",
        headers: commonHeaders(apiKey ?? opts.apiKey),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeGetBinaryRequest(
    path: string,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<ArrayBuffer> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers: commonHeaders(apiKey ?? opts.apiKey),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeGetTextRequest(
    path: string,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<string> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers: commonHeaders(apiKey ?? opts.apiKey),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return await res.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeDeleteRequest<T>(
    path: string,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "DELETE",
        headers: commonHeaders(apiKey ?? opts.apiKey),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeEmptyPostRequest<T>(
    path: string,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: commonHeaders(apiKey ?? opts.apiKey),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
  }

  async function makeFormRequest<T>(
    path: string,
    form: FormData,
    signal?: AbortSignal,
    apiKey?: string
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: commonHeaders(apiKey ?? opts.apiKey),
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) return await handleError(res);
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof AnthropicError) throw error;
      throw new AnthropicError(`Anthropic request failed: ${error}`, 500);
    }
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

  // Admin API key (falls back to main apiKey)
  const adminKey = opts.adminApiKey ?? opts.apiKey;

  // --- Build provider ---

  return {
    v1: {
      messages: Object.assign(
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
          payloadSchema: messagesSchema,
          validatePayload(data: unknown): ValidationResult {
            return validatePayload(data, messagesSchema);
          },
          stream: async function stream(
            req: AnthropicMessageRequest,
            signal?: AbortSignal
          ): Promise<AsyncIterable<AnthropicStreamEvent>> {
            const res = await makeStreamRequest("/messages", req, signal);
            return parseAnthropicStream(res);
          },
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
              payloadSchema: countTokensSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, countTokensSchema);
              },
            }
          ),
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
              payloadSchema: batchesCreateSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, batchesCreateSchema);
              },
              list: async function list(
                params?: AnthropicListParams,
                signal?: AbortSignal
              ): Promise<AnthropicBatchListResponse> {
                return await makeGetRequest<AnthropicBatchListResponse>(
                  "/messages/batches",
                  listQuery(params),
                  signal
                );
              },
              retrieve: async function retrieve(
                batchId: string,
                signal?: AbortSignal
              ): Promise<AnthropicBatch> {
                return await makeGetRequest<AnthropicBatch>(
                  `/messages/batches/${encodeURIComponent(batchId)}`,
                  undefined,
                  signal
                );
              },
              cancel: async function cancel(
                batchId: string,
                signal?: AbortSignal
              ): Promise<AnthropicBatch> {
                return await makeEmptyPostRequest<AnthropicBatch>(
                  `/messages/batches/${encodeURIComponent(batchId)}/cancel`,
                  signal
                );
              },
              results: async function results(
                batchId: string,
                signal?: AbortSignal
              ): Promise<string> {
                return await makeGetTextRequest(
                  `/messages/batches/${encodeURIComponent(batchId)}/results`,
                  signal
                );
              },
              del: async function del(
                batchId: string,
                signal?: AbortSignal
              ): Promise<AnthropicBatchDeleteResponse> {
                return await makeDeleteRequest<AnthropicBatchDeleteResponse>(
                  `/messages/batches/${encodeURIComponent(batchId)}`,
                  signal
                );
              },
            }
          ),
        }
      ),

      models: {
        list: async function list(
          params?: AnthropicListParams,
          signal?: AbortSignal
        ): Promise<AnthropicModelListResponse> {
          return await makeGetRequest<AnthropicModelListResponse>(
            "/models",
            listQuery(params),
            signal
          );
        },
        retrieve: async function retrieve(
          modelId: string,
          signal?: AbortSignal
        ): Promise<AnthropicModel> {
          return await makeGetRequest<AnthropicModel>(
            `/models/${encodeURIComponent(modelId)}`,
            undefined,
            signal
          );
        },
      },

      files: {
        upload: Object.assign(
          async function upload(
            file: Blob,
            signal?: AbortSignal
          ): Promise<AnthropicFile> {
            const form = new FormData();
            form.append("file", file);
            return await makeFormRequest<AnthropicFile>(
              "/files",
              form,
              signal
            );
          },
          {
            payloadSchema: filesUploadSchema,
          }
        ),
        list: async function list(
          params?: AnthropicListParams,
          signal?: AbortSignal
        ): Promise<AnthropicFileListResponse> {
          return await makeGetRequest<AnthropicFileListResponse>(
            "/files",
            listQuery(params),
            signal
          );
        },
        retrieve: async function retrieve(
          fileId: string,
          signal?: AbortSignal
        ): Promise<AnthropicFile> {
          return await makeGetRequest<AnthropicFile>(
            `/files/${encodeURIComponent(fileId)}`,
            undefined,
            signal
          );
        },
        content: async function content(
          fileId: string,
          signal?: AbortSignal
        ): Promise<ArrayBuffer> {
          return await makeGetBinaryRequest(
            `/files/${encodeURIComponent(fileId)}/content`,
            signal
          );
        },
        del: async function del(
          fileId: string,
          signal?: AbortSignal
        ): Promise<AnthropicFileDeleteResponse> {
          return await makeDeleteRequest<AnthropicFileDeleteResponse>(
            `/files/${encodeURIComponent(fileId)}`,
            signal
          );
        },
      },

      organizations: {
        me: async function me(
          signal?: AbortSignal
        ): Promise<AnthropicOrganization> {
          return await makeGetRequest<AnthropicOrganization>(
            "/organizations/me",
            undefined,
            signal,
            adminKey
          );
        },

        users: {
          list: async function list(
            params?: AnthropicListParams & { email?: string },
            signal?: AbortSignal
          ): Promise<AnthropicUserListResponse> {
            const query: Record<string, string | undefined> = {
              ...listQuery(params),
            };
            if (params?.email) query.email = params.email;
            return await makeGetRequest<AnthropicUserListResponse>(
              "/organizations/users",
              query,
              signal,
              adminKey
            );
          },
          retrieve: async function retrieve(
            userId: string,
            signal?: AbortSignal
          ): Promise<AnthropicUser> {
            return await makeGetRequest<AnthropicUser>(
              `/organizations/users/${encodeURIComponent(userId)}`,
              undefined,
              signal,
              adminKey
            );
          },
          update: async function update(
            userId: string,
            req: AnthropicUserUpdateRequest,
            signal?: AbortSignal
          ): Promise<AnthropicUser> {
            return await makeJsonRequest<AnthropicUser>(
              `/organizations/users/${encodeURIComponent(userId)}`,
              req,
              signal,
              adminKey
            );
          },
          del: async function del(
            userId: string,
            signal?: AbortSignal
          ): Promise<AnthropicUserDeleteResponse> {
            return await makeDeleteRequest<AnthropicUserDeleteResponse>(
              `/organizations/users/${encodeURIComponent(userId)}`,
              signal,
              adminKey
            );
          },
        },

        invites: {
          create: Object.assign(
            async function create(
              req: AnthropicInviteCreateRequest,
              signal?: AbortSignal
            ): Promise<AnthropicInvite> {
              return await makeJsonRequest<AnthropicInvite>(
                "/organizations/invites",
                req,
                signal,
                adminKey
              );
            },
            {
              payloadSchema: inviteCreateSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, inviteCreateSchema);
              },
            }
          ),
          list: async function list(
            params?: AnthropicListParams,
            signal?: AbortSignal
          ): Promise<AnthropicInviteListResponse> {
            return await makeGetRequest<AnthropicInviteListResponse>(
              "/organizations/invites",
              listQuery(params),
              signal,
              adminKey
            );
          },
          retrieve: async function retrieve(
            inviteId: string,
            signal?: AbortSignal
          ): Promise<AnthropicInvite> {
            return await makeGetRequest<AnthropicInvite>(
              `/organizations/invites/${encodeURIComponent(inviteId)}`,
              undefined,
              signal,
              adminKey
            );
          },
          del: async function del(
            inviteId: string,
            signal?: AbortSignal
          ): Promise<AnthropicInviteDeleteResponse> {
            return await makeDeleteRequest<AnthropicInviteDeleteResponse>(
              `/organizations/invites/${encodeURIComponent(inviteId)}`,
              signal,
              adminKey
            );
          },
        },

        workspaces: {
          create: Object.assign(
            async function create(
              req: AnthropicWorkspaceCreateRequest,
              signal?: AbortSignal
            ): Promise<AnthropicWorkspace> {
              return await makeJsonRequest<AnthropicWorkspace>(
                "/organizations/workspaces",
                req,
                signal,
                adminKey
              );
            },
            {
              payloadSchema: workspaceCreateSchema,
              validatePayload(data: unknown): ValidationResult {
                return validatePayload(data, workspaceCreateSchema);
              },
            }
          ),
          list: async function list(
            params?: AnthropicWorkspaceListParams,
            signal?: AbortSignal
          ): Promise<AnthropicWorkspaceListResponse> {
            const query: Record<string, string | undefined> = {
              ...listQuery(params),
            };
            if (params?.include_archived !== undefined) {
              query.include_archived = String(params.include_archived);
            }
            return await makeGetRequest<AnthropicWorkspaceListResponse>(
              "/organizations/workspaces",
              query,
              signal,
              adminKey
            );
          },
          retrieve: async function retrieve(
            workspaceId: string,
            signal?: AbortSignal
          ): Promise<AnthropicWorkspace> {
            return await makeGetRequest<AnthropicWorkspace>(
              `/organizations/workspaces/${encodeURIComponent(workspaceId)}`,
              undefined,
              signal,
              adminKey
            );
          },
          update: async function update(
            workspaceId: string,
            req: AnthropicWorkspaceUpdateRequest,
            signal?: AbortSignal
          ): Promise<AnthropicWorkspace> {
            return await makeJsonRequest<AnthropicWorkspace>(
              `/organizations/workspaces/${encodeURIComponent(workspaceId)}`,
              req,
              signal,
              adminKey
            );
          },
          archive: async function archive(
            workspaceId: string,
            signal?: AbortSignal
          ): Promise<AnthropicWorkspace> {
            return await makeEmptyPostRequest<AnthropicWorkspace>(
              `/organizations/workspaces/${encodeURIComponent(workspaceId)}/archive`,
              signal,
              adminKey
            );
          },
          members: {
            add: Object.assign(
              async function add(
                workspaceId: string,
                req: AnthropicWorkspaceMemberAddRequest,
                signal?: AbortSignal
              ): Promise<AnthropicWorkspaceMember> {
                return await makeJsonRequest<AnthropicWorkspaceMember>(
                  `/organizations/workspaces/${encodeURIComponent(workspaceId)}/members`,
                  req,
                  signal,
                  adminKey
                );
              },
              {
                payloadSchema: workspaceMemberAddSchema,
                validatePayload(data: unknown): ValidationResult {
                  return validatePayload(data, workspaceMemberAddSchema);
                },
              }
            ),
            list: async function list(
              workspaceId: string,
              params?: AnthropicListParams,
              signal?: AbortSignal
            ): Promise<AnthropicWorkspaceMemberListResponse> {
              return await makeGetRequest<AnthropicWorkspaceMemberListResponse>(
                `/organizations/workspaces/${encodeURIComponent(workspaceId)}/members`,
                listQuery(params),
                signal,
                adminKey
              );
            },
            retrieve: async function retrieve(
              workspaceId: string,
              userId: string,
              signal?: AbortSignal
            ): Promise<AnthropicWorkspaceMember> {
              return await makeGetRequest<AnthropicWorkspaceMember>(
                `/organizations/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
                undefined,
                signal,
                adminKey
              );
            },
            update: async function update(
              workspaceId: string,
              userId: string,
              req: AnthropicWorkspaceMemberUpdateRequest,
              signal?: AbortSignal
            ): Promise<AnthropicWorkspaceMember> {
              return await makeJsonRequest<AnthropicWorkspaceMember>(
                `/organizations/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
                req,
                signal,
                adminKey
              );
            },
            del: async function del(
              workspaceId: string,
              userId: string,
              signal?: AbortSignal
            ): Promise<AnthropicWorkspaceMemberDeleteResponse> {
              return await makeDeleteRequest<AnthropicWorkspaceMemberDeleteResponse>(
                `/organizations/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
                signal,
                adminKey
              );
            },
          },
        },

        api_keys: {
          list: async function list(
            params?: AnthropicApiKeyListParams,
            signal?: AbortSignal
          ): Promise<AnthropicApiKeyListResponse> {
            const query: Record<string, string | undefined> = {
              ...listQuery(params),
            };
            if (params?.status) query.status = params.status;
            if (params?.workspace_id)
              query.workspace_id = params.workspace_id;
            if (params?.created_by_user_id)
              query.created_by_user_id = params.created_by_user_id;
            return await makeGetRequest<AnthropicApiKeyListResponse>(
              "/organizations/api_keys",
              query,
              signal,
              adminKey
            );
          },
          retrieve: async function retrieve(
            apiKeyId: string,
            signal?: AbortSignal
          ): Promise<AnthropicApiKey> {
            return await makeGetRequest<AnthropicApiKey>(
              `/organizations/api_keys/${encodeURIComponent(apiKeyId)}`,
              undefined,
              signal,
              adminKey
            );
          },
          update: async function update(
            apiKeyId: string,
            req: AnthropicApiKeyUpdateRequest,
            signal?: AbortSignal
          ): Promise<AnthropicApiKey> {
            return await makeJsonRequest<AnthropicApiKey>(
              `/organizations/api_keys/${encodeURIComponent(apiKeyId)}`,
              req,
              signal,
              adminKey
            );
          },
        },
      },
    },
  };
}
