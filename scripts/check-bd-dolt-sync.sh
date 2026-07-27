#!/usr/bin/env bash
set -euo pipefail

# check-bd-dolt-sync.sh — repeatable bd/Dolt sync verification (plan work
# items 1-2, plans/ac-zhqz2/build/implementation-plan.md).
#
# Proves the restored invariant: bd's `ignored_schema_migrations`
# bookkeeping table lives untracked + `dolt_ignore`d in the working set, so
# rows added by schema migrations no longer block `CALL DOLT_PULL` with
# Error 1105 ("cannot merge with uncommitted changes").
#
# Two phases:
#
#   1. Scratch end-to-end (always runs; mktemp dir, local dolt CLI,
#      file:// remote; no network, no shared infrastructure):
#      - fixture commits the `dolt_ignore` table itself before any
#        clone/pull (an uncommitted `dolt_ignore` table also blocks
#        merges), mirroring upstream bd's scoped commitSeededDoltIgnore;
#      - pull succeeds with the bookkeeping table untracked + ignored +
#        dirty (AC1 / REQ-003);
#      - a second simulated migration (another bookkeeping row) does not
#        re-block the next pull (AC4 / REQ-004);
#      - negative control: force-tracking the table (`dolt add -f` +
#        commit) and dirtying it makes the pull fail with "cannot merge
#        with uncommitted changes", proving the harness detects the
#        hazard;
#      - recovery via `CALL DOLT_RM('--cached', ...)` + `CALL
#        DOLT_COMMIT(...)` preserves every bookkeeping row and the pull
#        succeeds again (AC5 / REQ-004).
#
#   2. Live invariants against database `ac` on the bd Dolt server
#      (read-only SELECTs; skipped with a printed notice — not a failure —
#      when the server is unreachable or credentials are absent):
#      pattern present in `dolt_ignore` with ignored=1; table absent at
#      HEAD (`... AS OF 'HEAD'` -> table not found); `dolt_status` does
#      not list the table.
#
# Live credentials come from the environment (same variables bd uses):
#   BEADS_DOLT_SERVER_HOST (default superlzy-dolt)
#   BEADS_DOLT_SERVER_PORT (default 3306)
#   BEADS_DOLT_SERVER_USER (default superlzy)
#   BEADS_DOLT_PASSWORD (required for the live phase; absent -> skip)
#
# Exit contract: exit 0 only when every assertion passes. Each failed
# assertion prints one machine-readable line `FAIL: <check-id>: <detail>`.
# Not wired into any pnpm gate: requires the dolt CLI (and, optionally,
# the live server).

FAILURES=0

pass() { echo "PASS: $1"; }
fail() {
  echo "FAIL: $1: $2"
  FAILURES=$((FAILURES + 1))
}
note() { echo "NOTE: $*"; }

command -v dolt >/dev/null 2>&1 || {
  echo "FAIL: prereq.dolt-cli: dolt CLI not found on PATH"
  echo "RESULT: FAIL (1 failed assertion)"
  exit 1
}

TABLE="ignored_schema_migrations"
# Mirrors the live `ac` schema exactly (verified 2026-07-27).
TABLE_DDL="CREATE TABLE ${TABLE} (
  version int NOT NULL,
  applied_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content_hash char(64)
);"

# ---------------------------------------------------------------------------
# Phase 1: scratch end-to-end
# ---------------------------------------------------------------------------

SCRATCH="$(mktemp -d /tmp/check-bd-dolt-sync.XXXXXX)"
trap 'rm -rf "$SCRATCH"' EXIT

REMOTE_DIR="$SCRATCH/remote"
UPSTREAM_DIR="$SCRATCH/upstream"
MAIN_DIR="$SCRATCH/main"

dolt_quiet() {
  # dolt_quiet <dir> <args...> — run dolt in <dir>, die loudly on failure.
  local dir="$1"
  shift
  (cd "$dir" && dolt "$@") >/dev/null
}

sql() {
  # sql <dir> <query> — run a SQL query in the dolt repo at <dir>.
  local dir="$1"
  shift
  (cd "$dir" && dolt sql -q "$1")
}

sql_scalar() {
  # sql_scalar <dir> <query> — print the single scalar result of <query>.
  local dir="$1"
  shift
  (cd "$dir" && dolt sql -r csv -q "$1") | tail -n 1
}

advance_remote() {
  # advance_remote <n> — commit + push a new row to the probe table so the
  # main clone has something to merge on the next pull.
  local n="$1"
  sql "$UPSTREAM_DIR" "INSERT INTO sync_probe VALUES ($n);"
  dolt_quiet "$UPSTREAM_DIR" add sync_probe
  dolt_quiet "$UPSTREAM_DIR" commit -m "advance $n"
  dolt_quiet "$UPSTREAM_DIR" push origin main
}

