# @apicity/meta

[![npm](https://img.shields.io/npm/v/@apicity/meta?color=cb0000)](https://www.npmjs.com/package/@apicity/meta)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

Instagram Graph API provider for posting reels via the public-URL flow (graph.instagram.com).

## Installation

```bash
npm install @apicity/meta
# or
pnpm add @apicity/meta
```

## Quick Start

```typescript
import { createMeta } from "@apicity/meta";

const meta = createMeta({ apiKey: process.env.META_API_KEY! });
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
import { createMeta } from "@apicity/meta";

const meta = createMeta({ accessToken: process.env.IG_ACCESS_TOKEN });
const igUserId = process.env.IG_USER_ID;

// Public-URL flow: host the mp4 somewhere (e.g. via @apicity/free-media-upload) and
// pass its URL. Meta GETs the video and processes it asynchronously.
const container = await ig.post.v25.media(igUserId, {
  media_type: "REELS",
  video_url: "https://example.com/clip.mp4",
  caption: "hello from @apicity/meta",
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

## Real-world example: publish a Reel via the public-URL flow

Instagram's Graph API doesn't take video bytes directly — Meta needs a
publicly reachable URL it can `GET` and transcode asynchronously. The
snippet below chains `@apicity/free-media-upload` (catbox public hosting, free + zero
auth) into `@apicity/meta` to land an `mp4` on disk as a published Reel,
mirroring
[`tests/integration/ig-post-video.test.ts`](../../../tests/integration/ig-post-video.test.ts)
step-for-step. The catbox upload replays against
[`tests/recordings/free_2578706139/`](../../../tests/recordings/free_2578706139/);
the IG calls land in `tests/recordings/ig_*/post-video_*/recording.har`
once a Business/Creator account's `IG_ACCESS_TOKEN` is recorded.

```typescript
import { readFileSync } from "node:fs";
import { createMeta } from "@apicity/meta";
import { createFreeMediaUpload } from "@apicity/free-media-upload";

const meta = createMeta({ accessToken: process.env.IG_ACCESS_TOKEN! });
const igUserId = process.env.IG_USER_ID!; // 17-digit numeric, e.g. "17841471234567890"

// 1. Host the mp4 publicly. catbox.moe is auth-free and persistent —
//    Meta's transcode worker will fetch this URL once during step 2,
//    so any host that returns the bytes within ~30s works (S3 presigned
//    URL, R2, your own CDN). @apicity/free-media-upload wraps the multipart upload
//    and returns the resolved file URL as a string.
const bytes = readFileSync("./jump.mp4");
const blob = new Blob([bytes], { type: "video/mp4" });

const freeMediaUpload = createFreeMediaUpload({});
const videoUrl = await free.catbox.upload({
  file: blob,
  filename: "jump.mp4",
});
console.log(videoUrl);
// → "https://files.catbox.moe/nn9sei.mp4"
//   catbox returns a permanent public URL of the form
//   `https://files.catbox.moe/<6char>.<ext>` — that's what Meta will GET.

// 2. Create a media container. For Reels you must pass `media_type:
//    "REELS"` (NOT "VIDEO" — that's the legacy IGTV path Meta
//    deprecated in 2024). The container is a server-side handle: Meta
//    queues the transcode against `video_url` and returns its id
//    immediately. Containers expire 24h after creation if you don't
//    publish them.
const container = await ig.post.v25.media(igUserId, {
  media_type: "REELS",
  video_url: videoUrl,
  caption: "jump #reels",
});
console.log(container.id);
// → "17889012345678901" (17-digit container id)

// 3. Poll the container's status_code until it leaves IN_PROGRESS.
//    The state machine is IN_PROGRESS → FINISHED on success;
//    FINISHED is the only state media_publish accepts. ERROR and
//    EXPIRED are terminal failure states; PUBLISHED is what you'll
//    see if you re-poll AFTER calling media_publish. The `fields`
//    query param is required — by default the GET only returns `id`.
let statusCode: string = "IN_PROGRESS";
while (statusCode === "IN_PROGRESS") {
  await new Promise((r) => setTimeout(r, 5000));
  const s = await ig.get.v25.container(container.id, {
    fields: "status_code,status",
  });
  statusCode = s.status_code ?? "FINISHED";
  if (statusCode === "ERROR" || statusCode === "EXPIRED") {
    throw new Error(`container ${container.id} ${statusCode}: ${s.status}`);
  }
}
// statusCode → "FINISHED"
// s.status   → "Finished: Media is ready to be published."

// 4. Publish. media_publish takes the container id (NOT the media url)
//    and returns the new post's id — that's the permanent ig_id you'd
//    use to construct an https://www.instagram.com/reel/<shortcode>/
//    URL or to query insights later via Graph API.
const post = await ig.post.v25.mediaPublish(igUserId, {
  creation_id: container.id,
});
console.log(post.id);
// → "17912345678901234" (17-digit post id, distinct from container id)
```

**Notes**

- Meta requires a **Business** or **Creator** Instagram account plus a
  Meta App approved for `instagram_business_content_publish`. Personal
  accounts get `190` ("Invalid OAuth access token") even with a
  syntactically valid token.
- `video_url` must be reachable from Meta's IPs and serve `Content-Type:
  video/mp4`. Common gotchas: presigned S3 URLs that expire before the
  transcoder pulls, hosts that require a `User-Agent`, and CDNs that
  redirect to a different origin. catbox.moe sidesteps all three.
- The Reel itself must satisfy Meta's Reel constraints — 9:16 aspect,
  3–90s duration, ≤ 1GB, H.264 video, AAC audio. Mismatches surface as
  `status_code: "ERROR"` during the poll, with the human-readable
  reason in `status` (e.g. `"Error: The video is too short."`).
- Containers and posts use **distinct** 17-digit ids. The container id
  is throwaway — you only need it for the GET poll and the subsequent
  `media_publish` `creation_id`. The post id is permanent and survives
  user deletion of the post.
- Errors throw `MetaError` with `status` (HTTP code), `body` (the parsed
  Meta error envelope), and an optional `code`. Meta's two error shapes
  — `error.error_user_msg` for user-facing validation and `error.message`
  for everything else — are both surfaced in `MetaError.message`, so a
  single `try/catch` reads naturally.

## API Reference

3 endpoints across 3 groups. Each method mirrors an upstream URL path.

### container

<details>
<summary><code>GET</code> <b><code>meta.v25.container</code></b></summary>

<code>GET https://graph.instagram.com/v25.0/{containerId}{query}</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/reference/ig-container/)

```typescript
const res = await meta.v25.container({ /* ... */ });
```

Source: [`packages/provider/meta/src/meta.ts`](src/meta.ts)

</details>

### media

<details>
<summary><code>POST</code> <b><code>meta.v25.media</code></b></summary>

<code>POST https://graph.instagram.com/v25.0/{igUserId}/media</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)

```typescript
const res = await meta.v25.media({ /* ... */ });
```

Source: [`packages/provider/meta/src/meta.ts`](src/meta.ts)

</details>

### mediaPublish

<details>
<summary><code>POST</code> <b><code>meta.v25.mediaPublish</code></b></summary>

<code>POST https://graph.instagram.com/v25.0/{igUserId}/media_publish</code>

[Upstream docs ↗](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/)

```typescript
const res = await meta.v25.mediaPublish({ /* ... */ });
```

Source: [`packages/provider/meta/src/meta.ts`](src/meta.ts)

</details>

## Middleware

```typescript
import { createMeta, withRetry } from "@apicity/meta";

const meta = createMeta({ apiKey: process.env.META_API_KEY! });
const models = withRetry(meta.get.v1.models, { retries: 3 });
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
