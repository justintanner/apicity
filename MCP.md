# Apicity MCP Server Setup

The Apicity MCP server exposes the provider packages as Model Context Protocol
tools. Each tool maps to one upstream endpoint from the monorepo's
`scripts/endpoint-docs.tsv`; tool names use this shape:

```text
<provider>_<method>_<dot_path_with_underscores>
```

Examples:

- `openai_post_v1_chat_completions`
- `anthropic_post_v1_messages`
- `kie_get_api_v1_jobs_record_info`

The server is a stdio MCP server. It writes MCP frames to stdout and logs to
stderr, so use it as an MCP client command rather than wrapping stdout.

## Requirements

- Node.js 18 or newer.
- An MCP client such as Claude Code, Claude Desktop, Codex, or another client
  that can run a stdio server command.
- Credentials for the providers you want to enable.
- Optional: the 1Password CLI (`op`) and a 1Password service-account token if
  you want the server to resolve provider secrets from 1Password.

## Quick Start

For a plain dotenv file with real credential values:

```bash
mkdir -p ~/.config/apicity
chmod 700 ~/.config/apicity

cat > ~/.config/apicity/.env <<'EOF'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
FAL_API_KEY=...
EOF

npx -y @apicity/mcp-server@latest \
  --env-file ~/.config/apicity/.env \
  --providers openai,anthropic,fal
```

For 1Password native mode:

```bash
export OP_SERVICE_ACCOUNT_TOKEN=ops_...

npx -y @apicity/mcp-server@latest \
  --op-vault Apicity \
  --op-token env:OP_SERVICE_ACCOUNT_TOKEN \
  --providers openai,anthropic,fal
```

Use `@latest` with `npx`; bare `npx -y @apicity/mcp-server` can reuse an older
cached package that does not know newer flags.

## Install And Run Options

### No Install, With npx

Use this for MCP client configs and one-off testing:

```bash
npx -y @apicity/mcp-server@latest --env-file ~/.config/apicity/.env
```

With 1Password:

```bash
npx -y @apicity/mcp-server@latest \
  --op-vault Apicity \
  --op-token env:OP_SERVICE_ACCOUNT_TOKEN
```

### No Install, With pnpm dlx

This is the pnpm/pnpx-style equivalent of `npx`:

```bash
pnpm dlx @apicity/mcp-server@latest --env-file ~/.config/apicity/.env
```

With 1Password:

```bash
pnpm dlx @apicity/mcp-server@latest \
  --op-vault Apicity \
  --op-token env:OP_SERVICE_ACCOUNT_TOKEN
```

### Global Install

```bash
npm install -g @apicity/mcp-server
apicity-mcp --env-file ~/.config/apicity/.env
```

Or:

```bash
pnpm add -g @apicity/mcp-server
apicity-mcp --op-vault Apicity --op-token env:OP_SERVICE_ACCOUNT_TOKEN
```

### Local Project Install

Install the server into another Node project and run its local bin:

```bash
npm install @apicity/mcp-server
npm exec -- apicity-mcp --env-file ~/.config/apicity/.env
```

With pnpm:

```bash
pnpm add @apicity/mcp-server
pnpm exec apicity-mcp --env-file ~/.config/apicity/.env
```

### Direct Repo Development

Use this when working from a checkout of this repository:

```bash
git clone https://github.com/justintanner/apicity.git
cd apicity
pnpm install
pnpm run build:mcp-server

node packages/mcp-server/dist/src/bin.js --env-file ~/.config/apicity/.env
```

With native 1Password mode:

```bash
node packages/mcp-server/dist/src/bin.js \
  --op-vault Apicity \
  --op-token env:OP_SERVICE_ACCOUNT_TOKEN
```

The repository also has a development launcher that resolves the repo's
1Password-backed `.env` file once, exports the resolved provider variables,
then execs the built server:

```bash
pnpm run build:mcp-server
APICITY_ENV_FILE="$PWD/.env" \
  packages/mcp-server/scripts/launch-with-1password.sh --providers openai,xai
```

This launcher is for direct repo use. It is not part of the published npm
package, whose published entry point is the `apicity-mcp` bin.

## Credential Modes

The CLI requires at least one credential source:

- `--env-file <path>` for a dotenv-style file.
- `--op-vault <vault>` plus `--op-token <token|env:VAR>` for native
  1Password resolution.

