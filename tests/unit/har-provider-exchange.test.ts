import { describe, expect, it } from "vitest";
import { entryToProviderExchange, type HarEntry } from "@apicity/har";

function entry(over: {
  url?: string;
  method?: string;
  status?: number;
  postText?: string;
  headers?: Array<{ name: string; value: string }>;
  text?: string;
  encoding?: string;
  mimeType?: string;
  _apicity?: HarEntry["_apicity"];
}): HarEntry {
  return {
    request: {
      method: over.method ?? "POST",
      url: over.url ?? "https://api.openai.com/v1/responses",
      ...(over.postText !== undefined
        ? { postData: { mimeType: "application/json", text: over.postText } }
        : {}),
    },
    response: {
      status: over.status ?? 200,
      headers: over.headers ?? [],
      content: {
        mimeType: over.mimeType ?? "application/json",
        ...(over.text !== undefined ? { text: over.text } : {}),
        ...(over.encoding !== undefined ? { encoding: over.encoding } : {}),
      },
    },
    ...(over._apicity ? { _apicity: over._apicity } : {}),
  } as unknown as HarEntry;
}

describe("entryToProviderExchange", () => {
  it("lower-cases header names and carries the call's facts", () => {
    const exchange = entryToProviderExchange(
      entry({
        method: "GET",
        status: 202,
        headers: [{ name: "X-Fal-Billable-Units", value: "3" }],
        text: "{}",
      }),
      { provider: "fal", dotPath: "v1.queue.result" }
    );
    expect(exchange).toMatchObject({
      provider: "fal",
      dotPath: "v1.queue.result",
      method: "GET",
      status: 202,
      responseHeaders: { "x-fal-billable-units": "3" },
    });
  });

  it("infers the provider from the host and leaves dotPath out", () => {
    const exchange = entryToProviderExchange(entry({ text: "{}" }));
    expect(exchange.provider).toBe("openai");
    expect("dotPath" in exchange).toBe(false);
  });

  it("matches a host at a label boundary, never by substring", () => {
    const provider = (url: string) =>
      entryToProviderExchange(entry({ url, text: "{}" })).provider;
    expect(provider("https://queue.fal.run/fal-ai/flux/dev")).toBe("fal");
    expect(provider("https://notfal.run/x")).toBe("");
    expect(provider("not a url")).toBe("");
  });

  it("parses a JSON request body", () => {
    const exchange = entryToProviderExchange(
      entry({ postText: '{"model":"gpt-5"}', text: "{}" })
    );
    expect(exchange.requestBody).toEqual({ model: "gpt-5" });
  });

  it.each([
    ["a captured placeholder", '{"_apicity_placeholder":{"bytes":1}}'],
    ["an unparsable body", "not json"],
    ["a non-object body", "[1,2]"],
  ])("returns a null request body for %s", (_name, postText) => {
    const exchange = entryToProviderExchange(entry({ postText, text: "{}" }));
    expect(exchange.requestBody).toBeNull();
  });

  it("returns a null request body when there is none", () => {
    expect(
      entryToProviderExchange(entry({ text: "{}" })).requestBody
    ).toBeNull();
  });

  it("parses a JSON response", () => {
    const exchange = entryToProviderExchange(entry({ text: '{"usage":{}}' }));
    expect(exchange.responseBody).toEqual({ usage: {} });
  });

  it("parses SSE into its data frames, skipping non-JSON lines", () => {
    const text = [
      "event: message_start",
      'data: {"a":1}',
      "",
      "data: [DONE]",
      'data: {"b":2}',
    ].join("\n");
    const exchange = entryToProviderExchange(
      entry({ text, mimeType: "text/event-stream" })
    );
    expect(exchange.responseBody).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("recognises a stream by its body when the type is missing", () => {
    const exchange = entryToProviderExchange(
      entry({ text: 'data: {"a":1}\n', mimeType: "" })
    );
    expect(exchange.responseBody).toEqual([{ a: 1 }]);
  });

  it("decodes a base64 response", () => {
    const exchange = entryToProviderExchange(
      entry({
        text: Buffer.from('{"ok":true}').toString("base64"),
        encoding: "base64",
      })
    );
    expect(exchange.responseBody).toEqual({ ok: true });
  });

  it.each([
    ["no body", undefined],
    ["a binary body", "\u0000\u0001"],
    ["a response placeholder", '{"_apicity_placeholder":{"bytes":1}}'],
  ])("returns a null response body for %s", (_name, text) => {
    const exchange = entryToProviderExchange(entry({ text }));
    expect(exchange.responseBody).toBeNull();
  });

  it("carries bodyTruncated only when the capture set it", () => {
    const truncated = entryToProviderExchange(
      entry({ text: "{}", _apicity: { kind: "http", bodyTruncated: true } })
    );
    expect(truncated.bodyTruncated).toBe(true);
    const whole = entryToProviderExchange(entry({ text: "{}" }));
    expect("bodyTruncated" in whole).toBe(false);
  });
});
