#!/bin/sh
# op-check.sh — verify 1Password CLI can resolve apicity's provider keys.
#
# Usage: op-check.sh <rig-root>
#
# Called from pre_start so session launch aborts before the agent burns
# tokens on a missing secrets setup. Exits 0 on success, non-zero with a
# clear message on failure. Runs `pnpm run check:op` from the rig root
# (which resolves all 8 provider keys via `op run --env-file=.env.tpl`).

set -eu

# Server mode (kamal / docker): secrets were resolved at deploy time and
# passed in as env vars. `op` isn't installed in the container — skip every
# check except a sanity probe for one expected key.
if [ "${GC_SERVER:-}" = "1" ]; then
    if [ -z "${OPENAI_API_KEY:-}" ]; then
        echo "op-check: GC_SERVER=1 but OPENAI_API_KEY is unset" >&2
        exit 5
    fi
    exit 0
fi

RIG_ROOT="${1:?usage: op-check.sh <rig-root>}"

if [ ! -d "$RIG_ROOT" ]; then
    echo "op-check: rig root '$RIG_ROOT' is not a directory" >&2
    exit 2
fi

if ! command -v op >/dev/null 2>&1; then
    echo "op-check: 1Password CLI 'op' not found on PATH" >&2
    echo "op-check: install with 'brew install --cask 1password-cli'" >&2
    exit 3
fi

if ! op account list >/dev/null 2>&1; then
    echo "op-check: 1Password session not active" >&2
    echo "op-check: run 'eval \$(op signin)' in the shell that launched 'gc start'" >&2
    exit 4
fi

if ! pnpm -C "$RIG_ROOT" run --silent check:op >/dev/null 2>&1; then
    echo "op-check: 'pnpm run check:op' failed in $RIG_ROOT" >&2
    echo "op-check: one or more provider keys could not be resolved" >&2
    echo "op-check: run the command directly to see which key is missing:" >&2
    echo "          pnpm -C $RIG_ROOT run check:op" >&2
    exit 5
fi

exit 0
