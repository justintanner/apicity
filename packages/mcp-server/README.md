# @apicity/mcp-server

Optional MCP (Model Context Protocol) server that exposes every endpoint from
the `@apicity/*` provider packages as a tool. One MCP tool per upstream
endpoint — no new abstractions, no curated subset.

The endpoint list is sourced from the monorepo's `scripts/endpoint-docs.tsv`
(also bundled into `dist/endpoint-docs.tsv` for installed users), so it stays
in lockstep with the providers.

## Install

```bash
npm install @apicity/mcp-server
# or
pnpm add @apicity/mcp-server
# plus whichever providers you want exposed:
pnpm add @apicity/openai @apicity/anthropic @apicity/xai @apicity/fal
```

## Run

```bash
# Stdio server. Logs to stderr; stdout is reserved for MCP framing.
OPENAI_API_KEY=sk-... ANTHROPIC_API_KEY=sk-... \
  npx apicity-mcp --output-dir ./apicity-out
```

### Flags

| Flag                           | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `--output-dir <path>`          | Where binary results and downloaded media URLs land.                                                           |
| `--providers <csv>`            | Allow-list of providers (default: every one with its env var set).                                             |
| `--paygate-secret-file <path>` | File holding the shared HMAC secret used to verify paid-endpoint OTPs (see [Paid endpoints](#paid-endpoints)). |
| `--help`                       | Print usage.                                                                                                   |

### Credentials

| Provider     | Env var                |
| ------------ | ---------------------- |
| `openai`     | `OPENAI_API_KEY`       |
| `xai`        | `XAI_API_KEY`          |
| `anthropic`  | `ANTHROPIC_API_KEY`    |
| `fireworks`  | `FIREWORKS_API_KEY`    |
| `fal`        | `FAL_API_KEY`          |
| `kie`        | `KIE_API_KEY`          |
| `kimicoding` | `KIMI_CODING_API_KEY`  |
| `alibaba`    | `DASHSCOPE_API_KEY`    |
| `elevenlabs` | `ELEVENLABS_API_KEY`   |
| `x`          | `X_ACCESS_TOKEN`       |
| `ig`         | `IG_ACCESS_TOKEN`      |
| `free`       | _(none — public APIs)_ |

Providers without their env var set are silently skipped.

## Tool naming

Every tool is named `<provider>_<dotPath_with_underscores>` and corresponds 1-1
to a row in `scripts/endpoint-docs.tsv`. Examples:

- `openai_v1_chat_completions` → `POST https://api.openai.com/v1/chat/completions`
- `anthropic_v1_messages` → `POST https://api.anthropic.com/v1/messages`
- `xai_v1_images_generations` → `POST https://api.x.ai/v1/images/generations`
- `kie_api_v1_jobs_recordInfo` → `GET https://api.kie.ai/api/v1/jobs/recordInfo`

The tool description always includes the upstream URL and docs URL.

## Output handling

When `--output-dir` is set:

- **Binary responses** (`ArrayBuffer` / `Uint8Array`, e.g. `openai_v1_audio_speech`)
  are written to the directory; the tool result is `{ savedTo, bytes }`.
- **JSON responses with media URLs** (keys `url`, `download_url`, `audio_url`,
  `video_url`, `image_url`, `file_url`, in either snake or camel case) are
  scanned shallowly. Each URL is downloaded and a sibling `*_savedTo` field is
  added next to the original URL. Failures are inlined as
  `*_savedTo: "error: ..."` and don't break the response.
- Streaming endpoints (anthropic streams, etc.) are buffered into an array.

Without `--output-dir`, binary results are summarized as a byte count and URLs
pass through untouched.

## Paid endpoints

A few endpoints incur direct marginal cost (e.g. `kie_api_v1_jobs_createTask`
for video/image generation) and are gated behind a single-use OTP. The server
is the **code client**: pass `--paygate-secret-file <path>` and it holds the
shared HMAC secret to **verify** OTPs — it never mints them. Paid tools
advertise an extra optional `otp` argument.

To run a paid call, a human mints an OTP out-of-band from the same secret
(`apicity-paygate otp mint --secret-file … --dot-path api.v1.jobs.createTask
--payload-file request.json --ttl 10m`) and the caller passes it as the tool's
`otp` argument. Because the AI driving the tool never sees the secret, it cannot
self-approve: with no `otp` (or no secret configured) the paid call fails closed.
See [@apicity/cost](../provider/cost) for the full spec.

## Programmatic use

```ts
import { startServer } from "@apicity/mcp-server";

await startServer({
  outputDir: "./out",
  enabledProviders: ["openai", "anthropic"],
});
```

`buildRegistry()` and `zodToJsonSchema()` are also exported if you want to
embed the registry into your own MCP server.

## Claude Desktop config

```json
{
  "mcpServers": {
    "apicity": {
      "command": "npx",
      "args": [
        "-y",
        "@apicity/mcp-server",
        "--output-dir",
        "/Users/me/apicity-out"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "ANTHROPIC_API_KEY": "sk-..."
      }
    }
  }
}
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
