# Releasing `@apicity/*`

Apicity ships public `@apicity/*` workspace packages in lockstep — providers
under `packages/provider/*` plus `packages/mcp-server`. The release workflow
discovers the package set from package manifests so newly added packages ship
with the rest. All releases use one three-part `X.Y.Z` version and publish to
the npm `latest` tag.

## Branch model

| Branch   | Role                                                                   |
| -------- | ---------------------------------------------------------------------- |
| `main`   | Where agents and humans land work. CI runs here on every PR.           |
| `stable` | Release branch. Releases cut from `stable`; `vX.Y.Z` tags pushed here. |

The release flow is: feature work → green `main` tests and CI →
fast-forward `stable` → publish.

`stable` is enforced by the `stable-release-only` GitHub ruleset: all pushes
are rejected except through the release deploy key
(`/gc/.gc/secrets/apicity-stable-deploy-key` on the server) or by a repo
admin. Agent work sessions cannot move `stable` — if a push to `stable` is
rejected, that is working as intended; land the work on `main`.

## Versioning

Use only standard three-part semver versions:

```
0.4.1
0.5.0
1.0.0
```

Bump in lockstep across all public `@apicity/*` packages. Don't drift one
package's version without bumping the rest — the `prepare-release-commit`
step enforces this. Do not use suffix identifiers or alternate npm tags.

## How to release

Releases are driven by the compiler-v2 `mol-apicity-release` Gas City workflow.
The workflow has one executable step that carries
`gc.run_target=apicity/gc.run-operator` by default. The whole release stays in
one run-operator turn so it cannot strand itself between release phases.

### Register or refresh the release pack

The city runs the release formula from a **pack import pinned to one commit of
this repository**, not from the working tree. That pin never moves on its own,
so a city registered once keeps serving the formula as it stood that day. This
went wrong in `ac-1yyttm`: the installed copy was ten days and one merged PR
behind `main` — missing the `check:npm-auth` gate entirely — while
`gc import check` reported `Import state OK` throughout, because it validates
the install against its own lock and never against upstream.

**First registration**, once per city:

```bash
gc import add /gc/apicity --name apicity-release
gc import install
gc reload
```

**Refreshing an existing pin is a different operation**, and neither verb an
operator reaches for first performs it. Both were run against the live stale
city on 2026-08-31:

| Command                                            | What it actually does                                                                                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gc import upgrade apicity-release`                | prints `Upgraded import` and exits **0** while moving only `pin.fetched`. A `sha:` constraint pins exactly, so there is nothing to upgrade within it. The reassuring output is the trap. |
| `gc import add /gc/apicity --name apicity-release` | exits **1** with `import already exists`, with or without `--version`.                                                                                                                   |

What moves the pin is editing the declared version and reinstalling:

```bash
git -C /gc/apicity rev-parse main    # the commit you want the city to serve

# In /gc/pack.toml, under [imports.apicity-release], set:
#   version = "sha:<that commit>"

gc import install
gc reload
```

Then **verify by content, not by exit code**. `gc formula show` proves the
formula loads; it does not prove it is the current one, and `gc import check`
exits 0 against a pin years out of date:

```bash
gc formula show mol-apicity-release   # loads, 2 steps: release, workflow-finalize
pnpm run check:pack-freshness         # exit 0 = the pin equals main

# Byte-level proof. The installed copy is content-addressed, so its directory
# changes every time the pin moves and stale copies linger beside it; the
# digest the city serves must equal the checkout's.
sha256sum .beads/formulas/mol-apicity-release.formula.toml
find /root/.gc/cache/repos -path '*/.beads/formulas/mol-apicity-release.formula.toml' -exec sha256sum {} +
```

**Rollback** if a refresh goes wrong: restore the previous `version` string in
`/gc/pack.toml`, then `gc import install && gc reload`.

### Why the refresh is manual

Refreshing stays a manual step with a loud check, rather than an automatic
one. What was rejected, and why:

- **A post-merge CI job that re-pins and reloads.** GitHub-hosted runners have
  neither the `gc` binary nor access to `/gc`, and giving CI authority to mutate
  city state needs an authorization story this change does not have.
- **A git `post-merge` hook.** `.beads/hooks/post-merge` is beads-managed ("Do
  not remove these markers") and is not installed into `.git/hooks`, which is
  empty — there is no live hook to extend.
- **A hard gate inside `mol-apicity-release` itself.** The stale copy is the one
  that would carry the gate, so it cannot detect its own staleness. This is the
  same reason the defect survived a release.
- **Kept: manual refresh plus a repo-owned check at release preflight.** The
  smallest change consistent with the requirement, granting no new authority,
  and the check lives somewhere it can actually be edited.

### Release preflight

Run both checks before slinging a release. Each is cheap here and expensive
later:

```bash
pnpm run check:npm-auth        # the publish credential
pnpm run check:pack-freshness  # the formula the city will actually run
```

`check:pack-freshness` exit codes:

| Exit | Verdict           | Meaning                                                                                                                                            |
| ---- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | `fresh`           | the pin equals `main`. Verifies the _pin_, not the installed bytes — pair it with `gc import check`, which covers the other half                   |
| 0    | `skipped`         | `gc` is not on `PATH`, so freshness was **not verified**. This is not a pass                                                                       |
| 1    | `stale-content`   | the pin is behind `main` and watched pack content differs: the city is serving behavior this repository has replaced                               |
| 1    | `stale-pin`       | the pin is behind `main` but served content is identical. Re-pin anyway, so the next content change is not withheld                                |
| 1    | `pin-unreachable` | the pinned commit is not in this checkout's history, so freshness could not be decided                                                             |
| 1    | `head-unknown`    | `main` could not be resolved in this checkout, so freshness could not be decided. Prints no `sha:` repair line — there is no commit to re-pin onto |
| 1    | `import-missing`  | no `pack:apicity-release` import exists — register it                                                                                              |
| 2    | —                 | the check itself failed unexpectedly. Also not a pass                                                                                              |

Two of those exit 0 and only one is a pass; a `skipped` run says `NOT verified`
in full. **Do not wire this check into `lint`, `lint:repo`, or `ci:local`** —
GitHub-hosted runners have neither `gc` nor `/gc`, so it would report `skipped`
there forever and buy nothing.

`check:npm-auth`'s exit codes are documented under [Rotating the npm publish
token](#rotating-the-npm-publish-token).

Once preflight is green, start a release from a fresh tracking bead:

```bash
# 1. File a release tracking bead
bd create --title="Release Apicity v0.4.1" --type=task --priority=2
# → returns na-XXX

