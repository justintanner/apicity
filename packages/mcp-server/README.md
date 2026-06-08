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
```

## Run

```bash
# Stdio server. Logs to stderr; stdout is reserved for MCP framing.
OP_SERVICE_TOKEN=ops_... \
  npx -y @apicity/mcp-server \
  --op-vault Apicity \
  --op-service-token env:OP_SERVICE_TOKEN
```

The CLI requires both `--op-vault` and `--op-service-token`. Put each provider
secret in a 1Password item named after the env var (`OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, etc.) with the value in the `password` field, then pass
the vault name and a 1Password service-account token:

```bash
npx -y @apicity/mcp-server \
  --op-vault Apicity \
  --op-service-token env:OP_SERVICE_TOKEN
```

`--op-service-token` accepts a literal token, `env:VAR`, `$VAR`, or an existing
env var name. `APICITY_OP_VAULT` and `APICITY_OP_SERVICE_TOKEN` can also be
used instead of flags.

Claude Code setup:

```bash
claude mcp add --scope user apicity -- \
  npx -y @apicity/mcp-server \
  --op-vault Apicity \
  --op-service-token env:OP_SERVICE_TOKEN
```

### Flags

| Flag                           | Description                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `--op-vault <vault>`           | Required. Resolve missing provider credentials from `op://<vault>/<ENV_VAR>/password` (or `APICITY_OP_VAULT`). |
| `--op-service-token <token>`   | Required. 1Password service-account token, `env:VAR`, `$VAR`, or env var name (or `APICITY_OP_SERVICE_TOKEN`). |
| `--output-dir <path>`          | Override where binary results and downloaded media URLs land. Defaults to `CLAUDE_PROJECT_DIR`, then cwd.      |
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
| `google`     | `GOOGLE_API_KEY`       |
| `x`          | `X_ACCESS_TOKEN`       |
| `ig`         | `IG_ACCESS_TOKEN`      |
| `youtube`    | `YOUTUBE_ACCESS_TOKEN` |
| `telegram`   | `TELEGRAM_BOT_KEY`     |
| `free`       | _(none — public APIs)_ |

Before the MCP server starts, the CLI lists the vault once and resolves
existing provider secrets in one batch using `OP_SERVICE_ACCOUNT_TOKEN` scoped
to the child `op` process. Provider env vars that are already set are left
untouched. If `--providers` is set, a missing requested provider secret is a
startup error; without `--providers`, missing vault items are skipped.

## Tool naming

Every tool is named `<provider>_<dotPath_with_underscores>` and corresponds 1-1
to a row in `scripts/endpoint-docs.tsv`. Examples:

- `openai_v1_chat_completions` → `POST https://api.openai.com/v1/chat/completions`
- `anthropic_v1_messages` → `POST https://api.anthropic.com/v1/messages`
- `xai_v1_images_generations` → `POST https://api.x.ai/v1/images/generations`
- `kie_api_v1_jobs_recordInfo` → `GET https://api.kie.ai/api/v1/jobs/recordInfo`

The tool description always includes the upstream URL and docs URL.

## Output handling

The CLI saves binary responses and downloaded media URLs to
`CLAUDE_PROJECT_DIR` when Claude Code provides it, otherwise to the current
directory. Pass `--output-dir` to override that location.

- **Binary responses** (`ArrayBuffer` / `Uint8Array`, e.g. `openai_v1_audio_speech`)
  are written to the directory; the tool result is `{ savedTo, bytes }`.
- **JSON responses with media URLs** (keys `url`, `download_url`, `audio_url`,
  `video_url`, `image_url`, `file_url`, in either snake or camel case) are
  scanned shallowly. Each URL is downloaded and a sibling `*_savedTo` field is
  added next to the original URL. Failures are inlined as
  `*_savedTo: "error: ..."` and don't break the response.
- Streaming endpoints (anthropic streams, etc.) are buffered into an array.

## Paid endpoints

A few endpoints incur direct marginal cost (e.g. `kie_post_api_v1_jobs_create_task`
for general media generation, plus direct VEO tools
`kie_post_api_v1_veo_generate` and `kie_post_api_v1_veo_extend`) and are gated
behind a single-use OTP. The server is the **code client**: pass
`--paygate-secret-file <path>` and it holds the shared HMAC secret to
**verify** OTPs — it never mints them. Paid tools advertise an extra optional
`otp` argument.

To run a paid call, a human mints an OTP out-of-band from the same secret
(`apicity-paygate otp mint --secret-file ... --dot-path api.v1.jobs.createTask
--payload-file request.json --ttl 10m`; direct VEO uses
`api.v1.veo.generate` or `api.v1.veo.extend`) and the caller passes it as the
tool's `otp` argument. Because the AI driving the tool never sees the secret,
it cannot self-approve: with no `otp` (or no secret configured) the paid call
fails closed. See [@apicity/cost](../provider/cost) for the full spec.

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
        "--op-vault",
        "Apicity",
        "--op-service-token",
        "env:OP_SERVICE_TOKEN"
      ],
      "env": {
        "OP_SERVICE_TOKEN": "ops_..."
      }
    }
  }
}
```

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
