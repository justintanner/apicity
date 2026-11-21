# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Support `happyhorse-1.0-video-edit` on `api.v1.services.aigc.videoGeneration.videoSynthesis`, requiring a non-empty `prompt` (`<=5000` chars), 1 `video` and 0–5 `reference_image` media entries, `720P`/`1080P` resolution, `audio_setting`, `watermark`, and non-negative `seed` (rejecting unsupported `480P`, `ratio`, `duration`, `audio`, `prompt_extend`, and `negative_prompt`).
- Support `wan3.0-video` and `wan3.0-video-prime` on `api.v1.services.aigc.videoGeneration.videoSynthesis`, including optional `media` for text-to-video, `480P` resolution, `adaptive` and `21:9` aspect ratios, `-1` and `2`–`30` s durations, `audio` flag, `seed: -1`, `20000`-character prompts, and `reference_video`, `reference_audio`, `file`, and `link` media types.

## [0.1.0] - 2026-05-16

### Added

- Initial release.
