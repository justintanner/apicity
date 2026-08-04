# @apicity/mcp-server

Optional MCP (Model Context Protocol) server that exposes every endpoint from
the `@apicity/*` provider packages as a tool — one MCP tool per upstream
endpoint, no new abstractions, no curated subset. The endpoint list is sourced
from the monorepo's `scripts/endpoint-docs.tsv` (bundled as
`dist/endpoint-docs.tsv` for installed users), so it stays in lockstep with
the providers.

## Install

```bash
npm install @apicity/mcp-server
# or
pnpm add @apicity/mcp-server
```

## Run

```bash
# Stdio server. Logs to stderr; stdout is reserved for MCP framing.

# 1Password mode
npx -y @apicity/mcp-server@latest \
  --op-vault apicity --op-token "$OP_SERVICE_ACCOUNT_TOKEN"

# .env file mode (no 1Password)
npx -y @apicity/mcp-server@latest --env-file ~/.config/apicity/.env

# Combined mode: file settings first, then missing secrets from 1Password
npx -y <mcp-package-spec> \
  --env-file <public-env-path> \
  --op-vault <vault> --op-token "$OP_SERVICE_ACCOUNT_TOKEN"
```

Use `@latest` with `npx`; bare `npx -y @apicity/mcp-server` can reuse an older
cached package that does not understand newer flags.

Provider credentials and settings can come from either source or both:

- **1Password** — put each provider secret in a 1Password item named after the
  env var (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) with the value in the
  `password` field, then pass the vault name and a service-account token.
  `--op-token` accepts a literal token, `env:VAR`, `$VAR`, or an existing env
  var name; `APICITY_OP_VAULT` and `APICITY_OP_SERVICE_TOKEN` work instead of
  the flags.
- **.env file** — a plain dotenv file of `KEY=VALUE` provider settings.
  Vars already set in the environment win; `op://` values are skipped. When
  the 1Password flags are also present, it fills only the secrets still
  missing after the file loads.

### Claude Code

```bash
claude mcp add apicity -- \
  npx -y @apicity/mcp-server@latest \
  --op-vault apicity --op-token "$OP_SERVICE_ACCOUNT_TOKEN"
```

Or with a .env file instead of 1Password:

```bash
claude mcp add apicity -- \
  npx -y @apicity/mcp-server@latest --env-file ~/.config/apicity/.env
```

The shell expands `"$OP_SERVICE_ACCOUNT_TOKEN"` when the `add` command runs,
so the token is stored as a literal in the client's MCP config — no `-e` env
plumbing needed.

### Codex

```bash
codex mcp add apicity -- \
  npx -y @apicity/mcp-server@latest \
  --op-vault apicity --op-token "$OP_SERVICE_ACCOUNT_TOKEN"
```

Or add it to `~/.codex/config.toml` directly:

```toml
[mcp_servers.apicity]
command = "npx"
args = [
  "-y",
  "@apicity/mcp-server@latest",
  "--op-vault",
  "apicity",
  "--op-token",
  "ops_...",
]
```

### Claude Desktop

```json
{
  "mcpServers": {
    "apicity": {
      "command": "npx",
      "args": [
        "-y",
        "@apicity/mcp-server@latest",
        "--op-vault",
        "apicity",
        "--op-token",
        "ops_..."
      ]
    }
  }
}
```

### Flags

One of `--op-vault` + `--op-token`, or `--env-file`, is required.

