#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/prune-branches.sh [options]

Description:
  Identify obsolete remote branches on the git origin and either report them
  (dry run) or delete them. Produces a machine-readable audit file plus a
  concise terminal summary.

Options:
  --remote <name>              Remote name (default: origin)
  --base <branch>              Merge-base branch (default: main)
  --stale-days <days>          Mark branches older than this as stale (default: 30)
  --keep-regex <regex>         Exclude branches matching this regex (default: '^(main|master|develop|staging|release/.*)$')
  --audit-file <path>          Save tab-separated audit report (default: none)
  --apply                      Actually delete branches (default: dry-run)
  --yes                        Skip confirmation prompt when deleting
  --dry-run                    Force dry-run mode (default)
  --help                       Show this help

Examples:
  scripts/prune-branches.sh --dry-run
  scripts/prune-branches.sh --stale-days 14 --apply --yes --audit-file /tmp/remote-prune-audit.tsv
USAGE
}

REMOTE="origin"
BASE_BRANCH="main"
STALE_DAYS=30
KEEP_REGEX='^(main|master|develop|staging|release/.*)$'
AUDIT_FILE=""
DRY_RUN=1
ASSUME_YES=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE="$2"
      shift 2
      ;;
    --base)
      BASE_BRANCH="$2"
      shift 2
      ;;
    --stale-days)
      STALE_DAYS="$2"
      shift 2
      ;;
    --keep-regex)
      KEEP_REGEX="$2"
      shift 2
      ;;
    --audit-file)
      AUDIT_FILE="$2"
      shift 2
      ;;
    --apply)
      DRY_RUN=0
      shift
      ;;
    --yes)
      ASSUME_YES=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository." >&2
  exit 1
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "Remote '$REMOTE' not found." >&2
  exit 1
fi

if ! [[ "$STALE_DAYS" =~ ^[0-9]+$ ]]; then
  echo "--stale-days must be a non-negative integer." >&2
  exit 1
fi

if ! git show-ref --verify --quiet "refs/remotes/$REMOTE/$BASE_BRANCH"; then
  echo "Base branch '$REMOTE/$BASE_BRANCH' not found locally. Fetching remote data..." >&2
fi

git fetch -q --prune "$REMOTE"

printf 'Using remote=%s base=%s stale_days=%s keep_regex=%s dry_run=%s\n' \
  "$REMOTE" "$BASE_BRANCH" "$STALE_DAYS" "$KEEP_REGEX" "$DRY_RUN"

declare -A MERGED_BRANCHES
while IFS= read -r branch; do
  branch="${branch#${REMOTE}/}"
  MERGED_BRANCHES["$branch"]=1
done < <(git branch -r --merged "$REMOTE/$BASE_BRANCH" 2>/dev/null | sed "s#^\s*##g" | sed "s#^$REMOTE/##")

NOW_TS=$(date +%s)
CANDIDATES=( )
CANDIDATE_REASONS=( )
CANDIDATE_SHAS=( )
CANDIDATE_AGES=( )
CANDIDATE_DATES=( )

is_keep_branch() {
  local branch="$1"
  if [[ "$branch" =~ $KEEP_REGEX ]]; then
    return 0
  fi
  return 1
}

append_candidate() {
  local branch="$1"
  local reason="$2"
  local sha="$3"
  local age_days="$4"
  local date_iso="$5"
  CANDIDATES+=("$branch")
  CANDIDATE_REASONS+=("$reason")
  CANDIDATE_SHAS+=("$sha")
  CANDIDATE_AGES+=("$age_days")
  CANDIDATE_DATES+=("$date_iso")
}

for ref in $(git for-each-ref --format='%(refname:short) %(objectname) %(committerdate:unix) %(committerdate:iso8601)' "refs/remotes/$REMOTE"); do
  :
 done

while IFS= read -r line; do
  branch_ref=$(printf '%s' "$line" | awk '{print $1}')
  sha=$(printf '%s' "$line" | awk '{print $2}')
  commit_ts=$(printf '%s' "$line" | awk '{print $3}')
  commit_iso=$(printf '%s' "$line" | awk '{print $4}')

  branch="${branch_ref#${REMOTE}/}"

  if [[ "$branch_ref" == "$REMOTE/HEAD" ]]; then
    continue
  fi

  if [[ "$branch" == "" ]]; then
    continue
  fi

  if is_keep_branch "$branch"; then
    continue
  fi

  if [[ "${MERGED_BRANCHES[$branch]+x}" == "x" ]]; then
    reason="merged"
  else
    reason=""
  fi

  age_days=$(( (NOW_TS - commit_ts) / 86400 ))
  if (( age_days >= STALE_DAYS )); then
    if [[ "$reason" == "" ]]; then
      reason="stale"
    else
      reason="$reason,stale"
    fi
  fi

  if [[ "$reason" == "" ]]; then
    continue
  fi

  append_candidate "$branch" "$reason" "$sha" "$age_days" "$commit_iso"
done < <(git for-each-ref --format='%(refname:short) %(objectname) %(committerdate:unix) %(committerdate:iso8601)' "refs/remotes/$REMOTE")

COUNT=${#CANDIDATES[@]}
printf '\nFound %s candidate obsolete branch(es):\n' "$COUNT"
printf '%-40s %-12s %-8s %-32s %s\n' "BRANCH" "AGE_DAYS" "REASON" "COMMIT" "LAST_COMMIT"
printf '%-40s %-12s %-8s %-32s %s\n' \
  "------" "--------" "------" "------" "----------"

if (( COUNT == 0 )); then
  echo "No branches matched cleanup policy."
  if [[ -n "$AUDIT_FILE" ]]; then
    printf '%s\t%s\t%s\t%s\t%s\n' "branch" "reason" "sha" "age_days" "commit_date" > "$AUDIT_FILE"
  fi
  exit 0
fi

for ((i=0; i<COUNT; i++)); do
  printf '%-40s %-12s %-8s %-32s %s\n' \
    "${CANDIDATES[i]}" "${CANDIDATE_AGES[i]}" "${CANDIDATE_REASONS[i]}" "${CANDIDATE_SHAS[i]}" "${CANDIDATE_DATES[i]}"
done

if [[ -n "$AUDIT_FILE" ]]; then
  printf '%s\t%s\t%s\t%s\t%s\n' "branch" "reason" "sha" "age_days" "commit_date" > "$AUDIT_FILE"
  for ((i=0; i<COUNT; i++)); do
    printf '%s\t%s\t%s\t%s\t%s\n' \
      "${CANDIDATES[i]}" "${CANDIDATE_REASONS[i]}" "${CANDIDATE_SHAS[i]}" "${CANDIDATE_AGES[i]}" "${CANDIDATE_DATES[i]}" >> "$AUDIT_FILE"
  done
  echo "Audit written to $AUDIT_FILE"
fi

if (( DRY_RUN == 1 )); then
  echo "\nDry-run mode enabled. Use --apply to delete branches."
  exit 0
fi

if (( ASSUME_YES == 0 )); then
  read -r -p "Delete $COUNT branch(es) above from '$REMOTE'? Type YES to confirm: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "Aborting delete."
    exit 0
  fi
fi

deleted=0
failed=0
for ((i=0; i<COUNT; i++)); do
  branch="${CANDIDATES[i]}"
  if git push "$REMOTE" --delete "$branch"; then
    echo "Deleted $REMOTE/$branch"
    ((deleted++))
  else
    echo "FAILED $REMOTE/$branch" >&2
    ((failed++))
  fi
done

echo "Deletion complete. deleted=$deleted failed=$failed"
if (( failed > 0 )); then
  exit 1
fi
