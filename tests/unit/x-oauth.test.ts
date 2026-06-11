import { describe, expect, it, vi } from "vitest";

import { createXOAuth, XError } from "../../packages/provider/x/src";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const TOKEN_RESPONSE = {
  token_type: "bearer",
  expires_in: 7200,
  access_token: "new-access",
  refresh_token: "new-refresh",
  scope: "tweet.read tweet.write offline.access",
};

describe("X OAuth token endpoint wiring", () => {
  it("exchanges an authorization code with Basic auth and form body", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(TOKEN_RESPONSE));
    const oauth = createXOAuth({
      clientId: "cid",
      clientSecret: "csec",
      fetch: mockFetch,
    });

    const result = await oauth.post.v2.oauth2.token({
      grant_type: "authorization_code",
      code: "auth-code",
      redirect_uri: "http://127.0.0.1:8765/callback",
      code_verifier: "verifier-123",
    });

    expect(result).toEqual(TOKEN_RESPONSE);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.x.com/2/oauth2/token");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: `Basic ${btoa("cid:csec")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    const body = init.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("redirect_uri")).toBe("http://127.0.0.1:8765/callback");
    expect(body.get("code_verifier")).toBe("verifier-123");
  });

  it("refreshes a token with the refresh_token grant", async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(TOKEN_RESPONSE));
    const oauth = createXOAuth({
      clientId: "cid",
      clientSecret: "csec",
      baseURL: "https://x.local",
      fetch: mockFetch,
    });

    await oauth.post.v2.oauth2.token({
      grant_type: "refresh_token",
      refresh_token: "old-refresh",
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://x.local/2/oauth2/token");
    const body = init.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("old-refresh");
    expect(body.get("code")).toBeNull();
  });

  it("surfaces RFC 6749 error responses", async () => {
    const oauth = createXOAuth({
      clientId: "cid",
      clientSecret: "csec",
      fetch: async () =>
        jsonResponse(
          {
            error: "invalid_grant",
            error_description: "Refresh token revoked",
          },
          400
        ),
    });

    try {
      await oauth.post.v2.oauth2.token({
        grant_type: "refresh_token",
        refresh_token: "revoked",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(XError);
      const xError = error as XError;
      expect(xError.status).toBe(400);
      expect(xError.message).toBe("X OAuth error 400: Refresh token revoked");
      expect(xError.body).toEqual({
        error: "invalid_grant",
        error_description: "Refresh token revoked",
      });
      return;
    }

    throw new Error("Expected XError");
  });

  it("falls back to the bare error code when no description is present", async () => {
    const oauth = createXOAuth({
      clientId: "cid",
      clientSecret: "csec",
      fetch: async () => jsonResponse({ error: "invalid_client" }, 401),
    });

    await expect(
      oauth.post.v2.oauth2.token({
        grant_type: "refresh_token",
        refresh_token: "rt",
      })
    ).rejects.toThrow("X OAuth error 401: invalid_client");
  });

  it("attaches the request schema to the token method", () => {
    const oauth = createXOAuth({ clientId: "cid", clientSecret: "csec" });
    const schema = oauth.post.v2.oauth2.token.schema;
    expect(
      schema.safeParse({
        grant_type: "refresh_token",
        refresh_token: "rt",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({ grant_type: "authorization_code", code: "c" }).success
    ).toBe(false);
  });
});
