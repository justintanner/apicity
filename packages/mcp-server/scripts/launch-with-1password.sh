#!/usr/bin/env bash
# Launcher for use as an MCP server `command`. Resolves @apicity provider keys
# from 1Password (one `op run` call, ~2s), exports them, then exec's the MCP
# server. Direct stdio inheritance — no `op run` wrapping the long-lived node
# process (op redacts/buffers output and breaks MCP framing).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PKG_DIR/../.." && pwd)"
ENV_FILE="${APICITY_ENV_FILE:-$REPO_ROOT/.env.tpl}"
BIN="$PKG_DIR/dist/src/bin.js"

while IFS= read -r line; do
  case "$line" in
    OPENAI_API_KEY=*|XAI_API_KEY=*|ANTHROPIC_API_KEY=*|\
FIREWORKS_API_KEY=*|FAL_API_KEY=*|KIE_API_KEY=*|\
KIMI_CODING_API_KEY=*|DASHSCOPE_API_KEY=*|ELEVENLABS_API_KEY=*)
      export "$line"
      ;;
  esac
done < <(op run --no-masking --env-file="$ENV_FILE" -- env)

exec node "$BIN" "$@"
