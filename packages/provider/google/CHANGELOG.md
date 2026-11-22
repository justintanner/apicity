# @apicity/google

## Unreleased

### Added

- Added project-scoped Vertex AI global Interactions API routes `v1.projects.locations.global.interactions` (`POST https://aiplatform.googleapis.com/v1/projects/{project}/locations/global/interactions`) and `get.v1.projects.locations.global.interactions` (`GET https://aiplatform.googleapis.com/v1/projects/{project}/locations/global/interactions/{id}`) using OAuth2 Bearer auth (`oauthToken`), typed `GoogleInteractionCreateRequestSchema` / `GoogleInteractionVideoResponseFormatSchema` / `GOOGLE_INTERACTION_MODELS` supporting `gemini-omni-1.2-flash` (3–15 s) and `gemini-omni-1.1-flash-preview` (3–10 s) across `360p`/`720p`/`1080p`/`4k` and `16:9`/`9:16` with inline or GCS URI delivery and pre-fetch input limit checks (max 10 images, max 3 videos, no `system_instruction`/`tools`), and string `error.code` parsing on `GoogleError` (ac-phvsmq).
- Added project-scoped Vertex AI global generateContent route `v1.projects.locations.global.publishers.google.models.generateContent` (`POST https://aiplatform.googleapis.com/v1/projects/{project}/locations/global/publishers/google/models/{model}:generateContent`) supporting `gemini-nano-banana-2.1`, along with typed `GoogleImageConfigSchema` (14 aspect ratios, `1K`/`2K`/`4K` sizes, `personGeneration`, `prominentPeople`, `imageOutputOptions`), `GoogleModalitySchema` (`responseModalities`), `GoogleThinkingConfigSchema` (`thinkingLevel`, `thinkingBudget`, `includeThoughts`), and pre-fetch 14-image input limit enforcement for `gemini-nano-banana-2.1` (ac-hvvd6d).

### Fixed

- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 1 inline `import("./x")` types, so a
  `moduleResolution: node16` or `nodenext` consumer with `skipLibCheck: false`
  no longer gets TS2835 from them (ac-0su9ax).

## 0.2.5

- Initial Google Gemini express-mode provider with generateContent support.
