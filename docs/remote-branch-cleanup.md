# Remote Branch Cleanup Workflow (apicity)

Use this workflow to identify and optionally delete obsolete branches on
`origin` before they pile up in the repository.

## Goals

- Keep the remote branch list manageable.
- Avoid deleting active or protected branches.
- Require explicit confirmation for destructive operations.
- Emit an audit trail for every run.

## Script

`scripts/prune-branches.sh` performs branch candidate selection and
can run in dry-run or apply mode.

### Candidate rules

A branch is a cleanup candidate if **either** of the following is true:

- It is already merged into the configured base branch.
- It has no new commits for at least `--stale-days` days.

Branches that match `--keep-regex` are always preserved.
The default keep pattern is:

```text
^(main|master|develop|staging|release/.*)$
```

### Safe mode (default)

Dry-run mode is on by default.

```bash
./scripts/prune-branches.sh --remote origin --base main
```

### Apply mode

Delete branches only after a clear confirmation prompt (or `--yes`).

```bash
./scripts/prune-branches.sh \
  --remote origin \
  --base main \
  --stale-days 30 \
  --apply \
  --yes
```

### Audit output

Use `--audit-file` to create a tab-separated audit file.

```bash
./scripts/prune-branches.sh --dry-run --audit-file /tmp/remote-branch-audit.tsv
```

## Notes

- The script first runs `git fetch --prune` for the configured remote.
- Deletions are done with `git push <remote> --delete <branch>`.
- This script is intentionally conservative and does not hardcode branch
  naming assumptions beyond your keep-regex.