pull_main() {
  # pull_main — attempt DOLT_PULL in the main clone; prints combined
  # output, returns dolt's exit code (never dies under set -e).
  (cd "$MAIN_DIR" && dolt sql -q "CALL DOLT_PULL();" 2>&1) || return $?
}

echo "== phase 1: scratch end-to-end (dolt $(dolt version | awk '{print $3}'), $SCRATCH)"

# Fixture: upstream repo with a probe table plus the seeded, COMMITTED
# dolt_ignore entry. An uncommitted dolt_ignore table blocks merges just
# like a tracked dirty table does, so this commit must happen before any
# clone/pull — same ordering as upstream bd's commitSeededDoltIgnore.
mkdir -p "$REMOTE_DIR" "$UPSTREAM_DIR"
dolt_quiet "$UPSTREAM_DIR" init --name check-bd-dolt-sync \
  --email check-bd-dolt-sync@localhost
sql "$UPSTREAM_DIR" "CREATE TABLE sync_probe (id int PRIMARY KEY);"
sql "$UPSTREAM_DIR" "REPLACE INTO dolt_ignore VALUES ('$TABLE', true);"
dolt_quiet "$UPSTREAM_DIR" add dolt_ignore sync_probe
dolt_quiet "$UPSTREAM_DIR" commit -m "seed dolt_ignore"
dolt_quiet "$UPSTREAM_DIR" remote add origin "file://$REMOTE_DIR"
dolt_quiet "$UPSTREAM_DIR" push origin main

# Main clone: the bd user's repo.
(cd "$SCRATCH" && dolt clone "file://$REMOTE_DIR" main) >/dev/null

# Fixture sanity: dolt_ignore (with the pattern) is tracked at HEAD in the
# clone; without this the dirty-table assertions below are vacuous.
FIXTURE_COUNT="$(sql_scalar "$MAIN_DIR" \
  "SELECT COUNT(*) FROM dolt_ignore AS OF 'HEAD' WHERE pattern = '$TABLE';")"
if [ "$FIXTURE_COUNT" = "1" ]; then
  pass "scratch.fixture-dolt-ignore-committed"
else
  fail "scratch.fixture-dolt-ignore-committed" \
    "dolt_ignore AS OF 'HEAD' has $FIXTURE_COUNT matching rows, want 1"
fi

# Simulate a local bd schema migration: the bookkeeping table is created
# and dirtied but never staged — untracked + ignored + dirty.
sql "$MAIN_DIR" "$TABLE_DDL"
sql "$MAIN_DIR" \
  "INSERT INTO $TABLE (version, content_hash) VALUES (1, REPEAT('a', 64));"

# AC1 / REQ-003: pull succeeds with the dirty bookkeeping table.
advance_remote 1
if OUT="$(pull_main)" && printf '%s' "$OUT" | grep -q "merge successful"; then
  pass "scratch.pull-dirty-ignored"
else
  fail "scratch.pull-dirty-ignored" \
    "DOLT_PULL with untracked+ignored+dirty $TABLE: $(printf '%s' "$OUT" | head -n 1)"
fi

# AC4 / REQ-004: a second simulated migration does not re-block the pull.
sql "$MAIN_DIR" \
  "INSERT INTO $TABLE (version, content_hash) VALUES (2, REPEAT('b', 64));"
advance_remote 2
if OUT="$(pull_main)" && printf '%s' "$OUT" | grep -q "merge successful"; then
  pass "scratch.second-migration-pull"
else
  fail "scratch.second-migration-pull" \
    "second DOLT_PULL after another bookkeeping row: $(printf '%s' "$OUT" | head -n 1)"
fi

# Negative control: force-track the table and dirty it; the pull MUST fail
# with Error 1105 ("cannot merge with uncommitted changes").
dolt_quiet "$MAIN_DIR" add -f "$TABLE"
dolt_quiet "$MAIN_DIR" commit -m "force-track $TABLE (negative control)"
sql "$MAIN_DIR" \
  "INSERT INTO $TABLE (version, content_hash) VALUES (3, REPEAT('c', 64));"
advance_remote 3
if OUT="$(pull_main)"; then
  fail "scratch.tracked-dirty-blocks-pull" \
    "DOLT_PULL unexpectedly succeeded with tracked+dirty $TABLE"
elif printf '%s' "$OUT" | grep -q "cannot merge with uncommitted changes"; then
  pass "scratch.tracked-dirty-blocks-pull"
