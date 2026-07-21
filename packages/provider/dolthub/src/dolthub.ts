import {
  DoltHubOptions,
  DoltHubProvider,
  DoltHubError,
  DoltHubSqlReadRequest,
  DoltHubSqlReadResponse,
  DoltHubSqlWriteRequest,
  DoltHubSqlWriteResponse,
  DoltHubWritePollRequest,
  DoltHubWritePollResponse,
  DoltHubDatabaseCreateRequest,
  DoltHubDatabaseCreateResponse,
  DoltHubBranchesListRequest,
  DoltHubBranchesListResponse,
  DoltHubBranchCreateRequest,
  DoltHubBranchCreateResponse,
  DoltHubPullsListRequest,
  DoltHubPullsListResponse,
  DoltHubPullCreateRequest,
  DoltHubPullCreateResponse,
  DoltHubPullGetRequest,
  DoltHubPullGetResponse,
  DoltHubPullMergeRequest,
  DoltHubPullMergeResponse,
  DoltHubUserGetResponse,
  DoltHubForkCreateRequest,
  DoltHubForkCreateResponse,
  DoltHubOperationsGetRequest,
  DoltHubOperationsGetResponse,
  DoltHubV2UserGetResponse,
  DoltHubV2SqlReadRequest,
  DoltHubV2SqlReadResponse,
  DoltHubV2SqlWriteRequest,
  DoltHubV2SqlWriteResponse,
  DoltHubV2Envelope,
  DoltHubV2Meta,
  DoltHubV2BranchesListRequest,
  DoltHubV2BranchesListResponse,
  DoltHubV2BranchCreateRequest,
  DoltHubV2BranchCreateResponse,
  DoltHubV2DatabaseCreateRequest,
  DoltHubV2DatabaseCreateResponse,
} from "./types";
import {
  DoltHubSqlReadRequestSchema,
  DoltHubSqlWriteRequestSchema,
  DoltHubWritePollRequestSchema,
  DoltHubDatabaseCreateRequestSchema,
  DoltHubBranchesListRequestSchema,
  DoltHubBranchCreateRequestSchema,
  DoltHubPullsListRequestSchema,
  DoltHubPullCreateRequestSchema,
  DoltHubPullGetRequestSchema,
  DoltHubPullMergeRequestSchema,
  DoltHubForkCreateRequestSchema,
  DoltHubV2BranchCreateRequestSchema,
  DoltHubV2DatabaseCreateRequestSchema,
  DoltHubV2SqlWriteRequestSchema,
} from "./zod";

