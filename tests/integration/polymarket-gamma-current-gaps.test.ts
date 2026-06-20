import { describe, it, expect } from "vitest";
import { createPolymarket } from "@apicity/polymarket";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

describe("polymarket gamma current public gaps", () => {
  it("serializes current keyset requests with after_cursor", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("/events/keyset")) {
        return jsonResponse({ events: [], next_cursor: "events-next" });
      }
      return jsonResponse({ markets: [], next_cursor: "markets-next" });
    };
    const provider = createPolymarket({
      fetch: fetchImpl,
      gammaBaseURL: "https://gamma.test",
    });

    const events = await provider.get.gamma.events.keyset({
      limit: 2,
      after_cursor: "events-cursor",
    });
    const markets = await provider.get.gamma.markets.keyset({
      limit: 1,
      next_cursor: "legacy-market-cursor",
    });

    expect(events.next_cursor).toBe("events-next");
    expect(markets.next_cursor).toBe("markets-next");

    const eventUrl = new URL(calls[0]);
    expect(eventUrl.pathname).toBe("/events/keyset");
    expect(eventUrl.searchParams.get("after_cursor")).toBe("events-cursor");
    expect(eventUrl.searchParams.has("next_cursor")).toBe(false);

    const marketUrl = new URL(calls[1]);
    expect(marketUrl.pathname).toBe("/markets/keyset");
    expect(marketUrl.searchParams.get("after_cursor")).toBe(
      "legacy-market-cursor"
    );
    expect(marketUrl.searchParams.has("next_cursor")).toBe(false);
  });

  it("exposes status, teams, public profile, and full related tags", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = new URL(String(input));
      calls.push(url.toString());
      if (url.pathname === "/status") return textResponse("OK");
      if (url.pathname === "/teams") {
        return jsonResponse([
          { id: 1, name: "Los Angeles Lakers", league: "NBA" },
        ]);
      }
      if (url.pathname === "/public-profile") {
        return jsonResponse({
          proxyWallet: url.searchParams.get("address"),
          name: "Test Profile",
          users: [{ id: "user-1", creator: false, mod: false }],
        });
      }
      if (url.pathname.endsWith("/related-tags/tags")) {
        return jsonResponse([{ id: "2", label: "Politics", slug: "politics" }]);
      }
      if (url.pathname.endsWith("/related-tags")) {
        return jsonResponse([{ id: "1", tagID: 2, relatedTagID: 3, rank: 1 }]);
      }
      throw new Error(`Unexpected URL: ${url.toString()}`);
    };
    const provider = createPolymarket({
      fetch: fetchImpl,
      gammaBaseURL: "https://gamma.test",
    });

    await expect(provider.get.gamma.status()).resolves.toBe("OK");

    const teams = await provider.get.gamma.teams({
      league: ["NBA"],
      abbreviation: "LAL",
      limit: 1,
    });
    expect(teams[0].league).toBe("NBA");

    const profile = await provider.get.gamma.publicProfile({
      address: "0x0000000000000000000000000000000000000001",
    });
    expect(profile.proxyWallet).toBe(
      "0x0000000000000000000000000000000000000001"
    );

    const rels = await provider.get.gamma.tags.relatedTags("2", {
      omit_empty: true,
      status: "active",
    });
    const relsBySlug = await provider.get.gamma.tags.relatedTags.slug(
      "politics",
      { status: "all" }
    );
    const relatedTags = await provider.get.gamma.tags.relatedTags.tags("2", {
      status: "closed",
    });
    const relatedTagsBySlug =
      await provider.get.gamma.tags.relatedTags.tags.slug("politics");

    expect(rels[0]).toMatchObject({ tagID: 2, relatedTagID: 3 });
    expect(relsBySlug[0].rank).toBe(1);
    expect(relatedTags[0].slug).toBe("politics");
    expect(relatedTagsBySlug[0].label).toBe("Politics");

    const urls = calls.map((call) => new URL(call));
    const teamsUrl = urls.find((url) => url.pathname === "/teams");
    expect(teamsUrl?.searchParams.getAll("league")).toEqual(["NBA"]);
    expect(teamsUrl?.searchParams.get("abbreviation")).toBe("LAL");
    expect(teamsUrl?.searchParams.get("limit")).toBe("1");

    const profileUrl = urls.find((url) => url.pathname === "/public-profile");
    expect(profileUrl?.searchParams.get("address")).toBe(
      "0x0000000000000000000000000000000000000001"
    );

    const relationshipUrl = urls.find(
      (url) => url.pathname === "/tags/2/related-tags"
    );
    expect(relationshipUrl?.searchParams.get("omit_empty")).toBe("true");
    expect(relationshipUrl?.searchParams.get("status")).toBe("active");

    const fullTagUrl = urls.find(
      (url) => url.pathname === "/tags/2/related-tags/tags"
    );
    expect(fullTagUrl?.searchParams.get("status")).toBe("closed");
  });
});
