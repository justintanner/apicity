#!/usr/bin/env bash
# verify-dolt-pull-ignored-table.sh — repeatable scratch verification harness
# for the `ignored_schema_migrations` dirty-table DOLT_PULL failure mode.
#
# Provenance: plans/ac-zhqz2/build/implementation-plan.md, "Verification"
# section (REQ-005, acceptance criteria 3 and 4); work item WI-2 (ac-5y7c0).
#
# Uses only the dolt CLI and a file:// remote in a mktemp scratch area — no
# shared infrastructure. Phases:
#   1. Reproduce: ignored table tracked at HEAD + dirty => pull fails with
#      "cannot merge with uncommitted changes" (Error 1105 analog of ac-9gc2h).
#   2. Fix: run the WI-1 repair sequence (snapshot, DOLT_RM + commit, recreate
#      untracked), dirty the table again, advance the remote, pull => succeeds,
#      bookkeeping rows preserved.
#   3. Resilience: repeat the dirty-then-pull cycle => succeeds again; the
#      failure must not move to the next migration.
#
# Exit 0 when every assertion passes; exit 1 on the first failed assertion.

set -euo pipefail

WORK="$(mktemp -d /tmp/dolt-pull-ignored-table.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

UPSTREAM="$WORK/upstream"
REMOTE="$WORK/remote"
LOCAL="$WORK/local"

PASS_COUNT=0

log() {
  printf '[harness] %s\n' "$*"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS: %s\n' "$*"
}

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

row_count() {
  # row_count <sql-count-query> -> prints the single integer result
  dolt sql -r csv -q "$1" | tail -n 1 | tr -d '[:space:]'
}

advance_upstream() {
  # advance_upstream <id> <note>: commit a remote advance on sync_marker
  local id="$1" note="$2"
  (
    cd "$UPSTREAM"
    dolt sql -q "INSERT INTO sync_marker VALUES ($id, '$note');" >/dev/null
    dolt add sync_marker >/dev/null
    dolt commit -m "advance: $note" >/dev/null
    dolt push origin main >/dev/null
  )
}

command -v dolt >/dev/null 2>&1 || fail "dolt CLI not found on PATH"
log "dolt version: $(dolt version)"
log "scratch area: $WORK (removed on exit)"

# --- Setup: bare remote, upstream repo, local clone --------------------
# dolt cannot clone a plain repo directory over file://, so the remote is a
# bare directory that the upstream working repo pushes into.
#
# Faithful bd model (verified against the live `ac` database on
# superlzy-dolt): `dolt_ignore` is *tracked at HEAD* with the
# `ignored_schema_migrations` entry on both sync ends, so bd's startup
# `REPLACE INTO dolt_ignore` is a no-op diff. A `dolt_ignore` row that only
# exists in the working set materializes as an uncommitted new table and
# blocks every merge — that is a scratch-harness artifact, not bd's state.

mkdir -p "$UPSTREAM" "$REMOTE"
(
  cd "$UPSTREAM"
  dolt init --name "verify" --email "verify@example.com" >/dev/null
  dolt sql -q "CREATE TABLE sync_marker (id INT PRIMARY KEY, note VARCHAR(64));" >/dev/null
  dolt sql -q "INSERT INTO sync_marker VALUES (1, 'base');" >/dev/null
  dolt sql -q "REPLACE INTO dolt_ignore VALUES ('ignored_schema_migrations', true);" >/dev/null
  dolt add sync_marker dolt_ignore >/dev/null
  dolt commit -m "base commit" >/dev/null
  dolt remote add origin "file://$REMOTE"
  dolt push origin main >/dev/null
)

dolt clone "file://$REMOTE" "$LOCAL" >/dev/null
cd "$LOCAL"
dolt config --local --add user.name "verify" >/dev/null
dolt config --local --add user.email "verify@example.com" >/dev/null

# bd's invariant: the table exists in the working set and is registered in
# dolt_ignore (bd re-registers it with REPLACE INTO on every startup; with
# dolt_ignore tracked at HEAD this REPLACE is a no-op diff, as in the live
# `ac` database).
dolt sql -q "CREATE TABLE ignored_schema_migrations (id INT PRIMARY KEY, migration VARCHAR(255));" >/dev/null
dolt sql -q "REPLACE INTO dolt_ignore VALUES ('ignored_schema_migrations', true);" >/dev/null
dolt sql -q "INSERT INTO ignored_schema_migrations VALUES (1, '0001_baseline');" >/dev/null
log "setup complete: upstream + local clone, ignored table created and registered in dolt_ignore"

