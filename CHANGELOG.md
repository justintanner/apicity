# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-05-16

### Added

- First stable release of the @apicity/\* monorepo.

## 0.1.0-alpha.0 - 2026-05-10

First alpha release of the `@apicity/*` monorepo to npm (dist-tag `alpha`).
Tag: `v0.1.0-alpha.0`. 15 scoped packages published in lockstep.

### Added

- 15 scoped provider packages with zero runtime dependencies:
  `@apicity/{alibaba, anthropic, cost, elevenlabs, fal, fireworks,
free-media-upload, kie, kimicoding, meta, openai, polymarket, x, xai,
mcp-server}`.
- Type-safe factories mirroring upstream API URL paths.
- Zod schema validation on every POST endpoint.
- Middleware composition (retry, fallback, rate-limit).
- `@apicity/cost` for local token/image/video spend estimation.
- `@apicity/mcp-server` exposing all endpoints as MCP tools.
- Integration-test harness with Polly.js record/replay.
- Endpoint documentation with upstream docs links.
