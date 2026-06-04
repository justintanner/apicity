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
  };
}
