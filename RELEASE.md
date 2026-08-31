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

Register the Apicity release pack with the city once per checkout/update:

```bash
gc import add /gc/apicity --name apicity-release
gc import install
gc reload
gc formula show mol-apicity-release
```

Start a release from a fresh tracking bead:

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

Rotation therefore updates the 1Password item and the `NPM_TOKEN` environment
source, and **leaves `/root/.npmrc` alone**. That file is a template, not a
cached credential; rewriting it with a literal token would put a secret at rest
in plaintext for no gain.

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
already resolves to the authoritative token through `${NPM_TOKEN}` — writing a
literal secret into it would store a credential in plaintext on the host and
gain nothing. The intent (no stale credential reachable from the host) is met;
the literal wording is not.

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
