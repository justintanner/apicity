export type {
  DoltHubSqlReadRequestInput,
  DoltHubSqlReadParsedRequest,
  DoltHubSqlWriteRequestInput,
  DoltHubSqlWriteParsedRequest,
  DoltHubWritePollRequestInput,
  DoltHubWritePollParsedRequest,
  DoltHubDatabaseCreateRequestInput,
  DoltHubDatabaseCreateParsedRequest,
  DoltHubBranchesListRequestInput,
  DoltHubBranchesListParsedRequest,
  DoltHubBranchCreateRequestInput,
  DoltHubBranchCreateParsedRequest,
  DoltHubPullsListRequestInput,
  DoltHubPullsListParsedRequest,
  DoltHubPullCreateRequestInput,
  DoltHubPullCreateParsedRequest,
  DoltHubPullGetRequestInput,
  DoltHubPullGetParsedRequest,
  DoltHubPullMergeRequestInput,
  DoltHubPullMergeParsedRequest,
  DoltHubForkCreateRequestInput,
  DoltHubForkCreateParsedRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class DoltHubError extends Error {
  status: number;
  body: unknown;
  /**
   * Stable, machine-readable error code from the v2 RFC 9457 problem-details
   * body (e.g. `UNAUTHENTICATED`). Absent for v1alpha1 errors.
   */
  code?: string;
  /** Short, human-readable summary of the problem type (v2 problem details). */
  title?: string;
  /** Human-readable explanation specific to this occurrence (v2 problem details). */
  detail?: string;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    details?: { code?: string; title?: string; detail?: string }
  ) {
    super(message);
    this.name = "DoltHubError";
    this.status = status;
    this.body = body ?? null;
    this.code = details?.code;
    this.title = details?.title;
    this.detail = details?.detail;
  }
}

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

export type { DoltHubOptions } from "./zod";

// ---------------------------------------------------------------------------
// SQL response types
// ---------------------------------------------------------------------------

export interface DoltHubSchemaColumn {
  columnName: string;
  columnType: string;
}

export interface DoltHubSqlRow {
  [key: string]: string | number | null;
}

export interface DoltHubSqlReadResponse {
  query_execution_status: string;
  query_execution_message: string;
  repository_owner: string;
  repository_name: string;
  commit_ref: string;
  sql_query: string;
  schema: DoltHubSchemaColumn[];
  rows: DoltHubSqlRow[];
}

export interface DoltHubSqlReadRequest {
  owner: string;
  database: string;
  ref?: string;
  query: string;
}

export interface DoltHubSqlReadMethod {
  (
    req: DoltHubSqlReadRequest,
    signal?: AbortSignal
  ): Promise<DoltHubSqlReadResponse>;
}

// ---------------------------------------------------------------------------
// SQL write types
// ---------------------------------------------------------------------------

export interface DoltHubSqlWriteResponse {
  query_execution_status: string;
  query_execution_message: string;
  repository_owner: string;
  repository_name: string;
  to_branch_name: string;
  from_branch_name: string;
  query: string;
  operation_name: string;
}

export interface DoltHubSqlWriteRequest {
  owner: string;
  database: string;
  fromBranch: string;
  toBranch: string;
  query?: string;
}

export interface DoltHubSqlWriteMethod {
  (
    req: DoltHubSqlWriteRequest,
    signal?: AbortSignal
  ): Promise<DoltHubSqlWriteResponse>;
}

// ---------------------------------------------------------------------------
// Write poll types
// ---------------------------------------------------------------------------

export interface DoltHubWritePollDetails {
  query_execution_status: string;
  query_execution_message: string;
  owner_name: string;
  repository_name: string;
  from_commit_id: string;
  to_commit_id: string;
}

export interface DoltHubWritePollResponse {
  _id: string;
  done: boolean;
  res_details?: DoltHubWritePollDetails;
}

export interface DoltHubWritePollRequest {
  owner: string;
  database: string;
  operationName: string;
}

export interface DoltHubWritePollMethod {
  (
    req: DoltHubWritePollRequest,
    signal?: AbortSignal
  ): Promise<DoltHubWritePollResponse>;
}

// ---------------------------------------------------------------------------
// Database types
// ---------------------------------------------------------------------------

export interface DoltHubDatabaseCreateRequest {
  description?: string;
  ownerName?: string;
  repoName?: string;
  visibility?: "public" | "private";
}

export interface DoltHubDatabaseCreateResponse {
  ownerName: string;
  repoName: string;
}

export interface DoltHubDatabaseCreateMethod {
  (
    req: DoltHubDatabaseCreateRequest,
    signal?: AbortSignal
  ): Promise<DoltHubDatabaseCreateResponse>;
}

// ---------------------------------------------------------------------------
// Branch types
// ---------------------------------------------------------------------------

export interface DoltHubBranch {
  name: string;
  hash: string;
}

export interface DoltHubBranchesListResponse {
  branches: DoltHubBranch[];
}

export interface DoltHubBranchesListRequest {
  owner: string;
  database: string;
}

export interface DoltHubBranchesListMethod {
  (
    req: DoltHubBranchesListRequest,
    signal?: AbortSignal
  ): Promise<DoltHubBranchesListResponse>;
}

export interface DoltHubBranchCreateRequest {
  owner: string;
  database: string;
  revisionType: "branch" | "ref" | "commit";
  revisionName: string;
  newBranchName: string;
}

