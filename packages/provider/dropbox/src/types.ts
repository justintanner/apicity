import type { z } from "zod";

export class DropboxError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly error_summary?: string;
  readonly error?: unknown;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    errorSummary?: string,
    error?: unknown
  ) {
    super(message);
    this.name = "DropboxError";
    this.status = status;
    this.body = body ?? null;
    this.error_summary = errorSummary;
    this.error = error;
  }
}

export interface DropboxOptions {
  oauthToken?: string;
  apiBaseURL?: string;
  contentBaseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export interface DropboxCheckUserRequest {
  query: string;
}

export interface DropboxCheckUserResponse {
  result: string;
  [key: string]: unknown;
}

export interface DropboxMethod<Req, Res> {
  (req: Req, signal?: AbortSignal): Promise<Res>;
  schema: z.ZodType<Req>;
}

export interface DropboxOptionalMethod<Req, Res> {
  (req?: Req, signal?: AbortSignal): Promise<Res>;
  schema: z.ZodType<Req>;
}

export interface DropboxNoRequestMethod<Res> {
  (signal?: AbortSignal): Promise<Res>;
  schema: undefined;
}

export interface DropboxTagged {
  ".tag": string;
  [key: string]: unknown;
}

export type DropboxWriteMode =
  | "add"
  | "overwrite"
  | { ".tag": "add" }
  | { ".tag": "overwrite" }
  | { ".tag": "update"; update: string };

export interface DropboxName {
  given_name: string;
  surname: string;
  familiar_name: string;
  display_name: string;
  abbreviated_name: string;
  [key: string]: unknown;
}

export interface DropboxUsersGetCurrentAccountResponse {
  account_id: string;
  name: DropboxName;
  email: string;
  email_verified: boolean;
  disabled: boolean;
  locale: string;
  referral_link: string;
  is_paired: boolean;
  account_type: DropboxTagged;
  root_info: DropboxTagged;
  country?: string;
  team?: Record<string, unknown>;
  team_member_id?: string;
  [key: string]: unknown;
}

export interface DropboxSharedLink {
  url: string;
  password?: string;
}

export interface DropboxFilesListFolderRequest {
  path: string;
  recursive?: boolean;
  include_media_info?: boolean;
  include_deleted?: boolean;
  include_has_explicit_shared_members?: boolean;
  include_mounted_folders?: boolean;
  limit?: number;
  shared_link?: DropboxSharedLink;
  include_property_groups?: Record<string, unknown>;
  include_non_downloadable_files?: boolean;
}

export interface DropboxFilesListFolderContinueRequest {
  cursor: string;
}

export interface DropboxMetadataBase {
  ".tag": string;
  name?: string;
  path_lower?: string;
  path_display?: string;
  id?: string;
  [key: string]: unknown;
}

export interface DropboxFileMetadata extends DropboxMetadataBase {
  ".tag": "file";
  name: string;
  client_modified: string;
  server_modified: string;
  rev: string;
  size: number;
  is_downloadable?: boolean;
  content_hash?: string;
}

export interface DropboxFolderMetadata extends DropboxMetadataBase {
  ".tag": "folder";
  name: string;
  shared_folder_id?: string;
  sharing_info?: Record<string, unknown>;
}

export interface DropboxDeletedMetadata extends DropboxMetadataBase {
  ".tag": "deleted";
  name: string;
}

export type DropboxMetadata =
  | DropboxFileMetadata
  | DropboxFolderMetadata
  | DropboxDeletedMetadata
  | DropboxMetadataBase;

export interface DropboxFilesListFolderResponse {
  entries: DropboxMetadata[];
  cursor: string;
  has_more: boolean;
}

export interface DropboxFilesGetMetadataRequest {
  path: string;
  include_media_info?: boolean;
  include_deleted?: boolean;
  include_has_explicit_shared_members?: boolean;
  include_property_groups?: Record<string, unknown>;
}

export interface DropboxFilesCreateFolderV2Request {
  path: string;
  autorename?: boolean;
}

export interface DropboxFilesCreateFolderV2Response {
  metadata: DropboxFolderMetadata;
  [key: string]: unknown;
}

export interface DropboxFilesDeleteV2Request {
  path: string;
  parent_rev?: string;
}

export interface DropboxFilesDeleteV2Response {
  metadata: DropboxMetadata;
  [key: string]: unknown;
}

export interface DropboxFilesRelocationRequest {
  from_path: string;
  to_path: string;
  allow_shared_folder?: boolean;
  autorename?: boolean;
  allow_ownership_transfer?: boolean;
}

export interface DropboxFilesRelocationResponse {
  metadata: DropboxMetadata;
  [key: string]: unknown;
}

export interface DropboxFilesUploadRequest {
  path: string;
  contents: BodyInit;
  mode?: DropboxWriteMode;
  autorename?: boolean;
  client_modified?: string;
  mute?: boolean;
  property_groups?: Array<Record<string, unknown>>;
  strict_conflict?: boolean;
  content_hash?: string;
}

export interface DropboxFilesDownloadRequest {
  path: string;
  rev?: string;
}

export interface DropboxFilesDownloadResponse {
  metadata: DropboxFileMetadata;
  content: ArrayBuffer;
  contentType?: string;
  headers: Headers;
  text(): string;
  bytes(): Uint8Array;
}

export type DropboxRequestedVisibility =
  | "public"
  | "team_only"
  | "password"
  | { ".tag": "public" }
  | { ".tag": "team_only" }
  | { ".tag": "password" };

export interface DropboxSharingSharedLinkSettings {
  requested_visibility?: DropboxRequestedVisibility;
  audience?: DropboxTagged;
  access?: DropboxTagged;
  expires?: string;
  link_password?: string;
  allow_download?: boolean;
  [key: string]: unknown;
}

export interface DropboxSharingCreateSharedLinkWithSettingsRequest {
  path: string;
  settings?: DropboxSharingSharedLinkSettings;
}

export interface DropboxSharingSharedLinkMetadata {
  url: string;
  name: string;
  id?: string;
  path_lower?: string;
  link_permissions?: Record<string, unknown>;
  expires?: string;
  [key: string]: unknown;
}

export interface DropboxSharingListSharedLinksRequest {
  path?: string;
  cursor?: string;
  direct_only?: boolean;
}

export interface DropboxSharingListSharedLinksResponse {
  links: DropboxSharingSharedLinkMetadata[];
  has_more: boolean;
  cursor?: string;
  [key: string]: unknown;
}

export interface DropboxCheckNamespace {
  user: DropboxMethod<DropboxCheckUserRequest, DropboxCheckUserResponse>;
}

export interface DropboxUsersNamespace {
  getCurrentAccount: DropboxNoRequestMethod<DropboxUsersGetCurrentAccountResponse>;
}

export interface DropboxFilesNamespace {
  listFolder: DropboxMethod<
    DropboxFilesListFolderRequest,
    DropboxFilesListFolderResponse
  >;
  listFolderContinue: DropboxMethod<
    DropboxFilesListFolderContinueRequest,
    DropboxFilesListFolderResponse
  >;
  getMetadata: DropboxMethod<DropboxFilesGetMetadataRequest, DropboxMetadata>;
  createFolderV2: DropboxMethod<
    DropboxFilesCreateFolderV2Request,
    DropboxFilesCreateFolderV2Response
  >;
  deleteV2: DropboxMethod<
    DropboxFilesDeleteV2Request,
    DropboxFilesDeleteV2Response
  >;
  copyV2: DropboxMethod<
    DropboxFilesRelocationRequest,
    DropboxFilesRelocationResponse
  >;
  moveV2: DropboxMethod<
    DropboxFilesRelocationRequest,
    DropboxFilesRelocationResponse
  >;
  upload: DropboxMethod<DropboxFilesUploadRequest, DropboxFileMetadata>;
  download: DropboxMethod<
    DropboxFilesDownloadRequest,
    DropboxFilesDownloadResponse
  >;
}

export interface DropboxSharingNamespace {
  createSharedLinkWithSettings: DropboxMethod<
    DropboxSharingCreateSharedLinkWithSettingsRequest,
    DropboxSharingSharedLinkMetadata
  >;
  listSharedLinks: DropboxOptionalMethod<
    DropboxSharingListSharedLinksRequest,
    DropboxSharingListSharedLinksResponse
  >;
}

export interface DropboxProvider {
  check: DropboxCheckNamespace;
  users: DropboxUsersNamespace;
  files: DropboxFilesNamespace;
  sharing: DropboxSharingNamespace;
}
