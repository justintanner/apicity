import { describe, it, expect } from "vitest";
import { createX, XError } from "@apicity/x";

interface FetchCall {
  input: RequestInfo | URL;
  init?: RequestInit;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function createQueuedFetch(responses: Response[]) {
  const calls: FetchCall[] = [];

  const fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    calls.push({ input, init });
    const res = responses.shift();
    if (!res) {
      throw new Error("No queued response for fake fetch");
    }
    return res;
  };

  return { calls, fetch };
}

function headersOf(init: RequestInit | undefined): Headers {
  return new Headers(init?.headers);
}

describe("x get.v2.users.me", () => {
  it("requests the authenticated user with bearer auth", async () => {
    const { calls, fetch } = createQueuedFetch([
      jsonResponse({
        data: {
          id: "2244994945",
          name: "X Dev",
          username: "TwitterDev",
        },
      }),
    ]);
    const provider = createX({ accessToken: "x-test-token", fetch });

    const res = await provider.get.v2.users.me();

    expect(res.data.username).toBe("TwitterDev");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.input).toBe("https://api.x.com/2/users/me");
    expect(calls[0]?.init?.method).toBe("GET");
    expect(calls[0]?.init?.body).toBeUndefined();
    expect(headersOf(calls[0]?.init).get("Authorization")).toBe(
      "Bearer x-test-token"
    );
    expect(headersOf(calls[0]?.init).get("Content-Type")).toBeNull();
  });

  it("serializes documented query parameters", async () => {
    const { calls, fetch } = createQueuedFetch([
      jsonResponse({
        data: {
          id: "2244994945",
          name: "X Dev",
          username: "TwitterDev",
          created_at: "2013-12-14T04:35:55Z",
        },
        includes: {
          tweets: [{ id: "1346889436626259968", text: "hello" }],
        },
      }),
    ]);
    const provider = createX({
      accessToken: "x-test-token",
      baseURL: "https://example.test",
      fetch,
    });

    await provider.get.v2.users.me({
      "user.fields": ["created_at", "username"],
      expansions: ["pinned_tweet_id"],
      "tweet.fields": ["created_at", "text"],
    });

    const url = new URL(String(calls[0]?.input));
    expect(url.origin).toBe("https://example.test");
    expect(url.pathname).toBe("/2/users/me");
    expect(url.searchParams.get("user.fields")).toBe("created_at,username");
    expect(url.searchParams.get("expansions")).toBe("pinned_tweet_id");
    expect(url.searchParams.get("tweet.fields")).toBe("created_at,text");
  });

  it("exposes a Zod schema for query parameters", () => {
    const provider = createX({ accessToken: "x-test-token" });
    const endpoint = provider.get.v2.users.me;

    expect(endpoint.schema.safeParse({}).success).toBe(true);
    expect(
      endpoint.schema.safeParse({
        "user.fields": ["created_at", "username"],
        expansions: ["affiliation.user_id"],
        "tweet.fields": ["public_metrics", "text"],
      }).success
    ).toBe(true);
    expect(
      endpoint.schema.safeParse({
        "user.fields": ["not_a_user_field"],
      }).success
    ).toBe(false);
    expect(
      endpoint.schema.safeParse({
        expansions: [],
      }).success
    ).toBe(false);
  });

  it("maps non-ok responses to XError", async () => {
    const body = {
      title: "Forbidden",
      detail: "Client Forbidden",
      status: 403,
      type: "about:blank",
    };
    const { fetch } = createQueuedFetch([jsonResponse(body, 403)]);
    const provider = createX({ accessToken: "x-test-token", fetch });

    try {
      await provider.get.v2.users.me();
      throw new Error("Expected users/me to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(XError);
      expect(error).toMatchObject({
        name: "XError",
        status: 403,
        body,
      });
    }
  });
});
