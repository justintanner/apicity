# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added fal HeyGen Avatar 4 image-to-video (`fal-ai/heygen/avatar4/image-to-video`) as `run.heygen.avatar4.imageToVideo`, restating fal's rule that a prompt without `audio_url` needs a `voice`; dynamically priced (ac-fh66p2).

- Added fal HeyGen Avatar 4 digital twin (`fal-ai/heygen/avatar4/digital-twin`) as `run.heygen.avatar4.digitalTwin`, reusing the stock catalogs; dynamically priced (whole output seconds set by the script) (ac-0y2ni6).

- Added fal HeyGen Avatar 3 digital twin (`fal-ai/heygen/avatar3/digital-twin`) as `run.heygen.avatar3.digitalTwin`, with HeyGen's published stock avatar (1286) and voice (102) catalogs; dynamically priced, since the spoken script sets the billed output seconds (ac-5jmpds).

- Added fal HeyGen Video reference-to-video (`heygen/heygen-video/reference-to-video`) as `run.heygen.heygenVideo.referenceToVideo`, priced per requested second by resolution, and added HeyGen Video (ultraquality) to the derived reference-to-video frontier list at rank 2 (ac-habde4).

- Added fal HeyGen Video image-to-video (`heygen/heygen-video/image-to-video`) as `run.heygen.heygenVideo.imageToVideo`, priced per requested second by resolution like text-to-video (ac-3bshuk).

- Added fal HeyGen Video text-to-video (`heygen/heygen-video/text-to-video`) as `run.heygen.heygenVideo.textToVideo`, priced per requested second by resolution ($0.02/s at 480p and 768p, $0.06/s at 1080p and 2K; fal billed the recorded call at half the card rate), and mapped the frontier text-to-video board's HeyGen Video (ultraquality) to it (ac-djhegp).

- Added fal Ideogram Vector text-to-vector (`ideogram/vector/text-to-vector`) as `run.ideogram.vector.textToVector`, priced per generated SVG by quality ($0.13 low, $0.16 medium, $0.20 high, $0.32 high with reference images) (ac-h61hu4).

- Added fal Ideogram Vector image-to-vector (`ideogram/vector/image-to-vector`) as `run.ideogram.vector.imageToVector`, priced at $0.10 per generated SVG (ac-hsbaox).

- Added fal HeyGen Voice Turbo text-to-speech (`heygen/heygen-voice/turbo`) as `run.heygen.heygenVoice.turbo`, priced per input character from its card; fal billed the recorded call at half the card rate (ac-52hhep).

- Added fal HeyGen Voice text-to-speech (`heygen/heygen-voice`), priced per input character from its card; fal billed the recorded call at half the card rate (ac-7wb7u7).

- Added a `price` to each `frontier()` row and to `apicity frontier <type>`, taken from the bundled `@apicity/cost` rates (`0.04-0.16 USD/s`, `0.08 USD/image`, `dynamic`, or `-`). `docs/frontier.md` has the same column. A missing rate stays `unpriced`; no rate table changed.

- Added MachGen provider (`@apicity/machgen`) for MiniMax H3, Seedance 2.5/2.0, Wan 3.0, HappyHorse 1.1 and Grok Imagine Video 1.5, with task status, authenticated asset download, per-second pricing and recorded replays. At recording time (2026-10-22) MachGen rejected Wan 3.0 requests that omitted its documented `video_config` (`aspect_ratio: "adaptive"`, `fps: 30`, `audio: true`), at zero charge; the Wan replays use the documented config.

- Added `apicity frontier <type>` and the `frontier()` registry in `@apicity/cost`, keyed by task type, with the ranking moved to `docs/frontier.md`.
- Added frontier text-to-image (`t2i`) and image-to-image (`i2i`) snapshots.
- Added frontier text-to-video (`t2v`) and video-to-video (`v2v`) snapshots, and a reference-to-video (`r2v`) list derived from the `t2v` and `i2v` top 10.
- Added MachGen to the frontier registry for `t2v`, `i2v` and `r2v`, through `api.v0.generate` with the MachGen model id.
- Added KIE `gpt-6-1-sol` on `POST /codex/v1/responses`, with per-token pricing and a recorded completion.
- Added KIE `claude-haiku-5-5` on `POST /claude/v1/messages`, with per-token pricing and a recorded completion.
- Added KIE Seedance 2.5 draft generation and 1080p rendering with recorded replay and current pricing.

- Added MiniMax H3 Max reframe-video with queue replay and dynamic billed-unit pricing guidance.

- Added Bria Fibo 2 edit with up to four reference images and structured VGL.

- Added Bria Fibo 2 generate with structured VGL prompts and image pricing.

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

- Root README rewritten; detail moved to docs/paygate.md, docs/middleware.md,
  docs/providers.md, CONTRIBUTING.md and MCP.md.
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

- **Breaking:** retired KIE `sora-watermark-remover`, its
  `SoraWatermarkRequestSchema`, and the `SoraWatermarkRequest`,
  `SoraWatermarkRequestInput`, and `SoraWatermarkParsedRequest` exports.
  Its cost pricing, slug, and display entries are removed as well.

- The MCP server: the CLI's `mcp` subcommand and its compatibility bin. MCP support ended with `@apicity/mcp-server` 0.11.2; use the `apicity` CLI and agent skill (see MCP.md).
- The MCP-era eager registry surface of `@apicity/cli`: the `makeToolName` and `toSnakeCase` exports and the `Endpoint` fields `toolName`, `fn`, `jsonSchema`, `example` and `pathParams`. `buildRegistry()` stays as the bulk resolver behind the registry tests and `scripts/diag.mjs`.

### Fixed

- Seedance 1.0 Lite/Pro estimates now use the wire duration or its billed
  five-second default; cost-only hints and legacy top-level durations cannot
  underquote an omitted duration.

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