export interface DoltHubBranchCreateResponse {
  name: string;
  hash: string;
}

export interface DoltHubBranchCreateMethod {
  (
    req: DoltHubBranchCreateRequest,
    signal?: AbortSignal
  ): Promise<DoltHubBranchCreateResponse>;
}

export interface DoltHubBranchesNamespace {
  list: DoltHubBranchesListMethod;
  create: DoltHubBranchCreateMethod;
}

// ---------------------------------------------------------------------------
// Pull request types
// ---------------------------------------------------------------------------

export interface DoltHubPullRequest {
  pullId: string;
  title: string;
  description?: string;
  state: string;
  fromBranchOwnerName: string;
  fromBranchRepoName: string;
  fromBranchName: string;
  toBranchOwnerName: string;
  toBranchRepoName: string;
  toBranchName: string;
}

export interface DoltHubPullsListResponse {
  pulls: DoltHubPullRequest[];
  nextPageToken?: string;
}

export interface DoltHubPullsListRequest {
  owner: string;
  database: string;
  pageToken?: string;
  filterByState?: "Open" | "Closed" | "Merged";
  filterByReviewStatus?:
    | "Approved"
    | "AssignedReviewer"
    | "Rejected"
    | "Reviewed";
  query?: string;
}

export interface DoltHubPullsListMethod {
  (
    req: DoltHubPullsListRequest,
    signal?: AbortSignal
  ): Promise<DoltHubPullsListResponse>;
}

export interface DoltHubPullCreateRequest {
  owner: string;
  database: string;
  title?: string;
  description?: string;
  fromBranchOwnerName?: string;
  fromBranchRepoName?: string;
  fromBranchName?: string;
  toBranchOwnerName?: string;
  toBranchRepoName?: string;
  toBranchName?: string;
}

export type DoltHubPullCreateResponse = DoltHubPullRequest;

export interface DoltHubPullCreateMethod {
  (
    req: DoltHubPullCreateRequest,
    signal?: AbortSignal
  ): Promise<DoltHubPullCreateResponse>;
}

export interface DoltHubPullGetRequest {
  owner: string;
  database: string;
  pullId: string;
}

export type DoltHubPullGetResponse = DoltHubPullRequest;

export interface DoltHubPullGetMethod {
  (
    req: DoltHubPullGetRequest,
    signal?: AbortSignal
  ): Promise<DoltHubPullGetResponse>;
}

export interface DoltHubPullMergeRequest {
  owner: string;
  database: string;
  pullId: string;
}

export interface DoltHubPullMergeResponse {
  operationName: string;
}

export interface DoltHubPullMergeMethod {
  (
    req: DoltHubPullMergeRequest,
    signal?: AbortSignal
  ): Promise<DoltHubPullMergeResponse>;
}

export interface DoltHubPullsNamespace {
  list: DoltHubPullsListMethod;
  create: DoltHubPullCreateMethod;
  get: DoltHubPullGetMethod;
  merge: DoltHubPullMergeMethod;
}

// ---------------------------------------------------------------------------
// User types
// ---------------------------------------------------------------------------

export interface DoltHubUser {
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  emailAddresses?: string[];
}

export type DoltHubUserGetResponse = DoltHubUser;

export interface DoltHubUserGetMethod {
  (signal?: AbortSignal): Promise<DoltHubUserGetResponse>;
}

// ---------------------------------------------------------------------------
// v2 API — shared models
// ---------------------------------------------------------------------------

/**
 * Reference to an in-progress async operation, returned in v2 `202` responses.
 * Pass `id` to `GET /api/v2/operations/{id}` (or follow `href`) to poll for
 * completion.
 */
export interface DoltHubOperationRef {
  id: string;
  href: string;
}

// ---------------------------------------------------------------------------
// v2 API — forks
// ---------------------------------------------------------------------------

export interface DoltHubForkCreateRequest {
  /** Source database owner (URL path segment). */
  owner: string;
  /** Source database name (URL path segment). */
  database: string;
  /** Owner (user or organization) that will own the new fork (request body). */
  newOwner: string;
}

export type DoltHubForkCreateResponse = DoltHubOperationRef;

export interface DoltHubForkCreateMethod {
  (
    req: DoltHubForkCreateRequest,
    signal?: AbortSignal
  ): Promise<DoltHubForkCreateResponse>;
}

export interface DoltHubV2ForksNamespace {
  create: DoltHubForkCreateMethod;
}

export interface DoltHubV2DatabasesNamespace {
  forks: DoltHubV2ForksNamespace;
}

export interface DoltHubV2Namespace {
  databases: DoltHubV2DatabasesNamespace;
}

export interface DoltHubApiNamespace {
  v2: DoltHubV2Namespace;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface DoltHubProvider {
  v1alpha1: {
    sql: {
      read: DoltHubSqlReadMethod;
      write: DoltHubSqlWriteMethod;
      writePoll: DoltHubWritePollMethod;
    };
    database: {
      create: DoltHubDatabaseCreateMethod;
    };
    branches: DoltHubBranchesNamespace;
    pulls: DoltHubPullsNamespace;
    user: {
      get: DoltHubUserGetMethod;
    };
  };
  api: DoltHubApiNamespace;
}