You can provide both. The server loads `--env-file` first, then 1Password fills
missing provider variables.

Provider variables already set in the process environment win over values from
`--env-file` and 1Password.

## Plain .env Setup

A plain `.env` file is the simplest setup for users who do not want
1Password. The file must contain real values:

```dotenv
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
FAL_API_KEY=fal-...
```

The parser supports blank lines, comments, and simple quoted values:

```dotenv
# Quotes are stripped.
OPENAI_API_KEY="sk-..."
```

Important behavior:

- `--env-file` reads `KEY=VALUE` lines only.
- Existing exported environment variables are not overwritten.
- Values that start with `op://` are skipped by `--env-file` because they are
  1Password references, not usable provider credentials.
- If no provider credentials are resolved, public providers such as `binance`
  and `free-media-upload` can still load, but credentialed providers are
  skipped.

Use `--providers` to keep the server focused on the providers you expect:

```bash
npx -y @apicity/mcp-server@latest \
  --env-file ~/.config/apicity/.env \
  --providers openai,anthropic
```

## 1Password Setup

Native 1Password mode reads provider credentials from references shaped like:

```text
op://<vault>/<ENV_VAR>/password
```

For example, with `--op-vault Apicity`, the server expects:

```text
op://Apicity/OPENAI_API_KEY/password
op://Apicity/ANTHROPIC_API_KEY/password
op://Apicity/FAL_API_KEY/password
```

That means each provider secret should be a 1Password item whose title is the
environment variable name and whose `password` field contains the secret value.

Example item layout:

| Vault     | Item title          | Field      |
| --------- | ------------------- | ---------- |
| `Apicity` | `OPENAI_API_KEY`    | `password` |
| `Apicity` | `ANTHROPIC_API_KEY` | `password` |
| `Apicity` | `KIE_API_KEY`       | `password` |

You can create those items in the 1Password app, or with the CLI:

```bash
op item create \
  --vault Apicity \
  --category password \
  --title OPENAI_API_KEY \
  password='sk-...'
```

For real secrets, prefer the 1Password app or a JSON template if you do not
want the value recorded in shell history.

Create a 1Password service-account token with read access to the vault, then
pass it one of these ways:

```bash
# Literal token. Useful for one-off local testing.
apicity-mcp --op-vault Apicity --op-token ops_...

# Read token from an environment variable.
export OP_SERVICE_ACCOUNT_TOKEN=ops_...
apicity-mcp --op-vault Apicity --op-token env:OP_SERVICE_ACCOUNT_TOKEN

# Equivalent shorthand forms accepted by the CLI.
apicity-mcp --op-vault Apicity --op-token '$OP_SERVICE_ACCOUNT_TOKEN'
apicity-mcp --op-vault Apicity --op-token OP_SERVICE_ACCOUNT_TOKEN
```

You can also set both options through environment variables:

```bash
export APICITY_OP_VAULT=Apicity
export APICITY_OP_SERVICE_TOKEN=ops_...
apicity-mcp
```

In native 1Password mode:

- The CLI lists the vault once, then resolves available provider secrets in one
  batch.
- Provider variables that are already exported are left unchanged.
- Without `--providers`, missing vault items are skipped and those providers do
  not load.
- With `--providers`, a missing requested provider secret is a startup error.

### Repo .env Versus Native 1Password Mode

The tracked repository `.env` is a 1Password template used by repo scripts:

```dotenv
OPENAI_API_KEY=op://Apicity/OPENAI_API_KEY/password
FIREWORKS_API_KEY=op://Apicity/FIREWORKS_AI_API_KEY/password
```

Run repo scripts with:

```bash
op run --env-file=.env -- pnpm run check:op
op run --env-file=.env -- node packages/mcp-server/scripts/demo.mjs
```

Do not expect `apicity-mcp --env-file .env` alone to resolve those `op://`
references. The MCP server intentionally skips `op://` values in `--env-file`
mode. For an MCP client, use native `--op-vault` mode, a plain dotenv file
with real values, or the direct-repo launcher after `pnpm run build:mcp-server`.

## Provider Environment Variables

Only set the providers you plan to use. Public providers can load without
credentials.

