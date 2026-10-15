import { once } from "node:events";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Polly } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createUndiciAgent, holdRecordingDispatcher } from "../harness";

// Node's bundled undici keeps its global dispatcher under this symbol; the
// harness swaps it while recording (ac-vs29fr).
const DISPATCHER = Symbol.for("undici.globalDispatcher.1");
const globals = globalThis as unknown as Record<symbol, unknown>;

// Answers after 1.5 s, so a 0.5 s headers timeout trips on it, while the
// default 300 s and a disabled (0) timeout wait it out.
let server: Server;
let base = "";

beforeAll(async () => {
  // Reading fetch loads Node's bundled undici, which registers its Agent.
  void globalThis.fetch;
  server = createServer((_req, res) => {
    setTimeout(() => {
      res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    }, 1500);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
});

afterAll(async () => {
  server.closeAllConnections();
  server.close();
  await once(server, "close");
});

// Every hold is released after its test, even a failing one, so the global
// dispatcher never leaks into the next test.
const releases: Array<() => void> = [];
afterEach(() => {
  for (const release of releases.splice(0)) release();
});

function hold(
  mode: Parameters<typeof holdRecordingDispatcher>[0],
  timeoutMs?: number
): () => void {
  const release = holdRecordingDispatcher(mode, timeoutMs);
  releases.push(release);
  return release;
}

async function failureCode(request: Promise<Response>) {
  try {
    await request;
    return "resolved";
  } catch (error) {
    return (error as { cause?: { code?: string } }).cause?.code;
  }
}

describe("recording dispatcher", () => {
  it("builds agents of Node's own undici class that honour their timeouts", async () => {
    const quick = createUndiciAgent(500);
    expect(quick.constructor).toBe((globals[DISPATCHER] as object).constructor);
    expect(
      await failureCode(
        fetch(base, { method: "GET", dispatcher: quick } as RequestInit)
      )
    ).toBe("UND_ERR_HEADERS_TIMEOUT");
    const patient = createUndiciAgent(0);
    const response = await fetch(base, {
      method: "GET",
      dispatcher: patient,
    } as RequestInit);
    expect(await response.text()).toBe("ok");
  });

  it("leaves the global dispatcher alone in replay", () => {
    const before = globals[DISPATCHER];
    const release = hold("replay");
    expect(globals[DISPATCHER]).toBe(before);
    release();
    expect(globals[DISPATCHER]).toBe(before);
  });

  it("swaps the global dispatcher outside replay until the last release", async () => {
    const before = globals[DISPATCHER];
    // A 0.5 s hold makes the swap observable from a plain fetch.
    const outer = hold("record-missing", 500);
    const swapped = globals[DISPATCHER];
    expect(swapped).not.toBe(before);
    expect(await failureCode(fetch(base))).toBe("UND_ERR_HEADERS_TIMEOUT");
    // A nested hold shares the installed dispatcher.
    const inner = hold("record");
    expect(globals[DISPATCHER]).toBe(swapped);
    inner();
    expect(globals[DISPATCHER]).toBe(swapped);
    outer();
    outer();
    expect(globals[DISPATCHER]).toBe(before);
    expect(await (await fetch(base)).text()).toBe("ok");
  });

  it("reaches requests that Polly passes through to the network", async () => {
    const polly = new Polly("harness-recording-dispatcher", {
      adapters: [FetchAdapter],
      mode: "passthrough",
      logLevel: "silent",
    });
    try {
      hold("passthrough", 500);
      expect(await failureCode(fetch(base))).toBe("UND_ERR_HEADERS_TIMEOUT");
    } finally {
      await polly.stop();
    }
  });
});
