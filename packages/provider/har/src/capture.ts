import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { exchangeToEntry, serializeExchange } from "./exchange.js";
import { scrubHar } from "./scrub.js";
import { providerHosts } from "./provider-hosts.js";
import type { ApicityCallMetadata, Har, HarEntry } from "./types.js";

export interface HarCaptureOptions {
  dir: string;
  mode: "all" | "failures";
  providers?: string[];
  maxBodyBytes?: number;
  /** Default context of every call; a call's own `context` merges over it. */
  context?: Record<string, unknown>;
  onError?: (error: unknown) => void;
  clock?: () => number;
  idFactory?: () => string;
}
export interface HarCallMeta {
  provider: string;
  endpoint: string;
  input: unknown;
  /** Merged shallowly over the capture's `context` for this call only. */
  context?: Record<string, unknown>;
}
export interface HarFetchHost {
  fetch: typeof globalThis.fetch;
}
export interface HarCapture {
  fetch: typeof globalThis.fetch;
  call<T>(meta: HarCallMeta, fn: () => T | Promise<T>): Promise<T>;
  install(host?: HarFetchHost): () => void;
  flush(): Promise<void>;
  close(): Promise<void>;
}
interface CallScope {
  metadata: ApicityCallMetadata;
  exchanges: Promise<HarEntry | undefined>[];
  networkError: boolean;
  finished: boolean;
}

function version(): string {
  // Source execution and the shipped dist/src layout.
  for (const path of ["../package.json", "../../package.json"]) {
    try {
      return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"))
        .version as string;
    } catch {
      // Try the installed layout.
    }
  }
  return "unknown";
}
function segment(value: string): string {
  return encodeURIComponent(value).replace(/\./g, "%2E");
}
function endpointSegment(value: string): string {
  // Preserve dot paths, but never permit traversal or a directory separator.
  return value
    .split(".")
    .map(segment)
    .map((v) => v || "%2E")
    .join(".");
}
function errorDetails(
  error: unknown
): NonNullable<ApicityCallMetadata["error"]> {
  const object = error && typeof error === "object" ? error : {};
  return {
    name: "name" in object ? String(object.name) : "Error",
    message: "message" in object ? String(object.message) : String(error),
    ...("status" in object && typeof object.status === "number"
      ? { status: object.status }
      : {}),
    ...("code" in object &&
    (typeof object.code === "string" || typeof object.code === "number")
      ? { code: object.code }
      : {}),
  };
}
function requestUrl(input: Parameters<typeof fetch>[0]): string {
  return input instanceof Request ? input.url : String(input);
}
function matchesProvider(url: string, providers: string[]): boolean {
  const hostname = new URL(url).hostname;
  return providers.some((provider) =>
    (providerHosts[provider] ?? []).some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    )
  );
}

