# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The request schema shared by the four text-to-speech endpoints
  (`v1.textToSpeech.schema`, `.stream.schema`, `.withTimestamps.schema`, and
  `.stream.withTimestamps.schema` — `ElevenLabsTextToSpeechRequestSchema`) now
  caps `text` at 10000 characters when `model_id` is omitted, matching
  ElevenLabs' default model (`eleven_multilingual_v2`). Such requests parsed
  locally before and failed upstream; set `model_id` explicitly to use a model
  with a larger cap.
- The shared text-to-speech schema now describes that conditional limit so MCP
  tool metadata can surface it instead of presenting the static 40000-character
  ceiling without context.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
