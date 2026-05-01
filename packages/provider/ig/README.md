# @apicity/ig

[![npm](https://img.shields.io/npm/v/@apicity/ig?color=cb0000)](https://www.npmjs.com/package/@apicity/ig)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Instagram Graph API provider for posting reels via the public-URL flow (graph.instagram.com).

## Installation

```bash
npm install @apicity/ig
# or
pnpm add @apicity/ig
```

## Quick Start

```typescript
import { ig as createIg } from "@apicity/ig";

const ig = createIg({ accessToken: process.env.IG_ACCESS_TOKEN! });
```

## Setup

Instagram requires a **long-lived (60-day) user access token** from the
Instagram Login OAuth flow. The token is bound to a specific Instagram
Business or Creator account; personal accounts have no programmatic
publishing access.

### 1. Configure your Meta App

Open [developers.facebook.com](https://developers.facebook.com), create a
new app (type: **Business**), then add the **Instagram** product.
Choose **API setup with Instagram login** and configure:

- Valid OAuth Redirect URI: `http://127.0.0.1:8765/callback`
- Permissions: `instagram_business_basic` + `instagram_business_content_publish`
- Save the **Instagram App ID** and **Instagram App Secret**

### 2. Verify Instagram account type

The Instagram account you're publishing to must be **Business** or
**Creator** (not Personal). Switch in the Instagram mobile app under
Settings → Account type and tools. No Facebook Page link is required
for the Instagram Login flow.

### 3. Mint a long-lived access token

Save the script below as `mint-ig-token.mjs` and run it:

```bash
IG_CLIENT_ID=<your-instagram-app-id> \
IG_CLIENT_SECRET=<your-instagram-app-secret> \
  node mint-ig-token.mjs
```

It prints an authorize URL — open it, click **Allow**, and the helper
captures the redirect on `127.0.0.1:8765`, exchanges the code for a
short-lived token, then upgrades it to a long-lived (60-day) token and
prints `{ access_token, user_id, expires_in }`. Save both `access_token`
and `user_id` — you need both to call the API.

<details>
<summary><code>mint-ig-token.mjs</code> — zero-dep OAuth 2.0 helper</summary>

```javascript
import http from "node:http";
import crypto from "node:crypto";

const CLIENT_ID = process.env.IG_CLIENT_ID;
const CLIENT_SECRET = process.env.IG_CLIENT_SECRET;
const REDIRECT = "http://127.0.0.1:8765/callback";
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
].join(",");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set IG_CLIENT_ID and IG_CLIENT_SECRET");
  process.exit(1);
}

const state = crypto.randomBytes(16).toString("hex");
const authURL = new URL("https://www.instagram.com/oauth/authorize");
authURL.searchParams.set("client_id", CLIENT_ID);
authURL.searchParams.set("redirect_uri", REDIRECT);
authURL.searchParams.set("response_type", "code");
authURL.searchParams.set("scope", SCOPES);
authURL.searchParams.set("state", state);

console.log("Open this URL and click Allow:\n" + authURL.toString());

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (!url.pathname.startsWith("/callback")) {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.get("state") !== state) {
    res.writeHead(400).end("bad state");
    server.close();
    process.exit(1);
  }

  // 1. short-lived
  const shortRes = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT,
        code,
      }),
    }
  );
  const short = await shortRes.json();

  // 2. long-lived (60-day)
  const longURL = new URL("https://graph.instagram.com/access_token");
  longURL.searchParams.set("grant_type", "ig_exchange_token");
  longURL.searchParams.set("client_secret", CLIENT_SECRET);
  longURL.searchParams.set("access_token", short.access_token);
  const longRes = await fetch(longURL);
  const long = await longRes.json();

  console.log(JSON.stringify({
    access_token: long.access_token,
    expires_in: long.expires_in,
    user_id: short.user_id,
  }, null, 2));
  res.writeHead(200).end("Authorized — check your terminal.");
  server.close();
});

server.listen(8765, "127.0.0.1");
```

</details>

### 4. Use the token

```typescript
import { ig as createIg } from "@apicity/ig";

const ig = createIg({ accessToken: process.env.IG_ACCESS_TOKEN });
const igUserId = process.env.IG_USER_ID;

// Public-URL flow: host the mp4 somewhere (e.g. via @apicity/free) and
// pass its URL. Meta GETs the video and processes it asynchronously.
const container = await ig.post.v25.media(igUserId, {
  media_type: "REELS",
  video_url: "https://example.com/clip.mp4",
  caption: "hello from @apicity/ig",
});

// Poll until the container is ready.
let status = "IN_PROGRESS";
while (status === "IN_PROGRESS") {
  await new Promise((r) => setTimeout(r, 5000));
  const s = await ig.get.v25.container(container.id, {
    fields: "status_code,status",
  });
  status = s.status_code ?? "FINISHED";
}

// Publish.
const post = await ig.post.v25.mediaPublish(igUserId, {
  creation_id: container.id,
});
console.log(post.id);
```

## API Reference

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

### container

<details>
<summary><code>GET</code> <b><code>ig.v25.container</code></b></summary>

<code>GET https://graph.instagram.com/v25.0/{containerId}{query}</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/reference/ig-container/)

```typescript
const res = await ig.v25.container({ /* ... */ });
```

Source: [`packages/provider/ig/src/ig.ts`](src/ig.ts)

</details>

### media

<details>
<summary><code>POST</code> <b><code>ig.v25.media</code></b></summary>

<code>POST https://graph.instagram.com/v25.0/{igUserId}/media</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)

```typescript
const res = await ig.v25.media({ /* ... */ });
```

Source: [`packages/provider/ig/src/ig.ts`](src/ig.ts)

</details>

### mediaPublish

<details>
<summary><code>POST</code> <b><code>ig.v25.mediaPublish</code></b></summary>

<code>POST https://graph.instagram.com/v25.0/{igUserId}/media_publish</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/)

```typescript
const res = await ig.v25.mediaPublish({ /* ... */ });
```

Source: [`packages/provider/ig/src/ig.ts`](src/ig.ts)

</details>

## License

MIT
