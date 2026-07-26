# `ignored_schema_migrations` DOLT_PULL Failure and Recovery

This note documents a known bd/Dolt failure mode in this rig and its
supported recovery. No operator-visible commands change: `bd dolt pull` /
`bd dolt push` usage is exactly as described in `AGENTS.md`.

## Failure Mode

`bd dolt pull` fails with:

```
Error 1105: cannot merge with uncommitted changes
```

This happens after a bd schema migration when the
`ignored_schema_migrations` table — which bd designs as an **untracked**,
session-local bookkeeping table registered in `dolt_ignore` — has become
**tracked** in the Dolt commit history (for example via a one-off
force-add). The next schema migration INSERTs rows into the table, leaving
uncommitted changes on a tracked table, and Dolt's merge preflight then
rejects every pull.

A second variant appears when the table is untracked locally but still
tracked in the remote's commits: pull fails with `local changes would be
stomped by merge: ignored_schema_migrations`.

## Why `dolt_ignore` Does Not Protect Tracked Tables

`dolt_ignore` only applies to **untracked** tables. It tells Dolt to leave
matching untracked tables out of staging and status checks; it does not
exempt a table that is already tracked at HEAD from merge preflight. Dolt
refuses to merge while any tracked table is dirty, regardless of
`dolt_ignore`.

Two consequences:

- Once `ignored_schema_migrations` is tracked at HEAD, bd's
  `REPLACE INTO dolt_ignore ...` re-registration on every startup cannot
  restore the intended invariant — the entry only matters again after the
  table is untracked.
- `CALL DOLT_ADD('ignored_schema_migrations')` on an ignored table refuses
  to stage ("nothing to commit"), which is why past one-off repairs needed
  `--force`. Force-adding is what creates this failure mode in the first
  place.

## Supported Recovery

Untrack the table on **all** sync ends. Never force-add and commit it.

1. Snapshot the rows (untracked temp table):

   ```sql
   CREATE TABLE ism_repair_backup AS SELECT * FROM ignored_schema_migrations;
   ```

2. Untrack and commit the untrack:

   ```sql
   CALL DOLT_RM('ignored_schema_migrations');
   CALL DOLT_COMMIT('-m', 'untrack session-local ignored_schema_migrations');
   ```

   `DOLT_RM` also drops the working-set table; the backup preserves the
   data.

3. Recreate the table untracked and drop the backup:

   ```sql
   CREATE TABLE ignored_schema_migrations AS SELECT * FROM ism_repair_backup;
   DROP TABLE ism_repair_backup;
   ```

   bd's `dolt_ignore` entry keeps the recreated table untracked, and the
   bookkeeping rows remain queryable.

4. Propagate the untrack commit to the Dolt remote (`refs/dolt/data`) via
   `bd dolt push` so remote HEAD also stops tracking the table. This
   prevents the "stomped by merge" variant.

5. Check every other database that syncs the same remote. If any of them
   still tracks the table, repeat the repair there **before** it pushes,
   or the tracked table returns on the next pull.

Do not "fix" this by force-adding and committing the table: that spreads
session-local migration cursors into the shared remote, creates
merge-conflict churn between servers, and fights `dolt_ignore` — it is the
root cause, not a recovery.
