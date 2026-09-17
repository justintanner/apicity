import type { CallShape } from "./call-shapes.js";
import type { CatalogEntry } from "./catalog.js";
import { CliError } from "./errors.js";
import type { InstantiatedProvider } from "./providers.js";
import { resolveEndpointFn } from "./registry.js";

export interface BindArgumentsOptions {
  entry: CatalogEntry;
  shape?: CallShape;
  /** Positional values keyed by parameter name, from `parseEndpointFlags`. */
  positional: Record<string, string>;
  body?: unknown;
  otp?: string;
}

/**
 * Turn one parsed invocation into the argument list its endpoint function
 * takes.
 *
 * Positional placeholders lead, in URL order. An absent optional one is
 * skipped rather than passed as `undefined`, because the endpoint's own
 * overload then reads the body from that slot — openai's `v1.files` GET is
 * `files(idOrOpts?, signal?)`, so `apicity openai v1.files --method GET
 * --data '{"purpose":"…"}'` must call `files(body)` (plan F-7).
 *
 * A paid row always ends with the approval argument, present or not: the gate
 * answers `otp-missing` for an absent one, which is the error the caller needs
 * to see rather than a silent unapproved call.
 */
export function bindArguments(options: BindArgumentsOptions): unknown[] {
  const args: unknown[] = [];

  for (const positional of options.shape?.positional ?? []) {
    const value = options.positional[positional.param];
    if (value === undefined) continue;
    args.push(value);
  }

  if (options.entry.paid) {
    args.push(options.body ?? {});
    args.push(options.otp === undefined ? undefined : { otp: options.otp });
    return args;
  }

  if (!isEmptyBody(options.body)) args.push(options.body);
  return args;
}

/**
 * Call the endpoint the catalog row names, buffering a streamed result.
 *
 * The null branch cannot be reached by a row `cli-catalog.test.ts` resolves —
 * it walks every row against every provider tree — but a provider that
 * renames a namespace between releases would land here, and "the tree has no
 * function at this path" is a far better answer than `fn is not a function`.
 */
export async function callEndpoint(
  instance: InstantiatedProvider,
  entry: CatalogEntry,
  args: unknown[]
): Promise<unknown> {
  const fn = resolveEndpointFn(instance, entry.method, entry.dotPath);
  if (!fn) {
    throw new CliError(
      "api",
      `the provider tree has no function at \`${entry.dotPath}\` ` +
        `for \`${entry.method}\``,
      { hint: `run: apicity commands --provider ${entry.provider}` }
    );
  }
  return maybeBuffer(await fn(...args));
}

/**
 * Collect an async-iterable result into an array (REQ-004). This is parity
 * with the server this CLI replaced, not a streaming mode: the CLI prints one
 * document, so a streamed response is buffered and then printed whole.
 */
export async function maybeBuffer(value: unknown): Promise<unknown> {
  if (
    value !== null &&
    typeof value === "object" &&
    Symbol.asyncIterator in (value as object)
  ) {
    const buffered: unknown[] = [];
    for await (const chunk of value as AsyncIterable<unknown>) {
      buffered.push(chunk);
    }
    return buffered;
  }
  return value;
}

/**
 * Merge the request-field flags over the parsed body, so `--bucket x` and
 * `--data '{"bucket":"x"}'` produce the same request object.
 */
export function mergeRequestFields(
  body: unknown,
  fields: Record<string, string>
): unknown {
  if (Object.keys(fields).length === 0) return body;
  if (body === undefined) return { ...fields };
  if (!isPlainObject(body)) {
    throw new CliError("usage", "request-field flags need a JSON object body", {
      hint: "pass the fields inside --data, or drop the object body",
    });
  }
  return { ...body, ...fields };
}

function isEmptyBody(body: unknown): boolean {
  if (body === undefined) return true;
  return isPlainObject(body) && Object.keys(body).length === 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