# 2. Launch the workflow through the control dispatcher
gc sling apicity/core.control-dispatcher mol-apicity-release --formula \
  --var release_bead=na-XXX \
  --var version=0.4.1
```

Do not manually sling child steps.

The single executable formula step runs these release sub-steps in order:

This list is numbered from 1; the formula's own `# Sub-step N` headers are
numbered from 0. They are offset by one — the formula's "Sub-step 6" is item 7
here. Identify a step by name, never by number.

1. Singleton guard — refuse duplicate concurrent releases.
2. `load-context` — verify clean working tree, read the release bead, and run
   `pnpm run check:npm-auth`. A non-zero exit stops the release here, before
   any gate spends time — see [Rotating the npm publish
   token](#rotating-the-npm-publish-token)
3. `verify-main-gates` — on `main`, run `pnpm run test:run`,
   `pnpm run ci:local`, and verify GitHub CI is green for `origin/main`
4. `sync-stable-and-preflight` — fast-forward `stable` from `origin/main`,
   then run `pnpm run ci:local` (build + lint + tests)
5. `prepare-release-commit` — verify every package has
   `publishConfig.access=public` + `LICENSE`, write `version` to all package
   manifests, and commit
6. `publish-dry-run` — `pnpm publish --dry-run` and inspect tarballs; when
   `dry_run=true`, stop here without publishing
7. **`publish`** — `pnpm publish --tag latest` with `NPM_TOKEN` from the
   `apicity` 1Password vault. Re-runs `pnpm run check:npm-auth`, then keeps its
   own `npm whoami` against the temp npmrc that `pnpm publish` actually uses —
   the two checks cover different things and both still run
8. `tag-push-and-github-release` — `git tag v<version>`, push `stable` + tag,
   and create or update the GitHub release page for
   `v<version>` with New and Updated sections from closed bead work since the
   previous release, excluding release workflow noise
9. `sync-main-and-smoke-install` — fast-forward `main` to the release commit,
   push it, then `npm install @apicity/openai@latest` in `/tmp` and
   dynamic-import
10. `close` — close the release bead, `bd remember` the version

## What the formula does NOT do automatically

- **Create or repair npm credentials.** The formula now _detects_ a bad
  publish credential early: `load-context` runs `pnpm run check:npm-auth` and
  stops the release before any gate is spent. It does not repair anything —
  minting and storing a new token is manual. See [Rotating the npm publish
  token](#rotating-the-npm-publish-token).
- **Create or repair GitHub credentials.** The `tag-push-and-github-release`
  step uses `gh auth status` and `gh release`. Authenticate the GitHub CLI
  before continuing if that check fails.
- **Decide divergence resolution.** If `stable` has diverged from `main` before
  release, or if `main` has moved before the post-release fast-forward, the
  formula stops and you decide whether to rebase, cherry-pick, or abort.
- **Refresh its own pack pin.** The formula the city runs is the copy installed
  at the pinned commit, so a formula that has fallen behind cannot notice it has
  — that is exactly how a release ran without the `check:npm-auth` gate that
  `main` already carried. `pnpm run check:pack-freshness` is the outside
  observer; run it at preflight. See [Register or refresh the release
  pack](#register-or-refresh-the-release-pack).

## Rotating the npm publish token

The publishing account is the sole maintainer of `@apicity/openai`, so a dead
token blocks every release.

**Mint a granular access token.** It needs read and write on the `@apicity`
scope. Do _not_ use a legacy classic token — the release flow assumes the
granular `npm_`-prefixed form, and `pnpm run check:npm-auth` reports anything
without that prefix as `secret-malformed`.

**Store it in 1Password, then redeploy so the host picks it up.** There is one
publish credential on this rig, reachable two ways:

- `op://apicity/NPM_TOKEN/password` — authoritative. The formula and
  `check:npm-auth` both read it directly with `op read`.
- the `NPM_TOKEN` environment variable — what manual `npm` calls on the rig
  use, because `/root/.npmrc` holds `_authToken=${NPM_TOKEN}` and npm
  interpolates it at read time.

That environment source is Kamal. `NPM_TOKEN` is an `env.secret: NPM_TOKEN`
entry in the deploy configuration on the deploy host (`config/deploy.yml`),
resolved from the same 1Password item and injected into the container when it
starts. This repository tracks none of that configuration.

**A process environment is fixed at start**, so writing the new token into
1Password does not reach the container that is already running. The tmux server
and every shell and agent session already running under it keep the old value
until the container is **redeployed or restarted**. Do that after storing the
token: a rotation that stops at the 1Password item leaves the host on the dead
credential, and `check:npm-auth` will keep reporting the divergence.

Rotation therefore updates the 1Password item, then redeploys so the
`NPM_TOKEN` environment source re-resolves, and **leaves `/root/.npmrc`
alone**. That file is a template, not a cached credential; rewriting it with a
literal token would put a secret at rest in plaintext for no gain.

Once the container is back, confirm the result with:

```bash
pnpm run check:npm-auth
```

Exit 0 names the authenticated account. Exit 1 (`credential-rejected`) means the
registry is healthy and refused the token. Exit 2 (`registry-unreachable`) means
the check could not reach the registry and proves nothing about the token —
retry rather than rotating. Exit 3/4 mean the secret is missing or malformed.

**If you need a working `npm` before the redeploy lands**, re-read the token
into the shell you are sitting in:

```bash
export NPM_TOKEN="$(op read 'op://apicity/NPM_TOKEN/password')"
```

That affects the current shell only. A new shell, the tmux server, and every
already-running agent session still carry the stale value, so it is a stopgap
for one manual `npm` call and **not a substitute for the redeploy**. Run it
after the confirmation above, not before — exporting first makes
`check:npm-auth` read the fresh value and report no divergence, hiding the very
thing you are checking for.

**Record the expiry date at rotation time**, in the 1Password item. Granular
tokens expire silently: the registry simply starts returning `401`, which is
indistinguishable from a revoked token. The observed history of the token this
check was built for:

| Date       | Observation                                                           |
| ---------- | --------------------------------------------------------------------- |
| 2026-05-31 | 1Password item last updated (token minted)                            |
| 2026-08-25 | still publishing successfully                                         |
| 2026-08-30 | `npm whoami` → `E401`, `npm ping` → `PONG` (registry healthy)         |
| 2026-08-30 | rotated in 1Password; container predates it, so `$NPM_TOKEN` is stale |
| 2026-08-31 | `check:npm-auth` exits 0, warns `$NPM_TOKEN` differs from 1Password   |

That is consistent with a ~90-day granular-token lifetime and no notification.

**Then re-pour the release:**

```bash
gc sling apicity/core.control-dispatcher mol-apicity-release --formula \
  --var release_bead=ac-vfz4u4 --var version=0.11.1
```

### `check:op` does not cover this token

`pnpm run check:op` validates `.env`, and `NPM_TOKEN` has no `.env` assignment,
so `scripts/check-op.mjs` never inspects it. A green `check:op` says nothing
about publish rights. `pnpm run check:npm-auth` is the publish-credential gate.

Keeping `NPM_TOKEN` out of `.env` is **deliberate**: `.env` is what recording
sessions load through `op run`, and a recording session must never hold publish
rights. Do not add it.

### A note on refreshing `/root/.npmrc`

The requirement that drove this work asked for `/root/.npmrc` to be "refreshed
from that same value" on rotation. It is deliberately not done, because the file
already resolves to whatever `NPM_TOKEN` holds, which is the authoritative
token once the container has been redeployed (above) — writing a literal secret
into it would store a credential in plaintext on the host and gain nothing. The
intent (one credential store to rotate, nothing at rest in plaintext) is met;
the literal wording is not. Until the redeploy lands, the running container
still carries the old value, and the per-shell `export` above is the stopgap for
that window — not a literal token in the file.

## Dry-run

Set `--var dry_run=true` to walk the formula through `publish-dry-run` and
stop. No real publish, no git tag, no push. Useful for testing the formula
itself or for sanity-checking tarball contents on a feature branch.

```bash
gc sling apicity/core.control-dispatcher mol-apicity-release --formula \
  --var release_bead=na-XXX \
  --var version=0.4.1 \
  --var dry_run=true
```

## Recovering from a partial publish

`pnpm -r publish` is not atomic. If publish fails partway (network blip,
expired OTP), some packages may already be live. npm rejects re-publishing
the same version, so simply retrying `pnpm publish --tag latest` is
safe — it'll skip the already-published packages and try the rest.

If a published version is broken, `npm deprecate @apicity/<pkg>@<version>
"reason"` from the publishing account. Within 72h of publish you can
`npm unpublish` instead, but deprecate is preferred for any version
consumers might already have installed.