| Flag                           | Description                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--op-vault <vault>`           | Resolve missing provider credentials from `op://<vault>/<ENV_VAR>/password` (or `APICITY_OP_VAULT`).                                    |
| `--op-token <token>`           | 1Password service-account token, `env:VAR`, `$VAR`, or env var name (or `APICITY_OP_SERVICE_TOKEN`). `--op-service-token` is an alias.  |
| `--env-file <path>`            | Load provider settings from a dotenv-style file. Set env vars win; `op://` values skip; combine with 1Password to fill missing secrets. |
| `--output-dir <path>`          | Override where binary results and downloaded media URLs land. Defaults to `CLAUDE_PROJECT_DIR`, then cwd.                               |
| `--providers <csv>`            | Allow-list of providers (default: every one with its env var set).                                                                      |
| `--paygate-secret-file <path>` | File holding the shared HMAC secret used to verify paid-endpoint OTPs (see [Paid endpoints](#paid-endpoints)).                          |
| `--help`                       | Print usage.                                                                                                                            |

### Credentials

| Provider     | Env var                                                   |
| ------------ | --------------------------------------------------------- |
| `openai`     | `OPENAI_API_KEY`                                          |
| `xai`        | `XAI_API_KEY`                                             |
| `anthropic`  | `ANTHROPIC_API_KEY`                                       |
| `fireworks`  | `FIREWORKS_API_KEY`                                       |
| `fal`        | `FAL_API_KEY`                                             |
| `dolthub`    | `DOLTHUB_API_KEY`                                         |
| `kie`        | `KIE_API_KEY`                                             |
| `kimicoding` | `KIMI_CODING_API_KEY`                                     |
| `alibaba`    | `DASHSCOPE_API_KEY`                                       |
| `binance`    | _(none — public APIs)_                                    |
| `openligadb` | _(none — public APIs)_                                    |
| `elevenlabs` | `ELEVENLABS_API_KEY`                                      |
| `s3`         | `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY`               |
| `b2`         | `B2_ACCESS_KEY_ID` + `B2_SECRET_ACCESS_KEY` + `B2_REGION` |
| `google`     | `GOOGLE_API_KEY`                                          |
| `x`          | `X_ACCESS_TOKEN`                                          |
| `ig`         | `IG_ACCESS_TOKEN`                                         |
| `polymarket` | _(none for public data)_                                  |
| `youtube`    | `YOUTUBE_ACCESS_TOKEN`                                    |
| `telegram`   | `TELEGRAM_BOT_KEY`                                        |
| `quo`        | `QUO_API_KEY`                                             |
| `free`       | _(none — public APIs)_                                    |

In 1Password mode, the CLI lists the vault once before the server starts and
resolves existing provider secrets in one batch, with
`OP_SERVICE_ACCOUNT_TOKEN` scoped to the child `op` process. Provider env vars
already set are left untouched. With `--providers`, a missing requested secret
is a startup error; without it, missing vault items are skipped. With
`--env-file`, 1Password is skipped entirely (unless the op flags are also
given, in which case 1Password fills whatever the file left missing).

#### Polymarket CLOB credentials and signature type

Polymarket public market-data tools need no credentials. Credentialed CLOB
tools use the secret-backed bundle `POLYMARKET_CLOB_API_KEY`,
`POLYMARKET_CLOB_API_SECRET`, `POLYMARKET_CLOB_API_PASSPHRASE`,
`POLYMARKET_ADDRESS`, `POLYMARKET_PRIVATE_KEY`, and
`POLYMARKET_FUNDER_ADDRESS`.

`POLYMARKET_SIGNATURE_TYPE` is public configuration, not a secret. Set it to
the account's verified exact value (`0`, `1`, `2`, or `3`); the MCP server does
not choose an account-specific default. Supply it through one of these paths:

- Put the literal in the file passed to `--env-file`, then combine that flag
  with `--op-vault` and `--op-token` so 1Password fills the credential bundle.
  For example, an account verified as type `2` uses the line
  `POLYMARKET_SIGNATURE_TYPE=2`.
- Set it in the MCP launcher's environment while using `--op-vault`, for
  example:

  ```bash
  POLYMARKET_SIGNATURE_TYPE="$VERIFIED_POLYMARKET_SIGNATURE_TYPE" \
    npx -y <mcp-package-spec> \
      --op-vault <vault> --op-token "$OP_SERVICE_ACCOUNT_TOKEN"
  ```

`--op-vault` intentionally does not resolve `POLYMARKET_SIGNATURE_TYPE`. If
any credential-bundle value is present while the signature type is missing or
unsupported, Polymarket fails to load with a name-only configuration error
before provider construction. With no credential bundle, credential-free
read-only Polymarket remains available without a signature type.

## Tool naming

Every tool is named `<provider>_<dotPath_with_underscores>` and corresponds
1-1 to a row in `scripts/endpoint-docs.tsv`. The tool description always
includes the upstream URL and docs URL. Examples:

- `openai_v1_chat_completions` → `POST https://api.openai.com/v1/chat/completions`
- `anthropic_v1_messages` → `POST https://api.anthropic.com/v1/messages`
- `xai_v1_images_generations` → `POST https://api.x.ai/v1/images/generations`
- `kie_api_v1_jobs_recordInfo` → `GET https://api.kie.ai/api/v1/jobs/recordInfo`

## Output handling

Binary results and downloaded media URLs land in `CLAUDE_PROJECT_DIR` when
Claude Code provides it, otherwise the current directory; `--output-dir`
overrides.

- **Binary responses** (`ArrayBuffer` / `Uint8Array`, e.g. `openai_v1_audio_speech`)
  are written to the directory; the tool result is `{ savedTo, bytes }`.
- **JSON responses with media URLs** (keys `url`, `download_url`, `audio_url`,
  `video_url`, `image_url`, `file_url`, snake or camel case) are scanned
  shallowly; each URL is downloaded and a sibling `*_savedTo` field is added.
  Failures are inlined as `*_savedTo: "error: ..."` and don't break the
  response.
- Streaming endpoints (anthropic streams, etc.) are buffered into an array.

## Paid endpoints

A few tools incur direct marginal cost (`kie_post_api_v1_jobs_create_task` for
general media generation, plus the direct VEO tools
`kie_post_api_v1_veo_generate` and `kie_post_api_v1_veo_extend`) and are gated
behind a single-use OTP. The server is the **code client**: pass
`--paygate-secret-file <path>` and it holds the shared HMAC secret to
**verify** OTPs — it never mints them. Paid tools advertise an extra optional
`otp` argument.

To run a paid call, a human mints an OTP out-of-band from the same secret and
the caller passes it as the tool's `otp` argument:

```bash
apicity-paygate otp mint \
  --secret-file ./paygate.secret \
  --dot-path api.v1.jobs.createTask \
  --payload-file request.json \
  --ttl 10m
# direct VEO: --dot-path api.v1.veo.generate (or api.v1.veo.extend)
```

The AI driving the tool never sees the secret, so it cannot self-approve: with
no `otp` (or no secret configured) the paid call fails closed. See
[@apicity/cost](../provider/cost) for the full spec.

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

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
