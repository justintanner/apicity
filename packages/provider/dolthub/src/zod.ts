import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

export const DoltHubOptionsSchema = z.object({
  baseURL: z.string().optional(),
  apiToken: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type DoltHubOptions = z.infer<typeof DoltHubOptionsSchema>;

// ---------------------------------------------------------------------------
// SQL read
// ---------------------------------------------------------------------------

export const DoltHubSqlReadRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  ref: z.string().optional(),
  query: z.string().min(1),
});

export type DoltHubSqlReadRequest = z.input<typeof DoltHubSqlReadRequestSchema>;
export type DoltHubSqlReadRequestInput = DoltHubSqlReadRequest;
export type DoltHubSqlReadParsedRequest = z.output<
  typeof DoltHubSqlReadRequestSchema
>;

// ---------------------------------------------------------------------------
// SQL write
// ---------------------------------------------------------------------------

export const DoltHubSqlWriteRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  fromBranch: z.string().min(1),
  toBranch: z.string().min(1),
  query: z.string().optional(),
});

export type DoltHubSqlWriteRequest = z.input<
  typeof DoltHubSqlWriteRequestSchema
>;
export type DoltHubSqlWriteRequestInput = DoltHubSqlWriteRequest;
export type DoltHubSqlWriteParsedRequest = z.output<
  typeof DoltHubSqlWriteRequestSchema
>;

// ---------------------------------------------------------------------------
// Write poll
// ---------------------------------------------------------------------------

export const DoltHubWritePollRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  operationName: z.string().min(1),
});

export type DoltHubWritePollRequest = z.input<
  typeof DoltHubWritePollRequestSchema
>;
export type DoltHubWritePollRequestInput = DoltHubWritePollRequest;
export type DoltHubWritePollParsedRequest = z.output<
  typeof DoltHubWritePollRequestSchema
>;

// ---------------------------------------------------------------------------
// Database create
// ---------------------------------------------------------------------------

export const DoltHubDatabaseCreateRequestSchema = z.object({
  description: z.string().optional(),
  ownerName: z.string().optional(),
  repoName: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export type DoltHubDatabaseCreateRequest = z.input<
  typeof DoltHubDatabaseCreateRequestSchema
>;
export type DoltHubDatabaseCreateRequestInput = DoltHubDatabaseCreateRequest;
export type DoltHubDatabaseCreateParsedRequest = z.output<
  typeof DoltHubDatabaseCreateRequestSchema
>;

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export const DoltHubBranchesListRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
});

export type DoltHubBranchesListRequest = z.input<
  typeof DoltHubBranchesListRequestSchema
>;
export type DoltHubBranchesListRequestInput = DoltHubBranchesListRequest;
export type DoltHubBranchesListParsedRequest = z.output<
  typeof DoltHubBranchesListRequestSchema
>;

export const DoltHubBranchCreateRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  revisionType: z.enum(["branch", "ref", "commit"]),
  revisionName: z.string().min(1),
  newBranchName: z.string().min(1),
});

export type DoltHubBranchCreateRequest = z.input<
  typeof DoltHubBranchCreateRequestSchema
>;
export type DoltHubBranchCreateRequestInput = DoltHubBranchCreateRequest;
export type DoltHubBranchCreateParsedRequest = z.output<
  typeof DoltHubBranchCreateRequestSchema
>;

// ---------------------------------------------------------------------------
// Pull requests
// ---------------------------------------------------------------------------

export const DoltHubPullsListRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  pageToken: z.string().optional(),
  filterByState: z.enum(["Open", "Closed", "Merged"]).optional(),
  filterByReviewStatus: z
    .enum(["Approved", "AssignedReviewer", "Rejected", "Reviewed"])
    .optional(),
  query: z.string().optional(),
});

export type DoltHubPullsListRequest = z.input<
  typeof DoltHubPullsListRequestSchema
>;
export type DoltHubPullsListRequestInput = DoltHubPullsListRequest;
export type DoltHubPullsListParsedRequest = z.output<
  typeof DoltHubPullsListRequestSchema
>;

export const DoltHubPullCreateRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  fromBranchOwnerName: z.string().optional(),
  fromBranchRepoName: z.string().optional(),
  fromBranchName: z.string().optional(),
  toBranchOwnerName: z.string().optional(),
  toBranchRepoName: z.string().optional(),
  toBranchName: z.string().optional(),
});

export type DoltHubPullCreateRequest = z.input<
  typeof DoltHubPullCreateRequestSchema
>;
export type DoltHubPullCreateRequestInput = DoltHubPullCreateRequest;
export type DoltHubPullCreateParsedRequest = z.output<
  typeof DoltHubPullCreateRequestSchema
>;

export const DoltHubPullGetRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  pullId: z.string().min(1),
});

export type DoltHubPullGetRequest = z.input<typeof DoltHubPullGetRequestSchema>;
export type DoltHubPullGetRequestInput = DoltHubPullGetRequest;
export type DoltHubPullGetParsedRequest = z.output<
  typeof DoltHubPullGetRequestSchema
>;

export const DoltHubPullMergeRequestSchema = z.object({
  owner: z.string().min(1),
  database: z.string().min(1),
  pullId: z.string().min(1),
});

export type DoltHubPullMergeRequest = z.input<
  typeof DoltHubPullMergeRequestSchema