else
  fail "scratch.tracked-dirty-blocks-pull" \
    "pull failed with unexpected error: $(printf '%s' "$OUT" | head -n 1)"
fi

# AC5 / REQ-004: untrack recovery preserves every bookkeeping row, and the
# pull succeeds afterwards.
ROWS_BEFORE="$(sql_scalar "$MAIN_DIR" "SELECT COUNT(*) FROM $TABLE;")"
sql "$MAIN_DIR" \
  "CALL DOLT_RM('--cached', '$TABLE'); CALL DOLT_COMMIT('-m', 'untrack $TABLE');" \
  >/dev/null
ROWS_AFTER="$(sql_scalar "$MAIN_DIR" "SELECT COUNT(*) FROM $TABLE;")"
if [ "$ROWS_BEFORE" = "$ROWS_AFTER" ]; then
  pass "scratch.untrack-recovery-preserves-rows"
else
  fail "scratch.untrack-recovery-preserves-rows" \
    "row count changed across DOLT_RM --cached: before=$ROWS_BEFORE after=$ROWS_AFTER"
fi

advance_remote 4
if OUT="$(pull_main)" && printf '%s' "$OUT" | grep -q "merge successful"; then
  pass "scratch.pull-after-recovery"
else
  fail "scratch.pull-after-recovery" \
    "DOLT_PULL after untrack recovery: $(printf '%s' "$OUT" | head -n 1)"
fi

# ---------------------------------------------------------------------------
# Phase 2: live invariants on database `ac` (read-only; skippable)
# ---------------------------------------------------------------------------

LIVE_HOST="${BEADS_DOLT_SERVER_HOST:-superlzy-dolt}"
LIVE_PORT="${BEADS_DOLT_SERVER_PORT:-3306}"
LIVE_USER="${BEADS_DOLT_SERVER_USER:-superlzy}"
LIVE_PASSWORD="${BEADS_DOLT_PASSWORD:-}"

live_sql() {
  # live_sql <query> — read-only query against database `ac` on the live
  # bd Dolt server; 20s budget; returns the CLI exit code.
  timeout 20 dolt \
    --host="$LIVE_HOST" --port="$LIVE_PORT" \
    --user="$LIVE_USER" --password="$LIVE_PASSWORD" --no-tls \
    sql -r csv -q "USE ac; $1" 2>&1
}

LIVE_SKIP_REASON=""
if [ -z "$LIVE_PASSWORD" ]; then
  LIVE_SKIP_REASON="BEADS_DOLT_PASSWORD is not set"
elif ! live_sql "SELECT 1;" >/dev/null 2>&1; then
  LIVE_SKIP_REASON="server $LIVE_HOST:$LIVE_PORT unreachable or credentials rejected"
fi

if [ -n "$LIVE_SKIP_REASON" ]; then
  note "live invariants skipped: $LIVE_SKIP_REASON (not a failure)"
  echo "SKIP: live: $LIVE_SKIP_REASON"
else
  echo "== phase 2: live invariants on ac@$LIVE_HOST:$LIVE_PORT (read-only)"

  IGNORED_COUNT="$(live_sql \
    "SELECT COUNT(*) FROM dolt_ignore WHERE pattern = '$TABLE' AND ignored = 1;" \
    | tail -n 1)"
  if [ "$IGNORED_COUNT" = "1" ]; then
    pass "live.dolt-ignore-entry"
  else
    fail "live.dolt-ignore-entry" \
      "dolt_ignore rows with pattern=$TABLE ignored=1: $IGNORED_COUNT, want 1"
  fi

  if HEAD_OUT="$(live_sql "SELECT COUNT(*) FROM $TABLE AS OF 'HEAD';" 2>&1)"; then
    fail "live.absent-at-head" \
      "$TABLE is tracked at HEAD (expected table not found)"
  elif printf '%s' "$HEAD_OUT" | grep -q "table not found"; then
    pass "live.absent-at-head"
  else
    fail "live.absent-at-head" \
      "unexpected error probing HEAD: $(printf '%s' "$HEAD_OUT" | head -n 1)"
  fi

  STATUS_COUNT="$(live_sql \
    "SELECT COUNT(*) FROM dolt_status WHERE table_name = '$TABLE';" \
    | tail -n 1)"
  if [ "$STATUS_COUNT" = "0" ]; then
    pass "live.status-clean"
  else
    fail "live.status-clean" \
      "dolt_status lists $TABLE $STATUS_COUNT time(s), want 0"
  fi
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

if [ "$FAILURES" -gt 0 ]; then
  echo "RESULT: FAIL ($FAILURES failed assertion(s))"
  exit 1
fi
echo "RESULT: PASS"
exit 0
