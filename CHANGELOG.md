# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 15 scoped provider packages with zero runtime dependencies.
- Type-safe factories mirroring upstream API URL paths.
- Zod schema validation on every POST endpoint.
- Middleware composition (retry, fallback, rate-limit).
- `@apicity/cost` for local token/image/video spend estimation.
- `@apicity/mcp-server` exposing all endpoints as MCP tools.
- Integration-test harness with Polly.js record/replay.
- Endpoint documentation with upstream docs links.

## 0.1.0-alpha.0 - 2026-05-09

### Added
- First alpha release of the @apicity/* monorepo.
