import {
  defaultWriter,
  printUsage,
  writeError,
  type CliWriter,
} from "./envelope.js";
import { CliError } from "./errors.js";
import { runCommands, runDescribe, runProviders } from "./discovery.js";
import { isHelpTopic, printHelpTopic } from "./help.js";
import { parseMcpArgs, runMcp } from "./mcp/cli.js";
import { PROVIDERS } from "./providers.js";
import { readPackageVersion } from "./version.js";

/**
 * Dispatch one `apicity` invocation and answer its exit status.
 *
 * W1 knew `mcp`, `help` and `version`; W2 adds the three discovery commands,
 * the help topics and the `apicity <provider>` shorthand. Every later slice
 * adds its command here and in `BUILTIN_COMMANDS` rather than introducing a
 * second entrypoint.
 *
 * Failures surface as the error envelope with the code's exit status: the
 * commands below raise `CliError` and never print a stack.
 */
export async function runMain(
  argv: string[],
  writer: CliWriter = defaultWriter
): Promise<number> {
  const [first, ...rest] = argv;

  if (first === "mcp") return serveMcp(rest);

  try {
    return await dispatch(first, rest, writer);
  } catch (err) {
    if (err instanceof CliError) return writeError(writer, err);
    throw err;
  }
}

async function dispatch(
  first: string | undefined,
  rest: string[],
  writer: CliWriter
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

  const flags = parseFlags(rest);

  if (first === "commands") {
    return runCommands(writer, {
      json: flags.json,
      provider: flags.options.provider,
    });
  }

  if (first === "providers") {
    return runProviders(writer, { json: flags.json });
  }

  if (first === "describe") {
    const [provider, dotPath] = flags.positional;
    if (provider === undefined || dotPath === undefined) {
      throw new CliError("usage", "describe needs a provider and a dotPath", {
        hint: "run: apicity describe <provider> <dotPath> [--method GET]",
      });
    }
    return runDescribe(writer, provider, dotPath, {
      json: flags.json,
      method: flags.options.method,
    });
  }

  // `apicity openai` is `apicity commands --provider openai`: the first thing
  // anyone types after learning a provider exists.
  if (Object.prototype.hasOwnProperty.call(PROVIDERS, first)) {
    return runCommands(writer, { json: flags.json, provider: first });
  }

  throw new CliError("not_found", `unknown command: ${first}`, {
    hint: "run: apicity providers",
  });
}

interface ParsedFlags {
  positional: string[];
  options: Record<string, string>;
  json: boolean;
}

/**
 * Split `--flag value`, `--flag=value` and bare `--json` out of the argv tail.
 *
 * Deliberately small: W2's commands take a handful of string options and no
 * repeated or negated flags. W3 replaces this with the full parser the call
 * path needs.
 */
function parseFlags(argv: string[]): ParsedFlags {
  const positional: string[] = [];
  const options: Record<string, string> = {};
  let json = false;

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

  return { positional, options, json };
}

/**
 * Hand the remaining argv to the MCP server untouched, so `apicity mcp <flags>`
 * is the `apicity-mcp` of previous releases.
 *
 * `runMcp` resolves as soon as the stdio transport is listening: the server
 * then lives on the event loop until the host closes stdin. `bin.ts` calls
 * `process.exit` on whatever this resolves to, so returning a status while the
 * server is healthy would kill it mid-session. Only the `--help` path is meant
 * to return; a serving invocation waits here and node exits on its own once
 * the transport ends, exactly as the standalone bin did before the move.
 * `parseMcpArgs` decides which of the two this is, and raises the same error
 * `runMcp` would on a bad flag.
 */
async function serveMcp(argv: string[]): Promise<number> {
  const serves = !parseMcpArgs(argv).help;
  await runMcp(argv);
  if (serves) await new Promise<never>(() => {});
  return 0;
}
