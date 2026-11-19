# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `v2.openai.images.generations` generates one image with GPT Image 2.6 Sunburst or Flare (`POST /v2/openai/images/generations`). Quality is `low`, `medium`, `high` or `auto` (`auto` renders at `high`). OpenAI's `xhigh` and `max` are not offered, so the Artificial Analysis (max) ranking cannot be reproduced. A recorded Flare image at `low` and `1024x1024` billed 0.02477 USD (ac-qggnrr).

### Fixed

- The Wan media field documents reference video inputs and billing limits for Wan 3.0 and Wan 3.0 Prime (ac-757evu).
