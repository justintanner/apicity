#!/usr/bin/env node
/**
 * One-shot OAuth 2.0 Authorization Code flow for Instagram Login.
 *
 * Mints a long-lived (60-day) user access token + ig_user_id for the
 * @apicity/ig package. Run as:
 *
 *   op run --env-file=.env.ig.tpl -- node scripts/ig-oauth.mjs
 *
 * Required env (resolved from 1Password via .env.ig.tpl):
 *   IG_CLIENT_ID, IG_CLIENT_SECRET
 *
 * On success it prints the long-lived access_token, user_id, and
 * expires_in. Save both to 1Password as IG_ACCESS_TOKEN and IG_USER_ID.
 *
 * Prerequisites in developers.facebook.com:
 *   - Create or open a Meta App
 *   - Add the "Instagram" product, then "API setup with Instagram login"
 *   - Set Valid OAuth Redirect URI: http://127.0.0.1:8765/callback
 *   - Permissions: instagram_business_basic + instagram_business_content_publish
 *   - Save the Instagram App ID and Client Secret -> 1Password
 *
 * Account requirements:
 *   - Instagram account must be Business or Creator type
 *   - For Instagram Login, NO Facebook Page link is required
 */

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
  console.error(
    "Missing IG_CLIENT_ID or IG_CLIENT_SECRET. Did you run via `op run --env-file=.env.ig.tpl --`?"
  );
  process.exit(1);
}

const state = crypto.randomBytes(16).toString("hex");

const authURL = new URL("https://www.instagram.com/oauth/authorize");
authURL.searchParams.set("client_id", CLIENT_ID);
authURL.searchParams.set("redirect_uri", REDIRECT);
authURL.searchParams.set("response_type", "code");
authURL.searchParams.set("scope", SCOPES);
authURL.searchParams.set("state", state);

console.log("\nOpen this URL in your browser and click 'Allow':\n");
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

  // Step 1: short-lived token exchange.
  const shortBody = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT,
    code,
  });

  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: shortBody,
  });
  const shortTok = await shortRes.json();

  if (!shortRes.ok) {
    console.error(
      `\nShort-lived token exchange failed (${shortRes.status}):\n`,
      shortTok,
      "\n"
    );
    res.writeHead(500);
    res.end("Short-lived token exchange failed. See terminal.");
    server.close();
    process.exit(1);
  }

  // Step 2: upgrade to long-lived (60-day) token.
  const longURL = new URL("https://graph.instagram.com/access_token");
  longURL.searchParams.set("grant_type", "ig_exchange_token");
  longURL.searchParams.set("client_secret", CLIENT_SECRET);
  longURL.searchParams.set("access_token", shortTok.access_token);

  const longRes = await fetch(longURL.toString());
  const longTok = await longRes.json();

  if (!longRes.ok) {
    console.error(
      `\nLong-lived token exchange failed (${longRes.status}):\n`,
      longTok,
      "\n"
    );
    res.writeHead(500);
    res.end("Long-lived token exchange failed. See terminal.");
    server.close();
    process.exit(1);
  }

  console.log("\n=== TOKENS ===\n");
  console.log(
    JSON.stringify(
      {
        access_token: longTok.access_token,
        token_type: longTok.token_type,
        expires_in: longTok.expires_in,
        user_id: shortTok.user_id,
      },
      null,
      2
    )
  );
  console.log(
    "\nNext steps:\n" +
      "  1. Save access_token to 1Password as IG_ACCESS_TOKEN (Apicity vault)\n" +
      "  2. Save user_id to 1Password as IG_USER_ID\n" +
      "  3. Tokens last 60 days; refresh via GET " +
      "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token\n"
  );

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(
    "<h1>Authorized.</h1><p>Check your terminal — tokens are printed there. You can close this tab.</p>"
  );

  server.close();
});

server.listen(8765, "127.0.0.1");
