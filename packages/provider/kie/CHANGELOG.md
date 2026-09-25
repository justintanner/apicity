# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `codex.v1.responses` now enumerates `gpt-6-astra`, `gpt-6-luna` and
  `gpt-6-sol` in its `model` enum, so `apicity describe` and the
  `KieResponsesModel` type autocomplete them. All three already validated
  through the versioned GPT alias, so no request that parsed before is
  rejected now. Nothing needs migrating.

### Changed

- **Breaking:** paid endpoints (`post.api.v1.jobs.createTask`, the direct VEO
  and Suno rows, and the other `PAID_ENDPOINTS` rows) now dispatch when
  `createKie` is built without `paygate`. `paygate: { secret }` arms the OTP
  gate, whose behavior is unchanged. An OTP passed to a provider built without
  `paygate` throws `PayGateError` `paygate-not-configured`, and
  `paygate: { secret: "" }` still fails closed. Migration: if you relied on
  paid calls failing closed by default, pass `paygate: { secret }`.

### Fixed

- Qwen2 image-edit seed validation and discovery metadata now follow KIE's
  published integer contract. This narrows caller-visible validation: replace
  fractional seed values with an integer or omit `seed` before upgrading.
- Seedance 2 Mini reference media and Qwen2 image-edit media fields accept
  pre-upload asset identifiers as plain strings.
- Generated documentation clarifies that pre-upload identifiers must be
  replaced with publicly reachable URLs before creating a KIE task.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