/** Opt-in Node.js capture. Nested calls join the outer scope. */
export function createHarCapture(options: HarCaptureOptions): HarCapture {
  const storage = new AsyncLocalStorage<CallScope>();
  const original = globalThis.fetch;
  const clock = options.clock ?? Date.now;
  const idFactory = options.idFactory ?? randomUUID;
  const apicityVersion = version();
  const pending = new Set<Promise<void>>();
  const uninstallers = new Set<() => void>();
  const wrappers = new WeakSet<typeof fetch>();
  const fingerprints = new WeakMap<HarEntry, string>();
  let disabled = false;
  let closed = false;
  let writes = Promise.resolve();

  function fail(error: unknown): void {
    if (disabled) return;
    disabled = true;
    try {
      options.onError?.(error);
    } catch {
      // Diagnostics must never affect the application.
    }
  }
  function track(task: Promise<void>): void {
    const safe = task.catch(fail);
    pending.add(safe);
    void safe.then(() => pending.delete(safe));
  }
  async function persist(scope: CallScope): Promise<void> {
    const entries = (await Promise.all(scope.exchanges)).filter(
      (entry): entry is HarEntry => entry !== undefined
    );
    if (
      disabled ||
      (options.mode === "failures" && scope.metadata.outcome === "ok")
    )
      return;
    const collapsed: HarEntry[] = [];
    let lastKey: string | undefined;
    for (const entry of entries) {
      const key = fingerprints.get(entry);
      const previous = collapsed.at(-1);
      // Only reads are polls: identical submissions must remain distinct.
      if (
        entry.request.method === "GET" &&
        key !== undefined &&
        key === lastKey &&
        previous
      ) {
        previous._apicity!.pollRepeat =
          (previous._apicity!.pollRepeat ?? 0) + 1;
      } else {
        collapsed.push(entry);
      }
      lastKey = key;
    }
    const har: Har = scrubHar({
      log: {
        version: "1.2",
        creator: { name: "apicity", version: apicityVersion },
        _apicity: scope.metadata,
        entries: collapsed,
      },
    });
    const meta = har.log._apicity!;
    const file = join(
      segment(meta.provider),
      endpointSegment(meta.endpoint),
      `${meta.startedAt.replace(/:/g, "-")}-${segment(meta.callId)}.har`
    );
    // Serialize before enqueueing writes: only scrubbed bytes can reach disk.
    const content = JSON.stringify(har, null, 2) + "\n";
    const index =
      JSON.stringify({
        ts: meta.startedAt,
        callId: meta.callId,
        provider: meta.provider,
        endpoint: meta.endpoint,
        outcome: meta.outcome,
        status: meta.status,
        file,
        context: meta.context,
      }) + "\n";
    writes = writes
      .then(async () => {
        if (disabled) return;
        // Create the private root only when a capture is actually persisted.
        await mkdir(options.dir, { recursive: true, mode: 0o700 });
        const target = join(options.dir, file);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, content, { flag: "wx" });
        await appendFile(join(options.dir, "index.jsonl"), index);
      })
      .catch(fail);
    await writes;
  }

  async function call<T>(
    meta: HarCallMeta,
    fn: () => T | Promise<T>
  ): Promise<T> {
    const outer = storage.getStore();
    if (disabled || closed || (outer && !outer.finished)) return await fn();
    let scope: CallScope;
    let started: number;
    try {
      started = clock();
      const { context, ...fields } = meta;
      scope = {
        metadata: {
          ...fields,
          callId: idFactory(),
          outcome: "ok",
          context: context
            ? { ...options.context, ...context }
            : options.context,
          apicityVersion,
          runtime: `node ${process.version}`,
          startedAt: new Date(started).toISOString(),
          durationMs: 0,
        },
        exchanges: [],
        networkError: false,
        finished: false,
      };
    } catch (error) {
      fail(error);
      return await fn();
    }
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    track(finished.then(() => persist(scope)));
    return await storage.run(scope, async () => {
      try {
        return await fn();
      } catch (error) {
        try {
          const details = errorDetails(error);
          scope.metadata.error = details;
          scope.metadata.status = details.status ?? 0;
          scope.metadata.outcome = scope.networkError
            ? "network_error"
            : scope.exchanges.length === 0
              ? "local_error"
              : "provider_error";
          if (scope.exchanges.length === 0) {
            scope.exchanges.push(
              exchangeToEntry(
                new Request(
                  `https://local.invalid/${encodeURIComponent(meta.endpoint)}`
                ),
                new Error(details.message),
                { startedAt: scope.metadata.startedAt, durationMs: 0 }
              )
                .then((entry) => {
                  entry._apicity = { kind: "local", error: details };
                  return entry;
                })
                .catch((error) => {
                  fail(error);
                  return undefined;
                })
            );
          }
        } catch (captureError) {
          fail(captureError);
        }
        throw error;
      } finally {
        scope.finished = true;
        try {
          scope.metadata.durationMs = Math.max(0, clock() - started);
          if (scope.networkError) scope.metadata.outcome = "network_error";
        } catch (error) {
          fail(error);
        }
        finish();
      }
    });
  }

  async function record(
    base: typeof fetch,
    scope: CallScope,
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ): Promise<Response> {
    let request: Request;
    let snapshot: Request;
    let started: number;
    try {
      started = clock();
      // Clone a Request before constructing: never lock the application's body.
      request = new Request(
        input instanceof Request ? input.clone() : input,
        init
      );
      snapshot = request.clone();
    } catch (error) {
      fail(error);
      return await base(input, init);
    }
    // Reserve order before concurrent requests finish.
    let complete!: (entry: HarEntry | undefined) => void;
    scope.exchanges.push(
      new Promise((resolve) => {
        complete = resolve;
      })
    );
    function serialize(response: Response | Error): void {
      try {
        const durationMs = Math.max(0, clock() - started);
        void serializeExchange(
          snapshot,
          response,
          {
            startedAt: new Date(started),
            durationMs,
          },
          { maxBodyBytes: options.maxBodyBytes }
        ).then(
          ({ entry, responseBodySha256 }) => {
            fingerprints.set(
              entry,
              JSON.stringify([
                snapshot.method,
                snapshot.url,
                entry.response.status,
                responseBodySha256,
              ])
            );
            complete(entry);
          },
          (error) => {
            fail(error);
            complete(undefined);
          }
        );
      } catch (error) {
        fail(error);
        complete(undefined);
      }
    }
    try {
      const response = await base(request);
      scope.metadata.status = response.status;
      serialize(response);
      return response;
    } catch (error) {
      scope.networkError = true;
      serialize(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  const capturedFetch: typeof fetch = async (input, init) => {
    if (disabled || closed) return await original(input, init);
    const scope = storage.getStore();
    if (scope && !scope.finished)
      return await record(original, scope, input, init);
    return await call(
      { provider: "unknown", endpoint: "unscoped", input: undefined },
      () => record(original, storage.getStore()!, input, init)
    );
  };
  function install(host: HarFetchHost = globalThis): () => void {
    if (closed || disabled) return () => {};
    const base = host.fetch;
    const wrapped: typeof fetch = async (input, init) => {
      const scope = storage.getStore();
      if (
        disabled ||
        closed ||
        !scope ||
        scope.finished ||
        base === capturedFetch ||
        wrappers.has(base)
      )
        return await base(input, init);
      let allowed = true;
      try {
        allowed =
          !options.providers ||
          matchesProvider(requestUrl(input), options.providers);
      } catch (error) {
        fail(error);
        allowed = false;
      }
      if (!allowed) return await base(input, init);
      return await record(base, scope, input, init);
    };
    wrappers.add(wrapped);
    host.fetch = wrapped;
    const uninstall = () => {
      if (host.fetch === wrapped) host.fetch = base;
      uninstallers.delete(uninstall);
    };
    uninstallers.add(uninstall);
    return uninstall;
  }
  async function flush(): Promise<void> {
    while (pending.size) await Promise.all([...pending]);
  }
  return {
    fetch: capturedFetch,
    call,
    install,
    flush,
    async close() {
      for (const uninstall of [...uninstallers].reverse()) uninstall();
      closed = true;
      await flush();
    },
  };
}
