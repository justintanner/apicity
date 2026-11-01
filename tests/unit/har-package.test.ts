import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  exchangeToEntry,
  scrubHar,
  scrubEntry,
  pollyEntryId,
  pollyRecordingDir,
  type Har,
  type PersistedHarRecording,
} from "@apicity/har";

const timing = { startedAt: "2026-10-24T00:00:00.000Z", durationMs: 7 };
const request = (body: BodyInit, contentType = "application/json") =>
  new Request("https://example.com/", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });

describe("exchange serializer", () => {
  it("retains JSON, timings and headers without consuming originals", async () => {
    const req = request('{"prompt":"hello"}');
    const res = new Response('{"ok":true}', {
      headers: { "content-type": "application/json", "x-test": "retained" },
    });
    const entry = await exchangeToEntry(req, res, timing);
    expect(entry.request.postData?.text).toBe(await req.text());
    expect(entry.response.content.text).toBe(await res.text());
    expect(entry.timings).toEqual({ send: 0, wait: 7, receive: 0 });
    expect(entry.startedDateTime).toBe(timing.startedAt);
    expect(entry.response.headers).toContainEqual({
      name: "x-test",
      value: "retained",
    });
  });
  it.each([
    ["oversized", "text/plain", 2],
    ["binary", "application/octet-stream", 100],
  ] as const)("hashes %s bodies", async (_, mime, cap) => {
    const entry = await exchangeToEntry(
      request("hello", mime),
      new Response(),
      timing,
      { maxBodyBytes: cap }
    );
    expect(JSON.parse(entry.request.postData!.text!)).toEqual({
      _apicity_placeholder: {
        sha256: createHash("sha256").update("hello").digest("hex"),
        bytes: 5,
        contentType: mime,
      },
    });
  });
  it("summarizes multipart file bytes and repeated fields", async () => {
    const form = new FormData();
    form.append("prompt", "one");
    form.append("prompt", "two");
    form.append("file", new Blob(["abc"], { type: "text/plain" }), "a.txt");
    const entry = await exchangeToEntry(
      new Request("https://example.com/", { method: "POST", body: form }),
      new Response(),
      timing
    );
    expect(JSON.parse(entry.request.postData!.text!)).toEqual({
      _multipart: true,
      prompt: ["one", "two"],
      file: {
        _file: true,
        filename: "a.txt",
        contentType: "text/plain",
        size: 3,
      },
    });
  });
  it("summarizes data URLs and long base64 strings", async () => {
    const entry = await exchangeToEntry(
      request(
        JSON.stringify({
          url: "data:image/png;base64,YWJj",
          data: "A".repeat(1028),
        })
      ),
      new Response(),
      timing
    );
    expect(JSON.parse(entry.request.postData!.text!)).toEqual({
      url: "<inline image/png data URL — replace with a real URL or upload>",
      data: "<inline base64 data; 771 bytes>",
    });
  });
  it("concatenates SSE chunks up to the byte cap", async () => {
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("data: one\n"));
        c.enqueue(new TextEncoder().encode("data: two\n"));
        c.close();
      },
    });
    const entry = await exchangeToEntry(
      new Request("https://example.com/"),
      new Response(stream, {
        headers: { "content-type": "text/event-stream" },
      }),
      timing,
      { maxBodyBytes: 12 }
    );
    expect(entry.response.content.text).toBe("data: one\nda");
    expect(entry._apicity).toMatchObject({
      streamed: true,
      bodyTruncated: true,
    });
    expect(entry.response.bodySize).toBe(20);
  });
  it("records network failures with status zero", async () => {
    const entry = await exchangeToEntry(
      new Request("https://example.com/"),
      new Error("offline"),
      timing
    );
    expect(entry.response.status).toBe(0);
  });
});

