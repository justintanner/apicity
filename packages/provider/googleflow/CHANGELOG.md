# @apicity/google

## [Unreleased]

### Added

- Support `omni-flash-1.2` (Gemini Omni 1.2 Flash) on `POST v1.videos` (`GoogleFlowVideosRequestSchema`): 3–15 s integer durations (3–10 s in start+end frame `I2V-FL` mode, default 8 s), closed `landscape`/`portrait` aspect ratio, `360p`/`720p` resolution (default `720p`), up to 10 `referenceImage_*` / `character_*` slots, `referenceAudio_1..5`, V2V edit via `referenceVideo_1` with `startFrameIndex_1` (`0–359`) and `endFrameIndex_1` (`1–360`) on a 24 fps timeline, and `returnSilentVideos` (ac-5kldja).

## 0.2.5

- Initial Google Gemini express-mode provider with generateContent support.
