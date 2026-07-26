#!/usr/bin/env bash
# check-beads-dolt-ignore.sh — guard against ignored-but-tracked Dolt tables.
#
# bd registers session-local bookkeeping tables (e.g. ignored_schema_migrations)
# in dolt_ignore and expects them to be UNTRACKED. If such a table is tracked at
# HEAD (typically from a manual `CALL DOLT_ADD('-f', ...)` recovery), every bd
# schema migration dirties it and `bd dolt pull` fails with Error 1105
# "cannot merge with uncommitted changes". dolt_ignore only exempts untracked
# tables, so the tracked state has to be repaired on every sync endpoint.
#
# This script is the local equivalent of the requested upstream bd preflight
# (https://github.com/gastownhall/beads/issues/4356): it detects any
# dolt_ignore'd table that is tracked at HEAD and, with --fix, untracks it
# while preserving its rows. Force-adding an ignored table is NOT a valid
# recovery; untracking is.
#
# Usage:
#   scripts/check-beads-dolt-ignore.sh [--fix] [--db NAME]
#                                      [--host H] [--port P] [--user U]
#                                      [--data-dir DIR] [--no-tls]
#
# Modes:
#   (default)   Connect to the bd Dolt SQL server. Connection parameters come
#               from flags or the environment, in priority order:
#               host:     --host > BEADS_DOLT_SERVER_HOST > GC_DOLT_HOST
#               port:     --port > BEADS_DOLT_SERVER_PORT > GC_DOLT_PORT (3306)
#               user:     --user > BEADS_DOLT_SERVER_USER > GC_DOLT_USER (root)
#               password: BEADS_DOLT_PASSWORD > GC_DOLT_PASSWORD > DOLT_MYSQL_PASSWORD
#               database: --db > BEADS_DOLT_DB > GC_DOLT_DB > .beads/metadata.json
#   --data-dir  Check a local Dolt repo directory instead (for scratch tests).
#
# Exit status: 0 when every dolt_ignore'd table is untracked at HEAD (or was
# repaired with --fix); 1 when violations are found without --fix or a step
# fails; 2 on usage/connection errors.

set -euo pipefail

FIX=0
DB=""
HOST=""
PORT=""
USER_NAME=""
DATA_DIR=""
NO_TLS=0

while [ $# -gt 0 ]; do
  case "$1" in
    --fix) FIX=1; shift ;;
    --db) DB="$2"; shift 2 ;;
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --user) USER_NAME="$2"; shift 2 ;;
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    --no-tls) NO_TLS=1; shift ;;
    -h|--help) sed -n '2,38p' "$0"; exit 0 ;;
    *) echo "check-beads-dolt-ignore: unknown argument: $1" >&2; exit 2 ;;
  esac
done

command -v dolt >/dev/null 2>&1 || {
  echo "check-beads-dolt-ignore: dolt CLI is required on PATH" >&2
  exit 2
}

DOLT_ARGS=()
if [ -n "$DATA_DIR" ]; then
  DOLT_ARGS=(--data-dir "$DATA_DIR")
else
  HOST="${HOST:-${BEADS_DOLT_SERVER_HOST:-${GC_DOLT_HOST:-127.0.0.1}}}"
  PORT="${PORT:-${BEADS_DOLT_SERVER_PORT:-${GC_DOLT_PORT:-3306}}}"
  USER_NAME="${USER_NAME:-${BEADS_DOLT_SERVER_USER:-${GC_DOLT_USER:-root}}}"
  PASSWORD="${BEADS_DOLT_PASSWORD:-${GC_DOLT_PASSWORD:-${DOLT_MYSQL_PASSWORD:-}}}"
  if [ -z "$DB" ]; then
    DB="${BEADS_DOLT_DB:-${GC_DOLT_DB:-}}"
  fi
  if [ -z "$DB" ]; then
    # Fall back to the rig's bd metadata (dolt_database field).
    ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
    if [ -f "$ROOT/.beads/metadata.json" ] && command -v python3 >/dev/null 2>&1; then
      DB="$(python3 -c '
import json, sys
try:
    print(json.load(open(sys.argv[1])).get("dolt_database", ""))
except Exception:
    print("")
