import {
  ElevenLabsAddPronunciationDictionaryFromFileRequest,
  ElevenLabsAddPronunciationDictionaryFromRulesRequest,
  ElevenLabsAddPronunciationDictionaryResponse,
  ElevenLabsAddPronunciationDictionaryRulesRequest,
  ElevenLabsDownloadPronunciationDictionaryRequest,
  ElevenLabsGetPronunciationDictionaryRequest,
  ElevenLabsGetPronunciationDictionaryResponse,
  ElevenLabsListPronunciationDictionariesRequest,
  ElevenLabsListPronunciationDictionariesResponse,
  ElevenLabsPronunciationDictionaryMetadata,
  ElevenLabsPronunciationDictionaryRulesResponse,
  ElevenLabsRemovePronunciationDictionaryRulesRequest,
  ElevenLabsSetPronunciationDictionaryRulesRequest,
  ElevenLabsUpdatePronunciationDictionaryRequest,
} from "./types";
import {
  ElevenLabsAddPronunciationDictionaryFromFileRequestSchema,
  ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema,
  ElevenLabsAddPronunciationDictionaryRulesRequestSchema,
  ElevenLabsDownloadPronunciationDictionaryRequestSchema,
  ElevenLabsGetPronunciationDictionaryRequestSchema,
  ElevenLabsListPronunciationDictionariesRequestSchema,
  ElevenLabsRemovePronunciationDictionaryRulesRequestSchema,
  ElevenLabsSetPronunciationDictionaryRulesRequestSchema,
  ElevenLabsUpdatePronunciationDictionaryRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createPronunciationDictionariesEndpoints(
  ctx: ElevenLabsContext
) {
  const {
    makeGetBinaryRequest,
    makeJsonRequest,
    makeMultipartJsonRequest,
    appendFormField,
    buildQueryString,
  } = ctx;

  // GET https://api.elevenlabs.io/v1/pronunciation-dictionaries
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/list
  const listPronunciationDictionaries = Object.assign(
    async (
      req: ElevenLabsListPronunciationDictionariesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListPronunciationDictionariesResponse> => {
      return makeJsonRequest<ElevenLabsListPronunciationDictionariesResponse>(
        "GET",
        "/v1/pronunciation-dictionaries",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListPronunciationDictionariesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-file
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-file
  const addPronunciationDictionaryFromFile = Object.assign(
    async (
      req: ElevenLabsAddPronunciationDictionaryFromFileRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPronunciationDictionaryResponse> => {
      const form = new FormData();
      appendFormField(form, "name", req.name);
      if (req.file) appendFormField(form, "file", req.file);
      if (req.description)
        appendFormField(form, "description", req.description);
      if (req.workspace_access)
        appendFormField(form, "workspace_access", req.workspace_access);

      return makeMultipartJsonRequest<ElevenLabsAddPronunciationDictionaryResponse>(
        "/v1/pronunciation-dictionaries/add-from-file",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAddPronunciationDictionaryFromFileRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/add-from-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/create-from-rules
  const addPronunciationDictionaryFromRules = Object.assign(
    async (
      req: ElevenLabsAddPronunciationDictionaryFromRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPronunciationDictionaryResponse> => {
      return makeJsonRequest<ElevenLabsAddPronunciationDictionaryResponse>(
        "POST",
        "/v1/pronunciation-dictionaries/add-from-rules",
        req,
        signal
      );
    },
    { schema: ElevenLabsAddPronunciationDictionaryFromRulesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/get
  const getPronunciationDictionary = Object.assign(
    async (
      id: string,
      req: ElevenLabsGetPronunciationDictionaryRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPronunciationDictionaryResponse> => {
      return makeJsonRequest<ElevenLabsGetPronunciationDictionaryResponse>(
        "GET",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetPronunciationDictionaryRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/update
  const updatePronunciationDictionary = Object.assign(
    async (
      id: string,
      req: ElevenLabsUpdatePronunciationDictionaryRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryMetadata> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryMetadata>(
        "PATCH",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePronunciationDictionaryRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/add-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/add
  const addPronunciationDictionaryRules = Object.assign(
    async (
      id: string,
      req: ElevenLabsAddPronunciationDictionaryRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryRulesResponse> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryRulesResponse>(
        "POST",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/add-rules`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAddPronunciationDictionaryRulesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/remove-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/remove
  const removePronunciationDictionaryRules = Object.assign(
    async (
      id: string,
      req: ElevenLabsRemovePronunciationDictionaryRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryRulesResponse> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryRulesResponse>(
        "POST",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/remove-rules`,
        req,
        signal
      );
    },
    { schema: ElevenLabsRemovePronunciationDictionaryRulesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/set-rules
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/rules/set
  const setPronunciationDictionaryRules = Object.assign(
    async (
      id: string,
      req: ElevenLabsSetPronunciationDictionaryRulesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPronunciationDictionaryRulesResponse> => {
      return makeJsonRequest<ElevenLabsPronunciationDictionaryRulesResponse>(
        "POST",
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/set-rules`,
        req,
        signal
      );
    },
    { schema: ElevenLabsSetPronunciationDictionaryRulesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/pronunciation-dictionaries/{id}/{versionId}/download
  // Docs: https://elevenlabs.io/docs/api-reference/pronunciation-dictionaries/download
  const downloadPronunciationDictionary = Object.assign(
    async (
      id: string,
      versionId: string,
      req: ElevenLabsDownloadPronunciationDictionaryRequest = {},
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/pronunciation-dictionaries/${encodeURIComponent(id)}/${encodeURIComponent(versionId)}/download`,
        buildQueryString(req),
        signal
      );
    },
    { schema: ElevenLabsDownloadPronunciationDictionaryRequestSchema }
  );

  // -- Endpoints -------------------------------------------------------------

  const pronunciationDictionaries = {
    list: listPronunciationDictionaries,
    addFromFile: addPronunciationDictionaryFromFile,
    addFromRules: addPronunciationDictionaryFromRules,
    get: getPronunciationDictionary,
    update: updatePronunciationDictionary,
    addRules: addPronunciationDictionaryRules,
    removeRules: removePronunciationDictionaryRules,
    setRules: setPronunciationDictionaryRules,
    download: downloadPronunciationDictionary,
  };

  return {
    v1: { pronunciationDictionaries },
    get: {
      v1: {
        pronunciationDictionaries: {
          list: listPronunciationDictionaries,
          get: getPronunciationDictionary,
          download: downloadPronunciationDictionary,
        },
      },
    },
    post: {
      v1: {
        pronunciationDictionaries: {
          addFromFile: addPronunciationDictionaryFromFile,
          addFromRules: addPronunciationDictionaryFromRules,
          addRules: addPronunciationDictionaryRules,
          removeRules: removePronunciationDictionaryRules,
          setRules: setPronunciationDictionaryRules,
        },
      },
    },
    patch: {
      v1: {
        pronunciationDictionaries: { update: updatePronunciationDictionary },
      },
    },
  };
}
