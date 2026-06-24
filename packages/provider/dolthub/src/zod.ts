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
