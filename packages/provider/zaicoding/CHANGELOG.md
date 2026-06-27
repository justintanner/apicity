# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Renamed package from `@apicity/zai` to `@apicity/zaicoding` and refocused it
  on the Z.ai GLM Coding Plan. Chat completions now target the coding endpoint
  (`/api/coding/paas/v4/chat/completions`). Factory renamed `createZai` →
  `createZaiCoding`; error/types renamed `Zai*` → `ZaiCoding*`. Credential env
  var is `ZAI_CODING_PLAN_API_KEY`.

### Added

- Coding-plan usage monitoring endpoints: `get.api.monitor.usage.quota.limit`,
  `get.api.monitor.usage.modelUsage`, and `get.api.monitor.usage.toolUsage`.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
