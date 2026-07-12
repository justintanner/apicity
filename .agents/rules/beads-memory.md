---
trigger: always_on
description: Use Beads (bd) for persistent memory and task tracking, not Antigravity's built-in memory
---

# Beads is the memory and task system

- Persistent project knowledge lives in Beads: recall with `bd memories <keyword>`, save with `bd remember --key <key> "content"`. Do NOT store project knowledge in Antigravity memories or Knowledge Items — other agents (Claude, Codex) share the bd store and will never see Antigravity-local memory.
- A `bd prime` context block (workflow rules + all persistent memories) is injected at conversation start by `.agents/hooks.json`. If it is missing from context (compaction, hook failure), run `bd prime` before starting work.
- ALL task tracking goes through `bd` (see AGENTS.md) — never markdown TODOs or ad hoc task lists.
