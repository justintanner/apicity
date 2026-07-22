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

### Fixed

- Fal area-billed models now use only documented fixed defaults and warn when
  an omitted image size cannot be priced safely.
- Kling 3.0 pricing applies the sound tier when `multi_shots` promotes an
  omitted sound setting.
- ElevenLabs text-to-speech MCP tools now disclose the 10000-character limit
  that applies when `model_id` is omitted.
- Provider-scoped lint and preflight support endpoint-less packages such as
  `@apicity/cost` and `@apicity/mcp-server` without accepting misspelled names.
- The local dependency audit can inventory the full workspace without
  overflowing Node's default subprocess buffer.
- Generated KIE documentation retains the media URL upload guidance added for
  pre-upload asset identifiers.

## [0.1.0] - 2026-05-16

### Added

- First stable release of the @apicity/\* monorepo.
