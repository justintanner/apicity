import { readFileSync } from "node:fs";

import {
  parseEndpointFlags,
  parseGlobalFlags,
  requireRequestFields,
  resolveRequestBody,
  type GlobalFlags,
  type StdinReader,
} from "./args.js";
import { CALL_SHAPES, callShapeKey } from "./call-shapes.js";
import { findEntries, loadCatalog, selectEntry } from "./catalog.js";
import type { CatalogEntry } from "./catalog.js";
import {
  isProviderConfigured,
  describeEnvVars,
  resolveCredentials,
} from "./credentials.js";
import {
  createWriter,
  defaultWriter,
  printUsage,
  resolveOutputDirectory,
  type CliWriter,
} from "./envelope.js";
import { CliError, classifyError, type ClassifyContext } from "./errors.js";
import { runCommands, runDescribe, runProviders } from "./discovery.js";
import { isHelpTopic, printHelpTopic } from "./help.js";
import { bindArguments, callEndpoint, mergeRequestFields } from "./invoke.js";
import { runSkillCommand } from "./skill.js";
import { runSetupCommand } from "./setup.js";
import { runDoctor } from "./doctor.js";
import {
  downloadUrlsInResult,
  guessExtension,
  isBinary,
  writeBinary,
} from "./output.js";
import {
  instantiateProvider,
  PROVIDERS,
  type InstantiatedProvider,
  type ProviderOverrides,
  type ProviderSpec,
} from "./providers.js";
import { installVerboseFetch } from "./verbose.js";
import { readPackageVersion } from "./version.js";

/**
 * Dispatch one `apicity` invocation and answer its exit status.
 *
 * W1 knew `help` and `version`; W2 adds the three discovery commands,
 * the help topics and the `apicity <provider>` shorthand; W4 adds `skill` and
 * `skill install`; W5 adds `setup` and `doctor`. Every later slice adds its
 * command here and in
 * `BUILTIN_COMMANDS` rather than introducing a second entrypoint.
 *
 * Failures surface through the same writer the endpoint form uses, with the
 * code's exit status: the commands below raise `CliError` and never print a
 * stack.
 */
export async function runMain(
  argv: string[],
  writer: CliWriter = defaultWriter,
  options: EndpointOptions = {}
): Promise<number> {
  const [first, ...rest] = argv;

  // A built-in failure follows the same output rule as an endpoint failure
  // (D-5): the envelope for `--json` and for a stdout that is not a terminal,
  // `Error:`/`hint:` for a human at one. `setup` and `doctor` report success
  // through this rule and failure through here, so the two paths diverging
  // read as one command contradicting itself.
  const out = createWriter({
    json: requestsJson(rest),
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: writer.out,
    stderr: writer.err,
  });

  try {
    return await dispatch(first, rest, writer, options);
  } catch (err) {
    if (err instanceof CliError) return out.failure(err);
    throw err;
  }
}

/**
 * Whether `--json` was asked for, read before anything can fail.
 *
 * `parseGlobalFlags` owns the flag table and stays the one reader of it, but
 * it raises on a value flag with no value — and that failure is `dispatch`'s
 * to report, with its own message and against its own command's grammar.
 * Here a throw means only that no `--json` was parsed, which leaves the TTY
 * rule to select the form on its own.
 */
function requestsJson(argv: string[]): boolean {
  try {
    return parseGlobalFlags(argv).flags.json;
  } catch {
    return false;
  }
}

