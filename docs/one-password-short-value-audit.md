# 1Password Short-Value Audit Evidence

## Evidence Metadata

| Field                         | Value                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| Verification date             | `2026-08-04`                                                       |
| Result                        | `blocked`                                                          |
| Implementation baseline       | `bb44429b2395911e9bc42a96d86769b4057e0e79`                         |
| `.env` SHA-256                | `d3944d5de721602e7800d1e5559a74562c6be5316ca5b04383a868b8b75c4bcc` |
| Active assignments            | `44`                                                               |
| Active 1Password references   | `43`                                                               |
| Constrained public literals   | `1`                                                                |
| Resolved values disclosed     | `false`                                                            |
| Sensitive addresses disclosed | `false`                                                            |

## Wallet Verification

| Field                           | Value                                              |
| ------------------------------- | -------------------------------------------------- |
| Official wallet-type name       | `DEPOSIT_WALLET`                                   |
| Selected public signature type  | `3`                                                |
| Authoritative documentation     | <https://docs.polymarket.com/trading/wallets-auth> |
| Documentation verification date | `2026-08-04`                                       |
| Signer/funder consistency       | `true`                                             |
| Wallet decision                 | `pass`                                             |
| Decision reason                 | `verified-deposit-wallet`                          |

Current official Polymarket documentation identifies `DEPOSIT_WALLET` as
wallet type `3`. The credential-safe wallet checkpoint confirmed that the
configured signer/funder relationship is consistent with that wallet model.
The selected enum therefore remains `3` as explicit public metadata; no
account-specific value is inferred by provider code.

## Public-Metadata Disposition

| Name                      | Classification  | Source         | Disposition |
| ------------------------- | --------------- | -------------- | ----------- |
| POLYMARKET_SIGNATURE_TYPE | public_metadata | public_literal | handled     |

`POLYMARKET_SIGNATURE_TYPE` is constrained to the supported values `0`, `1`,
`2`, or `3` by the shared policy. It is not part of the active 1Password
reference population below.

## Active 1Password Reference Audit

| Name                           | Classification     | Length | Disposition        |
| ------------------------------ | ------------------ | -----: | ------------------ |
| OPENAI_API_KEY                 | credential         |    164 | no_action_required |
| KIE_API_KEY                    | credential         |     32 | no_action_required |
| XAI_API_KEY                    | credential         |     84 | no_action_required |
| XAI_MANAGEMENT_API_KEY         | credential         |     90 | no_action_required |
| KIMI_CODING_API_KEY            | credential         |     72 | no_action_required |
| ZAI_CODING_PLAN_API_KEY        | credential         |     49 | no_action_required |
| FAL_API_KEY                    | credential         |     69 | no_action_required |
| FIREWORKS_API_KEY              | credential         |     25 | no_action_required |
| FIREWORKS_ACCOUNT_ID           | sensitive_metadata |     25 | no_action_required |
| GOOGLE_API_KEY                 | credential         |     53 | no_action_required |
| GEMINI_API_KEY                 | credential         |     39 | no_action_required |
| ANTHROPIC_API_KEY              | credential         |    108 | no_action_required |
| DASHSCOPE_API_KEY              | credential         |     35 | no_action_required |
| ELEVENLABS_API_KEY             | credential         |     51 | no_action_required |
| DROPBOX_OAUTH_TOKEN            | credential         |   1352 | no_action_required |
| QUO_API_KEY                    | credential         |     64 | no_action_required |
| S3_ACCESS_KEY_ID               | credential         |     20 | no_action_required |
| S3_SECRET_ACCESS_KEY           | credential         |     40 | no_action_required |
| S3_REGION                      | public_metadata    |      9 | no_action_required |
| S3_BUCKET                      | sensitive_metadata |     20 | no_action_required |
| S3_ENDPOINT                    | public_metadata    |     34 | no_action_required |
| B2_ACCESS_KEY_ID               | credential         |     25 | no_action_required |
| B2_SECRET_ACCESS_KEY           | credential         |     31 | no_action_required |
| B2_REGION                      | public_metadata    |     11 | no_action_required |
| B2_BUCKET                      | sensitive_metadata |      7 | no_action_required |
| B2_ENDPOINT                    | public_metadata    |     38 | no_action_required |
| YOUTUBE_ACCESS_TOKEN           | credential         |    253 | no_action_required |
| IG_CLIENT_ID                   | sensitive_metadata |     15 | no_action_required |
| IG_CLIENT_SECRET               | credential         |     32 | no_action_required |
| IG_ACCESS_TOKEN                | credential         |    182 | no_action_required |
| IG_USER_ID                     | sensitive_metadata |     17 | no_action_required |
| X_CLIENT_ID                    | sensitive_metadata |     34 | no_action_required |
| X_CLIENT_SECRET                | credential         |     50 | no_action_required |
| TELEGRAM_BOT_KEY               | credential         |     46 | no_action_required |
| TELEGRAM_CHAT_ID               | sensitive_metadata |     10 | no_action_required |
| DOLT_CREDS_JWK                 | credential         |    239 | no_action_required |
| POLYMARKET_ADDRESS             | sensitive_metadata |     42 | no_action_required |
| POLYMARKET_CLOB_API_KEY        | credential         |     36 | no_action_required |
| POLYMARKET_CLOB_API_SECRET     | credential         |     44 | no_action_required |
| POLYMARKET_CLOB_API_PASSPHRASE | credential         |     64 | no_action_required |
| POLYMARKET_PRIVATE_KEY         | credential         |     66 | no_action_required |
| POLYMARKET_FUNDER_ADDRESS      | sensitive_metadata |     42 | no_action_required |
| DOLTHUB_API_KEY                | credential         |     60 | no_action_required |

Every active `op://` assignment appears exactly once. The audit found zero
one- or two-character values, zero unresolved short hits, and zero resolution
failures. Resolved values existed only in process memory long enough to count
Unicode code points and are not present in this report.

## Sentinel Proof

| Field                        | Value                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| Expected sentinel SHA-256    | `e4910119509a0fd201919b1867700c1801167d773c50f835a6d0f83a2682c760` |
| Contains every decimal digit | `true`                                                             |
| Exact byte match             | `false`                                                            |
| Concealment marker present   | `true`                                                             |
| Sentinel result              | `fail`                                                             |
| Failure classification       | `non-decimal-prefix-reference-collision`                           |
| Resolved value disclosed     | `false`                                                            |

The full masking-enabled environment concealed part of the sentinel's
non-decimal prefix because it overlaps a longer protected value. The audit
proved that no one- or two-character active reference remains, so this result
does not establish decimal-digit concealment. It does mean the fixed sentinel
cannot provide the required exact-byte proof in the current environment.
Masking remained enabled, and neither the protected value nor child stdout was
printed or persisted.

## Command Evidence

| Command                          | Result                               |
| -------------------------------- | ------------------------------------ |
| `pnpm run check:op`              | `pass`                               |
| `pnpm run audit:op-env`          | `fail` — sentinel proof only         |
| In-memory report disclosure scan | `pass` — zero resolved-value matches |

The credential policy resolved every active 1Password reference. The audit
then enumerated all 43 references successfully and failed only its exact
sentinel check. Completion remains blocked until the audit owner supplies a
sentinel proof whose public framing does not collide with an active protected
value, while preserving normal 1Password masking and every decimal digit.

## Disclosure Review

This evidence contains only variable names, classifications, character
lengths, dispositions, approved public wallet metadata, hashes, booleans, and
command outcomes. It contains no resolved credential, passphrase, private key,
sensitive address, child stdout, or exception payload.
