import { describe, expect, it } from "vitest";

import { createOpenF1, OpenF1Error } from "@apicity/openf1";
import type { OpenF1Session, OpenF1TokenResponse } from "@apicity/openf1";

interface FetchCall {
  url: string;
  init?: RequestInit;
}

const sampleSession: OpenF1Session = {
  circuit_key: 61,
  circuit_short_name: "Singapore",
  country_code: "SGP",
  country_key: 157,
  country_name: "Singapore",
  date_end: "2024-09-22T14:00:00+00:00",
  date_start: "2024-09-22T13:00:00+00:00",
  gmt_offset: "08:00:00",
  is_cancelled: false,
  location: "Marina Bay",
  meeting_key: 1251,
  session_key: 9578,
  session_name: "Race",
  session_type: "Race",
  year: 2024,
};

function inputUrl(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("openf1 auth", () => {
  it("exchanges credentials for an OAuth token with form encoding", async () => {
    const calls: FetchCall[] = [];
    const tokenResponse: OpenF1TokenResponse = {
      access_token: "live-access-token",
      expires_in: 3600,
      token_type: "bearer",
    };
    const openf1 = createOpenF1({
      baseURL: "https://openf1.test/root/",
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return jsonResponse(tokenResponse);
      },
    });

    const result = await openf1.token({
      username: "driver@example.test",
      password: "p@ss word",
    });

    expect(result).toEqual(tokenResponse);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://openf1.test/root/token");
    expect(calls[0].init?.method).toBe("POST");
    expect(new Headers(calls[0].init?.headers).get("content-type")).toBe(
      "application/x-www-form-urlencoded"
    );
    expect(
      new URLSearchParams(String(calls[0].init?.body)).get("username")
    ).toBe("driver@example.test");
    expect(
      new URLSearchParams(String(calls[0].init?.body)).get("password")
    ).toBe("p@ss word");
  });

  it("maps token endpoint failures to OpenF1Error", async () => {
    const openf1 = createOpenF1({
      fetch: async () => jsonResponse({ detail: "Invalid credentials" }, 401),
    });

    await expect(
      openf1.token({ username: "driver@example.test", password: "wrong" })
    ).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 401,
      body: { detail: "Invalid credentials" },
    } satisfies Partial<OpenF1Error>);
  });

  it("adds bearer auth to REST reads when an access token is configured", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      accessToken: "live-access-token",
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return jsonResponse([sampleSession]);
      },
    });

    await expect(
      openf1.v1.sessions({ session_key: "latest" })
    ).resolves.toEqual([sampleSession]);

    expect(calls).toHaveLength(1);
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe(
      "Bearer live-access-token"
    );
  });

  it("leaves historical REST reads unauthenticated by default", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return jsonResponse([sampleSession]);
      },
    });

    await openf1.v1.sessions({ year: 2024 });

    expect(calls).toHaveLength(1);
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBeNull();
  });

  it("uses a token provider for authenticated REST reads", async () => {
    const calls: FetchCall[] = [];
    const openf1 = createOpenF1({
      accessToken: "stale-token",
      tokenProvider: async () => "fresh-provider-token",
      fetch: async (input, init) => {
        calls.push({ url: inputUrl(input), init });
        return jsonResponse([sampleSession]);
      },
    });

    await openf1.v1.sessions({ session_key: "latest" });

    expect(calls).toHaveLength(1);
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe(
      "Bearer fresh-provider-token"
    );
  });

  it("wraps token provider failures as OpenF1Error", async () => {
    let fetchCalled = false;
    const openf1 = createOpenF1({
      tokenProvider: async () => {
        throw new Error("token unavailable");
      },
      fetch: async () => {
        fetchCalled = true;
        return jsonResponse([sampleSession]);
      },
    });

    await expect(openf1.v1.sessions()).rejects.toMatchObject({
      name: "OpenF1Error",
      status: 500,
      message: expect.stringContaining("token unavailable"),
    });
    expect(fetchCalled).toBe(false);
  });
});
