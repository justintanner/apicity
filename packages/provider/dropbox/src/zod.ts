import { z } from "zod";

export const DropboxTaggedSchema = z
  .object({
    ".tag": z.string(),
  })
  .passthrough();

export const DropboxOptionsSchema = z.object({
  oauthToken: z.string().optional(),
  apiBaseURL: z.string().optional(),
  contentBaseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export const DropboxCheckUserRequestSchema = z.object({
  query: z.string(),
});

export const DropboxCheckUserResponseSchema = z
  .object({
    result: z.string(),
  })
  .passthrough();

export const DropboxNameSchema = z
  .object({
    given_name: z.string(),
    surname: z.string(),
    familiar_name: z.string(),
    display_name: z.string(),
    abbreviated_name: z.string(),
  })
  .passthrough();

export const DropboxUsersGetCurrentAccountResponseSchema = z
  .object({
    account_id: z.string(),
    name: DropboxNameSchema,
    email: z.string(),
    email_verified: z.boolean(),
    disabled: z.boolean(),
    locale: z.string(),
    referral_link: z.string(),
    is_paired: z.boolean(),
    account_type: DropboxTaggedSchema,
    root_info: DropboxTaggedSchema,
    country: z.string().optional(),
    team: z.record(z.string(), z.unknown()).optional(),
    team_member_id: z.string().optional(),
  })
  .passthrough();

export const DropboxSharedLinkSchema = z.object({
  url: z.string(),
  password: z.string().optional(),
});

const DropboxTemplateFilterSchema = z.record(z.string(), z.unknown());

export const DropboxFilesListFolderRequestSchema = z.object({
  path: z.string(),
  recursive: z.boolean().optional(),
  include_media_info: z.boolean().optional(),
  include_deleted: z.boolean().optional(),
  include_has_explicit_shared_members: z.boolean().optional(),
  include_mounted_folders: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  shared_link: DropboxSharedLinkSchema.optional(),
  include_property_groups: DropboxTemplateFilterSchema.optional(),
  include_non_downloadable_files: z.boolean().optional(),
});

export const DropboxFilesListFolderContinueRequestSchema = z.object({
  cursor: z.string().min(1),
});

export const DropboxMetadataSchema = z
  .object({
    ".tag": z.string(),
    name: z.string().optional(),
    path_lower: z.string().optional(),
    path_display: z.string().optional(),
    id: z.string().optional(),
  })
  .passthrough();

export const DropboxFileMetadataSchema = DropboxMetadataSchema.extend({
  ".tag": z.literal("file"),
  name: z.string(),
  client_modified: z.string(),
  server_modified: z.string(),
  rev: z.string(),
  size: z.number(),
  is_downloadable: z.boolean().optional(),
  content_hash: z.string().optional(),
}).passthrough();

export const DropboxFolderMetadataSchema = DropboxMetadataSchema.extend({
  ".tag": z.literal("folder"),
  name: z.string(),
  shared_folder_id: z.string().optional(),
  sharing_info: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const DropboxDeletedMetadataSchema = DropboxMetadataSchema.extend({
  ".tag": z.literal("deleted"),
  name: z.string(),
}).passthrough();

export const DropboxFilesListFolderResponseSchema = z
  .object({
    entries: z.array(DropboxMetadataSchema),
    cursor: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();

export const DropboxFilesGetMetadataRequestSchema = z.object({
  path: z.string().min(1),
  include_media_info: z.boolean().optional(),
  include_deleted: z.boolean().optional(),
  include_has_explicit_shared_members: z.boolean().optional(),
  include_property_groups: DropboxTemplateFilterSchema.optional(),
});

export const DropboxFilesCreateFolderV2RequestSchema = z.object({
  path: z.string().min(1),
  autorename: z.boolean().optional(),
});

export const DropboxFilesCreateFolderV2ResponseSchema = z
  .object({
    metadata: DropboxFolderMetadataSchema,
  })
  .passthrough();

export const DropboxFilesDeleteV2RequestSchema = z.object({
  path: z.string().min(1),
  parent_rev: z.string().optional(),
});

export const DropboxFilesDeleteV2ResponseSchema = z
  .object({
    metadata: DropboxMetadataSchema,
  })
  .passthrough();

export const DropboxFilesRelocationRequestSchema = z.object({
  from_path: z.string().min(1),
  to_path: z.string().min(1),
  allow_shared_folder: z.boolean().optional(),
  autorename: z.boolean().optional(),
  allow_ownership_transfer: z.boolean().optional(),
});

export const DropboxFilesRelocationResponseSchema = z
  .object({
    metadata: DropboxMetadataSchema,
  })
  .passthrough();

export const DropboxWriteModeSchema = z.union([
  z.literal("add"),
  z.literal("overwrite"),
  z.object({ ".tag": z.literal("add") }).passthrough(),
  z.object({ ".tag": z.literal("overwrite") }).passthrough(),
  z.object({ ".tag": z.literal("update"), update: z.string() }).passthrough(),
]);

export const DropboxBodyInitSchema = z.custom<BodyInit>(
  (value) => value !== undefined,
  "contents is required"
);

export const DropboxFilesUploadRequestSchema = z.object({
  path: z.string().min(1),
  contents: DropboxBodyInitSchema,
  mode: DropboxWriteModeSchema.optional(),
  autorename: z.boolean().optional(),
  client_modified: z.string().optional(),
  mute: z.boolean().optional(),
  property_groups: z.array(z.record(z.string(), z.unknown())).optional(),
  strict_conflict: z.boolean().optional(),
  content_hash: z.string().optional(),
});

export const DropboxFilesDownloadRequestSchema = z.object({
  path: z.string().min(1),
  rev: z.string().optional(),
});

export const DropboxFilesDownloadResponseSchema = z.object({
  metadata: DropboxFileMetadataSchema,
  content: z.custom<ArrayBuffer>(),
  contentType: z.string().optional(),
  headers: z.custom<Headers>(),
  text: z.function(),
  bytes: z.function(),
});

export const DropboxRequestedVisibilitySchema = z.union([
  z.literal("public"),
  z.literal("team_only"),
  z.literal("password"),
  z.object({ ".tag": z.literal("public") }).passthrough(),
  z.object({ ".tag": z.literal("team_only") }).passthrough(),
  z.object({ ".tag": z.literal("password") }).passthrough(),
]);

export const DropboxSharingSharedLinkSettingsSchema = z
  .object({
    requested_visibility: DropboxRequestedVisibilitySchema.optional(),
    audience: DropboxTaggedSchema.optional(),
    access: DropboxTaggedSchema.optional(),
    expires: z.string().optional(),
    link_password: z.string().optional(),
    allow_download: z.boolean().optional(),
  })
  .passthrough();

export const DropboxSharingCreateSharedLinkWithSettingsRequestSchema = z.object(
  {
    path: z.string().min(1),
    settings: DropboxSharingSharedLinkSettingsSchema.optional(),
  }
);

export const DropboxSharingSharedLinkMetadataSchema = z
  .object({
    url: z.string(),
    name: z.string(),
    id: z.string().optional(),
    path_lower: z.string().optional(),
    link_permissions: z.record(z.string(), z.unknown()).optional(),
    expires: z.string().optional(),
  })
  .passthrough();

export const DropboxSharingListSharedLinksRequestSchema = z.object({
  path: z.string().optional(),
  cursor: z.string().optional(),
  direct_only: z.boolean().optional(),
});

export const DropboxSharingListSharedLinksResponseSchema = z
  .object({
    links: z.array(DropboxSharingSharedLinkMetadataSchema),
    has_more: z.boolean(),
    cursor: z.string().optional(),
  })
  .passthrough();
