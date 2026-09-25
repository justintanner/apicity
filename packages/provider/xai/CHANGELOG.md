# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking:** the six paid image and video rows (`v1.images.generations`,
  `v1.images.edits`, `v1.videos.generations`,
  `v1.videos.generations.imageToVideo`, `v1.videos.edits` and
  `v1.videos.extensions`) now dispatch when `createXai` is built without
  `paygate`. `paygate: { secret }` arms the OTP gate, whose behavior is
  unchanged. An OTP passed to a provider built without `paygate` throws
  `PayGateError` `paygate-not-configured`, and an empty secret still fails
  closed. Migration: if you relied on paid calls failing closed by default,
  pass `paygate: { secret }`.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
