# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- KIE HappyHorse 1.1 bundled per-second pricing for text-to-video,
  image-to-video, and reference-to-video modes.
- `CostHints.durationSeconds`, a pricing-only channel for media requests whose
  wire schema does not carry the output duration.
- Static Fal pricing for video plus the remaining supported edit/image
  endpoints.
- Alibaba `wan2.7-image` and KIE `nano-banana` per-image pricing.

### Fixed

- Fal per-megapixel estimates now resolve documented endpoint defaults
  explicitly and warn when no fixed default is published.
- Kling 3.0 video estimates select the sound rate when `multi_shots: true`
  promotes an omitted `sound` field.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
