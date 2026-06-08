import { readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { isPaidEndpoint } from "@apicity/cost";
import { buildRegistry, type Endpoint } from "./registry.js";
import { zodToJsonSchema, type JsonSchema } from "./schema.js";
import {
  downloadUrlsInResult,
  guessExtension,
  isBinary,
  writeBinary,
} from "./output.js";

export interface StartServerOptions {
  outputDir?: string;
  enabledProviders?: string[];
  name?: string;
  version?: string;
  /** Shared HMAC secret used to verify OTPs for paid endpoints. */
  paygateSecret?: string;
}

export async function startServer(
  opts: StartServerOptions = {}
): Promise<void> {
  const endpoints = await buildRegistry({
    enabledProviders: opts.enabledProviders,
    paygateSecret: opts.paygateSecret,
  });

  const server = new Server(
    {
      name: opts.name ?? "apicity",
      version: opts.version ?? readPackageVersion(),
    },
    { capabilities: { tools: {} } }
  );

  const byName = new Map(endpoints.map((e) => [e.toolName, e]));

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: endpoints.map((ep) => ({
      name: ep.toolName,
      description: describe(ep, opts.outputDir),
      inputSchema: buildInputSchema(ep),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const ep = byName.get(req.params.name);
    if (!ep) {
      return errorResult(`Unknown tool: ${req.params.name}`);
    }
    try {
      const result = await invoke(ep, req.params.arguments ?? {});
      return await formatResult(ep, result, opts.outputDir);
    } catch (err) {
      return errorResult(
        `${ep.toolName} failed: ${(err as Error).message ?? String(err)}`
      );
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[apicity-mcp] ready — ${endpoints.length} tools registered` +
      (opts.outputDir ? ` (output dir: ${opts.outputDir})` : "")
  );
}

function describe(ep: Endpoint, outputDir?: string): string {
  const lines = [`${ep.method} ${ep.fullUrl}`, `Docs: ${ep.docsUrl}`];
  if (isPaidEndpoint(ep.provider, ep.method, ep.dotPath)) {
    lines.push(
      "PAID endpoint: requires an operator-minted `otp` (one-time approval). " +
        "The OTP is bound to this exact request and is single-use."
    );
  }
  if (outputDir && isMediaEndpoint(ep)) {
    lines.push(`Returned binary or media URLs are saved to: ${outputDir}`);
  }
  if (ep.example) {
    const body = JSON.stringify(ep.example.payload, null, 2);
    const truncated =
      body.length > 400 ? `${body.slice(0, 400).trimEnd()}\n…` : body;
    lines.push("", `Example (${ep.example.source}):`, truncated);
  }
  return lines.join("\n");
}

function isMediaEndpoint(ep: Endpoint): boolean {
  return /audio|image|video|speech|tts|generation|sound|upload|file/i.test(
    ep.dotPath
  );
}

const OTP_SCHEMA: JsonSchema = {
  type: "string",
  description:
    "Operator-minted one-time approval token authorizing this paid call. " +
    "Bound to this exact request and single-use; the AI cannot mint it.",
};

function buildInputSchema(ep: Endpoint): JsonSchema {
  const paid = isPaidEndpoint(ep.provider, ep.method, ep.dotPath);
  const body = zodToJsonSchema(ep.schema);
  // If the endpoint takes path params (e.g., {taskId}), wrap them at the top
  // level alongside the body fields and mark them required.
  if (ep.pathParams.length === 0) {
    if (body.type === "object") {
      return paid ? withOtp(body) : body;
    }
    const obj: JsonSchema = {
      type: "object",
      properties: {},
      additionalProperties: true,
    };
    return paid ? withOtp(obj) : obj;
  }
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];
  for (const p of ep.pathParams) {
    properties[p] = { type: "string", description: `Path param: {${p}}` };
    required.push(p);
  }
  if (body.type === "object" && body.properties) {
    properties.body = body;
  } else {
    properties.body = {
      type: "object",
      additionalProperties: true,
      description: "Request body (free-form)",
    };
  }
  if (paid) properties.otp = OTP_SCHEMA;
  return { type: "object", properties, required };
}

/** Add an optional top-level `otp` property to an object schema. */
function withOtp(objSchema: JsonSchema): JsonSchema {
  const properties = {
    ...((objSchema.properties as Record<string, JsonSchema>) ?? {}),
    otp: OTP_SCHEMA,
  };
  return { ...objSchema, properties };
}

async function invoke(
  ep: Endpoint,
  args: Record<string, unknown>
): Promise<unknown> {
  const paid = isPaidEndpoint(ep.provider, ep.method, ep.dotPath);
  // For paid endpoints, peel the `otp` approval off the arguments before the
  // rest is treated as the request body. The approval is forwarded as the final
  // argument so the provider's pay gate can verify it (or fail closed).
  let approval: { otp: string } | undefined;
  if (paid) {
    approval = extractApproval(args);
    args = stripApproval(args);
  }

  let pathArgs: unknown[] = [];
  let body: unknown = args;
  if (ep.pathParams.length > 0) {
    pathArgs = ep.pathParams.map((p) => args[p]);
    body = (args as Record<string, unknown>).body ?? undefined;
  }

  if (paid) {
    const result = await ep.fn(...pathArgs, body ?? {}, approval);
    return await maybeBuffer(result);
  }

  if (
    body === undefined ||
    (isPlainObject(body) && Object.keys(body).length === 0)
  ) {
    const result = await ep.fn(...pathArgs);
    return await maybeBuffer(result);
  }
  const result = await ep.fn(...pathArgs, body);
  return await maybeBuffer(result);
}

/** Read an `otp` approval from tool args (top-level `otp` or `approval.otp`). */
function extractApproval(
  args: Record<string, unknown>
): { otp: string } | undefined {
  if (typeof args.otp === "string") return { otp: args.otp };
  const approval = args.approval;
  if (
    isPlainObject(approval) &&
    typeof (approval as Record<string, unknown>).otp === "string"
  ) {
    return { otp: (approval as Record<string, unknown>).otp as string };
  }
  return undefined;
}

/** Return a copy of args without the approval fields. */
function stripApproval(args: Record<string, unknown>): Record<string, unknown> {
  const { otp: _otp, approval: _approval, ...rest } = args;
  void _otp;
  void _approval;
  return rest;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

async function maybeBuffer(value: unknown): Promise<unknown> {
  if (
    value !== null &&
    typeof value === "object" &&
    Symbol.asyncIterator in (value as object)
  ) {
    const buffered: unknown[] = [];
    for await (const chunk of value as AsyncIterable<unknown>)
      buffered.push(chunk);
    return buffered;
  }
  return value;
}

async function formatResult(
  ep: Endpoint,
  result: unknown,
  outputDir?: string
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  if (isBinary(result)) {
    if (!outputDir) {
      const bytes = (result as ArrayBuffer | Uint8Array).byteLength;
      return text(
        `Endpoint returned ${bytes} binary bytes. Pass --output-dir to persist.`
      );
    }
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const baseName = `${ep.provider}__${ep.dotPath}__${ts}.${guessExtension(
      ep.dotPath
    )}`;
    const out = await writeBinary(result, baseName, outputDir);
    return text(JSON.stringify(out, null, 2));
  }
  let payload = result;
  if (outputDir && payload && typeof payload === "object") {
    payload = await downloadUrlsInResult(
      payload,
      outputDir,
      `${ep.provider}__${ep.dotPath}`
    );
  }
  return text(safeStringify(payload));
}

function text(s: string): {
  content: Array<{ type: "text"; text: string }>;
} {
  return { content: [{ type: "text", text: s }] };
}

function errorResult(message: string): {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
} {
  return { isError: true, content: [{ type: "text", text: message }] };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function readPackageVersion(): string {
  for (const path of [
    new URL("../package.json", import.meta.url),
    new URL("../../package.json", import.meta.url),
  ]) {
    try {
      const pkg = JSON.parse(readFileSync(path, "utf8")) as unknown;
      if (typeof pkg === "object" && pkg !== null) {
        const version = (pkg as Record<string, unknown>).version;
        if (typeof version === "string") return version;
      }
    } catch {
      /* try source/dist fallback */
    }
  }
  return "0.0.0";
}
