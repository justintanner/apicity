#!/bin/sh
# op-run.sh — thin wrapper around `op run --env-file=<rig>/.env.tpl -- <cmd...>`.
#
# Usage: op-run.sh <rig-root> <cmd...>
#
# Agents in isolated worktrees use this so their live env resolves from the
# WORKTREE's copy of .env.tpl (not the host's), which is what worktree-setup.sh
# copied in. Keeps resolved secrets out of the host env and prevents the
# worktree agent from accidentally inheriting the human's shell state.

set -eu

# Server mode (kamal / docker): secrets are already in the process env.
# Drop the rig-root arg and exec the command directly.
if [ "${GC_SERVER:-}" = "1" ]; then
    shift
    exec "$@"
fi

RIG_ROOT="${1:?usage: op-run.sh <rig-root> <cmd...>}"
shift

ENV_FILE="$RIG_ROOT/.env.tpl"
if [ ! -f "$ENV_FILE" ]; then
    echo "op-run: env file '$ENV_FILE' not found" >&2
    exit 2
fi

exec op run --env-file="$ENV_FILE" -- "$@"
