# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- First-class `costHints.durationSeconds` metadata for pricing media whose wire
  request does not contain its billable duration.
- Static pricing coverage for Fal video and edit/image endpoints, Alibaba Wan
  2.7 Image, and KIE Nano Banana.
- Fal request input/output aliases and an endpoint-to-input type map.
- `@apicity/cli`: `apicity setup 1password` saves the 1Password vault and
  service-account token given by `--op-vault` and `--op-token` to the CLI's
  env file (`APICITY_OP_VAULT` and `APICITY_OP_SERVICE_TOKEN`, the token as
  given, so `env:VAR` keeps it off disk) and checks the pair once with
  `op item list`. `--no-verify` skips the check, and `--remove` deletes the
  two lines. A new directory is created `0700` and a new file `0600`.
- `@apicity/cli`: `op://vault/item/field` references in the env file or the
  environment resolve for the provider a call addresses, all of them in one
  `op inject`, with the configured token or `op`'s own sign-in.

### Changed

- `apicity commands`, `apicity providers` and `apicity describe`, and the
  `apicity <provider>` and endpoint `--help` forms that reuse them, now answer
  the success envelope `{"ok": true, "data": …}` with `--json` or a
  non-terminal stdout, like every other command, instead of printing their
  result at the top level. Read the result under `.data`: `jq length` on that
  output now counts the envelope's keys. They also accept `--quiet` for the
  data alone.
- **Breaking:** the OTP pay gate is opt-in in `@apicity/cost`, `@apicity/kie`,
  `@apicity/xai` and `@apicity/cli`. A paid endpoint now dispatches when no
  pay-gate secret is configured. Configuring one (`paygate: { secret }`, or
  the CLI's `--paygate-secret-file` / `APICITY_PAYGATE_SECRET_FILE`) arms the
  OTP gate, whose behavior is unchanged. An OTP passed to an unarmed provider
  or CLI is an error (`paygate-not-configured`), and a supplied but empty
  secret still fails closed. What counts as paid does not change. The CLI's
  doctor reports an unset secret file as the gate being off, at `ok`, and an
  empty secret file is a `usage` error. Migration: if you relied on paid
  endpoints failing closed by default, configure the secret.
- `@apicity/cli`: env-file `op://` lines now resolve, for the addressed
  provider's variables, instead of being skipped. References outside a
  provider's credential variables (`S3_REGION`, `B2_ENDPOINT`, …) are still
  neither resolved nor exported, and a reference that cannot be resolved is exit
  3 `auth`, naming the variable and the reference.
- A 1Password token without a vault is accepted: it authenticates `op://`
  references, and only the vault convention needs both. A vault without a
  token is still exit 1 `usage`.
- `configured` in `apicity providers`, `commands` and `describe`, and doctor's
  Providers row, now counts an env-file literal, an `op://` reference and the
  vault convention (vault and token both configured), including a pair saved
  in the env file. Those commands still never run `op`.
- `apicity doctor`'s 1Password CLI row reads the vault and token from flags,
  the environment and the env file. It reports a token alone as `ok`, a vault
  alone as an `error`, and with both lists the vault once and warns, by name,
  about provider variables it lacks. It names where the token came from and
  never prints a literal one.
- `SETUP_FORMS` gains `"1password"`; `apicity setup --remove` and the other
  forms' `--remove` never open the env file.
- The Claude Code plugin's SessionStart hook reads `apicity providers --json`
  instead of `apicity doctor --json`, so it never reaches 1Password. The line
  it prints is unchanged.
- `isProviderConfigured(name, env, sources?)`: with `sources` from the new
  `readCredentialSources`, it applies the meaning above; without, it answers
  exactly as before.
- `resolveCredentials` resolves `op://` references ahead of the vault
  convention, accepts a token without a vault, and takes two more seams,
  `listItemTitles` and `injectSecrets`, which `EndpointOptions` passes through.
- `OpInject` takes an optional second parameter, the token the `op` child
  receives as `OP_SERVICE_ACCOUNT_TOKEN`.
- `SubprocessOptions` gains an optional `env`, the variables layered over the
  child's inherited environment, and `SubprocessResult` an optional
  `notFound`, set when the binary is missing.

### Removed

- The MCP server: the CLI's `mcp` subcommand and its compatibility bin. MCP support ended with `@apicity/mcp-server` 0.11.2; use the `apicity` CLI and agent skill (see MCP.md).
- The MCP-era eager registry surface of `@apicity/cli`: the `makeToolName` and `toSnakeCase` exports and the `Endpoint` fields `toolName`, `fn`, `jsonSchema`, `example` and `pathParams`. `buildRegistry()` stays as the bulk resolver behind the registry tests and `scripts/diag.mjs`.

### Fixed

- Fal area-billed models now use only documented fixed defaults and warn when
  an omitted image size cannot be priced safely.
- Kling 3.0 pricing applies the sound tier when `multi_shots` promotes an
  omitted sound setting.
- ElevenLabs text-to-speech descriptions shown by `apicity describe` now
  disclose the 10000-character limit that applies when `model_id` is omitted.
- Provider-scoped lint and preflight support endpoint-less packages such as
  `@apicity/cost` and `@apicity/mcp-server` without accepting misspelled names.
- The local dependency audit can inventory the full workspace without
  overflowing Node's default subprocess buffer.
- Generated KIE documentation retains the media URL upload guidance added for
  pre-upload asset identifiers.
- The dependency graph pins `body-parser` to the patched 1.20.6 and 2.3.0
  release lines for CVE-2026-12590.

## [0.1.0] - 2026-05-16

### Added

- First stable release of the @apicity/\* monorepo.
