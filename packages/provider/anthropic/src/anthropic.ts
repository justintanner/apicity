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
  skillsCreateSchema,
  skillVersionsCreateSchema,
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
        body: JSON.stringify({
          ...(body as Record<string, unknown>),
          stream: true,
        }),
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
    apiKey?: string,
    beta?: string[]
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
        headers: commonHeaders(apiKey ?? opts.apiKey, undefined, beta),
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
    apiKey?: string,
    beta?: string[]
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "DELETE",
        headers: commonHeaders(apiKey ?? opts.apiKey, undefined, beta),
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
    apiKey?: string,
    beta?: string[]
  ): Promise<T> {
    const { controller, timeoutId } = makeController(signal);
    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: commonHeaders(apiKey ?? opts.apiKey, undefined, beta),
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

  // Skills beta flag
  const SKILLS_BETA = ["skills-2025-10-02"];

  // --- Define POST methods ---

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
      payloadSchema: messagesSchema,
      validatePayload(data: unknown): ValidationResult {
        return validatePayload(data, messagesSchema);
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

  const postFiles = Object.assign(
    async function upload(
      file: Blob,
      signal?: AbortSignal
    ): Promise<AnthropicFile> {
      const form = new FormData();
      form.append("file", file);
      return await makeFormRequest<AnthropicFile>("/files", form, signal);
    },
    {
      payloadSchema: filesUploadSchema,
    }
  );

  // POST stream namespace methods
  const postMessagesStream = Object.assign(
    async function stream(
      req: AnthropicMessageRequest,
      signal?: AbortSignal
    ): Promise<AsyncIterable<AnthropicStreamEvent>> {
      const res = await makeStreamRequest("/messages", req, signal);
      return parseAnthropicStream(res);
    },
    {
      payloadSchema: messagesSchema,
      validatePayload(data: unknown): ValidationResult {
        return validatePayload(data, messagesSchema);
      },
    }
  );

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
      payloadSchema: skillsCreateSchema,
    }
  );

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
      payloadSchema: skillVersionsCreateSchema,
    }
  );

  const postInvitesCreate = Object.assign(
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
  );

  const postWorkspacesCreate = Object.assign(
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
  );

  const postWorkspaceMembersAdd = Object.assign(
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
  );

  async function postApiKeysUpdate(
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
  }

  async function postUsersUpdate(
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
  }

  async function postWorkspacesUpdate(
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
  }

  async function postWorkspacesArchive(
    workspaceId: string,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspace> {
    return await makeEmptyPostRequest<AnthropicWorkspace>(
      `/organizations/workspaces/${encodeURIComponent(workspaceId)}/archive`,
      signal,
      adminKey
    );
  }

  async function postWorkspaceMembersUpdate(
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
  }

  // --- Define GET methods ---

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

  async function getBatchesResults(
    batchId: string,
    signal?: AbortSignal
  ): Promise<string> {
    return await makeGetTextRequest(
      `/messages/batches/${encodeURIComponent(batchId)}/results`,
      signal
    );
  }

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

  async function getFilesList(
    params?: AnthropicListParams,
    signal?: AbortSignal
  ): Promise<AnthropicFileListResponse> {
    return await makeGetRequest<AnthropicFileListResponse>(
      "/files",
      listQuery(params),
      signal
    );
  }

  async function getFilesRetrieve(
    fileId: string,
    signal?: AbortSignal
  ): Promise<AnthropicFile> {
    return await makeGetRequest<AnthropicFile>(
      `/files/${encodeURIComponent(fileId)}`,
      undefined,
      signal
    );
  }

  async function getFilesContent(
    fileId: string,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    return await makeGetBinaryRequest(
      `/files/${encodeURIComponent(fileId)}/content`,
      signal
    );
  }

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

  async function getOrganizationsMe(
    signal?: AbortSignal
  ): Promise<AnthropicOrganization> {
    return await makeGetRequest<AnthropicOrganization>(
      "/organizations/me",
      undefined,
      signal,
      adminKey
    );
  }

  async function getUsersList(
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
  }

  async function getUsersRetrieve(
    userId: string,
    signal?: AbortSignal
  ): Promise<AnthropicUser> {
    return await makeGetRequest<AnthropicUser>(
      `/organizations/users/${encodeURIComponent(userId)}`,
      undefined,
      signal,
      adminKey
    );
  }

  async function getInvitesList(
    params?: AnthropicListParams,
    signal?: AbortSignal
  ): Promise<AnthropicInviteListResponse> {
    return await makeGetRequest<AnthropicInviteListResponse>(
      "/organizations/invites",
      listQuery(params),
      signal,
      adminKey
    );
  }

  async function getInvitesRetrieve(
    inviteId: string,
    signal?: AbortSignal
  ): Promise<AnthropicInvite> {
    return await makeGetRequest<AnthropicInvite>(
      `/organizations/invites/${encodeURIComponent(inviteId)}`,
      undefined,
      signal,
      adminKey
    );
  }

  async function getWorkspacesList(
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
  }

  async function getWorkspacesRetrieve(
    workspaceId: string,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspace> {
    return await makeGetRequest<AnthropicWorkspace>(
      `/organizations/workspaces/${encodeURIComponent(workspaceId)}`,
      undefined,
      signal,
      adminKey
    );
  }

  async function getWorkspaceMembersList(
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
  }

  async function getWorkspaceMembersRetrieve(
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
  }

  async function getApiKeysList(
    params?: AnthropicApiKeyListParams,
    signal?: AbortSignal
  ): Promise<AnthropicApiKeyListResponse> {
    const query: Record<string, string | undefined> = {
      ...listQuery(params),
    };
    if (params?.status) query.status = params.status;
    if (params?.workspace_id) query.workspace_id = params.workspace_id;
    if (params?.created_by_user_id)
      query.created_by_user_id = params.created_by_user_id;
    return await makeGetRequest<AnthropicApiKeyListResponse>(
      "/organizations/api_keys",
      query,
      signal,
      adminKey
    );
  }

  async function getApiKeysRetrieve(
    apiKeyId: string,
    signal?: AbortSignal
  ): Promise<AnthropicApiKey> {
    return await makeGetRequest<AnthropicApiKey>(
      `/organizations/api_keys/${encodeURIComponent(apiKeyId)}`,
      undefined,
      signal,
      adminKey
    );
  }

  // --- Define DELETE methods ---

  async function deleteBatchesDel(
    batchId: string,
    signal?: AbortSignal
  ): Promise<AnthropicBatchDeleteResponse> {
    return await makeDeleteRequest<AnthropicBatchDeleteResponse>(
      `/messages/batches/${encodeURIComponent(batchId)}`,
      signal
    );
  }

  async function deleteFilesDel(
    fileId: string,
    signal?: AbortSignal
  ): Promise<AnthropicFileDeleteResponse> {
    return await makeDeleteRequest<AnthropicFileDeleteResponse>(
      `/files/${encodeURIComponent(fileId)}`,
      signal
    );
  }

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

  async function deleteUsersDel(
    userId: string,
    signal?: AbortSignal
  ): Promise<AnthropicUserDeleteResponse> {
    return await makeDeleteRequest<AnthropicUserDeleteResponse>(
      `/organizations/users/${encodeURIComponent(userId)}`,
      signal,
      adminKey
    );
  }

  async function deleteInvitesDel(
    inviteId: string,
    signal?: AbortSignal
  ): Promise<AnthropicInviteDeleteResponse> {
    return await makeDeleteRequest<AnthropicInviteDeleteResponse>(
      `/organizations/invites/${encodeURIComponent(inviteId)}`,
      signal,
      adminKey
    );
  }

  async function deleteWorkspaceMembersDel(
    workspaceId: string,
    userId: string,
    signal?: AbortSignal
  ): Promise<AnthropicWorkspaceMemberDeleteResponse> {
    return await makeDeleteRequest<AnthropicWorkspaceMemberDeleteResponse>(
      `/organizations/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
      signal,
      adminKey
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
    organizations: {
      invites: {
        create: postInvitesCreate,
      },
      users: {
        update: postUsersUpdate,
      },
      workspaces: {
        create: postWorkspacesCreate,
        update: postWorkspacesUpdate,
        archive: postWorkspacesArchive,
        members: {
          add: postWorkspaceMembersAdd,
          update: postWorkspaceMembersUpdate,
        },
      },
      apiKeys: {
        update: postApiKeysUpdate,
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
    organizations: {
      me: getOrganizationsMe,
      users: {
        list: getUsersList,
        retrieve: getUsersRetrieve,
      },
      invites: {
        list: getInvitesList,
        retrieve: getInvitesRetrieve,
      },
      workspaces: {
        list: getWorkspacesList,
        retrieve: getWorkspacesRetrieve,
        members: {
          list: getWorkspaceMembersList,
          retrieve: getWorkspaceMembersRetrieve,
        },
      },
      apiKeys: {
        list: getApiKeysList,
        retrieve: getApiKeysRetrieve,
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
    organizations: {
      users: {
        del: deleteUsersDel,
      },
      invites: {
        del: deleteInvitesDel,
      },
      workspaces: {
        members: {
          del: deleteWorkspaceMembersDel,
        },
      },
    },
  };

  // --- Build legacy v1 namespace (backward compatibility) ---

  const legacyV1 = {
    messages: Object.assign(
      async function messages(
        req: AnthropicMessageRequest,
        signal?: AbortSignal
      ): Promise<AnthropicMessageResponse> {
        return await postMessages(req, signal);
      },
      {
        payloadSchema: messagesSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, messagesSchema);
        },
        stream: postMessagesStream,
        countTokens: Object.assign(
          async function countTokens(
            req: AnthropicCountTokensRequest,
            signal?: AbortSignal
          ): Promise<AnthropicCountTokensResponse> {
            return await postMessages.countTokens(req, signal);
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
            return await postMessages.batches(req, signal);
          },
          {
            payloadSchema: batchesCreateSchema,
            validatePayload(data: unknown): ValidationResult {
              return validatePayload(data, batchesCreateSchema);
            },
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

    organizations: {
      me: getOrganizationsMe,

      users: {
        list: getUsersList,
        retrieve: getUsersRetrieve,
        update: postUsersUpdate,
        del: deleteUsersDel,
      },

      invites: {
        create: postInvitesCreate,
        list: getInvitesList,
        retrieve: getInvitesRetrieve,
        del: deleteInvitesDel,
      },

      workspaces: {
        create: postWorkspacesCreate,
        list: getWorkspacesList,
        retrieve: getWorkspacesRetrieve,
        update: postWorkspacesUpdate,
        archive: postWorkspacesArchive,
        members: {
          add: postWorkspaceMembersAdd,
          list: getWorkspaceMembersList,
          retrieve: getWorkspaceMembersRetrieve,
          update: postWorkspaceMembersUpdate,
          del: deleteWorkspaceMembersDel,
        },
      },

      api_keys: {
        list: getApiKeysList,
        retrieve: getApiKeysRetrieve,
        update: postApiKeysUpdate,
      },
    },
  };

  // --- Build provider ---

  return {
    post: { v1: postV1, stream: { v1: postStreamV1 } },
    get: { v1: getV1 },
    delete: { v1: deleteV1 },
    v1: legacyV1,
  };
}
