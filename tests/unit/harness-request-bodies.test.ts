import { describe, expect, it } from "vitest";
import {
  getRequestBodyText,
  parseRequestBody,
  type HarEntry,
} from "../har-data";
import {
  persistSafeTextRequestBody,
  redactPersistedHarSecrets,
  summarizeJsonRequestBodyMedia,
  summarizeMultipartFormData,
  summarizeMultipartRequestBody,
  type PersistedHarRecording,
} from "../harness";
import { scrubSensitiveResponse } from "../har-scrub";

function emptyResponse(): HarEntry["response"] {
  return {
    status: 200,
    statusText: "OK",
    headers: [],
    content: {},
  };
}

describe("harness request body helpers", () => {
  it("summarizes multipart form data without embedding file bytes", () => {
    const image = new Blob(["cat-bytes"], { type: "image/jpeg" });
    const mask = new Blob(["mask-bytes"], { type: "image/png" });
    const form = new FormData();
    form.append("prompt", "Add a red bow tie");
    form.append("model", "gpt-image-2-2026-04-21");
    form.append("image", image, "cat.jpg");
    form.append("image", mask, "mask.png");

    expect(summarizeMultipartFormData(form)).toEqual({
      _multipart: true,
      prompt: "Add a red bow tie",
      model: "gpt-image-2-2026-04-21",
      image: [
        {
          _file: true,
          filename: "cat.jpg",
          contentType: "image/jpeg",
          size: image.size,
        },
        {
          _file: true,
          filename: "mask.png",
          contentType: "image/png",
          size: mask.size,
        },
      ],
    });
  });

  it("summarizes FormData-like request bodies from fetch adapters", () => {
    const file = new Blob(["audio-bytes"], { type: "audio/mpeg" });
    const formDataLike = {
      [Symbol.toStringTag]: "FormData",
      entries: function* (): Iterable<[string, Blob | string]> {
        yield ["file", file];
        yield ["model", "whisper-v3"];
      },
    };

    expect(summarizeMultipartRequestBody(formDataLike)).toEqual({
      _multipart: true,
      file: {
        _file: true,
        contentType: "audio/mpeg",
        size: file.size,
      },
      model: "whisper-v3",
    });
  });

  it("does not treat URLSearchParams as multipart form data", () => {
    const params = new URLSearchParams();
    params.append("file", "not-a-file");

    expect(summarizeMultipartRequestBody(params)).toBeNull();
  });

  it("reconstructs a readable body from multipart HAR params", () => {
    const entry: HarEntry = {
      request: {
        method: "POST",
        url: "https://api.openai.com/v1/images/edits",
        headers: [
          {
            name: "content-type",
            value: "multipart/form-data; boundary=test",
          },
        ],
        postData: {
          mimeType: "multipart/form-data",
          params: [
            { name: "prompt", value: "Add a red bow tie" },
            { name: "model", value: "gpt-image-2-2026-04-21" },
            {
              name: "image",
              fileName: "cat.jpg",
              contentType: "image/jpeg",
            },
          ],
        },
      },
      response: emptyResponse(),
    };

    const expected = {
      _multipart: true,
      prompt: "Add a red bow tie",
      model: "gpt-image-2-2026-04-21",
      image: {
        _file: true,
        filename: "cat.jpg",
        contentType: "image/jpeg",
      },
    };

    expect(parseRequestBody(entry)).toEqual(expected);
    expect(JSON.parse(getRequestBodyText(entry) ?? "")).toEqual(expected);
  });

  it("persists safe XML request bodies captured as bytes", () => {
    const xml =
      '<AccelerateConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">' +
      "<Status>Suspended</Status>" +
      "</AccelerateConfiguration>";
    const recording: PersistedHarRecording = {
      request: {
        bodySize: 0,
        headers: [{ name: "content-type", value: "application/xml" }],
        postData: { mimeType: "application/xml", params: [] },
      },
    };

    persistSafeTextRequestBody(recording, new TextEncoder().encode(xml));

    expect(recording.request?.postData?.text).toBe(xml);
    expect(recording.request?.bodySize).toBe(
      new TextEncoder().encode(xml).length
    );
  });

  it("persists safe text request bodies captured as strings", () => {
    const body = "hello from @apicity/s3 object core test\n";
    const recording: PersistedHarRecording = {
      request: {
        bodySize: 0,
        headers: [{ name: "content-type", value: "text/plain; charset=utf-8" }],
        postData: { mimeType: "text/plain", params: [] },
      },
    };

    persistSafeTextRequestBody(recording, body);

    expect(recording.request?.postData?.text).toBe(body);
    expect(recording.request?.bodySize).toBe(body.length);
  });

  it("does not persist binary or already populated request bodies", () => {
    const binaryRecording: PersistedHarRecording = {
      request: {
        bodySize: 0,
        headers: [{ name: "content-type", value: "image/png" }],
        postData: { mimeType: "image/png", params: [] },
      },
    };
    const existingRecording: PersistedHarRecording = {
      request: {
        bodySize: 13,
        headers: [{ name: "content-type", value: "application/xml" }],
        postData: {
          mimeType: "application/xml",
          text: "<Existing />",
          params: [],
        },
      },
    };

    persistSafeTextRequestBody(binaryRecording, new Uint8Array([0xff, 0xd8]));
    persistSafeTextRequestBody(existingRecording, "<Next />");

    expect(binaryRecording.request?.postData?.text).toBeUndefined();
    expect(existingRecording.request?.postData?.text).toBe("<Existing />");
    expect(existingRecording.request?.bodySize).toBe(13);
  });

  it("redacts Gofile guest tokens from persisted response bodies", () => {
    const recording: PersistedHarRecording = {
      response: {
        content: {
          mimeType: "application/json",
          text: '{"data":{"guestToken":"live-token","nested":[{"guestToken":"other-token"}]},"status":"ok"}\n',
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(JSON.parse(recording.response?.content?.text ?? "")).toEqual({
      data: {
        guestToken: "***",
        nested: [{ guestToken: "***" }],
      },
      status: "ok",
    });
    expect(recording.response?.content?.text).not.toContain("live-token");
    expect(recording.response?.content?.text).not.toContain("other-token");
    expect(recording.response?.content?.size).toBe(
      new TextEncoder().encode(recording.response?.content?.text ?? "").length
    );
    expect(recording.response?.bodySize).toBe(
      recording.response?.content?.size
    );
  });

  it("redacts credential-bearing multipart request fields", () => {
    const recording: PersistedHarRecording = {
      request: {
        postData: {
          mimeType: "multipart/form-data",
          text: JSON.stringify({
            _multipart: true,
            OSSAccessKeyId: "oss-key",
            Signature: "oss-signature",
            policy: "base64-policy",
            key: "uploads/cat1.jpg",
            file: {
              _file: true,
              filename: "cat1.jpg",
              contentType: "image/jpeg",
              size: 83558,
            },
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(JSON.parse(recording.request?.postData?.text ?? "")).toEqual({
      _multipart: true,
      OSSAccessKeyId: "***",
      Signature: "***",
      policy: "***",
      key: "uploads/cat1.jpg",
      file: {
        _file: true,
        filename: "cat1.jpg",
        contentType: "image/jpeg",
        size: 83558,
      },
    });
    expect(recording.request?.postData?.text).not.toContain("oss-key");
    expect(recording.request?.postData?.text).not.toContain("oss-signature");
    expect(recording.request?.postData?.text).not.toContain("base64-policy");
  });

  it("summarizes JSON request media without losing scalar context", () => {
    const videoBytes = Buffer.from("fake-video");
    const rawBytes = Buffer.alloc(900, 7);
    const videoDataUrl = `data:video/mp4;base64,${videoBytes.toString(
      "base64"
    )}`;
    const rawBase64 = rawBytes.toString("base64");
    const recording: PersistedHarRecording = {
      request: {
        bodySize: 0,
        postData: {
          mimeType: "application/json",
          text: JSON.stringify({
            prompt: "The camera slowly zooms out",
            duration: 4,
            video_url: videoDataUrl,
            settings: {
              seed: 42,
              references: [{ kind: "mask", data: rawBase64 }],
            },
          }),
        },
      },
    };

    summarizeJsonRequestBodyMedia(recording);

    const text = recording.request?.postData?.text ?? "";
    expect(JSON.parse(text)).toEqual({
      prompt: "The camera slowly zooms out",
      duration: 4,
      video_url:
        "<inline video/mp4 data URL — replace with a real URL or upload>",
      settings: {
        seed: 42,
        references: [{ kind: "mask", data: "<inline base64 data; 900 bytes>" }],
      },
    });
    expect(text).not.toContain(videoDataUrl);
    expect(text).not.toContain(rawBase64);
    expect(recording.request?.bodySize).toBe(
      new TextEncoder().encode(text).length
    );
  });

  it("redacts Fireworks API key metadata from persisted response bodies", () => {
    const recording: PersistedHarRecording = {
      response: {
        content: {
          mimeType: "application/json",
          text: JSON.stringify({
            apiKeys: [
              {
                annotations: {},
                createTime: "2026-03-30T05:41:10Z",
                displayName: "production-key",
                email: "person@example.com",
                expireTime: null,
                key: "fw_live_secret",
                keyId: "key_live123",
                lastUsed: "2026-04-16T07:18:00Z",
                prefix: "fw_live",
                secure: true,
              },
            ],
            nextPageToken: "",
            totalSize: 1,
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(JSON.parse(recording.response?.content?.text ?? "")).toEqual({
      apiKeys: [
        {
          annotations: {},
          createTime: "2026-03-30T05:41:10Z",
          displayName: "***",
          email: "***",
          expireTime: null,
          key: "***",
          keyId: "***",
          lastUsed: "2026-04-16T07:18:00Z",
          prefix: "***",
          secure: true,
        },
      ],
      nextPageToken: "",
      totalSize: 1,
    });
    expect(recording.response?.content?.text).not.toContain("person@example");
    expect(recording.response?.content?.text).not.toContain("key_live123");
    expect(recording.response?.content?.text).not.toContain("fw_live");
    expect(recording.response?.content?.text).not.toContain("production-key");
    expect(recording.response?.content?.size).toBe(
      new TextEncoder().encode(recording.response?.content?.text ?? "").length
    );
    expect(recording.response?.bodySize).toBe(
      recording.response?.content?.size
    );
  });

  it("redacts xAI batch account metadata from persisted response bodies", () => {
    const recording: PersistedHarRecording = {
      response: {
        content: {
          mimeType: "application/json",
          text: JSON.stringify({
            batch_id: "batch_123",
            create_api_key_id: "276a4be1-763d-460a-a3d9-91b306d381b8",
            nested: {
              batches: [
                {
                  batch_id: "batch_456",
                  create_api_key_id: "31cf6025-b096-42d0-84c0-8d98be6889db",
                },
              ],
            },
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(JSON.parse(recording.response?.content?.text ?? "")).toEqual({
      batch_id: "batch_123",
      create_api_key_id: "***",
      nested: {
        batches: [
          {
            batch_id: "batch_456",
            create_api_key_id: "***",
          },
        ],
      },
    });
    expect(recording.response?.content?.text).not.toContain(
      "276a4be1-763d-460a-a3d9-91b306d381b8"
    );
    expect(recording.response?.content?.text).not.toContain(
      "31cf6025-b096-42d0-84c0-8d98be6889db"
    );
    expect(recording.response?.content?.size).toBe(
      new TextEncoder().encode(recording.response?.content?.text ?? "").length
    );
    expect(recording.response?.bodySize).toBe(
      recording.response?.content?.size
    );
  });
});

describe("harness persist scrubbers", () => {
  it("removes request cookies before persisting recordings", () => {
    const recording: PersistedHarRecording = {
      request: {
        headers: [
          { name: "authorization", value: "Bearer real-token" },
          { name: "cookie", value: "__cf_bm=raw-cloudflare-cookie" },
          { name: "Cookie", value: "session=raw-session" },
          { name: "content-type", value: "application/json" },
        ],
        cookies: [
          { name: "__cf_bm", value: "raw-cloudflare-cookie" },
          { name: "session", value: "raw-session" },
        ],
      },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.headers).toEqual([
      { name: "authorization", value: "Bearer ***" },
      { name: "content-type", value: "application/json" },
    ]);
    expect(recording.request?.cookies).toEqual([]);
  });

  it("removes response cookies before persisting recordings", () => {
    const recording: PersistedHarRecording = {
      response: {
        headers: [
          { name: "content-type", value: "application/json" },
          {
            name: "set-cookie",
            value: "JSESSIONID=raw-session; Path=/; HttpOnly",
          },
          {
            name: "Set-Cookie",
            value: "other=raw-cookie; Path=/; Secure",
          },
        ],
        cookies: [
          { name: "JSESSIONID", value: "raw-session", httpOnly: true },
          { name: "other", value: "raw-cookie", secure: true },
        ],
        content: { text: '{"ok":true}' },
      },
    };

    redactPersistedHarSecrets(recording);
    scrubSensitiveResponse(recording);

    expect(recording.response?.headers).toEqual([
      { name: "content-type", value: "application/json" },
    ]);
    expect(recording.response?.cookies).toEqual([]);
  });

  it("redacts DashScope identifiers and signed OSS response URLs", () => {
    const recording: PersistedHarRecording = {
      request: {
        url: "https://api.telegram.org/bot123456:secret/sendMessage",
        headers: [
          { name: "authorization", value: "Bearer real-token" },
          { name: "cookie", value: "session=real-session" },
          { name: "x-api-key", value: "real-key" },
        ],
        cookies: [{ name: "session", value: "real-session" }],
      },
      response: {
        headers: [
          {
            name: "set-cookie",
            value:
              "PHPSESSID=real-session; expires=Thu, 23 Apr 2026 07:19:05 GMT; " +
              "Max-Age=604800; path=/; domain=.catbox.moe; Secure; SameSite=Lax",
          },
          { name: "x-dashscope-apikeyid", value: "apikey-123" },
          { name: "x-dashscope-bwid", value: "ws-123" },
          { name: "x-dashscope-uid", value: "5077675727314676" },
          { name: "x-dashscope-workspace", value: "ws-456" },
          {
            name: "x-dashscope-inner-flow-control-meta",
            value: JSON.stringify({
              model: "qwen-image-edit",
              user_id: "5077675727314676",
              user_spec: {
                default_spec: false,
                count_limit: 2,
              },
            }),
          },
        ],
        cookies: [
          {
            name: "PHPSESSID",
            value: "real-session",
          },
        ],
        content: {
          text: JSON.stringify({
            image:
              "https://dashscope-result-sh.oss-cn-shanghai.aliyuncs.com/" +
              "result.png?Expires=1777010569&OSSAccessKeyId=LTAI-secret" +
              "&Signature=secret-signature",
            upload_host:
              "https://dashscope-file-mgr.oss-cn-beijing.aliyuncs.com",
            oss_access_key_id: "LTAI-upload-secret",
            signature: "upload-policy-signature",
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);
    scrubSensitiveResponse(recording);

    expect(recording.request?.url).toBe(
      "https://api.telegram.org/bot***/sendMessage"
    );
    expect(recording.request?.headers).toEqual([
      { name: "authorization", value: "Bearer ***" },
      { name: "x-api-key", value: "***" },
    ]);
    expect(recording.request?.cookies).toEqual([]);
    expect(recording.response?.headers).toEqual([
      { name: "x-dashscope-apikeyid", value: "***" },
      { name: "x-dashscope-bwid", value: "ws-***" },
      { name: "x-dashscope-uid", value: "***" },
      { name: "x-dashscope-workspace", value: "ws-***" },
      {
        name: "x-dashscope-inner-flow-control-meta",
        value: JSON.stringify({
          model: "qwen-image-edit",
          user_id: "***",
          user_spec: "***",
        }),
      },
    ]);
    expect(recording.response?.cookies).toEqual([]);
    expect(recording.response?.content?.text).toContain(
      "result.png?Expires=1777010569"
    );
    expect(recording.response?.content?.text).not.toContain("OSSAccessKeyId");
    expect(recording.response?.content?.text).not.toContain("Signature");
    expect(recording.response?.content?.text).not.toContain("LTAI-secret");
    expect(recording.response?.content?.text).not.toContain(
      "LTAI-upload-secret"
    );
    expect(recording.response?.content?.text).not.toContain("secret-signature");
    expect(recording.response?.content?.text).not.toContain(
      "upload-policy-signature"
    );
  });

  it("redacts Telegram webhook, payment, passport, and file artifacts", () => {
    const recording: PersistedHarRecording = {
      request: {
        url: "https://api.telegram.org/bot123456:secret/sendInvoice",
        headers: [
          {
            name: "X-Telegram-Bot-Api-Secret-Token",
            value: "webhook-secret",
          },
          { name: "content-type", value: "application/json" },
        ],
        postData: {
          mimeType: "application/json",
          text: JSON.stringify({
            chat_id: "@apicity_fixture",
            title: "Apicity plan",
            description: "Keep this public description",
            payload: "invoice-payload",
            provider_token: "payment-provider-token",
            provider_data: '{"receipt_email":"person@example.com"}',
            secret_token: "webhook-secret",
            passport_data: {
              data: "encrypted-passport-data",
              credentials: "encrypted-passport-credentials",
            },
            errors: [
              {
                source: "data",
                type: "personal_details",
                data_hash: "passport-data-hash",
                message: "keep validation message",
              },
            ],
          }),
        },
      },
      response: {
        content: {
          mimeType: "application/json",
          text: JSON.stringify({
            ok: true,
            result: {
              successful_payment: {
                invoice_payload: "invoice-payload",
                telegram_payment_charge_id: "tg-charge",
                provider_payment_charge_id: "provider-charge",
              },
              passport_data: {
                data: "encrypted-passport-response",
              },
              document: {
                file_id: "telegram-file-id",
                file_unique_id: "telegram-file-unique-id",
              },
            },
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.url).toBe(
      "https://api.telegram.org/bot***/sendInvoice"
    );
    const body = JSON.parse(
      recording.request?.postData?.text ?? "{}"
    ) as Record<string, unknown>;
    expect(body.payload).toBe("***");
    expect(body.provider_token).toBe("***");
    expect(recording.request?.headers).toEqual([
      { name: "X-Telegram-Bot-Api-Secret-Token", value: "***" },
      { name: "content-type", value: "application/json" },
    ]);
    expect(JSON.parse(recording.request?.postData?.text ?? "")).toEqual({
      chat_id: "@apicity_fixture",
      title: "Apicity plan",
      description: "Keep this public description",
      payload: "***",
      provider_token: "***",
      provider_data: "***",
      secret_token: "***",
      passport_data: "***",
      errors: [
        {
          source: "data",
          type: "personal_details",
          data_hash: "***",
          message: "keep validation message",
        },
      ],
    });
    expect(JSON.parse(recording.response?.content?.text ?? "")).toEqual({
      ok: true,
      result: {
        successful_payment: {
          invoice_payload: "***",
          telegram_payment_charge_id: "***",
          provider_payment_charge_id: "***",
        },
        passport_data: "***",
        document: {
          file_id: "***",
          file_unique_id: "***",
        },
      },
    });

    const serialized = JSON.stringify(recording);
    for (const leaked of [
      "123456:secret",
      "webhook-secret",
      "invoice-payload",
      "payment-provider-token",
      "person@example.com",
      "encrypted-passport-data",
      "encrypted-passport-credentials",
      "passport-data-hash",
      "tg-charge",
      "provider-charge",
      "encrypted-passport-response",
      "telegram-file-id",
      "telegram-file-unique-id",
    ]) {
      expect(serialized).not.toContain(leaked);
    }
    expect(recording.request?.bodySize).toBe(
      new TextEncoder().encode(recording.request?.postData?.text ?? "").length
    );
    expect(recording.response?.bodySize).toBe(
      recording.response?.content?.size
    );
  });

  it("keeps Telegram multipart file summaries while redacting payloads", () => {
    const recording: PersistedHarRecording = {
      request: {
        url: "https://api.telegram.org/bot123456:secret/sendPaidMedia",
        postData: {
          mimeType: "multipart/form-data",
          text: JSON.stringify({
            _multipart: true,
            chat_id: "@apicity_fixture",
            payload: "paid-media-payload",
            media: JSON.stringify([{ type: "photo", media: "attach://photo" }]),
            photo: {
              _file: true,
              filename: "receipt.png",
              contentType: "image/png",
              size: 4921,
            },
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(JSON.parse(recording.request?.postData?.text ?? "")).toEqual({
      _multipart: true,
      chat_id: "@apicity_fixture",
      payload: "***",
      media: JSON.stringify([{ type: "photo", media: "attach://photo" }]),
      photo: {
        _file: true,
        filename: "receipt.png",
        contentType: "image/png",
        size: 4921,
      },
    });
    expect(recording.request?.postData?.text).not.toContain(
      "paid-media-payload"
    );
  });

  it("redacts Polymarket CLOB auth headers, request signatures, and response credentials", () => {
    const recording: PersistedHarRecording = {
      request: {
        url: "https://clob.polymarket.com/auth/api-key",
        headers: [
          { name: "POLY_API_KEY", value: "poly-api-key" },
          { name: "POLY_PASSPHRASE", value: "poly-passphrase" },
          { name: "POLY_SIGNATURE", value: "poly-signature" },
          { name: "POLY_ADDRESS", value: "0x1234567890abcdef" },
          { name: "POLY_TIMESTAMP", value: "1700000000" },
          { name: "POLY_NONCE", value: "7" },
          { name: "X-Builder-API-Key", value: "builder-key" },
          { name: "X-Relayer-Signature", value: "relayer-signature" },
          { name: "content-type", value: "application/json" },
        ],
        postData: {
          mimeType: "application/json",
          text: JSON.stringify({
            note: "keep",
            signature: "signed-order",
            clobPrivateKey: "0xprivate",
            builderApiKey: "builder-body-key",
          }),
        },
      },
      response: {
        content: {
          mimeType: "application/json",
          text: JSON.stringify({
            apiKey: "created-api-key",
            secret: "created-secret",
            passphrase: "created-passphrase",
            nested: {
              api_key: "nested-api-key",
              signature: "nested-signature",
            },
          }),
        },
      },
    };

    redactPersistedHarSecrets(recording);

    expect(recording.request?.headers).toEqual([
      { name: "POLY_API_KEY", value: "***" },
      { name: "POLY_PASSPHRASE", value: "***" },
      { name: "POLY_SIGNATURE", value: "***" },
      { name: "POLY_ADDRESS", value: "***" },
      { name: "POLY_TIMESTAMP", value: "***" },
      { name: "POLY_NONCE", value: "***" },
      { name: "X-Builder-API-Key", value: "***" },
      { name: "X-Relayer-Signature", value: "***" },
      { name: "content-type", value: "application/json" },
    ]);
    expect(JSON.parse(recording.request?.postData?.text ?? "")).toEqual({
      note: "keep",
      signature: "***",
      clobPrivateKey: "***",
      builderApiKey: "***",
    });
    expect(JSON.parse(recording.response?.content?.text ?? "")).toEqual({
      apiKey: "***",
      secret: "***",
      passphrase: "***",
      nested: {
        api_key: "***",
        signature: "***",
      },
    });

    const serialized = JSON.stringify(recording);
    for (const leaked of [
      "poly-api-key",
      "poly-passphrase",
      "poly-signature",
      "0x1234567890abcdef",
      "1700000000",
      "builder-key",
      "relayer-signature",
      "signed-order",
      "0xprivate",
      "builder-body-key",
      "created-api-key",
      "created-secret",
      "created-passphrase",
      "nested-api-key",
      "nested-signature",
    ]) {
      expect(serialized).not.toContain(leaked);
    }
    expect(recording.request?.bodySize).toBe(
      new TextEncoder().encode(recording.request?.postData?.text ?? "").length
    );
    expect(recording.response?.bodySize).toBe(
      recording.response?.content?.size
    );
  });
});
