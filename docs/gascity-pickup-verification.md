# Gas City Pickup Verification

Evidence captured on 2026-06-21 for bead `ac-qwbm`.

## Upstream Surfaces Checked

The upstream Gas City README describes the system as a configurable
orchestration toolkit with declarative `city.toml`, beads-backed work,
formulas, mail, controller reconciliation, packs, overrides, and rig-scoped
orchestration:

- https://github.com/gastownhall/gascity#readme
- https://github.com/gastownhall/gascity/tree/main/cmd/gc
- https://github.com/gastownhall/gascity/tree/main/internal/beads
- https://github.com/gastownhall/gascity/tree/main/internal/runtime
- https://github.com/gastownhall/gascity/tree/main/internal/session
- https://github.com/gastownhall/gascity/blob/main/internal/bootstrap/packs/core/assets/scripts/nudge-on-route.sh

The relevant upstream behavior is that pool routing is represented on the
work bead, while actual execution starts when a session claims through
`gc hook --claim --json`.

## Local Configuration Evidence

`/gc/city.toml` defines the apicity rig as:

```toml
[[rigs]]
name = "apicity"
path = "/gc/apicity"
prefix = "ac"
default_branch = "main"
```

`gc rig list --json` resolved the same active rig:

```json
{
  "name": "apicity",
  "path": "/gc/apicity",
  "prefix": "ac",
  "default_branch": "main",
  "running": true,
  "beads": "initialized"
}
```

`gc config explain --rig apicity --agent polecat` resolved
`apicity/gastown.polecat` from the imported gastown pack with:

- `scope = rig`
- `min_active_sessions = 0`
- `max_active_sessions = 5`
- `work_dir = .gc/worktrees/{{.Rig}}/polecats/{{.AgentBase}}`
- `nudge` tells the session to run `gc hook --claim --json` and execute any
  returned work immediately.
- `scale_check` sourced from the pack

`gc order show nudge-on-route` confirmed the core event order is installed:

```text
Order:  nudge-on-route
Exec:   $PACK_DIR/assets/scripts/nudge-on-route.sh
Trigger: event
On:     bead.updated
```

That order is the expected bridge for warm-idle workers. The core script
documents that `gc sling` does not nudge warm-idle workers by design; routed
beads are woken by the `bead.updated` event order, which nudges the target
session or active members of a pool template.

## Live Claim Evidence

This bead was routed to the polecat pool:

```json
{
  "id": "ac-qwbm",
  "metadata": {
    "gc.routed_to": "apicity/gastown.polecat"
  }
}
```

Running `gc hook --claim --json` in the apicity polecat session returned:

```json
{
  "ok": true,
  "action": "work",
  "reason": "claimed",
  "bead_id": "ac-qwbm",
  "assignee": "gastown__polecat-su-wisp-hqj070",
  "route": "apicity/gastown.polecat"
}
```

After the claim, `gc session list --json` showed the active session as:

```json
{
  "name": "apicity/gastown.furiosa",
  "template": "apicity/gastown.polecat",
  "session_name": "gastown__polecat-su-wisp-hqj070",
  "rig": "apicity",
  "state": "active"
}
```

Recent `bead.updated` events for `ac-qwbm` showed the expected state
transition:

1. open and unrouted
2. open with `gc.routed_to=apicity/gastown.polecat`
3. `in_progress` assigned to `gastown__polecat-su-wisp-hqj070`
4. `gc.session_name=gastown__polecat-su-wisp-hqj070`

Current routed pool checks returned empty after the claim:

```bash
gc bd list --metadata-field gc.routed_to=apicity/gastown.polecat \
  --status=open --json --limit=0
gc bd list --metadata-field gc.routed_to=apicity/gastown.refinery \
  --status=open --json --limit=0
```

Both returned `[]`, so there is no current unclaimed apicity polecat or
refinery queue item hidden from storage-aware queries.

## Merge Path Evidence

Recent closed apicity implementation beads show the direct refinery path to
`main`:

- `ac-rkx2`: branch `polecat/ac-rkx2`, target `main`,
  `merge_result=merged`, `merged_target=main`
- `ac-hgdx`: branch `polecat/ac-hgdx`, target `main`,
  `merge_result=merged`, `merged_target=main`
- `ac-utl8`: branch `polecat/ac-utl8`, target `main`,
  `merge_result=merged`, `merged_target=main`

Convoy-targeted work correctly overrides the default target. For example,
`ac-vyfu.1` merged branch `polecat/ac-vyfu.1` into
`integration/simplefunctions-query-provider`, matching its convoy target
rather than defaulting to `main`.

## Runnable Work Versus Tracker Noise

At the time of verification, `bd ready --json` returned `[]` for current
`ac-*` work after `ac-qwbm` was claimed.

The remaining open `ac-*` beads visible in `gc bd list` were patrol molecules:

- `ac-wisp-kvevw1` (`mol-refinery-patrol`) assigned to
  `apicity/gastown.refinery`
- `ac-wisp-x7x05i` (`mol-witness-patrol`) assigned to
  `apicity/gastown.witness`

Those are agent patrol/control molecules, not standalone implementation work
for the polecat pool. Historical `ac-*` epics and convoys such as `ac-vyfu`
and `ac-frwj` also carry parent/tracker semantics; they are not runnable
standalone work merely because they appear in broad bead lists.

## Conclusion

No apicity repo or city configuration fix is indicated by this audit. The
current path is:

1. `gc sling apicity/gastown.polecat <bead>` sets
   `metadata.gc.routed_to=apicity/gastown.polecat` and leaves assignee empty.
2. `nudge-on-route` wakes warm sessions on `bead.updated`; cold demand is
   handled by the controller scale check for the on-demand polecat pool.
3. The polecat session runs `gc hook --claim --json`, which atomically claims
   one routed work bead and records the concrete session.
4. `mol-polecat-work` pushes `polecat/<bead-id>`, records `metadata.branch`
   and `metadata.target`, clears `gc.routed_to`, and assigns the bead to
   `apicity/gastown.refinery`.
5. The refinery uses branch metadata, defaults missing targets to the rig
   default branch (`main`), merges or publishes according to
   `metadata.merge_strategy`, and closes the work bead.

Manual nudges are expected only as a fallback for warm-idle sessions or event
latency. The installed `nudge-on-route` order is the configured automatic
fallback, and the live `ac-qwbm` claim confirms the current apicity pickup path
is functioning.
