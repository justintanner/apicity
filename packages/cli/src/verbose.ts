/** One `--verbose` line, written to stderr by the caller. */
export type VerboseLog = (line: string) => void;

/** The subset of the global object the wrapper replaces. */
export interface FetchHost {
  fetch: typeof globalThis.fetch;
}

/**
 * Log one line per HTTP call for the lifetime of this process.
 *
 * The CLI installs this before constructing providers so their default fetch
 * captures the wrapper. Every network factory also accepts an injected fetch.
 * The wrapper reads the method,
 * the URL, the status and the elapsed time and nothing else — never a header,
 * never a body, so a credential cannot reach the log.
 *
 * Returns the function that puts the original `fetch` back, which is what
 * keeps the wrapper out of the next test in the same process.
 */
export function installVerboseFetch(
  log: VerboseLog,
  host: FetchHost = globalThis as unknown as FetchHost
): () => void {
  const original = host.fetch;

  host.fetch = async (
    input: Parameters<typeof globalThis.fetch>[0],
    init?: Parameters<typeof globalThis.fetch>[1]
  ): Promise<Response> => {
    const method = init?.method ?? requestMethod(input) ?? "GET";
    const url = requestUrl(input);
    const started = Date.now();
    try {
      const response = await original(input, init);
      log(
        `[apicity] ${method} ${url} → ${response.status} ` +
          `(${Date.now() - started} ms)`
      );
      return response;
    } catch (err) {
      log(
        `[apicity] ${method} ${url} → ${errorName(err)} ` +
          `(${Date.now() - started} ms)`
      );
      throw err;
    }
  };

  return () => {
    host.fetch = original;
  };
}

function requestUrl(input: Parameters<typeof globalThis.fetch>[0]): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return (input as Request).url;
}

function requestMethod(
  input: Parameters<typeof globalThis.fetch>[0]
): string | undefined {
  if (typeof input === "string" || input instanceof URL) return undefined;
  const method = (input as Request).method;
  return typeof method === "string" ? method : undefined;
}

function errorName(err: unknown): string {
  if (err instanceof Error) return err.name;
  return "Error";
}