# --- Phase 1: reproduce the failure ------------------------------------
# ac-9gc2h analog: force-add + commit the ignored table so it is tracked at
# HEAD, then dirty it with a migration row and pull an upstream advance.
log "phase 1: reproduce dirty-tracked-table pull failure"
dolt add --force ignored_schema_migrations >/dev/null
dolt commit -m "force-track ignored_schema_migrations (ac-9gc2h analog)" >/dev/null
dolt sql -q "INSERT INTO ignored_schema_migrations VALUES (2, '0002_dirty_migration');" >/dev/null
advance_upstream 2 "advance-1"

set +e
PULL_OUT="$(dolt pull 2>&1)"
PULL_RC=$?
set -e
if [ "$PULL_RC" -eq 0 ]; then
  fail "phase 1: pull unexpectedly succeeded with dirty tracked ignored table"
fi
if ! grep -qi "cannot merge with uncommitted changes" <<<"$PULL_OUT"; then
  fail "phase 1: expected 'cannot merge with uncommitted changes', got: $PULL_OUT"
fi
pass "phase 1: dirty tracked ignored table blocks DOLT_PULL ('cannot merge with uncommitted changes')"

# --- Phase 2: WI-1 repair sequence, then clean pull --------------------
log "phase 2: repair (untrack) then dirty-then-pull"
PRE_REPAIR_COUNT="$(row_count "SELECT COUNT(*) AS c FROM ignored_schema_migrations;")"
[ "$PRE_REPAIR_COUNT" = "2" ] || fail "phase 2: expected 2 pre-repair rows, got $PRE_REPAIR_COUNT"

# Repair: snapshot rows, untrack via DOLT_RM + commit, recreate untracked.
dolt sql -q "CREATE TABLE ism_repair_backup AS SELECT * FROM ignored_schema_migrations;" >/dev/null
# The harness dirties the table on purpose; the backup already holds those
# rows, so discard the unstaged delta so `dolt rm` can proceed. The live WI-1
# repair runs against a clean working set and needs no such reset.
dolt reset --hard >/dev/null
dolt rm ignored_schema_migrations >/dev/null
dolt commit -m "untrack session-local ignored_schema_migrations (gc ac-zhqz2)" >/dev/null
dolt sql -q "CREATE TABLE ignored_schema_migrations AS SELECT * FROM ism_repair_backup; DROP TABLE ism_repair_backup;" >/dev/null
dolt sql -q "REPLACE INTO dolt_ignore VALUES ('ignored_schema_migrations', true);" >/dev/null

# Simulate the next bd schema migration dirtying the (now untracked) table.
dolt sql -q "INSERT INTO ignored_schema_migrations VALUES (3, '0003_post_repair_migration');" >/dev/null
advance_upstream 3 "advance-2"

set +e
PULL_OUT="$(dolt pull 2>&1)"
PULL_RC=$?
set -e
[ "$PULL_RC" -eq 0 ] || fail "phase 2: pull after repair failed: $PULL_OUT"

POST_REPAIR_COUNT="$(row_count "SELECT COUNT(*) AS c FROM ignored_schema_migrations;")"
[ "$POST_REPAIR_COUNT" = "3" ] || fail "phase 2: expected 3 rows after repair+pull (2 pre-repair + 1 new), got $POST_REPAIR_COUNT"
pass "phase 2: pull succeeds after untrack repair; rows preserved (2 pre-repair + 1 new = 3)"

# --- Phase 3: upgrade resilience — second dirty-then-pull cycle --------
log "phase 3: second dirty-then-pull cycle (upgrade resilience)"
dolt sql -q "INSERT INTO ignored_schema_migrations VALUES (4, '0004_next_migration');" >/dev/null
advance_upstream 4 "advance-3"

set +e
PULL_OUT="$(dolt pull 2>&1)"
PULL_RC=$?
set -e
[ "$PULL_RC" -eq 0 ] || fail "phase 3: second-cycle pull failed (failure moved to next migration): $PULL_OUT"

FINAL_COUNT="$(row_count "SELECT COUNT(*) AS c FROM ignored_schema_migrations;")"
[ "$FINAL_COUNT" = "4" ] || fail "phase 3: expected 4 rows after second cycle, got $FINAL_COUNT"
pass "phase 3: second dirty-then-pull cycle succeeds; failure did not move to the next migration"

log "all $PASS_COUNT assertions passed"
printf 'RESULT: PASS\n'