' "$ROOT/.beads/metadata.json")"
    fi
  fi
  [ -n "$DB" ] || {
    echo "check-beads-dolt-ignore: no database; pass --db or set BEADS_DOLT_DB" >&2
    exit 2
  }
  DOLT_ARGS=(--host "$HOST" --port "$PORT" --user "$USER_NAME" --use-db "$DB")
  [ -n "$PASSWORD" ] && DOLT_ARGS+=(--password "$PASSWORD")
  [ "$NO_TLS" -eq 1 ] && DOLT_ARGS+=(--no-tls)
fi

# run_sql <query> — prints CSV on stdout; returns dolt's exit code.
run_sql() {
  dolt "${DOLT_ARGS[@]}" sql -r csv -q "$1"
}

# Server connections may need --no-tls; auto-retry once on the TLS error.
run_sql_tls_aware() {
  local out rc
  set +e
  out="$(run_sql "$1" 2>&1)"
  rc=$?
  set -e
  if [ "$rc" -ne 0 ] && [ "$NO_TLS" -eq 0 ] && [ -z "$DATA_DIR" ] &&
    printf '%s' "$out" | grep -q "TLS requested"; then
    NO_TLS=1
    DOLT_ARGS+=(--no-tls)
    set +e
    out="$(run_sql "$1" 2>&1)"
    rc=$?
    set -e
  fi
  printf '%s' "$out"
  return "$rc"
}

IGNORED_TABLES="$(run_sql_tls_aware "SELECT pattern FROM dolt_ignore")" || {
  echo "check-beads-dolt-ignore: failed to query dolt_ignore:" >&2
  printf '%s\n' "$IGNORED_TABLES" >&2
  exit 2
}

VIOLATIONS=()
while IFS= read -r pattern; do
  [ "$pattern" = "pattern" ] && continue # CSV header
  [ -n "$pattern" ] || continue
  case "$pattern" in
    *%* | *\** | *\?*) continue ;; # skip glob/LIKE wildcard patterns
  esac
  # Probe HEAD: "table not found" means untracked (healthy); anything else
  # means the table is tracked at HEAD (violation).
  set +e
  probe="$(run_sql_tls_aware "SELECT 1 FROM \`$pattern\` AS OF 'HEAD' LIMIT 1" 2>&1)"
  rc=$?
  set -e
  if [ "$rc" -ne 0 ] && printf '%s' "$probe" | grep -q "table not found"; then
    echo "ok: $pattern is untracked at HEAD"
  elif [ "$rc" -ne 0 ]; then
    echo "check-beads-dolt-ignore: probe failed for $pattern:" >&2
    printf '%s\n' "$probe" >&2
    exit 2
  else
    echo "VIOLATION: $pattern is in dolt_ignore but tracked at HEAD"
    VIOLATIONS+=("$pattern")
  fi
done <<<"$IGNORED_TABLES"

repair_table() {
  local t="$1"
  # --cached untracks without dropping the working-set table, so the
  # bookkeeping rows survive untouched and no backup table is needed. It also
  # works when the table is dirty (the post-migration state that blocks
  # pulls), where plain DOLT_RM refuses with "unstaged changes".
  echo "repairing $t: DOLT_RM --cached -> commit (rows preserved in working set)"
  run_sql_tls_aware "CALL DOLT_RM('--cached','$t')" >/dev/null
  run_sql_tls_aware "CALL DOLT_COMMIT('-m','untrack session-local ignored table $t (check-beads-dolt-ignore --fix)')" >/dev/null
  echo "repaired: $t is now untracked; rows preserved"
}

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  if [ "$FIX" -eq 1 ]; then
    for t in "${VIOLATIONS[@]}"; do
      repair_table "$t"
    done
    echo "pass: all dolt_ignore'd tables are untracked at HEAD"
    exit 0
  fi
  cat >&2 <<EOF
check-beads-dolt-ignore: ${#VIOLATIONS[@]} ignored-but-tracked table(s) found.
Do NOT recover with DOLT_ADD('-f', ...) — that keeps the table tracked and
re-blocks every pull after the next schema migration. Re-run with --fix to
untrack (rows are preserved), and repeat on every sync endpoint. See
https://github.com/gastownhall/beads/issues/4356
EOF
  exit 1
fi

echo "pass: all dolt_ignore'd tables are untracked at HEAD"
