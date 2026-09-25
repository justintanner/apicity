# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release.

### Changed

- **Breaking:** the pay gate is opt-in. With no `--paygate-secret-file` and no
  `APICITY_PAYGATE_SECRET_FILE`, a paid endpoint call now goes upstream
  directly. Naming a secret file arms the OTP gate, whose behavior is
  unchanged. An `--otp` given with no secret configured exits 4 `paygate`, and
  its `hint` names `paygate-not-configured`, `--paygate-secret-file` and
  `APICITY_PAYGATE_SECRET_FILE`. A secret file that is empty after trimming is
  exit 1 `usage` (`<path> is empty`) before any provider is built, where it
  used to exit 4. `apicity doctor`'s Paygate Secret File row reports an unset
  file at `ok` ("the pay gate is off") rather than as a warning, and an empty
  file as an `error`. Migration: if you relied on paid calls failing closed by
  default, set `--paygate-secret-file` or `APICITY_PAYGATE_SECRET_FILE`.

### Fixed

- Endpoint descriptions shown by `apicity describe` include root
  request-schema guidance, including the ElevenLabs text-to-speech limit that
  applies when `model_id` is omitted.
