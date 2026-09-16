import {
  defaultWriter,
  printUsage,
  writeError,
  type CliWriter,
} from "./envelope.js";
import { CliError } from "./errors.js";
import { parseMcpArgs, runMcp } from "./mcp/cli.js";
import { readPackageVersion } from "./version.js";

/**
 * Dispatch one `apicity` invocation and answer its exit status.
 *
 * W1 knows `mcp`, `help` and `version`; every later slice adds its command
 * here and in `BUILTIN_COMMANDS` rather than introducing a second entrypoint.
 */
export async function runMain(
  argv: string[],
  writer: CliWriter = defaultWriter
): Promise<number> {
  const [first, ...rest] = argv;

  if (
    first === undefined ||
    first === "help" ||
    first === "--help" ||
    first === "-h"
  ) {
    printUsage(writer);
    return 0;
  }

  if (first === "version" || first === "--version") {
    writer.out(readPackageVersion());
    return 0;
  }

  if (first === "mcp") return serveMcp(rest);

  return writeError(
    writer,
    new CliError("not_found", `unknown command: ${first}`, {
      hint: "run: apicity providers",
    })
  );
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