async function dispatch(
  first: string | undefined,
  rest: string[],
  writer: CliWriter,
  options: EndpointOptions
): Promise<number> {
  if (
    first === undefined ||
    first === "--help" ||
    first === "-h" ||
    (first === "help" && rest.length === 0)
  ) {
    printUsage(writer);
    return 0;
  }

  if (first === "help") {
    const [topic] = rest;
    if (topic !== undefined && isHelpTopic(topic)) {
      printHelpTopic(writer, topic);
      return 0;
    }
    throw new CliError("not_found", `unknown help topic: ${topic}`, {
      hint: "run: apicity help",
    });
  }

  if (first === "version" || first === "--version") {
    writer.out(readPackageVersion());
    return 0;
  }

  // Before the built-in flag parser, like the endpoint form: `apicity skill`
  // prints the file raw and `--json` does not wrap it, so its argv is read by
  // the command rather than by the shared table.
  if (first === "skill") {
    return runSkillCommand(rest, writer, {
      env: options.env,
      stdoutIsTTY: options.stdoutIsTTY,
    });
  }

  // `setup` and `doctor` read their own argv for the same reason: `--remove`
  // and a stray word are theirs to interpret, not the shared table's.
  if (first === "setup") {
    return runSetupCommand(rest, writer, {
      env: options.env,
      stdoutIsTTY: options.stdoutIsTTY,
    });
  }

  if (first === "doctor") {
    return runDoctor(rest, writer, {
      env: options.env,
      stdoutIsTTY: options.stdoutIsTTY,
      cwd: options.cwd,
    });
  }

  // The endpoint form is checked before the built-in flag parser runs: its
  // argv carries the addressed row's own flags, which that parser has no
  // table for. No provider shares a name with a built-in.
  if (Object.prototype.hasOwnProperty.call(PROVIDERS, first)) {
    return runEndpoint(first, rest, writer, options);
  }

  const flags = parseFlags(rest);
  // The discovery commands answer under the same output rule as every other
  // command (D-5), so they take the same three inputs.
  const output = {
    json: flags.json,
    quiet: flags.quiet,
    stdoutIsTTY: options.stdoutIsTTY,
  };

  if (first === "commands") {
    return runCommands(writer, {
      ...output,
      provider: flags.options.provider,
    });
  }

  if (first === "providers") {
    return runProviders(writer, output);
  }

  if (first === "describe") {
    const [provider, dotPath] = flags.positional;
    if (provider === undefined || dotPath === undefined) {
      throw new CliError("usage", "describe needs a provider and a dotPath", {
        hint: "run: apicity describe <provider> <dotPath> [--method GET]",
      });
    }
    return runDescribe(writer, provider, dotPath, {
      ...output,
      method: flags.options.method,
    });
  }

  throw new CliError("not_found", `unknown command: ${first}`, {
    hint: "run: apicity providers",
  });
}

interface ParsedFlags {
  positional: string[];
  options: Record<string, string>;
  json: boolean;
  quiet: boolean;
}

/**
 * Split `--flag value`, `--flag=value` and the bare `--json` and `--quiet` out
 * of the argv tail.
 *
 * Deliberately small, and deliberately separate from `parseGlobalFlags` in
 * `args.ts`. This parser serves the discovery commands — `commands`,
 * `providers` and `describe` — which take a handful of string options and no
 * repeated or negated flags. The endpoint form uses `args.ts`, because its
 * grammar is the addressed row's own call shape, which only that module knows
 * how to read. The two parsers answer different grammars and both stay.
 */
function parseFlags(argv: string[]): ParsedFlags {
  const positional: string[] = [];
  const options: Record<string, string> = {};
  let json = false;
  let quiet = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const body = arg.slice(2);
    if (body === "json") {
      json = true;
      continue;
    }
    if (body === "quiet") {
      quiet = true;
      continue;
    }
    const eq = body.indexOf("=");
    if (eq !== -1) {
      options[body.slice(0, eq)] = body.slice(eq + 1);
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      throw new CliError("usage", `${arg} needs a value`);
    }
    options[body] = next;
    i++;
  }

  return { positional, options, json, quiet };
}

// ---------------------------------------------------------------------------
// the endpoint form: apicity <provider> <dotPath> [flags]
// ---------------------------------------------------------------------------

/** How the endpoint branch reaches a provider tree; a test passes a fake. */
export type ProviderInstantiator = (
  name: string,
  spec: ProviderSpec,
  paygateSecret: string | undefined,
  overrides: ProviderOverrides
) => Promise<InstantiatedProvider | null>;

