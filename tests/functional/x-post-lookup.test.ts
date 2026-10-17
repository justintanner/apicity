import { createServer } from "node:http";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createX, XError } from "@apicity/x";

const requests: URL[] = [];
const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  requests.push(url);
  res.setHeader("Content-Type", "application/json");
  if (req.headers.authorization !== "Bearer test-token") {
    res.writeHead(401).end(JSON.stringify({ detail: "Unauthorized" }));
    return;
  }
  if (url.pathname === "/2/tweets/404") {
    res.end(
      JSON.stringify({
        errors: [{ title: "Not Found Error", detail: "Deleted post" }],
      })
    );
    return;
  }
  res.end(
    JSON.stringify({
      data: {
        id: "123",
        author_id: "42",
        created_at: "2026-10-01T00:00:00Z",
        public_metrics: { like_count: 3, impression_count: 50 },
      },
      includes: {
        media: [
          {
            media_key: "13_1",
            type: "video",
            public_metrics: { view_count: 20 },
            non_public_metrics: { playback_100_count: 8 },
          },
        ],
      },
    })
  );
});
let baseURL: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing HTTP address");
  baseURL = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
});

it("retrieves post and media metrics through the real HTTP transport", async () => {
  const client = createX({ baseURL, accessToken: "test-token" });
  const result = await client.get.v2.tweets("123", {
    "tweet.fields": ["created_at", "author_id", "public_metrics"],
    expansions: ["attachments.media_keys"],
    "media.fields": ["public_metrics", "non_public_metrics"],
  });
  expect(result.data?.public_metrics?.impression_count).toBe(50);
  expect(
    result.includes?.media?.[0]?.non_public_metrics?.playback_100_count
  ).toBe(8);
  expect(requests.at(-1)?.searchParams.get("tweet.fields")).toBe(
    "created_at,author_id,public_metrics"
  );
  expect(requests.at(-1)?.searchParams.get("media.fields")).toBe(
    "public_metrics,non_public_metrics"
  );
  expect(
    client.get.v2.tweets.schema.safeParse({ "media.fields": ["invalid"] })
      .success
  ).toBe(false);
});

it("preserves per-post errors and typed authentication failures", async () => {
  const client = createX({ baseURL, accessToken: "test-token" });
  expect((await client.get.v2.tweets("404")).errors?.[0]?.detail).toBe(
    "Deleted post"
  );
  await expect(
    createX({ baseURL, accessToken: "invalid" }).get.v2.tweets("123")
  ).rejects.toBeInstanceOf(XError);
});
