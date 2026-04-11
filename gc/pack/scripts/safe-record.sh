#!/bin/sh
# safe-record.sh — the ONLY sanctioned path to re-record a HAR fixture.
#
# Usage: safe-record.sh <provider> <test-file>
#
# Why this exists: `pnpm run dev:rerecord` has an edge case that can clobber
# the whole HAR suite. The user has been burned. This script instead:
#   1. Parses the test file for setupPolly("<name>") / setupPollyForFileUploads("<name>")
#   2. Resolves each name to its specific tests/recordings/<prov>_<h>/<endpoint>_<h>/
#      directory via prefix matching (mirroring tests/harness.ts recordingExists).
#   3. Deletes only those directories — nothing else.
#   4. Re-runs vitest for ONLY that test file under POLLY_MODE=record-missing
#      via `op run --env-file=.env.tpl` so keys come from 1Password.
#
# Refuses to run if <test-file> isn't a real file, or if parsing finds zero
# setupPolly calls.

set -eu

PROVIDER="${1:?usage: safe-record.sh <provider> <test-file>}"
TEST_FILE="${2:?missing test-file}"

RIG_ROOT=$(git rev-parse --show-toplevel)
cd "$RIG_ROOT"

if [ ! -f "$TEST_FILE" ]; then
    echo "safe-record: '$TEST_FILE' is not a file (relative to $RIG_ROOT)" >&2
    exit 1
fi

# Defend against shell-glob expansion or path injection by normalising.
case "$TEST_FILE" in
    *..*|/*)
        echo "safe-record: test file must be a relative path without '..'" >&2
        exit 1
        ;;
esac

RECORDINGS_DIR="tests/recordings"
if [ ! -d "$RECORDINGS_DIR" ]; then
    echo "safe-record: $RECORDINGS_DIR not found in $RIG_ROOT" >&2
    exit 1
fi

# Extract setupPolly("...") / setupPollyForFileUploads("...") arg strings.
# Matches a single-line call. Tolerates whitespace between the function
# name and the opening paren, and between the paren and the opening quote,
# so that manual edits or a different formatter setting won't silently
# break the parser. grep -oE captures through the closing quote, then sed
# strips the prefix and the trailing quote.
NAMES=$(grep -oE 'setupPolly(ForFileUploads)?[[:space:]]*\([[:space:]]*"[^"]+"' "$TEST_FILE" \
    | sed -E 's/^setupPolly(ForFileUploads)?[[:space:]]*\([[:space:]]*"//' \
    | sed -E 's/"$//' \
    | sort -u)

if [ -z "$NAMES" ]; then
    echo "safe-record: no setupPolly() calls found in $TEST_FILE" >&2
    echo "safe-record: nothing to delete, refusing to re-record blindly" >&2
    exit 1
fi

echo "safe-record: recordings referenced by $TEST_FILE:"
printf '  %s\n' $NAMES

# For each name like "openai/chat", find tests/recordings/openai_*/chat_*/.
# Mirrors the prefix-matching logic in tests/harness.ts recordingExists().
DELETED_ANY=0
OLDIFS=$IFS
IFS='
'
for NAME in $NAMES; do
    PROVIDER_PART=${NAME%%/*}
    REST=${NAME#*/}
    if [ "$PROVIDER_PART" = "$NAME" ]; then
        # Single-level name (no slash) — single dir match.
        for DIR in "$RECORDINGS_DIR"/"${PROVIDER_PART}"_*; do
            [ -d "$DIR" ] || continue
            echo "safe-record: rm -rf $DIR"
            rm -rf "$DIR"
            DELETED_ANY=1
        done
        continue
    fi
    # Nested: tests/recordings/<provider>_<hash>/<endpoint>_<hash>/
    for PDIR in "$RECORDINGS_DIR"/"${PROVIDER_PART}"_*; do
        [ -d "$PDIR" ] || continue
        for EDIR in "$PDIR"/"${REST}"_*; do
            [ -d "$EDIR" ] || continue
            echo "safe-record: rm -rf $EDIR"
            rm -rf "$EDIR"
            DELETED_ANY=1
        done
    done
done
IFS=$OLDIFS

if [ "$DELETED_ANY" -eq 0 ]; then
    echo "safe-record: no existing recording dirs matched — recording fresh" >&2
fi

# Re-record ONLY the matching test file. POLLY_MODE=record-missing will
# replay anything that still exists and record anything that's missing —
# which, after the deletes above, is precisely the set we want to refresh.
# In server mode (kamal / docker) secrets come from the process env already;
# locally we still route through `op run --env-file=.env.tpl`.
if [ "${GC_SERVER:-}" = "1" ]; then
    exec env POLLY_MODE=record-missing \
        pnpm vitest run --config tests/vitest.integration.ts "$TEST_FILE"
fi
exec op run --env-file=.env.tpl -- env POLLY_MODE=record-missing \
    pnpm vitest run --config tests/vitest.integration.ts "$TEST_FILE"
