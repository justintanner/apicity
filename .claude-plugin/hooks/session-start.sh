#!/usr/bin/env bash
# session-start.sh — apicity plugin liveness check (SessionStart, 5 s budget).
# Prints one line: whether the CLI is on PATH and how many providers are
# configured. Offline and never a credential: `apicity providers --json`
# reports variable names and configured-or-not states only, and spawns no
# `op` (D-5), so this hook never reaches 1Password.
set -euo pipefail

if ! command -v apicity >/dev/null 2>&1; then
  cat <<'MSG'
<hook-output>
apicity plugin active — CLI not found on PATH.
Install: npm install -g @apicity/cli
</hook-output>
MSG
  exit 0
fi

summary=$(apicity providers --json 2>/dev/null | node -e '
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let out = "";
  try {
    const rows = JSON.parse(input).data;
    if (Array.isArray(rows)) {
      const names = rows
        .filter((r) => r && r.configured === true)
        .map((r) => r.provider);
      out =
        `${names.length} providers configured` +
        (names.length === 0 ? "" : ` (${names.join(", ")})`);
    }
  } catch {}
  process.stdout.write(out);
});
' 2>/dev/null || true)

if [[ -n "$summary" ]]; then
  printf '<hook-output>\napicity plugin active — %s\n</hook-output>\n' "$summary"
else
  printf '<hook-output>\napicity plugin active.\n</hook-output>\n'
fi