function bodyEntry(
  body: unknown,
  url = "https://example.com/"
): PersistedHarRecording {
  return {
    request: { url, postData: { text: JSON.stringify(body) } },
    response: { content: { text: JSON.stringify(body) } },
  };
}
describe("shipped scrubber legacy rules", () => {
  it.each([
    "authorization",
    "x-api-key",
    "xi-api-key",
    "x-goog-api-key",
    "x-amz-security-token",
    "api-key",
    "poly-api-key",
    "poly-passphrase",
    "poly-signature",
    "poly-address",
    "poly-timestamp",
    "poly-nonce",
    "poly_builder_api_key",
    "x-telegram-bot-api-secret-token",
  ])("har-secrets.mjs:30-36 / har-scrub.ts:42-55 header %s", (name) => {
    const e = { request: { headers: [{ name, value: "secret" }] } };
    scrubEntry(e);
    expect(e.request.headers[0].value).toBe(
      name === "authorization" ? "Bearer ***" : "***"
    );
  });
  it.each([
    "set-cookie",
    "openai-organization",
    "openai-project",
    "x-request-id",
    "traceresponse",
    "x-ratelimit-limit",
    "cf-ray",
    "anthropic-organization-id",
    "cookie",
    "origin-cf-ray",
    "request-id",
    "x-amz-id-2",
    "x-amz-request-id",
    "x-amzn-requestid",
    "x-amzn-trace-id",
    "x-dashscope-inner-user-group",
    "x-dashscope-inner-user-meta",
    "x-mbx-uuid",
    "ratelimit-limit",
    "x-rate-limit-limit",
  ])("har-scrub.ts:57-75 drops %s", (name) => {
    const e = { response: { headers: [{ name, value: "private" }] } };
    scrubEntry(e);
    expect(e.response.headers).toEqual([]);
  });
  it("har-scrub.ts:107-159 removes cookie header and both cookie arrays", () => {
    const e = {
      request: {
        headers: [{ name: "Cookie", value: "private" }],
        cookies: [{ value: "private" }],
      },
      response: { cookies: [{ value: "private" }] },
    };
    scrubEntry(e);
    expect(e).toEqual({
      request: { headers: [], cookies: [] },
      response: { cookies: [] },
    });
  });
  it.each(["OSSAccessKeyId", "policy", "Signature"])(
    "harness.ts:163-235 request key %s",
    (key) => {
      const e = bodyEntry({ nested: { [key]: "private" } });
      scrubEntry(e);
      expect(JSON.parse(e.request!.postData!.text!).nested[key]).toBe("***");
    }
  );
  it.each([
    "credentials",
    "payload",
    "provider_token",
    "secret_token",
    "invoice_payload",
    "file_id",
    "file_unique_id",
    "file_hashes",
    "data_hash",
    "telegram_payment_charge_id",
    "shipping_address",
    "encrypted_credentials",
    "order_info",
    "passport_data",
    "provider_data",
    "provider_payment_charge_id",
    "secret",
    "secure_data",
    "element_hash",
    "element_hashes",
    "file_hash",
  ])("har-scrub.ts:77-101 Telegram key %s", (key) => {
    const e = bodyEntry(
      { [key]: "private" },
      "https://api.telegram.org/bot123:token/call"
    );
    scrubEntry(e);
    expect(e.request!.url).toContain("/bot***/");
    expect(JSON.parse(e.response!.content!.text!)[key]).toBe("***");
  });
  it.each([
    "apiKey",
    "secret",
    "passphrase",
    "privateKey",
    "signature",
    "builderToken",
    "relayerKey",
  ])("har-scrub.ts:348-496 Polymarket key %s", (key) => {
    const e = bodyEntry(
      { [key]: "private" },
      "https://clob.polymarket.com/auth"
    );
    scrubEntry(e);
    expect(JSON.parse(e.response!.content!.text!)[key]).toBe("***");
  });
  it("har-secrets.mjs:182-216 fal checkpoint keeps non-checkpoint signatures", () => {
    const e = bodyEntry({
      checkpoint: {
        signature: "private",
        url: "https://example.com/model?token=private",
      },
      signature: "thinking",
    });
    scrubEntry(e);
    expect(JSON.parse(e.response!.content!.text!)).toEqual({
      checkpoint: { signature: "***", url: "https://example.com/model" },
      signature: "thinking",
    });
  });
  it.each(["guestToken", "create_api_key_id"])(
    "harness.ts response metadata %s",
    (key) => {
      const e = bodyEntry({ [key]: "private" });
      scrubEntry(e);
      expect(JSON.parse(e.response!.content!.text!)[key]).toBe("***");
    }
  );
  it("harness.ts fireworks apiKeys account fields", () => {
    const e = bodyEntry({
      apiKeys: [
        {
          key: "private",
          displayName: "private",
          email: "private",
          keyId: "private",
          prefix: "private",
        },
      ],
    });
    scrubEntry(e);
    expect(
      Object.values(JSON.parse(e.response!.content!.text!).apiKeys[0])
    ).toEqual(Array(5).fill("***"));
  });
  it("harness.ts:149-161 OSS policy response", () => {
    const e = bodyEntry({
      upload_host: "https://oss.example/",
      oss_access_key_id: "private",
      signature: "private",
    });
    scrubEntry(e);
    expect(JSON.parse(e.response!.content!.text!).signature).toBe("***");
  });
  it.each([
    ["x-dashscope-apikeyid", "***"],
    ["x-dashscope-uid", "***"],
    ["x-dashscope-bwid", "ws-***"],
    ["x-dashscope-workspace", "ws-***"],
  ])("harness.ts:237-279 DashScope %s", (name, expected) => {
    const e = { response: { headers: [{ name, value: "private" }] } };
    scrubEntry(e);
    expect(e.response.headers[0].value).toBe(expected);
  });
  it("harness.ts:237-279 DashScope flow control metadata", () => {
    const e = {
      response: {
        headers: [
          {
            name: "x-dashscope-inner-flow-control-meta",
            value: JSON.stringify({
              user_id: "private",
              user_spec: { private: true },
              retained: true,
            }),
          },
        ],
      },
    };
    scrubEntry(e);
    expect(JSON.parse(e.response.headers[0].value)).toEqual({
      user_id: "***",
      user_spec: "***",
      retained: true,
    });
  });
});