| Provider name for `--providers` | Environment variables                                                                                                                                                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openai`                        | `OPENAI_API_KEY`                                                                                                                                                                                                                                    |
| `xai`                           | `XAI_API_KEY`                                                                                                                                                                                                                                       |
| `anthropic`                     | `ANTHROPIC_API_KEY`                                                                                                                                                                                                                                 |
| `fireworks`                     | `FIREWORKS_API_KEY`                                                                                                                                                                                                                                 |
| `fal`                           | `FAL_API_KEY`                                                                                                                                                                                                                                       |
| `google`                        | `GOOGLE_API_KEY`                                                                                                                                                                                                                                    |
| `dolthub`                       | `DOLTHUB_API_KEY`                                                                                                                                                                                                                                   |
| `simplefunctions`               | `SIMPLEFUNCTIONS_API_KEY`                                                                                                                                                                                                                           |
| `kie`                           | `KIE_API_KEY`                                                                                                                                                                                                                                       |
| `kimicoding`                    | `KIMI_CODING_API_KEY`                                                                                                                                                                                                                               |
| `alibaba`                       | `DASHSCOPE_API_KEY`                                                                                                                                                                                                                                 |
| `binance`                       | none                                                                                                                                                                                                                                                |
| `elevenlabs`                    | `ELEVENLABS_API_KEY`                                                                                                                                                                                                                                |
| `s3`                            | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optional `S3_REGION`, `S3_ENDPOINT`                                                                                                                                                                     |
| `b2`                            | `B2_ACCESS_KEY_ID`, `B2_SECRET_ACCESS_KEY`, `B2_REGION`; optional `B2_ENDPOINT`                                                                                                                                                                     |
| `x`                             | `X_ACCESS_TOKEN`                                                                                                                                                                                                                                    |
| `meta`                          | `IG_ACCESS_TOKEN`                                                                                                                                                                                                                                   |
| `polymarket`                    | none for public data; trading/account tools use `POLYMARKET_CLOB_API_KEY`, `POLYMARKET_CLOB_API_SECRET`, `POLYMARKET_CLOB_API_PASSPHRASE`, `POLYMARKET_ADDRESS`, `POLYMARKET_PRIVATE_KEY`, `POLYMARKET_FUNDER_ADDRESS`, `POLYMARKET_SIGNATURE_TYPE` |
| `free-media-upload`             | none                                                                                                                                                                                                                                                |
| `youtube`                       | `YOUTUBE_ACCESS_TOKEN`                                                                                                                                                                                                                              |
| `telegram`                      | `TELEGRAM_BOT_KEY`                                                                                                                                                                                                                                  |

## MCP Client Configuration

### Claude Code

Plain `.env` file:

```bash
claude mcp add apicity -- \
  npx -y @apicity/mcp-server@latest \
  --env-file ~/.config/apicity/.env \
  --providers openai,anthropic
```

Native 1Password:

```bash
claude mcp add apicity -- \
  npx -y @apicity/mcp-server@latest \
  --op-vault Apicity \
  --op-token "$OP_SERVICE_ACCOUNT_TOKEN" \
  --providers openai,anthropic
```

In this command form, the shell expands `"$OP_SERVICE_ACCOUNT_TOKEN"` when the
client config is written.

### Codex

Plain `.env` file:

```bash
codex mcp add apicity -- \
  npx -y @apicity/mcp-server@latest \
  --env-file ~/.config/apicity/.env \
  --providers openai,anthropic
```

Or edit `~/.codex/config.toml` directly:

```toml
[mcp_servers.apicity]
command = "npx"
args = [
  "-y",
  "@apicity/mcp-server@latest",
  "--env-file",
  "/Users/YOU/.config/apicity/.env",
  "--providers",
  "openai,anthropic",
]
```

Native 1Password:

```toml
[mcp_servers.apicity]
command = "npx"
args = [
  "-y",
  "@apicity/mcp-server@latest",
  "--op-vault",
  "Apicity",
  "--op-token",
  "env:OP_SERVICE_ACCOUNT_TOKEN",
  "--providers",
  "openai,anthropic",
]
```

Make sure `OP_SERVICE_ACCOUNT_TOKEN` is exported in the environment that starts
Codex, or replace the token reference with the literal service-account token.

### Claude Desktop

Plain `.env` file:

```json
{
  "mcpServers": {
    "apicity": {
      "command": "npx",
      "args": [
        "-y",
        "@apicity/mcp-server@latest",
        "--env-file",
        "/Users/YOU/.config/apicity/.env",
        "--providers",
        "openai,anthropic"
      ]
    }
  }
}
```

Native 1Password:

```json
{
  "mcpServers": {
    "apicity": {
      "command": "npx",
      "args": [
        "-y",
        "@apicity/mcp-server@latest",
        "--op-vault",
        "Apicity",
        "--op-token",
        "ops_...",
        "--providers",
        "openai,anthropic"
      ]
    }
  }
}
```

### Direct Repo Client Config

After building the repo:

```bash
pnpm run build:mcp-server
```

Configure the MCP client to run:

```text
node /absolute/path/to/apicity/packages/mcp-server/dist/src/bin.js --env-file /absolute/path/to/.env
```

For the direct-repo launcher:

```text
/absolute/path/to/apicity/packages/mcp-server/scripts/launch-with-1password.sh --providers openai,anthropic
```

Set `APICITY_ENV_FILE=/absolute/path/to/apicity/.env` in the environment if the
launcher should use a non-default `.env` path.

## CLI Flags

```text
apicity-mcp --op-vault <vault> --op-token <token|env:VAR>
            [--output-dir <path>] [--providers <csv>]

