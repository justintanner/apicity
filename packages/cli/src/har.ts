import { randomUUID } from "node:crypto";
import { accessSync, constants, existsSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { createHarCapture, scrubHar, type Har } from "@apicity/har";
import { createWriter, type CliWriter } from "./envelope.js";
import { CliError } from "./errors.js";
import { resolveHome } from "./plugin.js";
import { readPackageVersion } from "./version.js";

export function captureSettings(
  flag: string | undefined,
  env: NodeJS.ProcessEnv
): { mode: "off" | "all" | "failures"; dir: string } {
  const mode = flag ?? env.APICITY_HAR_CAPTURE ?? "off";
  if (mode !== "off" && mode !== "all" && mode !== "failures") {
    throw new CliError(
      "usage",
      "APICITY_HAR_CAPTURE must be all, failures or off"
    );
  }
  const dir = resolve(
    env.APICITY_HAR_DIR || join(resolveHome({ env }), ".config/apicity/har")
  );
  return { mode, dir };
}

/** Read-only probe: a missing capture directory is created on first use. */
export function captureWritable(dir: string): boolean {
  let parent = dir;
  while (!existsSync(parent) && dirname(parent) !== parent)
    parent = dirname(parent);
  try {
    if (!statSync(parent).isDirectory()) return false;
    accessSync(parent, constants.W_OK | constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

interface IndexRow {
  ts: string;
  callId: string;
  provider: string;
  endpoint: string;
  outcome: string;
  status?: number;
  file: string;
}
async function readIndex(dir: string): Promise<IndexRow[]> {
  let content: string;
  try {
    content = await readFile(join(dir, "index.jsonl"), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const row = JSON.parse(line) as IndexRow;
      if (
        ![
          row.ts,
          row.callId,
          row.provider,
          row.endpoint,
          row.outcome,
          row.file,
        ].every((v) => typeof v === "string")
      ) {
        throw new Error("invalid capture index row");
      }
      return row;
    });
}
function indexedPath(dir: string, file: string): string {
  const target = resolve(dir, file);
  const rel = relative(dir, target);
  if (rel.startsWith("..") || isAbsolute(rel))
    throw new Error("capture index file escapes its directory");
  return target;
}

/** Keep argument names, but omit all values: bodies live in scrubbed input. */
export function redactedArgv(argv: string[]): string[] {
  return argv.map((arg, index) =>
    index < 2
      ? arg
      : arg.startsWith("--")
        ? arg.split("=", 1)[0] + (arg.includes("=") ? "=***" : "")
        : "***"
  );
}

export async function startCapture(
  flag: string | undefined,
  env: NodeJS.ProcessEnv,
  argv: string[],
  writer: CliWriter
) {
  const { mode, dir } = captureSettings(flag, env);
  if (mode === "off") return undefined;
  const callId = randomUUID();
  const runtime = createHarCapture({
    mode,
    dir,
    idFactory: () => callId,
    context: { argv: redactedArgv(argv), cli: readPackageVersion() },
    onError: () => writer.err("[apicity] HAR capture failed"),
  });
  return {
    runtime,
    async finish(): Promise<string | undefined> {
      await runtime.close();
      try {
        const row = (await readIndex(dir)).find((r) => r.callId === callId);
        return row ? indexedPath(dir, row.file) : undefined;
      } catch {
        writer.err("[apicity] HAR capture index could not be read");
        return undefined;
      }
    },
  };
}

export async function runHarCommand(
  argv: string[],
  writer: CliWriter,
  options: { env?: NodeJS.ProcessEnv; stdoutIsTTY?: boolean } = {}
): Promise<number> {
  const [command, ...args] = argv;
  if (!["list", "show", "scrub"].includes(command)) {
    throw new CliError("usage", "run: apicity har list|show|scrub");
  }
  const values: Record<string, string> = {};
  const switches = new Set<string>();
  const positional: string[] = [];
  const valueNames =
    command === "list"
      ? ["dir", "since", "provider"]
      : command === "show"
        ? ["dir"]
        : [];
  const switchNames =
    command === "list"
      ? ["json", "failures"]
      : command === "show"
        ? ["json", "bodies"]
        : ["json", "check"];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const key = arg.slice(2, eq < 0 ? undefined : eq);
    if (switchNames.includes(key) && eq < 0) {
      switches.add(key);
      continue;
    }
    if (!valueNames.includes(key))
      throw new CliError("usage", `unknown flag: --${key}`);
    const value = eq < 0 ? args[++i] : arg.slice(eq + 1);
    if (!value || value.startsWith("--"))
      throw new CliError("usage", `--${key} needs a value`);
    values[key] = value;
  }
  const out = createWriter({
    json: switches.has("json"),
    stdoutIsTTY: options.stdoutIsTTY,
    stdout: writer.out,
    stderr: writer.err,
  });
  const env = options.env ?? process.env;
  // Management remains usable even when the capture mode env is mistyped.
  const dir = resolve(values.dir ?? captureSettings("off", env).dir);
  try {
    if (command === "list") {
      if (positional.length)
        throw new CliError("usage", "har list takes no positional arguments");
      const since =
        values.since === undefined ? undefined : Date.parse(values.since);
      if (since !== undefined && !Number.isFinite(since))
        throw new CliError("usage", "--since needs an ISO date");
      const rows = (await readIndex(dir))
        .filter(
          (row) =>
            (since === undefined || Date.parse(row.ts) >= since) &&
            (!values.provider || row.provider === values.provider) &&
            (!switches.has("failures") || row.outcome !== "ok")
        )
        .sort((a, b) => b.ts.localeCompare(a.ts));
      if (out.machine) return out.success(rows);
      out.text([
        "ts\tprovider\tendpoint\toutcome\tstatus\tfile",
        ...rows.map((row) =>
          [
            row.ts,
            row.provider,
            row.endpoint,
            row.outcome,
            row.status ?? "-",
            row.file,
          ].join("\t")
        ),
      ]);
      return 0;
    }
    if (command === "show") {
      if (positional.length !== 1)
        throw new CliError("usage", "har show needs one file or callId");
      const target = positional[0];
      let file = target;
      if (!existsSync(file)) {
        const row = (await readIndex(dir)).find(
          (r) => r.callId === target || r.file === target
        );
        if (!row)
          throw new CliError("not_found", `capture not found: ${target}`);
        file = indexedPath(dir, row.file);
      }
      const har = scrubHar(JSON.parse(await readFile(file, "utf8")) as Har);
      const summary = {
        file,
        ...har.log._apicity,
        entries: har.log.entries.map((entry) => ({
          method: entry.request.method,
          url: entry.request.url,
          status: entry.response.status,
          size: entry.response.content.size,
          role: entry._apicity?.role,
          pollRepeat: entry._apicity?.pollRepeat,
          ...(switches.has("bodies")
            ? {
                request: entry.request.postData,
                response: entry.response.content,
              }
            : {}),
        })),
      };
      // Input is a request body too; only show it with --bodies.
      if (!switches.has("bodies")) delete summary.input;
      return out.success(summary);
    }
    if (!positional.length)
      throw new CliError("usage", "har scrub needs one or more files");
    const results = [];
    for (const file of positional) {
      const original = JSON.parse(await readFile(file, "utf8")) as Har;
      const before = JSON.stringify(original);
      const clean = scrubHar(original);
      const changed = before !== JSON.stringify(clean);
      if (changed && !switches.has("check"))
        await writeFile(file, JSON.stringify(clean, null, 2) + "\n");
      if (changed && switches.has("check"))
        writer.err(`needs scrubbing: ${file}`);
      results.push({ file, changed });
    }
    out.success(results);
    return switches.has("check") && results.some((r) => r.changed) ? 1 : 0;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError("usage", "could not read or update HAR captures", {
      hint: error instanceof Error ? error.message : String(error),
    });
  }
}