const root = path.resolve("tests/recordings");
const files = readdirSync(root, { recursive: true }).filter(
  (f): f is string => typeof f === "string" && f.endsWith("recording.har")
);
describe("committed corpus parity", () => {
  // A whole-corpus scan: under a parallel full-suite replay it took half the
  // default 30 s, so it carries its own timeout (ac-zpa6nt).
  it("is idempotent across the committed corpus and leaves clean recordings unchanged", () => {
    let unchanged = 0;
    for (const file of files) {
      const har = JSON.parse(
        readFileSync(path.join(root, file), "utf8")
      ) as Har;
      const before = JSON.stringify(har);
      scrubHar(har);
      const after = JSON.stringify(har);
      if (before === after) unchanged++;
      scrubHar(har);
      expect(JSON.stringify(har), file).toBe(after);
    }
    expect(unchanged).toBeGreaterThan(3);
  }, 120_000);
  it("matches identity and directory names for three committed recordings", () => {
    const matches = [
      "anthropic_2966493235/batches-list_981440878/recording.har",
      "anthropic_2966493235/batches-retrieve_3161503962/recording.har",
      "anthropic_2966493235/count-tokens_2625777809/recording.har",
    ];
    for (const file of matches) {
      const har = JSON.parse(
        readFileSync(path.join(root, file), "utf8")
      ) as Har;
      for (const entry of har.log.entries)
        expect(pollyEntryId(entry), file).toBe(entry._id);
      const dir = path.dirname(file);
      const name = dir
        .split(path.sep)
        .map((s) => s.replace(/_\d+$/, ""))
        .join("/");
      expect(pollyRecordingDir(name)).toBe(dir);
    }
  });
});

describe("call metadata and URL arrays", () => {
  it("applies provider body rules to input even for a call with no HTTP entry", () => {
    const har: Har = {
      log: {
        version: "1.2",
        creator: { name: "test", version: "1" },
        entries: [],
        _apicity: {
          callId: "test",
          provider: "telegram",
          endpoint: "sendInvoice",
          input: { provider_token: "private", prompt: "kept" },
          outcome: "local_error",
          apicityVersion: "test",
          runtime: "node",
          startedAt: timing.startedAt,
          durationMs: 0,
        },
      },
    };
    scrubHar(har);
    expect(har.log._apicity!.input).toEqual({
      provider_token: "***",
      prompt: "kept",
    });
  });
  it("scrubs presigned redirect locations as well as bodies", async () => {
    const url = "https://bucket.example/key?X-Amz-Credential=private&keep=yes";
    const entry = await exchangeToEntry(
      new Request("https://example.com"),
      new Response(null, { status: 302, headers: { location: url } }),
      timing
    );
    expect(entry.response.redirectURL).toBe(
      "https://bucket.example/key?keep=yes"
    );
    expect(entry.response.headers).toContainEqual({
      name: "location",
      value: "https://bucket.example/key?keep=yes",
    });
  });
  it("does not leave presigned credentials in HAR queryString", async () => {
    const entry = await exchangeToEntry(
      new Request(
        "https://bucket.example/key?X-Amz-Credential=private&X-Amz-Signature=private&keep=yes"
      ),
      new Response(),
      timing
    );
    expect(entry.request.url).toBe("https://bucket.example/key?keep=yes");
    expect(entry.request.queryString).toEqual([{ name: "keep", value: "yes" }]);
  });
  it("handles multipart fields named after Object prototype members", async () => {
    const form = new FormData();
    form.append("__proto__", "kept");
    form.append("constructor", "also kept");
    const entry = await exchangeToEntry(
      new Request("https://example.com", { method: "POST", body: form }),
      new Response(),
      timing
    );
    const body = JSON.parse(entry.request.postData!.text!);
    expect(Object.hasOwn(body, "__proto__")).toBe(true);
    expect(body.constructor).toBe("also kept");
  });
});

