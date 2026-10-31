# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `v1.images.edits` accepts `quality` `xhigh` and `max`, which
  gpt-image-2.5-sunburst and gpt-image-2.5-flare add, and any `WIDTHxHEIGHT`
  size, which gpt-image-2 and the 2.5 models take (for example `2048x2048`,
  `2048x1152` or `3840x2160`). `OpenAiImageEditRequestSchema` closed both
  fields, so `apicity describe` and `.schema.safeParse` refused documented
  edit requests. The known sizes stay listed beside the `WIDTHxHEIGHT`
  grammar; OpenAI applies the per-model size rules (ac-r8riqc).

## [0.1.0] - 2026-05-16

### Added

- Initial release.
