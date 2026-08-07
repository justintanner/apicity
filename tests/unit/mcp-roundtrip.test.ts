// In-process round trip against the real MCP revision 2026-07-28 wire.
//
// This is the durable proof that the SDK v2 cutover actually serves the modern
// era — the thing a `tsc --noEmit` pass cannot show. It drives the server
// through `serveStdio(factory, { transport, legacy: "reject" })`, exactly as
// `startServer` does, over a linked in-memory transport pair. Connecting a bare
// `Server` to a transport would answer the 2025-era `initialize` handshake
// instead and prove nothing, so this must stay on the `serveStdio` seam.
//
// No Polly and no recordings: nothing here touches the network. The registry is
// built from `scripts/endpoint-docs.tsv` with one fake credential in the
// environment.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  Client,
  InMemoryTransport,
  isJSONRPCResultResponse,
  type JSONRPCMessage,
} from "@modelcontextprotocol/client";
import { serveStdio } from "@modelcontextprotocol/server/stdio";

import mcpPackage from "../../packages/mcp-server/package.json";
import { createServer } from "../../packages/mcp-server/src/server";

/** The single revision this server serves. Pre-2026-07-28 openings are rejected. */
const PROTOCOL_REVISION = "2026-07-28";

/** Spec-defined `_meta` key carrying server identity on the modern era. */
const SERVER_INFO_KEY = "io.modelcontextprotocol/serverInfo";

// One provider is enough to exercise the wire, and pinning to it keeps the
// tool set independent of whatever other credentials happen to be present.
const PROVIDER = "xai";
const PROVIDER_ENV_VAR = "XAI_API_KEY";

interface Harness {
  client: Client;
  /** Raw JSON-RPC the server wrote, captured before the v2 client decodes it. */
  wire: JSONRPCMessage[];
  close(): Promise<void>;
}

/**
 * Build a server, serve it over an in-memory pair, and connect a client pinned
 * to the modern era.
 *
 * The pin is required, not incidental: the v2 client defaults to `'legacy'`
 * negotiation, which this server answers with `-32022`. `'auto'` would connect
 * but would also silently tolerate a legacy server, which is what this file
 * exists to rule out.
 */
async function connectPinned(): Promise<Harness> {
  const { factory } = await createServer({ enabledProviders: [PROVIDER] });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  const wire: JSONRPCMessage[] = [];
  const send = serverTransport.send.bind(serverTransport);
  serverTransport.send = async (message, options) => {
    wire.push(message);
    await send(message, options);
  };

  const handle = serveStdio(factory, {
    transport: serverTransport,
    legacy: "reject",
  });

  const client = new Client(
    { name: "apicity-roundtrip-test", version: "0.0.1" },
    {
      capabilities: {},
      versionNegotiation: { mode: { pin: PROTOCOL_REVISION } },
    }
  );
  await client.connect(clientTransport);

  return {
    client,
    wire,
    close: async () => {
      await client.close();
      await handle.close();
    },
  };
}

/** First captured result envelope carrying `key`, as it went over the wire. */
function rawResultWith(
  wire: JSONRPCMessage[],
  key: string
): Record<string, unknown> | undefined {
  for (const message of wire) {
    if (!isJSONRPCResultResponse(message)) continue;
    const result = message.result as Record<string, unknown>;
    if (key in result) return result;
  }
  return undefined;
}

describe("apicity-mcp round trip on MCP revision 2026-07-28", () => {
  let harness: Harness;
  let previousKey: string | undefined;

  beforeAll(async () => {
    previousKey = process.env[PROVIDER_ENV_VAR];
    process.env[PROVIDER_ENV_VAR] = "roundtrip-fake-key";
    harness = await connectPinned();
  });

  afterAll(async () => {
    await harness?.close();
    if (previousKey === undefined) {
      delete process.env[PROVIDER_ENV_VAR];
    } else {
      process.env[PROVIDER_ENV_VAR] = previousKey;
    }
  });

  it("negotiates the modern era at the pinned revision", () => {
    expect(harness.client.getProtocolEra()).toBe("modern");
    expect(harness.client.getNegotiatedProtocolVersion()).toBe(
      PROTOCOL_REVISION
    );
  });

  it("answers server/discover with the revision, tools capability, and identity", () => {
    const discover = harness.client.getDiscoverResult();

    expect(discover?.supportedVersions).toContain(PROTOCOL_REVISION);
    expect(discover?.capabilities?.tools).toBeDefined();
    expect(discover?._meta?.[SERVER_INFO_KEY]).toEqual({
      name: "apicity",
      version: mcpPackage.version,
    });
  });

  it("serves a non-empty tools/list carrying the cache hint", async () => {
    const result = await harness.client.listTools();

    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.ttlMs).toBe(3_600_000);
    expect(result.cacheScope).toBe("private");
    expect(result._meta?.[SERVER_INFO_KEY]).toEqual({
      name: "apicity",
      version: mcpPackage.version,
    });
  });

  it("stamps resultType on the raw wire result", async () => {
    await harness.client.listTools();

    // `resultType` is an era marker the v2 client strips while decoding, so the
    // decoded result cannot show it — assert on what the server actually wrote.
    const discover = rawResultWith(harness.wire, "supportedVersions");
    const listed = rawResultWith(harness.wire, "tools");

    expect(discover?.resultType).toBe("complete");
    expect(listed?.resultType).toBe("complete");
    expect(listed?.ttlMs).toBe(3_600_000);
    expect(listed?.cacheScope).toBe("private");
  });

  it("reports an unknown tool as an in-band error result", async () => {
    const result = await harness.client.callTool({
      name: "no_such_tool",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      { type: "text", text: "Unknown tool: no_such_tool" },
    ]);
  });

  it("lists tools in the same order from an independently built server", async () => {
    const other = await connectPinned();
    try {
      const [first, second] = await Promise.all([
        harness.client.listTools(),
        other.client.listTools(),
      ]);

      expect(second.tools.map((tool) => tool.name)).toEqual(
        first.tools.map((tool) => tool.name)
      );
    } finally {
      await other.close();
    }
  });

  it("rejects a legacy opening instead of serving the 2025 era", async () => {
    const { factory } = await createServer({ enabledProviders: [PROVIDER] });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const handle = serveStdio(factory, {
      transport: serverTransport,
      legacy: "reject",
    });

    // Default negotiation mode is 'legacy' — the 2025 connect sequence.
    const legacyClient = new Client(
      { name: "legacy-client", version: "0.0.1" },
      { capabilities: {} }
    );

    try {
      const error = await legacyClient.connect(clientTransport).then(
        () => undefined,
        (err: unknown) => err as Error & { code?: number; data?: unknown }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error?.code).toBe(-32022);
      expect(error?.data).toMatchObject({ supported: [PROTOCOL_REVISION] });
    } finally {
      await handle.close();
    }
  });
});
