# Credentials for the OAuth helper for @apicity/ig.
#
# Usage:
#   op run --env-file=.env.ig.tpl -- node scripts/ig-oauth.mjs
#
# After the helper prints { access_token, user_id, expires_in }, save:
#   - access_token  -> 1Password as IG_ACCESS_TOKEN
#   - user_id       -> 1Password as IG_USER_ID
#
# Then export them inline when recording fixtures:
#
#   IG_ACCESS_TOKEN=$(op item get IG_ACCESS_TOKEN --vault Apicity --reveal --fields password) \
#   IG_USER_ID=$(op item get IG_USER_ID --vault Apicity --reveal --fields password) \
#     POLLY_MODE=record-missing \
#     pnpm vitest run --config tests/vitest.integration.ts \
#     tests/integration/ig-<endpoint>.test.ts
#
# This file deliberately holds ONLY IG_CLIENT_ID + IG_CLIENT_SECRET so that
# it never references items that may not exist yet (op run hard-fails on
# a missing reference).

IG_CLIENT_ID=op://Apicity/IG_CLIENT_ID/password
IG_CLIENT_SECRET=op://Apicity/IG_CLIENT_SECRET/password
