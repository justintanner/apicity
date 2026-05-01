# @apicity/x

[![npm](https://img.shields.io/npm/v/@apicity/x?color=cb0000)](https://www.npmjs.com/package/@apicity/x)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)

X (formerly Twitter) social API provider for posting content (api.x.com).

## Installation

```bash
npm install @apicity/x
# or
pnpm add @apicity/x
```

## Quick Start

```typescript
import { x as createX } from "@apicity/x";

const x = createX({ accessToken: process.env.X_ACCESS_TOKEN! });
```

## Setup

X requires an **OAuth 2.0 user-context access token** to post or upload
media. App-only Bearer tokens are read-only and rejected by the upload
and tweets endpoints.

### 1. Configure your X app

Open [console.x.com](https://console.x.com) and make sure your app lives
in a **Pay Per Use** project — the legacy *Free* project is deprecated
and v2 endpoints reject its tokens with `client-not-enrolled`. Move the
app from the Apps list if needed.

Then open the app and click **User authentication settings → Set up**:

- Type of App: **Web App, Automated App or Bot** (this yields a Client Secret)
- App permissions: **Read and write**
- Callback URI: `http://127.0.0.1:8765/callback`
- Website URL: any valid URL

Save and copy the **OAuth 2.0 Client ID** and **Client Secret**.

### 2. Load credits

Pay-per-use bills per write (~$0.015 / post). Open **Billing → Credits**
and load the minimum (typically $5). Without credits, write endpoints
return `402 Your enrolled account does not have any credits to fulfill
this request` — even though authentication itself succeeds.

### 3. Mint an access token

Save the script below as `mint-x-token.mjs` and run it:

```bash
X_CLIENT_ID=<your-client-id> \
X_CLIENT_SECRET=<your-client-secret> \
  node mint-x-token.mjs
```

It prints an authorize URL — open it, click **Authorize app**, and the
helper captures the redirect on `127.0.0.1:8765` and prints the access
token + refresh token. Access tokens last 2 hours; the refresh token
(via `offline.access` scope) lets you mint a new one without
re-authorizing.

<details>
<summary><code>mint-x-token.mjs</code> — zero-dep OAuth 2.0 PKCE helper</summary>

```javascript
import http from "node:http";
import crypto from "node:crypto";

const CLIENT_ID = process.env.X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const REDIRECT = "http://127.0.0.1:8765/callback";
const SCOPES = [
  "tweet.read",
  "tweet.write",
  "media.write",
  "users.read",
  "offline.access",
].join(" ");

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set X_CLIENT_ID and X_CLIENT_SECRET");
  process.exit(1);
}

const verifier = crypto.randomBytes(32).toString("base64url");
const challenge = crypto
  .createHash("sha256")
  .update(verifier)
  .digest("base64url");
const state = crypto.randomBytes(16).toString("hex");

const authURL = new URL("https://x.com/i/oauth2/authorize");
authURL.searchParams.set("response_type", "code");
authURL.searchParams.set("client_id", CLIENT_ID);
authURL.searchParams.set("redirect_uri", REDIRECT);
authURL.searchParams.set("scope", SCOPES);
authURL.searchParams.set("state", state);
authURL.searchParams.set("code_challenge", challenge);
authURL.searchParams.set("code_challenge_method", "S256");

console.log("Open this URL and click \"Authorize app\":\n" + authURL.toString());

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
  const basic = Buffer.from(
    `${CLIENT_ID}:${CLIENT_SECRET}`
  ).toString("base64");
  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
      code_verifier: verifier,
    }),
  });
  const tok = await tokenRes.json();
  console.log(JSON.stringify(tok, null, 2));
  res.writeHead(200).end("Authorized — check your terminal.");
  server.close();
});

server.listen(8765, "127.0.0.1");
```

</details>

### 4. Use the token

```typescript
import { x as createX } from "@apicity/x";

const x = createX({ accessToken: process.env.X_ACCESS_TOKEN });

await x.post.v2.tweets({
  text: "hello from @apicity/x",
});
```

## API Reference

5 endpoints across 2 groups. Each method mirrors an upstream URL path.

### media

<details>
<summary><code>GET</code> <b><code>x.v2.media.upload</code></b></summary>

<code>GET https://api.x.com/2/media/upload{query}</code>

[Upstream docs ↗](https://docs.x.com/x-api/media/get-media-upload-status)

```typescript
const res = await x.v2.media.upload({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

<details>
<summary><code>POST</code> <b><code>x.v2.media.upload.append</code></b></summary>

<code>POST https://api.x.com/2/media/upload/{id}/append</code>

[Upstream docs ↗](https://docs.x.com/x-api/media/append-media-upload)

```typescript
const res = await x.v2.media.upload.append({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

<details>
<summary><code>POST</code> <b><code>x.v2.media.upload.finalize</code></b></summary>

<code>POST https://api.x.com/2/media/upload/{id}/finalize</code>

[Upstream docs ↗](https://docs.x.com/x-api/media/finalize-media-upload)

```typescript
const res = await x.v2.media.upload.finalize({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

<details>
<summary><code>POST</code> <b><code>x.v2.media.upload.initialize</code></b></summary>

<code>POST https://api.x.com/2/media/upload/initialize</code>

[Upstream docs ↗](https://docs.x.com/x-api/media/media-upload-initialize)

```typescript
const res = await x.v2.media.upload.initialize({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

### tweets

<details>
<summary><code>POST</code> <b><code>x.v2.tweets</code></b></summary>

<code>POST https://api.x.com/2/tweets</code>

[Upstream docs ↗](https://docs.x.com/x-api/posts/create-post)

```typescript
const res = await x.v2.tweets({ /* ... */ });
```

Source: [`packages/provider/x/src/x.ts`](src/x.ts)

</details>

## License

MIT
