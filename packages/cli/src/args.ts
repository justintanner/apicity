import { readFileSync } from "node:fs";
import type { CallShape } from "./call-shapes.js";
import { CliError } from "./errors.js";
import { errorMessage } from "./internal.js";

/**
 * Every flag the CLI itself owns, on any command.
 *
 * Endpoint flags are not here: they are derived per row from its call shape
 * (`parseEndpointFlags`), so a provider that ships a `--json` path parameter
 * tomorrow does not collide with the global table.
 */
export interface GlobalFlags {
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  help: boolean;
  version: boolean;
  outputDir?: string;
  envFile?: string;
  opVault?: string;
  opToken?: string;
  paygateSecretFile?: string;
  baseUrl?: string;
  timeout?: string;
  method?: string;
  otp?: string;
  data?: string;
  dataFile?: string;
}

type BooleanFlag = "json" | "quiet" | "verbose" | "help" | "version";
type ValueFlag = Exclude<keyof GlobalFlags, BooleanFlag>;

const BOOLEAN_FLAGS: Record<string, BooleanFlag> = {
  "--json": "json",
  "--quiet": "quiet",
  "--verbose": "verbose",
  "--help": "help",
  "-h": "help",
  "--version": "version",
};

const VALUE_FLAGS: Record<string, ValueFlag> = {
  "--output-dir": "outputDir",
  "--env-file": "envFile",
  "--op-vault": "opVault",
  "--op-token": "opToken",
  // Both spellings are accepted, on every command.
  "--op-service-token": "opToken",
  "--paygate-secret-file": "paygateSecretFile",
  "--base-url": "baseUrl",
  "--timeout": "timeout",
  "--method": "method",
  "--otp": "otp",
  "--data": "data",
  "--data-file": "dataFile",
};

/** Every global flag name, for help text and error messages. */
export const GLOBAL_FLAGS: readonly string[] = [
  ...Object.keys(BOOLEAN_FLAGS),
  ...Object.keys(VALUE_FLAGS),
];

export interface ParsedGlobalFlags {
  flags: GlobalFlags;
  /** Everything the global table did not claim, in order. */
  rest: string[];
}

/**
 * Pull the global flags out of an argv tail, wherever they appear.
 *
 * Unknown `--x` tokens are left in `rest` rather than rejected here: on the
 * endpoint form they are the row's own parameters, and only the call shape
 * knows which of those exist. `rest` therefore still carries flags, and the
 * caller hands it to `parseEndpointFlags`.
 */
export function parseGlobalFlags(argv: string[]): ParsedGlobalFlags {
  const flags: GlobalFlags = {
    json: false,
    quiet: false,
    verbose: false,
    help: false,
    version: false,
  };
  const rest: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    const booleanFlag = BOOLEAN_FLAGS[arg];
    if (booleanFlag) {
      flags[booleanFlag] = true;
      continue;
    }

    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg : arg.slice(0, eq);
    const valueFlag = VALUE_FLAGS[name];
    if (!valueFlag) {
      rest.push(arg);
      continue;
    }

    if (eq !== -1) {
      flags[valueFlag] = arg.slice(eq + 1);
      continue;
    }

    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      throw new CliError("usage", `${name} needs a value`, {
        hint: `pass ${name} <value> or ${name}=<value>`,
      });
    }
    flags[valueFlag] = next;
    i++;
  }

  return { flags, rest };
}

export interface EndpointFlagValues {
  /** Positional argument values, keyed by the endpoint's parameter name. */
  positional: Record<string, string>;
  /** Request-object values, keyed by the property that carries them. */
  fields: Record<string, string>;
}

type FlagBinding =
  | { kind: "positional"; param: string; placeholder: string }
  | { kind: "field"; property: string; placeholder: string }
  | { kind: "substituted"; placeholder: string };

/**
 * Read one endpoint's own flags against its generated call shape.
 *
 * The shape decides the whole grammar: a `positional` placeholder is a flag
 * passed as an argument, a `field` placeholder is a flag merged into the
 * request object, and an `injected` or `derived` placeholder is not a flag at
 * all — the factory substitutes the credential or the endpoint computes it, so
 * naming it is a usage error rather than a silently ignored token.
 */
export function parseEndpointFlags(
  argv: string[],
  shape?: CallShape
): EndpointFlagValues {
  const bindings = flagBindings(shape);
  const values: EndpointFlagValues = { positional: {}, fields: {} };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      throw new CliError("usage", `unexpected argument: ${arg}`, {
        hint: "pass every value as --<parameter> <value>",
      });
    }

    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg : arg.slice(0, eq);
    const binding = bindings.get(name);
    if (!binding) {
      throw new CliError("usage", `unknown flag: ${name}`, {
        hint: knownFlagsHint(bindings),
      });
    }
    if (binding.kind === "substituted") {
      throw new CliError(
        "usage",
        `${name} is not a flag: {${binding.placeholder}} is supplied by the provider`,
        { hint: `drop ${name} — the factory fills it from the credential` }
      );
    }

    let value: string;
    if (eq !== -1) {
      value = arg.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new CliError("usage", `${name} needs a value`, {
          hint: `pass ${name} <value> or ${name}=<value>`,
        });
      }
      value = next;
      i++;
    }

    if (binding.kind === "positional") values.positional[binding.param] = value;
    else values.fields[binding.property] = value;
  }

  requireAll(shape, values);
  return values;
}

