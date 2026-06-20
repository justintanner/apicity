import { describe, expect, it } from "vitest";
import { createTelegram } from "@apicity/telegram";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function createMockTelegram() {
  const calls: CapturedRequest[] = [];
  const mockFetch: typeof fetch = async (input, init) => {
    calls.push({
      url: String(input),
      init: init ?? {},
    });
    return new Response(JSON.stringify({ ok: true, result: true }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  return {
    calls,
    telegram: createTelegram({
      botToken: "TEST_TOKEN",
      fetch: mockFetch,
    }),
  };
}

function jsonBody(call: CapturedRequest): Record<string, unknown> {
  expect(call.init.headers).toEqual({ "Content-Type": "application/json" });
  expect(typeof call.init.body).toBe("string");
  return JSON.parse(call.init.body as string) as Record<string, unknown>;
}

describe("telegram chat administration request shapes", () => {
  it("serializes chat, member, and permissions endpoints as JSON", async () => {
    const { calls, telegram } = createMockTelegram();

    await telegram.getChat({ chat_id: "@apicity_fixture" });
    await telegram.getChatAdministrators({
      chat_id: -100123,
      return_bots: true,
    });
    await telegram.restrictChatMember({
      chat_id: -100123,
      user_id: 42,
      permissions: {
        can_send_messages: false,
        can_react_to_messages: true,
      },
      use_independent_chat_permissions: true,
    });
    await telegram.promoteChatMember({
      chat_id: -100123,
      user_id: 42,
      can_manage_tags: true,
      can_manage_direct_messages: true,
    });
    await telegram.setChatMemberTag({
      chat_id: -100123,
      user_id: 42,
      tag: "trusted",
    });
    await telegram.getUserPersonalChatMessages({
      user_id: 42,
      limit: 2,
    });

    expect(calls.map((c) => c.url)).toEqual([
      "https://api.telegram.org/botTEST_TOKEN/getChat",
      "https://api.telegram.org/botTEST_TOKEN/getChatAdministrators",
      "https://api.telegram.org/botTEST_TOKEN/restrictChatMember",
      "https://api.telegram.org/botTEST_TOKEN/promoteChatMember",
      "https://api.telegram.org/botTEST_TOKEN/setChatMemberTag",
      "https://api.telegram.org/botTEST_TOKEN/getUserPersonalChatMessages",
    ]);
    expect(jsonBody(calls[1])).toEqual({
      chat_id: -100123,
      return_bots: true,
    });
    expect(jsonBody(calls[2])).toEqual({
      chat_id: -100123,
      user_id: 42,
      permissions: {
        can_send_messages: false,
        can_react_to_messages: true,
      },
      use_independent_chat_permissions: true,
    });
    expect(jsonBody(calls[3])).toMatchObject({
      can_manage_direct_messages: true,
      can_manage_tags: true,
    });
    expect(jsonBody(calls[5])).toEqual({
      user_id: 42,
      limit: 2,
    });
  });

  it("serializes invite, forum, boost, and join request endpoints", async () => {
    const { calls, telegram } = createMockTelegram();

    await telegram.createChatInviteLink({
      chat_id: -100123,
      name: "qa",
      creates_join_request: true,
    });
    await telegram.createChatSubscriptionInviteLink({
      chat_id: "@apicity_fixture",
      subscription_period: 2592000,
      subscription_price: 100,
    });
    await telegram.createForumTopic({
      chat_id: -100123,
      name: "support",
      icon_color: 7322096,
    });
    await telegram.closeForumTopic({
      chat_id: -100123,
      message_thread_id: 7,
    });
    await telegram.getUserChatBoosts({
      chat_id: -100123,
      user_id: 42,
    });
    await telegram.approveChatJoinRequest({
      chat_id: -100123,
      user_id: 42,
    });
    await telegram.answerChatJoinRequestQuery({
      chat_join_request_query_id: "join-query",
      result: "queue",
    });
    await telegram.sendChatJoinRequestWebApp({
      chat_join_request_query_id: "join-query",
      web_app_url: "https://example.com/join",
    });
    await telegram.answerGuestQuery({
      guest_query_id: "guest-query",
      result: {
        type: "article",
        id: "1",
        title: "Guest reply",
        input_message_content: { message_text: "hello" },
      },
    });

    expect(calls.map((c) => c.url)).toEqual([
      "https://api.telegram.org/botTEST_TOKEN/createChatInviteLink",
      "https://api.telegram.org/botTEST_TOKEN/createChatSubscriptionInviteLink",
      "https://api.telegram.org/botTEST_TOKEN/createForumTopic",
      "https://api.telegram.org/botTEST_TOKEN/closeForumTopic",
      "https://api.telegram.org/botTEST_TOKEN/getUserChatBoosts",
      "https://api.telegram.org/botTEST_TOKEN/approveChatJoinRequest",
      "https://api.telegram.org/botTEST_TOKEN/answerChatJoinRequestQuery",
      "https://api.telegram.org/botTEST_TOKEN/sendChatJoinRequestWebApp",
      "https://api.telegram.org/botTEST_TOKEN/answerGuestQuery",
    ]);
    expect(jsonBody(calls[0])).toEqual({
      chat_id: -100123,
      name: "qa",
      creates_join_request: true,
    });
    expect(jsonBody(calls[1])).toEqual({
      chat_id: "@apicity_fixture",
      subscription_period: 2592000,
      subscription_price: 100,
    });
    expect(jsonBody(calls[6])).toEqual({
      chat_join_request_query_id: "join-query",
      result: "queue",
    });
    expect(jsonBody(calls[8])).toMatchObject({
      guest_query_id: "guest-query",
      result: {
        type: "article",
        title: "Guest reply",
      },
    });
  });

  it("uses multipart form data when a chat photo includes a Blob", async () => {
    const { calls, telegram } = createMockTelegram();
    const photo = new Blob(["fake image"], { type: "image/png" });

    await telegram.setChatPhoto({
      chat_id: -100123,
      photo,
    });

    expect(calls[0].url).toBe(
      "https://api.telegram.org/botTEST_TOKEN/setChatPhoto"
    );
    expect(calls[0].init.headers).toBeUndefined();
    expect(calls[0].init.body).toBeInstanceOf(FormData);
    const form = calls[0].init.body as FormData;
    const photoField = form.get("photo");
    expect(form.get("chat_id")).toBe("-100123");
    expect(photoField).toBeInstanceOf(Blob);
    expect((photoField as Blob).size).toBe(photo.size);
    expect((photoField as Blob).type).toBe(photo.type);
  });

  it("exposes schemas for current chat admin request validation", () => {
    const { telegram } = createMockTelegram();

    expect(
      telegram.restrictChatMember.schema.safeParse({
        chat_id: -100123,
        user_id: 42,
        permissions: { can_react_to_messages: true },
      }).success
    ).toBe(true);
    expect(
      telegram.answerChatJoinRequestQuery.schema.safeParse({
        chat_join_request_query_id: "join-query",
        result: "approve",
      }).success
    ).toBe(true);
    expect(
      telegram.answerChatJoinRequestQuery.schema.safeParse({
        chat_join_request_query_id: "join-query",
        result: "hold",
      }).success
    ).toBe(false);
    expect(
      telegram.sendChatJoinRequestWebApp.schema.safeParse({
        chat_join_request_query_id: "join-query",
        web_app_url: "not-a-url",
      }).success
    ).toBe(false);
  });
});
