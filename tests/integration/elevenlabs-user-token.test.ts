import { describe, it, expect } from "vitest";
import {
  createElevenLabs,
  type ElevenLabsSingleUseTokenType,
} from "@apicity/elevenlabs";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function inputUrl(input: string | URL | Request): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("elevenlabs v1 user and single-use token", () => {
  it("routes user and single-use token endpoints without invalid-key replay", async () => {
    const calls: FetchCall[] = [];
    const provider = createElevenLabs({
      apiKey: "elevenlabs-test-key",
      fetch: async (input, init) => {
        const url = inputUrl(input);
        const pathname = new URL(url).pathname;
        calls.push({ url, init });

        if (pathname === "/v1/user") {
          return jsonResponse({
            user_id: "user_123",
            subscription: {
              tier: "creator",
              character_count: 25,
              character_limit: 100,
            },
            is_new_user: false,
            can_use_delayed_payment_methods: false,
            is_onboarding_completed: true,
            is_onboarding_checklist_completed: true,
            created_at: 1_788_000_000,
            seat_type: "admin",
          });
        }

        if (pathname === "/v1/user/subscription") {
          return jsonResponse({
            tier: "creator",
            character_count: 25,
            character_limit: 100,
          });
        }

        if (pathname === "/v1/single-use-token/realtime_scribe") {
          return jsonResponse({ token: "single-use-token" });
        }

        return jsonResponse({ detail: "unexpected request" }, 500);
      },
    });
    const tokenType: ElevenLabsSingleUseTokenType = "realtime_scribe";

    expect(provider.get.v1.user).toBe(provider.v1.user);
    expect(provider.get.v1.user.subscription).toBe(
      provider.v1.user.subscription
    );
    expect(provider.post.v1.singleUseToken).toBe(provider.v1.singleUseToken);
    expect(provider.v1.user.schema).toBeUndefined();
    expect(provider.v1.singleUseToken.schema).toBeUndefined();

    const user = await provider.v1.user();
    const subscription = await provider.v1.user.subscription();
    const singleUseToken = await provider.v1.singleUseToken(tokenType);

    expect(user.user_id).toBe("user_123");
    expect(subscription.remaining_character_count).toBe(75);
    expect(singleUseToken.token).toBe("single-use-token");
    expect(calls.map((call) => new URL(call.url).pathname)).toEqual([
      "/v1/user",
      "/v1/user/subscription",
      "/v1/single-use-token/realtime_scribe",
    ]);
    expect(calls.map((call) => call.init?.method)).toEqual([
      "GET",
      "GET",
      "POST",
    ]);
    expect(
      calls.every(
        (call) =>
          new Headers(call.init?.headers).get("xi-api-key") ===
          "elevenlabs-test-key"
      )
    ).toBe(true);
    expect(calls.every((call) => call.init?.body === undefined)).toBe(true);
  });
});