describe("generic credential body keys", () => {
  it.each([
    "api_key",
    "apiKey",
    "API-KEY",
    "apikey",
    "access_token",
    "accessToken",
    "refresh_token",
    "authToken",
    "client_secret",
    "secretAccessKey",
    "private_key",
    "password",
  ])("scrubs %s in request and response JSON at every depth", (key) => {
    const entry = bodyEntry({
      [key]: "private",
      nested: [{ [key]: ["one", "two"], prompt: "kept" }],
      key: "model-key",
      token: "model-token",
      tokens: 10,
      api_key_id: "id",
    });
    scrubEntry(entry);
    const expected = {
      [key]: "***",
      nested: [{ [key]: "***", prompt: "kept" }],
      key: "model-key",
      token: "model-token",
      tokens: 10,
      api_key_id: "id",
    };
    expect(JSON.parse(entry.request!.postData!.text!)).toEqual(expected);
    expect(JSON.parse(entry.response!.content!.text!)).toEqual(expected);
    const once = JSON.stringify(entry);
    scrubEntry(entry);
    expect(JSON.stringify(entry)).toBe(once);
  });
  it("preserves ordinary JSON formatting and null credentials", () => {
    const text = '{ "prompt": "keep", "tokens": 12, "api_key": null }';
    const entry = {
      request: { postData: { text } },
      response: { content: { text } },
    };
    scrubEntry(entry);
    expect(entry.request.postData.text).toBe(text);
    expect(entry.response.content.text).toBe(text);
  });
  it.each([
    'data: {"api_key":"private","prompt":"kept"}\n\ndata: [DONE]',
    '{"apiKey":"private',
    '{"api_key":"escaped\\"secret","prompt":"kept"',
    '{"api\\u005fkey":"private"',
  ])("scrubs string credentials in partial JSON/SSE: %s", (text) => {
    const entry = {
      request: { postData: { text } },
      response: { content: { text } },
    };
    scrubEntry(entry);
    expect(entry.request.postData.text).not.toMatch(/private|secret/);
    expect(entry.response.content.text).not.toMatch(/private|secret/);
    expect(entry.request.postData.text).toContain("***");
    const once = JSON.stringify(entry);
    scrubEntry(entry);
    expect(JSON.stringify(entry)).toBe(once);
  });
  it("redacts input/context for local failures with no exchange", () => {
    const har: Har = {
      log: {
        version: "1.2",
        creator: { name: "test", version: "1" },
        entries: [],
        _apicity: {
          callId: "test",
          provider: "openai",
          endpoint: "v1.models",
          input: {
            api_key: "private",
            nested: [{ clientSecret: "private" }],
            prompt: "kept",
          },
          context: { authToken: "private" },
          outcome: "local_error",
          apicityVersion: "test",
          runtime: "node",
          startedAt: timing.startedAt,
          durationMs: 0,
        },
      },
    };
    scrubHar(har);
    expect(har.log._apicity!.input).toEqual({
      api_key: "***",
      nested: [{ clientSecret: "***" }],
      prompt: "kept",
    });
    expect(har.log._apicity!.context).toEqual({ authToken: "***" });
    const once = JSON.stringify(har);
    scrubHar(har);
    expect(JSON.stringify(har)).toBe(once);
  });
});
