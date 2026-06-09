#!/usr/bin/env bash
# Launcher for use as an MCP server `command`. Resolves @apicity provider keys
# from 1Password (one `op run` call, ~2s), exports them, then exec's the MCP
# server. Direct stdio inheritance — no `op run` wrapping the long-lived node
# process (op redacts/buffers output and breaks MCP framing).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PKG_DIR/../.." && pwd)"
ENV_FILE="${APICITY_ENV_FILE:-$REPO_ROOT/.env}"
BIN="$PKG_DIR/dist/src/bin.js"

REQUIRED_KEYS=(
  OPENAI_API_KEY
  XAI_API_KEY
  ANTHROPIC_API_KEY
  FIREWORKS_API_KEY
  FAL_API_KEY
  GOOGLE_API_KEY
  KIE_API_KEY
  KIMI_CODING_API_KEY
  DASHSCOPE_API_KEY
  ELEVENLABS_API_KEY
  IG_ACCESS_TOKEN
  YOUTUBE_ACCESS_TOKEN
  TELEGRAM_BOT_KEY
)

# Short-circuit: when every required key is already exported with a real
# (non-op://) value, skip `op run` entirely. Lets a parent prefetch once
# and have many child sessions inherit, instead of each session firing its
# own Touch ID prompt.
all_set=1
for key in "${REQUIRED_KEYS[@]}"; do
  val="${!key:-}"
  if [[ -z "$val" || "$val" == op://* ]]; then
    all_set=0
    break
  fi
done

if [[ "$all_set" -eq 0 ]]; then
  while IFS= read -r line; do
    case "$line" in
      OPENAI_API_KEY=*|XAI_API_KEY=*|ANTHROPIC_API_KEY=*|\
FIREWORKS_API_KEY=*|FAL_API_KEY=*|GOOGLE_API_KEY=*|KIE_API_KEY=*|\
KIMI_CODING_API_KEY=*|DASHSCOPE_API_KEY=*|ELEVENLABS_API_KEY=*|\
IG_ACCESS_TOKEN=*|YOUTUBE_ACCESS_TOKEN=*|TELEGRAM_BOT_KEY=*)
        export "$line"
        ;;
    esac
  done < <(op run --no-masking --env-file="$ENV_FILE" -- env)
fi

exec node "$BIN" "$@"
