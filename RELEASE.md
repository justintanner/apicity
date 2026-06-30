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
`gc.run_target=apicity/gastown.polecat` by default. The whole release stays in
one polecat turn so it cannot strand itself between prepare and publish
handoffs.

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

1. Singleton guard — refuse duplicate concurrent releases.
2. `load-context` — verify clean working tree, read the release bead.
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
   `apicity` 1Password vault
8. `tag-push-and-github-release` — `git tag v<version>`, push `stable` + tag,
   and create or update the GitHub release page for
   `v<version>` with a flat Summary list of closed bead work since the
   previous release, excluding release workflow noise
9. `sync-main-and-smoke-install` — fast-forward `main` to the release commit,
   push it, then `npm install @apicity/openai@latest` in `/tmp` and
   dynamic-import
10. `close` — close the release bead, `bd remember` the version

## What the formula does NOT do automatically

- **Create or repair npm credentials.** The `publish` step reads
  `op://apicity/NPM_TOKEN/password` and verifies it with `npm whoami`. If
  1Password access is unavailable or the token lacks publish rights, fix that
  before continuing.
- **Create or repair GitHub credentials.** The `tag-push-and-github-release`
  step uses `gh auth status` and `gh release`. Authenticate the GitHub CLI
  before continuing if that check fails.
- **Decide divergence resolution.** If `stable` has diverged from `main` before
  release, or if `main` has moved before the post-release fast-forward, the
  formula stops and you decide whether to rebase, cherry-pick, or abort.

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