export function createDoltHub(opts?: DoltHubOptions): DoltHubProvider {
  const baseURL = opts?.baseURL ?? "https://www.dolthub.com";
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

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

  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as {
        message?: string;
        error?: { message?: string };
      };
      if (b.message) {
        return `DoltHub API error ${status}: ${b.message}`;
      }
      if (b.error?.message) {
        return `DoltHub API error ${status}: ${b.error.message}`;
      }
    }
    return `DoltHub API error: ${status}`;
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {};
      if (opts?.apiToken) {
        headers.authorization = `token ${opts.apiToken}`;
      }
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new DoltHubError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DoltHubError) throw error;
      throw new DoltHubError(`DoltHub request failed: ${error}`, 500);
    }
  }

  // --- v2 API transport --------------------------------------------------
  // The v2 API (https://www.dolthub.com/api/v2/...) differs from v1alpha1 in
  // three ways: Bearer auth, a uniform `{ data, meta }` success envelope, and
  // a single RFC 9457 problem-details error model. `makeV2Request` centralizes
  // all three so v2 endpoints only describe method/path/body.

  interface DoltHubV2ProblemDetails {
    status?: number;
    code?: string;
    title?: string;
    detail?: string;
  }

  function v2ProblemDetails(body: unknown): DoltHubV2ProblemDetails {
    if (typeof body !== "object" || body === null) return {};
    const b = body as Record<string, unknown>;
    return {
      status: typeof b.status === "number" ? b.status : undefined,
      code: typeof b.code === "string" ? b.code : undefined,
      title: typeof b.title === "string" ? b.title : undefined,
      detail: typeof b.detail === "string" ? b.detail : undefined,
    };
  }

  function v2Error(status: number, body: unknown): DoltHubError {
    const { code, title, detail } = v2ProblemDetails(body);
    const summary = detail ?? title;
    const message = summary
      ? `DoltHub API error ${status}: ${summary}`
      : `DoltHub API error: ${status}`;
    return new DoltHubError(message, status, body, { code, title, detail });
  }

  async function makeV2EnvelopeRequest<TData, TMeta = DoltHubV2Meta>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<DoltHubV2Envelope<TData, TMeta>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {};
      if (opts?.apiToken) {
        headers.authorization = `Bearer ${opts.apiToken}`;
      }
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw v2Error(res.status, resBody);
      }

      return (await res.json()) as DoltHubV2Envelope<TData, TMeta>;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DoltHubError) throw error;
      throw new DoltHubError(`DoltHub request failed: ${error}`, 500);
    }
  }

  async function makeV2Request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    // Existing v2 endpoints preserve their unwrapped return values. New
    // paginated endpoints can use `makeV2EnvelopeRequest` directly.
    const envelope = await makeV2EnvelopeRequest<T>(method, path, body, signal);
    if (
      typeof envelope === "object" &&
      envelope !== null &&
      "data" in envelope
    ) {
      return envelope.data;
    }
    return envelope as T;
  }

  function buildQuery(
    params: Record<string, string | number | undefined>
  ): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        qs.append(key, String(value));
      }
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
  }

  // sig-ok: semantic DoltHub SQL read namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}{refPath}{query}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/sql
  const sqlRead = Object.assign(
    async (
      req: DoltHubSqlReadRequest,
      signal?: AbortSignal
    ): Promise<DoltHubSqlReadResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const refPath = req.ref ? `/${req.ref}` : "";
      const query = buildQuery({ q: req.query });
      return makeJsonRequest<DoltHubSqlReadResponse>(
        "GET",
        `/api/v1alpha1/${owner}/${database}${refPath}${query}`,
        undefined,
        signal
      );
    },
    { schema: DoltHubSqlReadRequestSchema }
  );

  // sig-ok: semantic DoltHub SQL write namespace over dynamic repo URL
  // POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/write/{fromBranch}/{toBranch}{query}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/sql
  const sqlWrite = Object.assign(
    async (
      req: DoltHubSqlWriteRequest,
      signal?: AbortSignal
    ): Promise<DoltHubSqlWriteResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const fromBranch = encodeURIComponent(req.fromBranch);
      const toBranch = encodeURIComponent(req.toBranch);
      const query = buildQuery({ q: req.query });
      return makeJsonRequest<DoltHubSqlWriteResponse>(
        "POST",
        `/api/v1alpha1/${owner}/${database}/write/${fromBranch}/${toBranch}${query}`,
        undefined,
        signal
      );
    },
    { schema: DoltHubSqlWriteRequestSchema }
  );

  // sig-ok: semantic DoltHub SQL write namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/write{query}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/sql
  const writePoll = Object.assign(
    async (
      req: DoltHubWritePollRequest,
      signal?: AbortSignal
    ): Promise<DoltHubWritePollResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const query = buildQuery({ operationName: req.operationName });
      return makeJsonRequest<DoltHubWritePollResponse>(
        "GET",
        `/api/v1alpha1/${owner}/${database}/write${query}`,
        undefined,
        signal
      );
    },
    { schema: DoltHubWritePollRequestSchema }
  );

  // sig-ok: semantic DoltHub database namespace over API root URL
  // POST https://www.dolthub.com/api/v1alpha1/database
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const databaseCreate = Object.assign(
    async (
      req: DoltHubDatabaseCreateRequest,
      signal?: AbortSignal
    ): Promise<DoltHubDatabaseCreateResponse> => {
      return makeJsonRequest<DoltHubDatabaseCreateResponse>(
        "POST",
        "/api/v1alpha1/database",
        req,
        signal
      );
    },
    { schema: DoltHubDatabaseCreateRequestSchema }
  );

  // sig-ok: semantic DoltHub branches namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/branches
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const branchesList = Object.assign(
    async (
      req: DoltHubBranchesListRequest,
      signal?: AbortSignal
    ): Promise<DoltHubBranchesListResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      return makeJsonRequest<DoltHubBranchesListResponse>(
        "GET",
        `/api/v1alpha1/${owner}/${database}/branches`,
        undefined,
        signal
      );
    },
    { schema: DoltHubBranchesListRequestSchema }
  );

  // sig-ok: semantic DoltHub branches namespace over dynamic repo URL
  // POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/branches
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const branchCreate = Object.assign(
    async (
      req: DoltHubBranchCreateRequest,
      signal?: AbortSignal
    ): Promise<DoltHubBranchCreateResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const body = {
        revisionType: req.revisionType,
        revisionName: req.revisionName,
        newBranchName: req.newBranchName,
      };
      return makeJsonRequest<DoltHubBranchCreateResponse>(
        "POST",
        `/api/v1alpha1/${owner}/${database}/branches`,
        body,
        signal
      );
    },
    { schema: DoltHubBranchCreateRequestSchema }
  );

  // sig-ok: semantic DoltHub pulls namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls{query}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const pullsList = Object.assign(
    async (
      req: DoltHubPullsListRequest,
      signal?: AbortSignal
    ): Promise<DoltHubPullsListResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const query = buildQuery({
        pageToken: req.pageToken,
        filterByState: req.filterByState,
        filterByReviewStatus: req.filterByReviewStatus,
        query: req.query,
      });
      return makeJsonRequest<DoltHubPullsListResponse>(
        "GET",
        `/api/v1alpha1/${owner}/${database}/pulls${query}`,
        undefined,
        signal
      );
    },
    { schema: DoltHubPullsListRequestSchema }
  );

  // sig-ok: semantic DoltHub pulls namespace over dynamic repo URL
  // POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const pullCreate = Object.assign(
    async (
      req: DoltHubPullCreateRequest,
      signal?: AbortSignal
    ): Promise<DoltHubPullCreateResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const body = {
        title: req.title,
        description: req.description,
        fromBranchOwnerName: req.fromBranchOwnerName,
        fromBranchRepoName: req.fromBranchRepoName,
        fromBranchName: req.fromBranchName,
        toBranchOwnerName: req.toBranchOwnerName,
        toBranchRepoName: req.toBranchRepoName,
        toBranchName: req.toBranchName,
      };
      return makeJsonRequest<DoltHubPullCreateResponse>(
        "POST",
        `/api/v1alpha1/${owner}/${database}/pulls`,
        body,
        signal
      );
    },
    { schema: DoltHubPullCreateRequestSchema }
  );

  // sig-ok: semantic DoltHub pulls namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls/{pullId}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const pullGet = Object.assign(
    async (
      req: DoltHubPullGetRequest,
      signal?: AbortSignal
    ): Promise<DoltHubPullGetResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const pullId = encodeURIComponent(req.pullId);
      return makeJsonRequest<DoltHubPullGetResponse>(
        "GET",
        `/api/v1alpha1/${owner}/${database}/pulls/${pullId}`,
        undefined,
        signal
      );
    },
    { schema: DoltHubPullGetRequestSchema }
  );

  // sig-ok: semantic DoltHub pulls namespace over dynamic repo URL
  // POST https://www.dolthub.com/api/v1alpha1/{owner}/{database}/pulls/{pullId}/merge
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/database
  const pullMerge = Object.assign(
    async (
      req: DoltHubPullMergeRequest,
      signal?: AbortSignal
    ): Promise<DoltHubPullMergeResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const pullId = encodeURIComponent(req.pullId);
      return makeJsonRequest<DoltHubPullMergeResponse>(
        "POST",
        `/api/v1alpha1/${owner}/${database}/pulls/${pullId}/merge`,
        undefined,
        signal
      );
    },
    { schema: DoltHubPullMergeRequestSchema }
  );

  // sig-ok: semantic DoltHub user namespace over API root URL
  // GET https://www.dolthub.com/api/v1alpha1/user
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/user
  const userGet = Object.assign(
    async (signal?: AbortSignal): Promise<DoltHubUserGetResponse> => {
      return makeJsonRequest<DoltHubUserGetResponse>(
        "GET",
        "/api/v1alpha1/user",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: semantic DoltHub v2 forks namespace over dynamic repo URL
  // POST https://www.dolthub.com/api/v2/databases/{owner}/{database}/forks
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/database
  const forkCreate = Object.assign(
    async (
      req: DoltHubForkCreateRequest,
      signal?: AbortSignal
    ): Promise<DoltHubForkCreateResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      return makeV2Request<DoltHubForkCreateResponse>(
        "POST",
        `/api/v2/databases/${owner}/${database}/forks`,
        { owner: req.newOwner },
        signal
      );
    },
    { schema: DoltHubForkCreateRequestSchema }
  );

  // sig-ok: semantic DoltHub v2 operations namespace over API root URL
  // GET https://www.dolthub.com/api/v2/operations/{operationId}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/operations
  const operationsGet = Object.assign(
    async (
      req: DoltHubOperationsGetRequest,
      signal?: AbortSignal
    ): Promise<DoltHubOperationsGetResponse> => {
      const operationId = encodeURIComponent(req.id);
      return makeV2Request<DoltHubOperationsGetResponse>(
        "GET",
        `/api/v2/operations/${operationId}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: semantic DoltHub v2 user namespace over API root URL
  // GET https://www.dolthub.com/api/v2/user
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/user
  const userGetV2 = Object.assign(
    async (signal?: AbortSignal): Promise<DoltHubV2UserGetResponse> => {
      return makeV2Request<DoltHubV2UserGetResponse>(
        "GET",
        "/api/v2/user",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: semantic DoltHub v2 SQL read namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v2/databases/{owner}/{database}/sql{query}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/database
  const sqlReadV2 = Object.assign(
    async (
      req: DoltHubV2SqlReadRequest,
      signal?: AbortSignal
    ): Promise<DoltHubV2SqlReadResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const query = buildQuery({ ref: req.ref, q: req.query });
      return makeV2Request<DoltHubV2SqlReadResponse>(
        "GET",
        `/api/v2/databases/${owner}/${database}/sql${query}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: v1alpha1.sql.write parity — the endpoint keeps the sibling sql.read
  // namespace instead of mirroring the literal `sql-writes` URL segment
  // POST https://www.dolthub.com/api/v2/databases/{owner}/{database}/sql-writes
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/database
  const sqlWriteV2 = Object.assign(
    async (
      req: DoltHubV2SqlWriteRequest,
      signal?: AbortSignal
    ): Promise<DoltHubV2SqlWriteResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      // A v2 SQL write is asynchronous: upstream answers `202` with an
      // OperationRef, so the envelope's `data` is unwrapped exactly like the
      // sibling async `forks.create` (not preserved like the synchronous
      // `branches.create` / `databases.create`).
      //
      // The body is built from typed fields explicitly rather than spreading
      // `req`, so `owner`/`database` cannot leak out of the path and onto the
      // wire, and the serialized object carries exactly the three documented
      // snake_case keys.
      return makeV2Request<DoltHubV2SqlWriteResponse>(
        "POST",
        `/api/v2/databases/${owner}/${database}/sql-writes`,
        { from_branch: req.fromBranch, to_branch: req.toBranch, q: req.query },
        signal
      );
    },
    { schema: DoltHubV2SqlWriteRequestSchema }
  );

  // sig-ok: semantic DoltHub v2 branches namespace over dynamic repo URL
  // GET https://www.dolthub.com/api/v2/databases/{owner}/{database}/branches{query}
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/database
  const branchesListV2 = Object.assign(
    async (
      req: DoltHubV2BranchesListRequest,
      signal?: AbortSignal
    ): Promise<DoltHubV2BranchesListResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      const query = buildQuery({ page_token: req.pageToken });
      return makeV2EnvelopeRequest(
        "GET",
        `/api/v2/databases/${owner}/${database}/branches${query}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: semantic DoltHub v2 branches namespace over dynamic repo URL
  // POST https://www.dolthub.com/api/v2/databases/{owner}/{database}/branches
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/database
  const branchCreateV2 = Object.assign(
    async (
      req: DoltHubV2BranchCreateRequest,
      signal?: AbortSignal
    ): Promise<DoltHubV2BranchCreateResponse> => {
      const owner = encodeURIComponent(req.owner);
      const database = encodeURIComponent(req.database);
      // Only body fields go in the JSON body; owner/database stay in the path.
      // v2 branch creation is synchronous, so the created branch is preserved
      // inside the `{ data, meta }` envelope (unlike the async fork endpoint).
      return makeV2EnvelopeRequest(
        "POST",
        `/api/v2/databases/${owner}/${database}/branches`,
        { name: req.name, from: req.from },
        signal
      );
    },
    { schema: DoltHubV2BranchCreateRequestSchema }
  );

  // sig-ok: semantic DoltHub v2 databases namespace over API root URL
  // POST https://www.dolthub.com/api/v2/databases
  // Docs: https://www.dolthub.com/docs/products/dolthub/api/v2/database
  const databaseCreateV2 = Object.assign(
    async (
      req: DoltHubV2DatabaseCreateRequest,
      signal?: AbortSignal
    ): Promise<DoltHubV2DatabaseCreateResponse> => {
      // Unlike the all-optional v1alpha1 create body, the v2 spec requires
      // owner, name, and visibility. `visibility` is deliberately narrowed to
      // the public/private union: the v2 spec types it as a free-form string,
      // but v1alpha1 uses that union and no other value is documented.
      //
      // The body is built from typed fields explicitly rather than spreading
      // `req`, so no unexpected key can reach the wire. `description` is
      // omitted entirely when undefined rather than serialized as null.
      //
      // v2 database creation is synchronous, so the created database is
      // preserved inside the `{ data, meta }` envelope.
      return makeV2EnvelopeRequest(
        "POST",
        "/api/v2/databases",
        {
          owner: req.owner,
          name: req.name,
          visibility: req.visibility,
          ...(req.description !== undefined
            ? { description: req.description }
            : {}),
        },
        signal
      );
    },
    { schema: DoltHubV2DatabaseCreateRequestSchema }
  );

  return {
    v1alpha1: {
      sql: {
        read: sqlRead,
        write: sqlWrite,
        writePoll: writePoll,
      },
      database: {
        create: databaseCreate,
      },
      branches: {
        list: branchesList,
        create: branchCreate,
      },
      pulls: {
        list: pullsList,
        create: pullCreate,
        get: pullGet,
        merge: pullMerge,
      },
      user: {
        get: userGet,
      },
    },
    api: {
      v2: {
        databases: {
          create: databaseCreateV2,
          branches: {
            list: branchesListV2,
            create: branchCreateV2,
          },
          forks: {
            create: forkCreate,
          },
          sql: {
            read: sqlReadV2,
            write: sqlWriteV2,
          },
        },
        operations: {
          get: operationsGet,
        },
        user: {
          get: userGetV2,
        },
      },
    },
  };
}
