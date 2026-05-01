#!/usr/bin/env node
/**
 * One-shot OAuth 2.0 Authorization Code Flow with PKCE for X.
 *
 * Mints a user-context access token + refresh token for the @apicity/x package.
 * Run as:
 *
 *   op run --env-file=.env.tpl -- node scripts/x-oauth.mjs
 *
 * Required env (resolved from 1Password via .env.tpl):
 *   X_CLIENT_ID, X_CLIENT_SECRET
 *
 * On success it prints the access_token / refresh_token / expires_in /
 * scope. Pipe the token straight into 1Password if you want — example:
 *
 *   ... | jq -r '.access_token' | op item create \
 *     --vault Apicity --category 'API Credential' \
 *     --title X_ACCESS_TOKEN credential[password]=-
 *
 * Prerequisites in console.x.com:
 *   - Open your App -> User authentication settings -> Set up
 *   - Permissions: Read and write
 *   - Type of App: Web App, Automated App or Bot  (yields a Client Secret)
 *   - Callback URI: http://127.0.0.1:8765/callback
 *   - Website URL: anything valid
 *   - Save -> copy the OAuth 2.0 Client ID + Client Secret -> 1Password
 */

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
  console.error(
    "Missing X_CLIENT_ID or X_CLIENT_SECRET. Did you run via `op run --env-file=.env.tpl --`?"
  );
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

console.log("\nOpen this URL in your browser and click 'Authorize app':\n");
console.log(authURL.toString());
console.log("\nWaiting for callback on http://127.0.0.1:8765 …\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (!url.pathname.startsWith("/callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const err = url.searchParams.get("error");
  if (err) {
    const detail = url.searchParams.get("error_description") ?? "";
    console.error(`\nAuthorize failed: ${err} ${detail}\n`);
    res.writeHead(400);
    res.end(`Authorize failed: ${err} ${detail}`);
    server.close();
    process.exit(1);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || returnedState !== state) {
    console.error("\nMissing code or state mismatch.\n");
    res.writeHead(400);
    res.end("Missing code or state mismatch.");
    server.close();
    process.exit(1);
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT,
    code_verifier: verifier,
  });

  const tokenRes = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const tok = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error(`\nToken exchange failed (${tokenRes.status}):\n`, tok, "\n");
    res.writeHead(500);
    res.end("Token exchange failed. See terminal.");
    server.close();
    process.exit(1);
  }

  console.log("\n=== TOKENS ===\n");
  console.log(JSON.stringify(tok, null, 2));
  console.log(
    "\nNext steps:\n" +
      "  1. Copy the access_token value above\n" +
      "  2. Add it to 1Password as X_ACCESS_TOKEN (Apicity vault, password field)\n" +
      "  3. Save the refresh_token as X_REFRESH_TOKEN if you want to refresh later\n"
  );

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    "<h1>Authorized.</h1><p>Check your terminal — tokens are printed there. You can close this tab.</p>"
  );

  server.close();
});

server.listen(8765, "127.0.0.1");