export interface EndpointOptions {
  env?: NodeJS.ProcessEnv;
  /** Injected so a test can drive both halves of the output rule (D-5). */
  stdoutIsTTY?: boolean;
  readStdin?: StdinReader;
  instantiate?: ProviderInstantiator;
  /** Seam: the 1Password read, so a test never spawns `op`. */
  readSecret?: (ref: string) => Promise<string>;
  installVerbose?: (log: (line: string) => void) => void;
  cwd?: string;
}

/**
 * Call one endpoint, or answer why it could not be called.
 *
 * Every step is inside one `try`: catalog → shape → flags → body →
 * credentials → instantiate → bind → call → persist → write. Whatever a
 * provider throws — its own error class, a pay-gate refusal, a transport
 * failure — leaves through `classifyError` and the same writer, so a caller
 * reads one envelope and one exit status rather than a stack trace.
 */
export async function runEndpoint(
  provider: string,
  argv: string[],
  writer: CliWriter,
  options: EndpointOptions = {}
): Promise<number> {
  const env = options.env ?? process.env;
  const context: ClassifyContext = {};
  let out = createWriter({
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: writer.out,
    stderr: writer.err,
  });

  try {
    const { flags, rest } = parseGlobalFlags(argv);
    out = createWriter({
      json: flags.json,
      quiet: flags.quiet,
      stdoutIsTTY: options.stdoutIsTTY,
      stdout: writer.out,
      stderr: writer.err,
    });

    const [first, ...endpointArgv] = rest;
    // `apicity openai` is `apicity commands --provider openai`: the first
    // thing anyone types after learning a provider exists.
    if (first === undefined) {
      return await runCommands(writer, {
        json: flags.json,
        quiet: flags.quiet,
        stdoutIsTTY: options.stdoutIsTTY,
        provider,
        env,
      });
    }
    if (first.startsWith("-")) {
      throw new CliError("usage", `unknown flag: ${first}`, {
        hint: `run: apicity commands --provider ${provider}`,
      });
    }

    const dotPath = first;
    context.dotPath = dotPath;
    context.dataFile = flags.dataFile;

    const catalog = await loadCatalog({ env });
    const entries = findEntries(catalog, provider, dotPath);
    if (entries.length === 0) {
      throw new CliError("not_found", `no endpoint at ${provider} ${dotPath}`, {
        hint: `run: apicity commands --provider ${provider}`,
      });
    }

    if (flags.help) {
      return await describeForHelp(writer, provider, dotPath, entries, flags, {
        env,
        stdoutIsTTY: options.stdoutIsTTY,
      });
    }

    const entry = selectEntry(entries, flags.method);
    const shape = CALL_SHAPES[callShapeKey(provider, entry.method, dotPath)];
    const bound = parseEndpointFlags(endpointArgv, shape);
    const body = await resolveRequestBody(flags, options.readStdin);
    const request = mergeRequestFields(body, bound.fields);
    requireRequestFields(shape, request);

    await resolveCredentials({
      provider,
      flags,
      env,
      readSecret: options.readSecret,
    });
    if (!isProviderConfigured(provider, env)) {
      throw new CliError("auth", `no credential configured for ${provider}`, {
        hint:
          `set ${describeEnvVars(provider)}, or pass ` +
          "--env-file / --op-vault; see apicity doctor",
      });
    }

    if (flags.verbose) {
      (options.installVerbose ?? installVerboseFetch)((line) =>
        writer.err(line)
      );
    }

    const paygateSecretFile =
      flags.paygateSecretFile ?? env.APICITY_PAYGATE_SECRET_FILE;
    context.paygateSecretFile = paygateSecretFile;

    const instantiate = options.instantiate ?? instantiateProvider;
    const instance = await instantiate(
      provider,
      PROVIDERS[provider],
      readPaygateSecret(paygateSecretFile),
      factoryOverrides(flags)
    );
    if (!instance) {
      throw new CliError("auth", `no credential configured for ${provider}`, {
        hint: `set ${describeEnvVars(provider)}; see apicity doctor`,
      });
    }

    const result = await callEndpoint(
      instance,
      entry,
      bindArguments({
        entry,
        shape,
        positional: bound.positional,
        body: request,
        otp: flags.otp,
      })
    );

    const data = await persistResult(
      entry,
      result,
      resolveOutputDirectory(flags.outputDir, env, options.cwd)
    );
    return out.success(data);
  } catch (err) {
    return out.failure(classifyError(err, context));
  }
}

