import { attachExamples } from "./example";
import { DropboxError } from "./types";
import type {
  DropboxCheckUserRequest,
  DropboxCheckUserResponse,
  DropboxFilesCreateFolderV2Request,
  DropboxFilesCreateFolderV2Response,
  DropboxFilesDeleteV2Request,
  DropboxFilesDeleteV2Response,
  DropboxFilesDownloadRequest,
  DropboxFilesDownloadResponse,
  DropboxFilesGetMetadataRequest,
  DropboxFilesListFolderContinueRequest,
  DropboxFilesListFolderRequest,
  DropboxFilesListFolderResponse,
  DropboxFilesRelocationRequest,
  DropboxFilesRelocationResponse,
  DropboxFilesUploadRequest,
  DropboxFileMetadata,
  DropboxMetadata,
  DropboxOptions,
  DropboxProvider,
  DropboxSharingCreateSharedLinkWithSettingsRequest,
  DropboxSharingListSharedLinksRequest,
  DropboxSharingListSharedLinksResponse,
  DropboxSharingSharedLinkMetadata,
  DropboxUsersGetCurrentAccountResponse,
} from "./types";
import {
  DropboxCheckUserRequestSchema,
  DropboxFilesCreateFolderV2RequestSchema,
  DropboxFilesDeleteV2RequestSchema,
  DropboxFilesDownloadRequestSchema,
  DropboxFilesGetMetadataRequestSchema,
  DropboxFilesListFolderContinueRequestSchema,
  DropboxFilesListFolderRequestSchema,
  DropboxFilesRelocationRequestSchema,
  DropboxFilesUploadRequestSchema,
  DropboxSharingCreateSharedLinkWithSettingsRequestSchema,
  DropboxSharingListSharedLinksRequestSchema,
} from "./zod";

interface DropboxErrorDetails {
  errorSummary?: string;
  error?: unknown;
}

type JsonBody = unknown;

