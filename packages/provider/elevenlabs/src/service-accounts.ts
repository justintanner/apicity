import {
  ElevenLabsCreateServiceAccountApiKeyRequest,
  ElevenLabsCreateServiceAccountApiKeyResponse,
  ElevenLabsDeleteServiceAccountApiKeyResponse,
  ElevenLabsServiceAccountApiKeysResponse,
  ElevenLabsServiceAccountsResponse,
  ElevenLabsUpdateServiceAccountApiKeyRequest,
  ElevenLabsUpdateServiceAccountApiKeyResponse,
} from "./types";
import {
  ElevenLabsCreateServiceAccountApiKeyRequestSchema,
  ElevenLabsUpdateServiceAccountApiKeyRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createServiceAccountsEndpoints(ctx: ElevenLabsContext) {
  const { makeJsonRequest, makeJsonRequestAllowEmpty } = ctx;

  // GET https://api.elevenlabs.io/v1/service-accounts
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/list
  const listServiceAccounts = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsServiceAccountsResponse> => {
      return makeJsonRequest<ElevenLabsServiceAccountsResponse>(
        "GET",
        "/v1/service-accounts",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/list
  const listServiceAccountApiKeys = Object.assign(
    async (
      serviceAccountUserId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsServiceAccountApiKeysResponse> => {
      return makeJsonRequest<ElevenLabsServiceAccountApiKeysResponse>(
        "GET",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/create
  const createServiceAccountApiKey = Object.assign(
    async (
      serviceAccountUserId: string,
      req: ElevenLabsCreateServiceAccountApiKeyRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateServiceAccountApiKeyResponse> => {
      return makeJsonRequest<ElevenLabsCreateServiceAccountApiKeyResponse>(
        "POST",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys`,
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateServiceAccountApiKeyRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys/{apiKeyId}
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/update
  const updateServiceAccountApiKey = Object.assign(
    async (
      serviceAccountUserId: string,
      apiKeyId: string,
      req: ElevenLabsUpdateServiceAccountApiKeyRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdateServiceAccountApiKeyResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsUpdateServiceAccountApiKeyResponse>(
        "PATCH",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys/${encodeURIComponent(apiKeyId)}`,
        Object.keys(req).length > 0 ? req : undefined,
        signal
      );
    },
    { schema: ElevenLabsUpdateServiceAccountApiKeyRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/service-accounts/{serviceAccountUserId}/api-keys/{apiKeyId}
  // Docs: https://elevenlabs.io/docs/api-reference/service-accounts/api-keys/delete
  const deleteServiceAccountApiKey = Object.assign(
    async (
      serviceAccountUserId: string,
      apiKeyId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteServiceAccountApiKeyResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteServiceAccountApiKeyResponse>(
        "DELETE",
        `/v1/service-accounts/${encodeURIComponent(serviceAccountUserId)}/api-keys/${encodeURIComponent(apiKeyId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const serviceAccountApiKeys = {
    list: listServiceAccountApiKeys,
    create: createServiceAccountApiKey,
    update: updateServiceAccountApiKey,
    delete: deleteServiceAccountApiKey,
  };
  const serviceAccounts = {
    list: listServiceAccounts,
    apiKeys: serviceAccountApiKeys,
  };
  const postServiceAccounts = {
    apiKeys: {
      create: createServiceAccountApiKey,
    },
  };
  const patchServiceAccounts = {
    apiKeys: {
      update: updateServiceAccountApiKey,
    },
  };
  const deleteServiceAccounts = {
    apiKeys: {
      delete: deleteServiceAccountApiKey,
    },
  };

  return {
    v1: { serviceAccounts },
    get: {
      v1: {
        serviceAccounts: {
          list: listServiceAccounts,
          apiKeys: { list: listServiceAccountApiKeys },
        },
      },
    },
    post: { v1: { serviceAccounts: postServiceAccounts } },
    patch: { v1: { serviceAccounts: patchServiceAccounts } },
    delete: { v1: { serviceAccounts: deleteServiceAccounts } },
  };
}
