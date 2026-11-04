import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import {
  createHarCapture,
  exchangeToEntry,
  entryToProviderExchange,
  scrubHar,
  type Har,
} from "@apicity/har";
import { extractActual } from "@apicity/cost";

const timing = { startedAt: new Date(0), durationMs: 1 };
const meta = {
  provider: "anthropic",
  endpoint: "v1.messages",
  input: { model: "claude-sonnet-4-6" },
};

it.each([
  '{"guestToken":"LIVE-SECRET-cut',
  '{"usage":{"input_tokens":1000,"output_tokens":5},"guestToken":"LIVE-SECRET-cut',
])("does not persist incomplete close-delimited JSON: %s", async (wire) => {
  const server = createServer((_req, res) => {
    res.useChunkedEncodingByDefault = false;
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      connection: "close",
    });
    res.write(wire);
    setTimeout(() => res.destroy(), 30);
  });
  const dir = await mkdtemp(join(tmpdir(), "har-json-cut-"));
  const capture = createHarCapture({ dir, mode: "all" });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    await capture.call(meta, async () => {
      // Close-delimited EOF is a successful fetch read. Capture must not alter it.
      expect(await (await capture.fetch(url)).text()).toBe(wire);
    });
    await capture.flush();
    const index = JSON.parse(
      (await readFile(join(dir, "index.jsonl"), "utf8")).trim()
    );
    const raw = await readFile(join(dir, index.file), "utf8");
    expect(raw).not.toContain("LIVE-SECRET");
    const har = JSON.parse(raw) as Har;
    const entry = har.log.entries[0]!;
    expect(har.log._apicity?.outcome).toBe("ok");
    expect(entry._apicity).toMatchObject({
      bodyTruncated: true,
      streamIncomplete: true,
    });
    expect(entry._apicity?.responseCut).toBeUndefined();
    expect(JSON.parse(entry.response.content.text!)).toMatchObject({
      _apicity_placeholder: {
        bytes: Buffer.byteLength(wire),
        contentType: "application/json; charset=utf-8",
      },
    });
    const actual = extractActual(entryToProviderExchange(entry, meta));
    expect(actual.settled).toBe(false);
    expect(actual.derivedUsd).toBeNull();
    expect(actual.usd).toBeNull();
    expect(JSON.stringify(scrubHar(structuredClone(har)))).toBe(
      JSON.stringify(har)
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await capture.close();
    await rm(dir, { recursive: true, force: true });
  }
});

it.each(["application/json", "application/problem+json", "text/json"])(
  "marks invalid JSON incomplete for %s",
  async (contentType) => {
    const entry = await exchangeToEntry(
      new Request("https://example.com"),
      new Response('{"guestToken":"LIVE-SECRET', {
        headers: { "content-type": contentType },
      }),
      timing
    );
    expect(entry._apicity).toMatchObject({
      bodyTruncated: true,
      streamIncomplete: true,
    });
    expect(entry._apicity?.responseCut).toBeUndefined();
    expect(entry.response.content.text).not.toContain("LIVE-SECRET");
  }
);

it.each(["{}", "[]", "null", "false", "0", '"words"'])(
  "preserves valid JSON %s",
  async (wire) => {
    const entry = await exchangeToEntry(
      new Request("https://example.com"),
      new Response(wire, { headers: { "content-type": "application/json" } }),
      timing
    );
    expect(entry.response.content.text).toBe(wire);
    expect(entry._apicity?.streamIncomplete).toBeUndefined();
    expect(entry._apicity?.bodyTruncated).toBeUndefined();
  }
);

it.each(["text/plain", "text/html", "application/xml"])(
  "preserves ordinary %s bodies",
  async (contentType) => {
    const entry = await exchangeToEntry(
      new Request("https://example.com"),
      new Response("ordinary words", {
        headers: { "content-type": contentType },
      }),
      timing
    );
    expect(entry.response.content.text).toBe("ordinary words");
    expect(entry._apicity?.streamIncomplete).toBeUndefined();
    expect(entry._apicity?.bodyTruncated).toBeUndefined();
  }
);

it("does not classify a JSON retention cap as a malformed wire body", async () => {
  const entry = await exchangeToEntry(
    new Request("https://example.com"),
    new Response(JSON.stringify({ text: "x".repeat(1000) }), {
      headers: { "content-type": "application/json" },
    }),
    timing,
    { maxBodyBytes: 100 }
  );
  expect(entry._apicity?.bodyTruncated).toBe(true);
  expect(entry._apicity?.streamIncomplete).toBeUndefined();
  expect(JSON.parse(entry.response.content.text!)).toHaveProperty(
    "_apicity_placeholder"
  );
});

it("preserves a bodyless JSON response", async () => {
  const entry = await exchangeToEntry(
    new Request("https://example.com"),
    new Response(null, {
      status: 204,
      headers: { "content-type": "application/json" },
    }),
    timing
  );
  expect(entry.response.content.text).toBe("");
  expect(entry._apicity?.streamIncomplete).toBeUndefined();
  expect(entry._apicity?.bodyTruncated).toBeUndefined();
});
