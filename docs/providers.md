# Providers

Each package is a standalone client. Providers depend only on `zod`.
`@apicity/polymarket` also depends on `viem` for EIP-712 order signing, and
`@apicity/openai` and `@apicity/xai` also depend on `ws` for their Realtime
WebSocket transports. Paid-endpoint OTP verification and B2's S3-compatible
transport are bundled inside their provider packages. ESM, strict TypeScript.

`@apicity/cli` is the command-line client. It is not a provider package; the
table includes it so the published roster stays in one place.

<!-- provider-inventory:providers:start -->

| Package                                                              | Focus                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [@apicity/machgen](../packages/provider/machgen)                     | Video generation, task status and authenticated assets             |
| [@apicity/openai](../packages/provider/openai)                       | OpenAI chat, responses, images, audio, embeddings, files           |
| [@apicity/anthropic](../packages/provider/anthropic)                 | Anthropic messages, streams, batches, files, models, admin APIs    |
| [@apicity/xai](../packages/provider/xai)                             | xAI chat, responses, Grok images/video, files, collections, search |
| [@apicity/fal](../packages/provider/fal)                             | fal model registry, generation, pricing, usage, analytics          |
| [@apicity/google](../packages/provider/google)                       | Google Gemini express-mode generateContent                         |
| [@apicity/kie](../packages/provider/kie)                             | KIE media generation for video, image, audio, Claude, Suno         |
| [@apicity/alibaba](../packages/provider/alibaba)                     | Alibaba DashScope/Qwen chat, image, and video workflows            |
| [@apicity/binance](../packages/provider/binance)                     | Binance Spot REST public/general endpoints                         |
| [@apicity/openligadb](../packages/provider/openligadb)               | OpenLigaDB public soccer match data, standings, and scorers        |
| [@apicity/fireworks](../packages/provider/fireworks)                 | Fireworks chat, embeddings, audio, deployments, fine-tuning        |
| [@apicity/kimicoding](../packages/provider/kimicoding)               | Kimi Coding messages, streaming, models, embeddings                |
| [@apicity/elevenlabs](../packages/provider/elevenlabs)               | ElevenLabs text-to-speech, sound effects, audio APIs               |
| [@apicity/s3](../packages/provider/s3)                               | S3-compatible object storage                                       |
| [@apicity/b2](../packages/provider/b2)                               | Backblaze B2 S3-compatible object storage                          |
| [@apicity/free-media-upload](../packages/provider/free-media-upload) | Public file upload/hosting services                                |
| [@apicity/x](../packages/provider/x)                                 | X API posting and media upload                                     |
| [@apicity/meta](../packages/provider/meta)                           | Instagram Graph API reel publishing                                |
| [@apicity/polymarket](../packages/provider/polymarket)               | Polymarket Gamma, Data, and CLOB public market data                |
| [@apicity/simplefunctions](../packages/provider/simplefunctions)     | SimpleFunctions public prediction-market and analytical APIs       |
| [@apicity/telegram](../packages/provider/telegram)                   | Telegram Bot API text, photo, video, and audio sending             |
| [@apicity/quo](../packages/provider/quo)                             | Quo business text messaging                                        |
| [@apicity/thesportsdb](../packages/provider/thesportsdb)             | TheSportsDB public sports player data                              |
| [@apicity/googleflow](../packages/provider/googleflow)               | Google Flow video generation via the useapi.net proxy              |
| [@apicity/zaicoding](../packages/provider/zaicoding)                 | Z.ai GLM coding-plan chat completions and quota monitoring         |
| [@apicity/openf1](../packages/provider/openf1)                       | OpenF1 Formula 1 historical and live timing data                   |
| [@apicity/dropbox](../packages/provider/dropbox)                     | Dropbox users, files, content upload/download, and sharing         |
| [@apicity/dolthub](../packages/provider/dolthub)                     | DoltHub SQL execution and Dolt database management                 |
| [@apicity/youtube](../packages/provider/youtube)                     | YouTube Data API v3 video publishing                               |
| [@apicity/cost](../packages/provider/cost)                           | Pure local cost/token estimates across providers                   |
| [@apicity/cli](../packages/cli)                                      | CLI and agent skill for every provider endpoint                    |

<!-- provider-inventory:providers:end -->
