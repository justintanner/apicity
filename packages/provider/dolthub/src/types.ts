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
  DoltHubV2BranchCreateRequestInput,
  DoltHubV2BranchCreateParsedRequest,
  DoltHubV2DatabaseCreateRequestInput,
  DoltHubV2DatabaseCreateParsedRequest,
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

/**
 * Lifecycle state of an async v2 operation. Poll `GET /api/v2/operations/{id}`
 * until the status is a terminal `succeeded` or `failed`.
 */
export type DoltHubOperationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

/** The kind of work an async v2 operation performs. */
export type DoltHubOperationType =
  | "import"
  | "merge"
  | "sql_write"
  | "fork"
  | "dolt_ci";

/** Error details recorded when an operation reaches the `failed` status. */
export interface DoltHubOperationError {
  /** HTTP-equivalent status code for the failure. */
  status: number;
  /** Stable, machine-readable error code (SCREAMING_SNAKE_CASE). */
  code: string;
  /** Short, human-readable summary of the failure. */
  title: string;
  /** Human-readable explanation of the failure, when available. */
  detail?: string;
}

/**
 * A long-running async v2 operation. Every async mutation returns an
 * `OperationRef`; poll `GET /api/v2/operations/{id}` until `status` is the
 * terminal `succeeded` or `failed`. The `id` is opaque — pass it back verbatim.
 */
