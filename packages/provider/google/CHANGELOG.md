# @apicity/google

## Unreleased

### Added

- Added project-scoped Vertex AI global generateContent route `v1.projects.locations.global.publishers.google.models.generateContent` (`POST https://aiplatform.googleapis.com/v1/projects/{project}/locations/global/publishers/google/models/{model}:generateContent`) supporting `gemini-nano-banana-2.1`, along with typed `GoogleImageConfigSchema` (14 aspect ratios, `1K`/`2K`/`4K` sizes, `personGeneration`, `prominentPeople`, `imageOutputOptions`), `GoogleModalitySchema` (`responseModalities`), `GoogleThinkingConfigSchema` (`thinkingLevel`, `thinkingBudget`, `includeThoughts`), and pre-fetch 14-image input limit enforcement for `gemini-nano-banana-2.1` (ac-hvvd6d).

### Fixed

- Published `.d.ts` files give every relative import an explicit `.js`
  extension, including the 1 inline `import("./x")` types, so a
  `moduleResolution: node16` or `nodenext` consumer with `skipLibCheck: false`
  no longer gets TS2835 from them (ac-0su9ax).

## 0.2.5

- Initial Google Gemini express-mode provider with generateContent support.
