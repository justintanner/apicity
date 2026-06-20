import { describe, expect, it } from "vitest";
import { createTelegram } from "@apicity/telegram";

const SEND_METHODS = [
  "sendAnimation",
  "sendAudio",
  "sendChatAction",
  "sendChecklist",
  "sendContact",
  "sendDice",
  "sendDocument",
  "sendLivePhoto",
  "sendLocation",
  "sendMediaGroup",
  "sendMessage",
  "sendMessageDraft",
  "sendPaidMedia",
  "sendPhoto",
  "sendPoll",
  "sendRichMessage",
  "sendRichMessageDraft",
  "sendVenue",
  "sendVideo",
  "sendVideoNote",
  "sendVoice",
] as const;

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function messageResult(): Record<string, unknown> {
  return {
    message_id: 1,
    date: 1,
    chat: { id: 42, type: "private" },
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (input instanceof Request) return input.url;
  return String(input);
}

function createFetch(captured: CapturedRequest[]): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    captured.push({ url, init: init ?? {} });

    let result: unknown = messageResult();
    if (url.endsWith("/sendMediaGroup")) {
      result = [messageResult(), messageResult()];
    } else if (
      url.endsWith("/sendChatAction") ||
      url.endsWith("/sendMessageDraft") ||
      url.endsWith("/sendRichMessageDraft")
    ) {
      result = true;
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

function firstCapture(captured: CapturedRequest[]): CapturedRequest {
  const first = captured[0];
  if (!first) {
    throw new Error("expected one captured request");
  }
  return first;
}

function jsonBody(capture: CapturedRequest): Record<string, unknown> {
  expect(typeof capture.init.body).toBe("string");
  return JSON.parse(capture.init.body as string) as Record<string, unknown>;
}

function formBody(capture: CapturedRequest): FormData {
  expect(capture.init.body).toBeInstanceOf(FormData);
  return capture.init.body as FormData;
}

function expectBlobPart(
  value: FormDataEntryValue | null,
  expected: Blob
): void {
  expect(value).toBeInstanceOf(Blob);
  const blob = value as Blob;
  expect(blob.size).toBe(expected.size);
  expect(blob.type).toBe(expected.type);
}

describe("telegram send method wrappers", () => {
  it("exposes the current message-sending endpoint family", () => {
    const telegram = createTelegram({ botToken: "test" });
    const root = telegram as unknown as Record<string, unknown>;
    const post = telegram.post as unknown as Record<string, unknown>;

    for (const method of SEND_METHODS) {
      expect(typeof root[method], method).toBe("function");
      expect(typeof post[method], `post.${method}`).toBe("function");
      expect(root[method], method).toBe(post[method]);
    }
  });

  it("sends JSON when the request has no files", async () => {
    const captured: CapturedRequest[] = [];
    const telegram = createTelegram({
      botToken: "test-token",
      fetch: createFetch(captured),
    });

    await telegram.sendPoll({
      chat_id: "@fixture",
      question: "Lunch?",
      options: [{ text: "Soup" }],
      media: {
        type: "photo",
        media: "https://example.com/poll.png",
      },
    });

    const first = firstCapture(captured);
    expect(first.url).toBe("https://api.telegram.org/bottest-token/sendPoll");
    expect(new Headers(first.init.headers).get("content-type")).toBe(
      "application/json"
    );
    expect(jsonBody(first)).toEqual({
      chat_id: "@fixture",
      question: "Lunch?",
      options: [{ text: "Soup" }],
      media: {
        type: "photo",
        media: "https://example.com/poll.png",
      },
    });
  });

  it("uses multipart form data for top-level InputFile uploads", async () => {
    const captured: CapturedRequest[] = [];
    const telegram = createTelegram({
      botToken: "test-token",
      fetch: createFetch(captured),
    });
    const document = new Blob(["doc"], { type: "text/plain" });

    await telegram.sendDocument({
      chat_id: "@fixture",
      document,
      caption: "plain text",
    });

    const first = firstCapture(captured);
    const headers = new Headers(first.init.headers);
    expect(headers.get("content-type")).toBeNull();

    const form = formBody(first);
    expect(form.get("chat_id")).toBe("@fixture");
    expect(form.get("caption")).toBe("plain text");
    expectBlobPart(form.get("document"), document);
  });

  it("turns nested media blobs into attach references", async () => {
    const captured: CapturedRequest[] = [];
    const telegram = createTelegram({
      botToken: "test-token",
      fetch: createFetch(captured),
    });
    const photo = new Blob(["photo"], { type: "image/png" });
    const thumb = new Blob(["thumb"], { type: "image/jpeg" });

    await telegram.sendMediaGroup({
      chat_id: "@fixture",
      media: [
        {
          type: "photo",
          media: photo,
          thumbnail: thumb,
          caption: "local file",
        },
        {
          type: "photo",
          media: "https://example.com/remote.png",
        },
      ],
    });

    const form = formBody(firstCapture(captured));
    expectBlobPart(form.get("media_0_media"), photo);
    expectBlobPart(form.get("media_0_thumbnail"), thumb);

    expect(JSON.parse(String(form.get("media")))).toEqual([
      {
        type: "photo",
        media: "attach://media_0_media",
        thumbnail: "attach://media_0_thumbnail",
        caption: "local file",
      },
      {
        type: "photo",
        media: "https://example.com/remote.png",
      },
    ]);
  });

  it("supports nested paid media uploads", async () => {
    const captured: CapturedRequest[] = [];
    const telegram = createTelegram({
      botToken: "test-token",
      fetch: createFetch(captured),
    });
    const paidPhoto = new Blob(["paid"], { type: "image/png" });

    await telegram.sendPaidMedia({
      chat_id: "@fixture",
      star_count: 1,
      media: [{ type: "photo", media: paidPhoto }],
      payload: "fixture",
    });

    const form = formBody(firstCapture(captured));
    expectBlobPart(form.get("media_0_media"), paidPhoto);
    expect(JSON.parse(String(form.get("media")))).toEqual([
      { type: "photo", media: "attach://media_0_media" },
    ]);
  });
});