/**
 * `--help` on the endpoint form is `apicity describe`.
 *
 * A dotPath carrying several methods is ambiguous for a *call* — picking one
 * would spend money on a guess — but not for a description: the caller is
 * reading, and the POST row is the one that carries the request schema they
 * came for. The other methods are named on stderr, which keeps stdout to the
 * one document the contract allows.
 */
async function describeForHelp(
  writer: CliWriter,
  provider: string,
  dotPath: string,
  entries: CatalogEntry[],
  flags: GlobalFlags,
  options: Pick<EndpointOptions, "env" | "stdoutIsTTY">
): Promise<number> {
  const method = flags.method ?? preferredHelpMethod(entries);
  if (method !== undefined && entries.length > 1) {
    const others = entries
      .map((entry) => entry.method)
      .filter((name) => name !== method.toUpperCase());
    writer.err(
      `[apicity] ${provider} ${dotPath} also answers ${others.join(", ")} — ` +
        "pass --method to describe one of those"
    );
  }
  return runDescribe(writer, provider, dotPath, {
    json: flags.json,
    quiet: flags.quiet,
    stdoutIsTTY: options.stdoutIsTTY,
    method,
    env: options.env,
  });
}

function preferredHelpMethod(entries: CatalogEntry[]): string | undefined {
  if (entries.length <= 1) return undefined;
  const post = entries.find((entry) => entry.method === "POST");
  return (post ?? entries[0]).method;
}

function factoryOverrides(flags: GlobalFlags): ProviderOverrides {
  const overrides: ProviderOverrides = {};
  if (flags.baseUrl !== undefined) overrides.baseURL = flags.baseUrl;
  if (flags.timeout !== undefined) {
    const timeout = Number(flags.timeout);
    if (!Number.isFinite(timeout) || timeout <= 0) {
      throw new CliError(
        "usage",
        `--timeout ${flags.timeout} is not a number`,
        {
          hint: "--timeout takes milliseconds, e.g. --timeout 30000",
        }
      );
    }
    overrides.timeout = timeout;
  }
  return overrides;
}

/**
 * Read the shared pay-gate secret, only to hand to the factory.
 *
 * The CLI is the code client and never the minter: it verifies an OTP a human
 * minted out of band with `apicity-paygate`, so this value reaches the
 * provider's gate and nothing else — never an envelope, a log line or a hint.
 */
function readPaygateSecret(path: string | undefined): string | undefined {
  if (path === undefined || path === "") return undefined;
  let secret: string;
  try {
    secret = readFileSync(path, "utf8").trim();
  } catch (cause) {
    throw new CliError(
      "usage",
      `--paygate-secret-file ${path} could not be read`,
      { hint: cause instanceof Error ? cause.message : String(cause), cause }
    );
  }
  // Naming a secret file is arming the gate (OQ-001): an empty one is refused
  // rather than read as "no secret", which would let paid calls through.
  if (secret === "") {
    throw new CliError("usage", `--paygate-secret-file ${path} is empty`, {
      hint: "write the shared pay-gate secret to that file",
    });
  }
  return secret;
}

/**
 * Persist whatever the endpoint returned, at parity with the server this CLI
 * replaced (OQ-17): binary becomes a file plus `{savedTo, bytes}`, and a JSON
 * result carrying media URLs gets sibling `_savedTo` fields. An output
 * directory always resolves, so this runs for every call rather than only
 * when one was asked for.
 */
async function persistResult(
  entry: CatalogEntry,
  result: unknown,
  outputDir: string
): Promise<unknown> {
  if (isBinary(result)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName =
      `${entry.provider}__${entry.dotPath}__${stamp}.` +
      guessExtension(entry.dotPath);
    return writeBinary(result, baseName, outputDir);
  }
  if (result !== null && typeof result === "object") {
    return downloadUrlsInResult(
      result,
      outputDir,
      `${entry.provider}__${entry.dotPath}`
    );
  }
  return result;
}