apicity-mcp --env-file <path>
            [--output-dir <path>] [--providers <csv>]
```

| Flag                           | Description                                                                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--op-vault <vault>`           | Resolve missing provider credentials from `op://<vault>/<ENV_VAR>/password`. Can also be set with `APICITY_OP_VAULT`.                                          |
| `--op-token <token>`           | 1Password service-account token. Accepts a literal token, `env:VAR`, `$VAR`, or an environment variable name. Can also be set with `APICITY_OP_SERVICE_TOKEN`. |
| `--op-service-token <token>`   | Alias for `--op-token`.                                                                                                                                        |
| `--env-file <path>`            | Load provider credentials from a dotenv-style file. Existing env vars win; `op://` values are skipped.                                                         |
| `--providers <csv>`            | Comma-separated provider allow-list, such as `openai,xai,anthropic`.                                                                                           |
| `--output-dir <path>`          | Directory for binary results and downloaded media URLs. Defaults to `CLAUDE_PROJECT_DIR`, then the current directory.                                          |
| `--paygate-secret-file <path>` | File containing the shared HMAC secret used to verify OTPs for paid endpoints.                                                                                 |
| `--help`                       | Print CLI usage.                                                                                                                                               |

## Output Files

Binary responses and downloaded media URLs are saved only when an output
directory is configured:

```bash
npx -y @apicity/mcp-server@latest \
  --env-file ~/.config/apicity/.env \
  --output-dir ~/apicity-outputs
```

If `--output-dir` is omitted, the server uses `CLAUDE_PROJECT_DIR` when the
client provides it, then the current directory. Binary endpoint results return
`{ savedTo, bytes }` when saved.

## Paid Endpoint OTPs

Some KIE media-generation tools incur direct marginal cost and require a
single-use OTP. To enable paid endpoint verification, pass a shared HMAC secret
file:

```bash
npx -y @apicity/mcp-server@latest \
  --env-file ~/.config/apicity/.env \
  --paygate-secret-file ~/.config/apicity/paygate.secret
```

The server verifies OTPs; it does not mint them. A human or external code
client mints an OTP with the same secret and passes it as the tool's `otp`
argument.

## Programmatic Use

The package also exports the server and registry helpers:

```ts
import { startServer } from "@apicity/mcp-server";

await startServer({
  outputDir: "./out",
  enabledProviders: ["openai", "anthropic"],
});
```

Other exported helpers include `buildRegistry()`, `zodToJsonSchema()`,
`loadEnvFile()`, and the 1Password helpers used by the CLI.

## Troubleshooting

No tools registered:

- Check that at least one provider credential is available.
- Add `--providers openai,anthropic` while testing so missing credentials are
  easier to reason about.
- Remember that `--env-file` skips `op://` references.

`1Password CLI op was not found in PATH`:

- Install the 1Password CLI and make sure the MCP client can see it in `PATH`.
- For MCP client configs, native `--op-vault` mode needs a service-account
  token; interactive desktop auth usually is not enough for unattended startup.

`Missing 1Password secret for ...`:

- In native 1Password mode, create an item titled exactly like the environment
  variable, with the provider secret in the `password` field.
- Check the vault name passed to `--op-vault`.

Media output was not saved:

- Pass `--output-dir <path>` or run from a client that sets
  `CLAUDE_PROJECT_DIR`.