export interface DoltHubOperation {
  /** Opaque operation identifier; pass verbatim to the poll endpoint. */
  id: string;
  /** The kind of work this operation performs. */
  type: DoltHubOperationType;
  /** Current lifecycle state. */
  status: DoltHubOperationStatus;
  /** When the operation was enqueued. */
  created_at: string;
  /** Reserved for a future cancel endpoint; always `false` today. */
  cancelable: boolean;
  /** Error details, present when `status` is `failed`. */
  error?: DoltHubOperationError;
  /**
   * Result payload, present when `status` is `succeeded`. Shape depends on
   * `type` (e.g. `fork` -> `{ database: { owner, name } }`).
   */
  result?: Record<string, unknown>;
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

/** Pagination metadata included by cursor-paginated v2 responses. */
export interface DoltHubV2Meta {
  /** Opaque cursor for the next page; absent or empty when there is no next page. */
  next_page_token?: string;
}

/** The uniform v2 API success envelope. */
export interface DoltHubV2Envelope<TData, TMeta = DoltHubV2Meta> {
  data: TData;
  /** Present when the endpoint has response metadata, such as a page cursor. */
  meta?: TMeta;
}

// ---------------------------------------------------------------------------
// v2 API — branches
// ---------------------------------------------------------------------------

/** A branch returned by the v2 database branches endpoint. */
export interface DoltHubV2Branch {
  /** Branch name. */
  name: string;
  /** Commit SHA at the branch head. */
  head_commit_sha: string;
  /** ISO-8601 time at which the branch was last updated. */
  last_updated_at: string;
}

export interface DoltHubV2BranchesListRequest {
  /** Database owner (URL path segment). */
  owner: string;
  /** Database name (URL path segment). */
  database: string;
  /** Opaque cursor from a preceding page's `meta.next_page_token`. */
  pageToken?: string;
}

export type DoltHubV2BranchesListResponse = DoltHubV2Envelope<
  DoltHubV2Branch[]
>;

export interface DoltHubV2BranchesListMethod {
  (
    req: DoltHubV2BranchesListRequest,
    signal?: AbortSignal
  ): Promise<DoltHubV2BranchesListResponse>;
}

/**
 * Source revision a newly created v2 branch will point at. A discriminated
 * union mirroring the v2 spec's `CreateBranchRequest.from`: branch from the
 * head of an existing `branch`, or from a specific `commit` hash.
 */
export type DoltHubV2BranchFrom = { branch: string } | { commit: string };

export interface DoltHubV2BranchCreateRequest {
  /** Database owner (URL path segment). */
  owner: string;
  /** Database name (URL path segment). */
  database: string;
  /** The new branch's name (request body). */
  name: string;
  /** Source revision the new branch points at (request body). */
  from: DoltHubV2BranchFrom;
}

/**
 * The v2 create-branch response. Creation is synchronous (HTTP 201): the newly
 * created branch is returned directly in the `{ data, meta }` envelope, reusing
 * the same `DoltHubV2Branch` shape as the list endpoint.
 */
export type DoltHubV2BranchCreateResponse = DoltHubV2Envelope<DoltHubV2Branch>;

export interface DoltHubV2BranchCreateMethod {
  (
    req: DoltHubV2BranchCreateRequest,
    signal?: AbortSignal
  ): Promise<DoltHubV2BranchCreateResponse>;
}

export interface DoltHubV2BranchesNamespace {
  list: DoltHubV2BranchesListMethod;
  create: DoltHubV2BranchCreateMethod;
}

// ---------------------------------------------------------------------------
// v2 API — databases
// ---------------------------------------------------------------------------

/**
 * An `{ owner, name }` pair identifying another database. The v2 spec nests
 * this shape under a database's `parent` and `network_root`.
 */
export interface DoltHubV2DatabaseRef {
  /** Owner (user or organization) of the referenced database. */
  owner: string;
  /** Name of the referenced database, unique within the owner. */
  name: string;
}

/** A database returned by the v2 databases endpoints. */
export interface DoltHubV2Database {
  /** Owner (user or organization) of the database. */
  owner: string;
  /** Database name, unique within the owner. */
  name: string;
  /** Human-readable description; absent when the database has none. */
  description?: string;
  /**
   * Whether the database is publicly readable or private. Typed as a
   * free-form string because the v2 models page enumerates no allowed values.
   */
  visibility: string;
  /** Number of databases in this database's fork network. */
  fork_network_count: number;
  /** Number of users who have starred the database. */
  star_count: number;
  /** On-disk size of the database in bytes. */
  size_bytes: number;
  /** ISO-8601 time of the most recent write; absent when never written to. */
  last_write_at?: string;
  /** The database this one was forked from; absent when this is not a fork. */
  parent?: DoltHubV2DatabaseRef;
  /**
   * The original database at the root of this database's fork network; absent
   * when this database is itself the root.
   */
  network_root?: DoltHubV2DatabaseRef;
}

export interface DoltHubV2DatabaseCreateRequest {
  /** Owner (user or organization) that will own the new database (request body). */
  owner: string;
  /** Database name, unique within the owner (request body). */
  name: string;
  /** Visibility of the new database (request body); required by v2. */
  visibility: "public" | "private";
  /** Optional human-readable description (request body). */
  description?: string;
}

/**
 * The v2 create-database response. Creation is synchronous (HTTP 201): the
 * newly created database is returned directly in the `{ data, meta }`
 * envelope, so the envelope is preserved rather than unwrapped to an
 * operation reference.
 */
export type DoltHubV2DatabaseCreateResponse =
  DoltHubV2Envelope<DoltHubV2Database>;

export interface DoltHubV2DatabaseCreateMethod {
  (
    req: DoltHubV2DatabaseCreateRequest,
    signal?: AbortSignal
  ): Promise<DoltHubV2DatabaseCreateResponse>;
}

export interface DoltHubV2DatabasesNamespace {
  create: DoltHubV2DatabaseCreateMethod;
  branches: DoltHubV2BranchesNamespace;
  forks: DoltHubV2ForksNamespace;
  sql: DoltHubV2SqlNamespace;
}

// ---------------------------------------------------------------------------
// v2 API — SQL read
// ---------------------------------------------------------------------------

/**
 * One column of a v2 SQL read result set. v2 returns column metadata separately
 * from the row values (rows are positional), so the schema is described once
 * here per column. Typed distinctly from the v1alpha1 `DoltHubSchemaColumn`
 * (which is `{ columnName, columnType }`) — the two API versions can diverge.
 */
export interface DoltHubV2SqlReadColumn {
  /** Column name (or alias) as it appears in the result set. */
  name: string;
  /** SQL type of the column, e.g. `"VARCHAR(255)"` or `"BIGINT"`. */
  type: string;
  /** Whether the column is part of the source table's primary key. */
  is_primary_key: boolean;
  /** Originating table name, or `""` for computed/aggregate columns. */
  source_table: string;
}

/**
 * A single v2 SQL read result row: positional values aligned to the response
 * `columns` array (v2 returns rows as arrays, not objects keyed by column
 * name). Every cell is a stringified value or `null`.
 */
export type DoltHubV2SqlRow = (string | null)[];

/**
 * The unwrapped `data` payload of a v2 SQL read. v2 uses snake_case field names
 * and a column/row split, so it is typed distinctly from the v1alpha1
 * `DoltHubSqlReadResponse` (the two API versions can diverge independently).
 */
export interface DoltHubV2SqlReadResponse {
  /** Column metadata, one entry per selected column. */
  columns: DoltHubV2SqlReadColumn[];
  /** Result rows as positional value arrays aligned to `columns`. */
  rows: DoltHubV2SqlRow[];
  /**
   * Query execution state. Documented values:
   * `"success"`, `"error"`, `"timeout"`, `"row_limit"`, `"not_workspace"`.
   */
  status: string;
  /** Optional query-level warnings emitted alongside a successful read. */
  warnings?: string[];
}

export interface DoltHubV2SqlReadRequest {
  /** Database owner (URL path segment). */
  owner: string;
  /** Database name (URL path segment). */
  database: string;
  /** Branch, tag, or commit hash to query against (v2 `ref` query param). */
  ref?: string;
  /** The read-only SQL query to execute (v2 `q` query param). */
  query: string;
}

export interface DoltHubV2SqlReadMethod {
  (
    req: DoltHubV2SqlReadRequest,
    signal?: AbortSignal
  ): Promise<DoltHubV2SqlReadResponse>;
}

export interface DoltHubV2SqlNamespace {
  read: DoltHubV2SqlReadMethod;
}

// ---------------------------------------------------------------------------
// v2 API — operations
// ---------------------------------------------------------------------------

export interface DoltHubOperationsGetRequest {
  /** Opaque operation id from an `OperationRef` (URL path segment). */
  id: string;
}

export type DoltHubOperationsGetResponse = DoltHubOperation;

export interface DoltHubOperationsGetMethod {
  (
    req: DoltHubOperationsGetRequest,
    signal?: AbortSignal
  ): Promise<DoltHubOperationsGetResponse>;
}

export interface DoltHubV2OperationsNamespace {
  get: DoltHubOperationsGetMethod;
}

// ---------------------------------------------------------------------------
// v2 API — user
// ---------------------------------------------------------------------------

/** A single email address on a v2 user profile. */
export interface DoltHubV2UserEmail {
  /** The email address itself. */
  address: string;
  /** Whether this is the account's primary email address. */
  is_primary: boolean;
  /** Whether ownership of this address has been verified. */
  is_verified: boolean;
}

/**
 * The authenticated caller's profile as returned by the v2 API, unwrapped from
 * the `{ data, meta }` envelope. v2 uses snake_case field names and a richer
 * profile than the camelCase v1alpha1 `DoltHubUser`, so it is typed distinctly
 * (the two API versions can diverge without a breaking change).
 */
export interface DoltHubV2User {
  /** The user's unique handle. */
  username: string;
  /** The user's human-readable display name. */
  display_name: string;
  /** Free-form profile biography, when set. */
  bio?: string;
  /** Free-form profile location, when set. */
  location?: string;
  /** The user's website URL, when set. */
  website_url?: string;
  /** URL of the user's profile picture, when set. */
  profile_pic_url?: string;
  /** The email addresses associated with the account. */
  email_addresses: DoltHubV2UserEmail[];
}

export type DoltHubV2UserGetResponse = DoltHubV2User;

export interface DoltHubV2UserGetMethod {
  (signal?: AbortSignal): Promise<DoltHubV2UserGetResponse>;
}

export interface DoltHubV2UserNamespace {
  get: DoltHubV2UserGetMethod;
}

export interface DoltHubV2Namespace {
  databases: DoltHubV2DatabasesNamespace;
  operations: DoltHubV2OperationsNamespace;
  user: DoltHubV2UserNamespace;
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
