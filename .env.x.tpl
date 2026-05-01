# Credentials for the OAuth 2.0 PKCE helper for @apicity/x.
#
# Usage:
#   op run --env-file=.env.x.tpl -- node scripts/x-oauth.mjs
#
# After the helper prints tokens, paste access_token into 1Password as
# X_ACCESS_TOKEN, then export it inline when recording fixtures:
#
#   X_ACCESS_TOKEN=$(op item get X_ACCESS_TOKEN --vault Apicity --reveal --fields password) \
#     POLLY_MODE=record-missing \
#     pnpm vitest run --config tests/vitest.integration.ts \
#     tests/integration/x-<endpoint>.test.ts
#
# This file deliberately holds ONLY X_CLIENT_ID + X_CLIENT_SECRET so that
# it never references items that may not exist yet (op run hard-fails on
# a missing reference).

X_CLIENT_ID=op://Apicity/X_CLIENT_ID/password
X_CLIENT_SECRET=op://Apicity/X_CLIENT_SECRET/password