>;
export type DoltHubPullMergeRequestInput = DoltHubPullMergeRequest;
export type DoltHubPullMergeParsedRequest = z.output<
  typeof DoltHubPullMergeRequestSchema
>;

// ---------------------------------------------------------------------------
// v2 — forks
// ---------------------------------------------------------------------------

export const DoltHubForkCreateRequestSchema = z.object({
  // Source database owner (URL path segment).
  owner: z.string().min(1),
  // Source database name (URL path segment).
  database: z.string().min(1),
  // Owner (user or organization) that will own the new fork (request body).
  newOwner: z.string().min(1),
});

export type DoltHubForkCreateRequest = z.input<
  typeof DoltHubForkCreateRequestSchema
>;
export type DoltHubForkCreateRequestInput = DoltHubForkCreateRequest;
export type DoltHubForkCreateParsedRequest = z.output<
  typeof DoltHubForkCreateRequestSchema
>;

// ---------------------------------------------------------------------------
// v2 — branches
// ---------------------------------------------------------------------------

export const DoltHubV2BranchCreateRequestSchema = z.object({
  // Database owner (URL path segment).
  owner: z.string().min(1),
  // Database name (URL path segment).
  database: z.string().min(1),
  // The new branch's name (request body).
  name: z.string().min(1),
  // Source revision the new branch points at (request body): a discriminated
  // union naming either an existing `branch` or a `commit` hash.
  from: z.union([
    z.object({ branch: z.string().min(1) }),
    z.object({ commit: z.string().min(1) }),
  ]),
});

export type DoltHubV2BranchCreateRequest = z.input<
  typeof DoltHubV2BranchCreateRequestSchema
>;
export type DoltHubV2BranchCreateRequestInput = DoltHubV2BranchCreateRequest;
export type DoltHubV2BranchCreateParsedRequest = z.output<
  typeof DoltHubV2BranchCreateRequestSchema
>;

// ---------------------------------------------------------------------------
// v2 — databases
// ---------------------------------------------------------------------------

export const DoltHubV2DatabaseCreateRequestSchema = z.object({
  // Owner (user or organization) that will own the new database (request body).
  owner: z.string().min(1),
  // Database name, unique within the owner (request body).
  name: z.string().min(1),
  // Visibility of the new database (request body); required by v2, unlike the
  // all-optional v1alpha1 body. Deliberate narrowing: the v2 spec types this as
  // a free-form string, but v1alpha1 uses the public/private union and no other
  // value is documented.
  visibility: z.enum(["public", "private"]),
  // Optional human-readable description (request body).
  description: z.string().optional(),
});

export type DoltHubV2DatabaseCreateRequest = z.input<
  typeof DoltHubV2DatabaseCreateRequestSchema
>;
export type DoltHubV2DatabaseCreateRequestInput =
  DoltHubV2DatabaseCreateRequest;
export type DoltHubV2DatabaseCreateParsedRequest = z.output<
  typeof DoltHubV2DatabaseCreateRequestSchema
>;

// ---------------------------------------------------------------------------
// v2 — sql
// ---------------------------------------------------------------------------

export const DoltHubV2SqlWriteRequestSchema = z.object({
  // Database owner (URL path segment).
  owner: z.string().min(1),
  // Database name (URL path segment).
  database: z.string().min(1),
  // Branch the write starts from (request body `from_branch`).
  fromBranch: z.string().min(1),
  // Branch the write commits to (request body `to_branch`).
  toBranch: z.string().min(1),
  // The write SQL statement (request body `q`).
  query: z.string().min(1),
});

export type DoltHubV2SqlWriteRequest = z.input<
  typeof DoltHubV2SqlWriteRequestSchema
>;
export type DoltHubV2SqlWriteRequestInput = DoltHubV2SqlWriteRequest;
export type DoltHubV2SqlWriteParsedRequest = z.output<
  typeof DoltHubV2SqlWriteRequestSchema
>;

// ---------------------------------------------------------------------------
// v2 — pulls
// ---------------------------------------------------------------------------

// A branch reference in a v2 create-pull body: the database that owns the
// branch (`{ owner, name }`) plus the branch name within it. Shared by both
// `from_branch` and `to_branch`; kept snake_case to mirror the v2 wire shape
// exactly (confirmed from the v2 OpenAPI spec).
const DoltHubV2PullBranchRefSchema = z.object({
  database: z.object({
    owner: z.string().min(1),
    name: z.string().min(1),
  }),
  branch_name: z.string().min(1),
});

export const DoltHubV2PullCreateRequestSchema = z.object({
  // Database owner receiving the pull request (URL path segment).
  owner: z.string().min(1),
  // Database name receiving the pull request (URL path segment).
  database: z.string().min(1),
  // Pull-request title (request body); required by v2.
  title: z.string().min(1),
  // Optional free-form description (request body).
  description: z.string().optional(),
  // Source branch the pull request merges from (request body `from_branch`).
  from_branch: DoltHubV2PullBranchRefSchema,
  // Target branch the pull request merges into (request body `to_branch`).
  to_branch: DoltHubV2PullBranchRefSchema,
});

export type DoltHubV2PullCreateRequest = z.input<
  typeof DoltHubV2PullCreateRequestSchema
>;
export type DoltHubV2PullCreateRequestInput = DoltHubV2PullCreateRequest;
export type DoltHubV2PullCreateParsedRequest = z.output<
  typeof DoltHubV2PullCreateRequestSchema
>;
