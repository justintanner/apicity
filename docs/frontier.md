# Frontier models

Coverage policy (2026-10-22): each type lists the top 10 of its Artificial
Analysis leaderboard; reference-to-video is derived because no leaderboard
exists.

## text-to-image (`t2i`)

[AA-Image-T2I v2.1](https://artificialanalysis.ai/image/leaderboard/text-to-image)

no data yet

## image-to-image (`i2i`)

[AA-Image-Editing v2.1](https://artificialanalysis.ai/image/leaderboard/editing)

no data yet

## text-to-video (`t2v`)

[AA-Video-T2V v2.1](https://artificialanalysis.ai/video/leaderboard/text-to-video)

no data yet

## image-to-video (`i2v`)

[AA-Video-I2V v1.1](https://artificialanalysis.ai/video/leaderboard/image-to-video),
captured 2026-10-22. Elo from blind comparisons by validated private evaluators.

| Rank | Model                  | Creator           | Elo  | apicity endpoints                                                                                                                                                                                                                                                                                                                            |
| ---- | ---------------------- | ----------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | MiniMax H3 (768p)      | MiniMax           | 1140 | [fal `minimax.h3.imageToVideo`](../packages/provider/fal/README.md#minimax), [kie `minimax-h3/image-to-video`](../packages/provider/kie/README.md#jobs)                                                                                                                                                                                      |
| 2    | FLUX 3 Max (720p)      | Black Forest Labs | 1138 | [fal `blackforestlabs.flux3Max.imageToVideo`](../packages/provider/fal/README.md#blackforestlabs)                                                                                                                                                                                                                                            |
| 3    | Dreamina Seedance 2.5  | ByteDance         | 1138 | [fal `bytedance.seedance2p5.imageToVideo`](../packages/provider/fal/README.md#bytedance), [fal `bytedance.seedance2p5.us.imageToVideo`](../packages/provider/fal/README.md#bytedance), [kie `bytedance/seedance-2-5`](../packages/provider/kie/README.md#jobs)                                                                               |
| 4    | Gemini Omni Flash 1.1  | Google            | 1132 | [fal `geminiOmniFlash.v1p1.imageToVideo`](../packages/provider/fal/README.md#geminiomniflash), [kie `google/gemini-omni-flash-1-1`](../packages/provider/kie/README.md#jobs), [googleflow `omni-flash`](../packages/provider/googleflow/README.md#videos)                                                                                    |
| 5    | Wan 3.0                | Alibaba           | 1127 | [fal `alibaba.wan3p0.imageToVideo`](../packages/provider/fal/README.md#alibaba), [fal `alibaba.wan3p0Prime.imageToVideo`](../packages/provider/fal/README.md#alibaba), [kie `wan/3-0-video`](../packages/provider/kie/README.md#jobs), [kie `wan/3-0-video-prime`](../packages/provider/kie/README.md#jobs)                                  |
| 6    | MiniMax H3 Max         | MiniMax           | 1125 | [fal `minimax.h3Max.imageToVideo`](../packages/provider/fal/README.md#minimax), [fal `minimax.h3MaxTurbo.imageToVideo`](../packages/provider/fal/README.md#minimax)                                                                                                                                                                          |
| 7    | Dreamina Seedance 2.0  | ByteDance         | 1121 | [fal `bytedance.seedance2p0.imageToVideo`](../packages/provider/fal/README.md#bytedance), [fal `bytedance.seedance2p0.us.imageToVideo`](../packages/provider/fal/README.md#bytedance), [kie `bytedance/seedance-2`](../packages/provider/kie/README.md#jobs)                                                                                 |
| 8    | FLUX 3                 | Black Forest Labs | 1086 | [fal `blackforestlabs.flux3.imageToVideo`](../packages/provider/fal/README.md#blackforestlabs)                                                                                                                                                                                                                                               |
| 9    | Grok Imagine Video 1.5 | SpaceXAI          | 1067 | [fal `xai.grokImagineVideo.v1p5.imageToVideo`](../packages/provider/fal/README.md#xai), [kie `grok-imagine/image-to-video`](../packages/provider/kie/README.md#jobs), [kie `grok-imagine-video-1-5-preview`](../packages/provider/kie/README.md#jobs), [xai `v1.videos.generations.imageToVideo`](../packages/provider/xai/README.md#videos) |
| 10   | HappyHorse-1.1         | Alibaba           | 1061 | [fal `alibaba.happyHorse.v1p1.imageToVideo`](../packages/provider/fal/README.md#alibaba), [kie `happyhorse-1-1/image-to-video`](../packages/provider/kie/README.md#jobs)                                                                                                                                                                     |

## video-to-video (`v2v`)

[AA-Video-Editing v1.1](https://artificialanalysis.ai/video/leaderboard/video-editing)

no data yet

## reference-to-video (`r2v`)

Derived. Artificial Analysis publishes no reference-to-video leaderboard.

no data yet

## Refresh

Paste a new leaderboard into `scripts/frontier/<type>/leaderboard.json` and
update `scripts/frontier/<type>/endpoints.json` so every model has an endpoint
list or an explicit empty list. Keep ranks contiguous from 1 and stop at 10, or
list every model when the board has fewer than 10. Bump the capture date, run
`pnpm run gen:frontier` and `pnpm run doc-gen`, and commit the JSON with the
regenerated registry and this file. Nothing in code, tests, or CI may download a
leaderboard.