function flagBindings(shape?: CallShape): Map<string, FlagBinding> {
  const bindings = new Map<string, FlagBinding>();
  if (!shape) return bindings;

  for (const positional of shape.positional) {
    const binding: FlagBinding = {
      kind: "positional",
      param: positional.param,
      placeholder: positional.placeholder,
    };
    // The placeholder is the documented name; the parameter name is accepted
    // as an alias because the URL spells `{vector_store_id}` where the
    // endpoint declares `vectorStoreId`.
    bindings.set(`--${positional.placeholder}`, binding);
    bindings.set(`--${positional.param}`, binding);
  }

  for (const field of shape.fields) {
    const binding: FlagBinding = {
      kind: "field",
      property: field.property,
      placeholder: field.placeholder,
    };
    bindings.set(`--${field.placeholder}`, binding);
    bindings.set(`--${field.property}`, binding);
  }

  for (const placeholder of [...shape.injected, ...shape.derived]) {
    bindings.set(`--${placeholder}`, { kind: "substituted", placeholder });
  }

  return bindings;
}

/**
 * Only the positional placeholders are settled here. A request field can also
 * arrive inside `--data`, so `requireRequestFields` checks those against the
 * merged request object instead.
 */
function requireAll(
  shape: CallShape | undefined,
  values: EndpointFlagValues
): void {
  if (!shape) return;

  for (const positional of shape.positional) {
    if (positional.optional) continue;
    if (values.positional[positional.param] !== undefined) continue;
    const flag = `--${positional.placeholder}`;
    throw new CliError("usage", `missing required flag: ${flag}`, {
      hint: `${flag} is required (path parameter {${positional.placeholder}})`,
    });
  }
}

/**
 * Every request-field placeholder has to be filled, but not necessarily by a
 * flag: `--bucket x` and `--data '{"bucket":"x"}'` are the same request, so
 * this runs on the merged object rather than on the parsed flags.
 */
export function requireRequestFields(
  shape: CallShape | undefined,
  request: unknown
): void {
  if (!shape) return;
  const object =
    typeof request === "object" && request !== null && !Array.isArray(request)
      ? (request as Record<string, unknown>)
      : undefined;

  for (const field of shape.fields) {
    if (object?.[field.property] !== undefined) continue;
    const flag = `--${field.placeholder}`;
    throw new CliError("usage", `missing required flag: ${flag}`, {
      hint: `${flag} is required (request field ${field.property})`,
    });
  }
}

function knownFlagsHint(bindings: Map<string, FlagBinding>): string {
  const callable = [...bindings.entries()]
    .filter(([, binding]) => binding.kind !== "substituted")
    .map(([flag]) => flag);
  if (callable.length === 0) {
    return "this endpoint takes no parameter flags; pass the request with --data";
  }
  return `this endpoint takes: ${[...new Set(callable)].join(", ")}`;
}

/** Reads the request body from stdin. The only stdin read in the program. */
export type StdinReader = () => Promise<string>;

export interface BodySources {
  data?: string;
  dataFile?: string;
}

/**
 * Resolve the request body from `--data <json>`, `--data-file <path>` or
 * `--data -` (stdin).
 *
 * Every failure here is a usage error: the caller mistyped the request, and
 * the parser's own message is the most useful hint we can give.
 */
export async function resolveRequestBody(
  sources: BodySources,
  readStdin: StdinReader = readProcessStdin
): Promise<unknown> {
  if (sources.data !== undefined && sources.dataFile !== undefined) {
    throw new CliError("usage", "pass only one of --data and --data-file", {
      hint: "use --data - to read the body from stdin",
    });
  }

  const text = await readBodyText(sources, readStdin);
  if (text === undefined) return undefined;
  if (text.trim() === "") {
    throw new CliError("usage", "the request body is empty", {
      hint: "pass a JSON object to --data, --data-file or stdin",
    });
  }

  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    throw new CliError("usage", "the request body is not valid JSON", {
      hint: errorMessage(cause),
      cause,
    });
  }
}

async function readBodyText(
  sources: BodySources,
  readStdin: StdinReader
): Promise<string | undefined> {
  if (sources.data === "-") return readStdin();
  if (sources.data !== undefined) return sources.data;
  if (sources.dataFile === undefined) return undefined;
  if (sources.dataFile === "-") return readStdin();
  try {
    return readFileSync(sources.dataFile, "utf8");
  } catch (cause) {
    throw new CliError(
      "usage",
      `--data-file ${sources.dataFile} could not be read`,
      { hint: errorMessage(cause), cause }
    );
  }
}

async function readProcessStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