export function createDropbox(opts: DropboxOptions = {}): DropboxProvider {
  const baseURL = (opts.apiBaseURL ?? "https://api.dropboxapi.com/2").replace(
    /\/+$/,
    ""
  );
  const uploadBaseURL = (
    opts.contentBaseURL ?? "https://content.dropboxapi.com/2"
  ).replace(/\/+$/, "");
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  function oauthToken(): string {
    const token = opts.oauthToken ?? process.env.DROPBOX_OAUTH_TOKEN;
    if (!token) {
      throw new DropboxError(
        "Dropbox OAuth token is required. Pass oauthToken or set DROPBOX_OAUTH_TOKEN.",
        401
      );
    }
    return token;
  }

  function authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${oauthToken()}`,
    };
  }

  function errorDetails(body: unknown): DropboxErrorDetails {
    if (body === null || typeof body !== "object") return {};
    const record = body as Record<string, unknown>;
    return {
      errorSummary:
        typeof record.error_summary === "string"
          ? record.error_summary
          : undefined,
      error: record.error,
    };
  }

  function errorMessage(status: number, body: unknown): string {
    const { errorSummary } = errorDetails(body);
    if (errorSummary) return `Dropbox API error ${status}: ${errorSummary}`;
    if (typeof body === "string" && body.length > 0) {
      return `Dropbox API error ${status}: ${body}`;
    }
    return `Dropbox API error: ${status}`;
  }

  async function parseBody(res: Response): Promise<unknown> {
    const text = await res.text();
    if (text.length === 0) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async function throwDropboxError(res: Response): Promise<never> {
    const body = await parseBody(res);
    const { errorSummary, error } = errorDetails(body);
    throw new DropboxError(
      errorMessage(res.status, body),
      res.status,
      body,
      errorSummary,
      error
    );
  }

  async function makeJsonRequest<T>(
    method: "POST",
    path: string,
    body: JsonBody,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method,
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) await throwDropboxError(res);
      return (await parseBody(res)) as T;
    } catch (error) {
      if (error instanceof DropboxError) throw error;
      throw new DropboxError(`Dropbox request failed: ${error}`, 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function makeUploadRequest<T>(
    path: string,
    req: DropboxFilesUploadRequest,
    signal?: AbortSignal,
    options: { baseOverride: string } = { baseOverride: uploadBaseURL }
  ): Promise<T> {
    const { contents, ...arg } = req;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(`${options.baseOverride}${path}`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify(arg),
        },
        body: contents,
        signal: controller.signal,
      });

      if (!res.ok) await throwDropboxError(res);
      return (await parseBody(res)) as T;
    } catch (error) {
      if (error instanceof DropboxError) throw error;
      throw new DropboxError(`Dropbox request failed: ${error}`, 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function parseDropboxApiResult(header: string | null): DropboxFileMetadata {
    if (!header) {
      throw new DropboxError(
        "Dropbox download response is missing Dropbox-API-Result.",
        500
      );
    }
    try {
      return JSON.parse(header) as DropboxFileMetadata;
    } catch (error) {
      throw new DropboxError(
        `Dropbox download metadata parse failed: ${error}`,
        500,
        header
      );
    }
  }

  async function makeBinaryRequest(
    path: string,
    req: DropboxFilesDownloadRequest,
    signal?: AbortSignal,
    options: { baseOverride: string } = { baseOverride: uploadBaseURL }
  ): Promise<DropboxFilesDownloadResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) attachAbortHandler(signal, controller);

    try {
      const res = await doFetch(`${options.baseOverride}${path}`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Dropbox-API-Arg": JSON.stringify(req),
        },
        signal: controller.signal,
      });

      if (!res.ok) await throwDropboxError(res);

      const metadata = parseDropboxApiResult(
        res.headers.get("Dropbox-API-Result")
      );
      const content = await res.arrayBuffer();
      const contentType = res.headers.get("Content-Type") ?? undefined;

      return {
        metadata,
        content,
        contentType,
        headers: res.headers,
        text: () => new TextDecoder().decode(content),
        bytes: () => new Uint8Array(content.slice(0)),
      };
    } catch (error) {
      if (error instanceof DropboxError) throw error;
      throw new DropboxError(`Dropbox request failed: ${error}`, 500);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/check/user
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#check-user
  const checkUser = Object.assign(
    async (
      req: DropboxCheckUserRequest,
      signal?: AbortSignal
    ): Promise<DropboxCheckUserResponse> => {
      return makeJsonRequest<DropboxCheckUserResponse>(
        "POST",
        "/check/user",
        req,
        signal
      );
    },
    { schema: DropboxCheckUserRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/users/get_current_account
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#users-get_current_account
  const getCurrentAccount = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<DropboxUsersGetCurrentAccountResponse> => {
      return makeJsonRequest<DropboxUsersGetCurrentAccountResponse>(
        "POST",
        "/users/get_current_account",
        null,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/list_folder
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder
  const listFolder = Object.assign(
    async (
      req: DropboxFilesListFolderRequest,
      signal?: AbortSignal
    ): Promise<DropboxFilesListFolderResponse> => {
      return makeJsonRequest<DropboxFilesListFolderResponse>(
        "POST",
        "/files/list_folder",
        req,
        signal
      );
    },
    { schema: DropboxFilesListFolderRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/list_folder/continue
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder-continue
  const listFolderContinue = Object.assign(
    async (
      req: DropboxFilesListFolderContinueRequest,
      signal?: AbortSignal
    ): Promise<DropboxFilesListFolderResponse> => {
      return makeJsonRequest<DropboxFilesListFolderResponse>(
        "POST",
        "/files/list_folder/continue",
        req,
        signal
      );
    },
    { schema: DropboxFilesListFolderContinueRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/get_metadata
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-get_metadata
  const getMetadata = Object.assign(
    async (
      req: DropboxFilesGetMetadataRequest,
      signal?: AbortSignal
    ): Promise<DropboxMetadata> => {
      return makeJsonRequest<DropboxMetadata>(
        "POST",
        "/files/get_metadata",
        req,
        signal
      );
    },
    { schema: DropboxFilesGetMetadataRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/create_folder_v2
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-create_folder_v2
  const createFolderV2 = Object.assign(
    async (
      req: DropboxFilesCreateFolderV2Request,
      signal?: AbortSignal
    ): Promise<DropboxFilesCreateFolderV2Response> => {
      return makeJsonRequest<DropboxFilesCreateFolderV2Response>(
        "POST",
        "/files/create_folder_v2",
        req,
        signal
      );
    },
    { schema: DropboxFilesCreateFolderV2RequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/delete_v2
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-delete_v2
  const deleteV2 = Object.assign(
    async (
      req: DropboxFilesDeleteV2Request,
      signal?: AbortSignal
    ): Promise<DropboxFilesDeleteV2Response> => {
      return makeJsonRequest<DropboxFilesDeleteV2Response>(
        "POST",
        "/files/delete_v2",
        req,
        signal
      );
    },
    { schema: DropboxFilesDeleteV2RequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/copy_v2
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-copy_v2
  const copyV2 = Object.assign(
    async (
      req: DropboxFilesRelocationRequest,
      signal?: AbortSignal
    ): Promise<DropboxFilesRelocationResponse> => {
      return makeJsonRequest<DropboxFilesRelocationResponse>(
        "POST",
        "/files/copy_v2",
        req,
        signal
      );
    },
    { schema: DropboxFilesRelocationRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/files/move_v2
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-move_v2
  const moveV2 = Object.assign(
    async (
      req: DropboxFilesRelocationRequest,
      signal?: AbortSignal
    ): Promise<DropboxFilesRelocationResponse> => {
      return makeJsonRequest<DropboxFilesRelocationResponse>(
        "POST",
        "/files/move_v2",
        req,
        signal
      );
    },
    { schema: DropboxFilesRelocationRequestSchema }
  );

  // sig-ok: intentional
  // POST https://content.dropboxapi.com/2/files/upload
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-upload
  const upload = Object.assign(
    async (
      req: DropboxFilesUploadRequest,
      signal?: AbortSignal
    ): Promise<DropboxFileMetadata> => {
      return makeUploadRequest<DropboxFileMetadata>(
        "/files/upload",
        req,
        signal,
        { baseOverride: uploadBaseURL }
      );
    },
    { schema: DropboxFilesUploadRequestSchema }
  );

  // sig-ok: intentional
  // POST https://content.dropboxapi.com/2/files/download
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#files-download
  const download = Object.assign(
    async (
      req: DropboxFilesDownloadRequest,
      signal?: AbortSignal
    ): Promise<DropboxFilesDownloadResponse> => {
      return makeBinaryRequest("/files/download", req, signal, {
        baseOverride: uploadBaseURL,
      });
    },
    { schema: DropboxFilesDownloadRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#sharing-create_shared_link_with_settings
  const createSharedLinkWithSettings = Object.assign(
    async (
      req: DropboxSharingCreateSharedLinkWithSettingsRequest,
      signal?: AbortSignal
    ): Promise<DropboxSharingSharedLinkMetadata> => {
      return makeJsonRequest<DropboxSharingSharedLinkMetadata>(
        "POST",
        "/sharing/create_shared_link_with_settings",
        req,
        signal
      );
    },
    { schema: DropboxSharingCreateSharedLinkWithSettingsRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.dropboxapi.com/2/sharing/list_shared_links
  // Docs: https://www.dropbox.com/developers/documentation/http/documentation#sharing-list_shared_links
  const listSharedLinks = Object.assign(
    async (
      req: DropboxSharingListSharedLinksRequest = {},
      signal?: AbortSignal
    ): Promise<DropboxSharingListSharedLinksResponse> => {
      return makeJsonRequest<DropboxSharingListSharedLinksResponse>(
        "POST",
        "/sharing/list_shared_links",
        req,
        signal
      );
    },
    { schema: DropboxSharingListSharedLinksRequestSchema }
  );

  return attachExamples({
    check: {
      user: checkUser,
    },
    users: {
      getCurrentAccount,
    },
    files: {
      listFolder,
      listFolderContinue,
      getMetadata,
      createFolderV2,
      deleteV2,
      copyV2,
      moveV2,
      upload,
      download,
    },
    sharing: {
      createSharedLinkWithSettings,
      listSharedLinks,
    },
  });
}
