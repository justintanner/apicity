# Releasing `@apicity/*`

Apicity ships 18 scoped npm packages in lockstep — 17 providers under
`packages/provider/*` plus `packages/mcp-server`. All share one version and
one npm dist-tag per release.

## Branch model

| Branch   | Role                                                                   |
| -------- | ---------------------------------------------------------------------- |
| `main`   | Where agents and humans land work. CI runs here on every PR.           |
| `stable` | Release branch. Releases cut from `stable`; `vX.Y.Z` tags pushed here. |

The release flow is: feature work → `main` → fast-forward `stable` → publish.

## Versioning + dist-tags

Prereleases ship under prerelease dist-tags. Stable releases ship under
`latest`. Order of stability:

```
0.1.0-alpha.N   →  --tag alpha
0.1.0-beta.N    →  --tag beta
0.1.0-rc.N      →  --tag next
0.1.0           →  --tag latest    (first stable)
```

Bump in lockstep across all 18 packages. Don't drift one package's version
without bumping the rest — the formula's `bump-versions` step enforces this.

## How to release

Releases are driven by the `mol-apicity-release` bd formula. Pour it into a
fresh tracking bead:

```bash
# 1. File a release tracking bead
bd create --title="Release @apicity/* v0.1.0-alpha.N" --type=task --priority=2
# → returns na-XXX

# 2. Pour the formula
bd mol pour mol-apicity-release \
  --var release_bead=na-XXX \
  --var version=0.1.0-alpha.N \
  --var dist_tag=alpha
```

The formula creates 12 chained beads. An agent (or you, manually) walks them:

1. `load-context` — verify clean working tree, read the release bead
2. `sync-stable` — `git checkout stable && git merge --ff-only origin/main`
3. `preflight-gates` — `pnpm run ci:local` (build + lint + tests)
4. `verify-publish-config` — every package has `publishConfig.access=public` + `LICENSE`
5. `bump-versions` — write `version` to all 18 `package.json`, commit
6. `publish-dry-run` — `pnpm publish --dry-run` and inspect tarballs
7. **`publish`** — `pnpm publish --tag <dist_tag>` with `NPM_TOKEN` from the `apicity` 1Password vault
8. `tag-and-push` — `git tag v<version>`, push `stable` + tag
9. `update-github-release` — create or update the GitHub release page for `v<version>`
10. `sync-main-release` — fast-forward `main` to the release commit and push it
11. `smoke-install` — `npm install @apicity/openai@<dist_tag>` in `/tmp` and dynamic-import
12. `close` — close the release bead, `bd remember` the version

## What the formula does NOT do automatically

- **Create or repair npm credentials.** The `publish` step reads
  `op://apicity/NPM_TOKEN/password` and verifies it with `npm whoami`. If
  1Password access is unavailable or the token lacks publish rights, fix that
  before continuing.
- **Create or repair GitHub credentials.** The `update-github-release` step
  uses `gh auth status` and `gh release`. Authenticate the GitHub CLI before
  continuing if that check fails.
- **Decide divergence resolution.** If `stable` has diverged from `main` before
  release, or if `main` has moved before the post-release fast-forward, the
  formula stops and you decide whether to rebase, cherry-pick, or abort.

## Dry-run

Set `--var dry_run=true` to walk the formula through `publish-dry-run` and
stop. No real publish, no git tag, no push. Useful for testing the formula
itself or for sanity-checking tarball contents on a feature branch.

```bash
bd mol pour mol-apicity-release \
  --var release_bead=na-XXX \
  --var version=0.1.0-alpha.999 \
  --var dist_tag=alpha \
  --var dry_run=true
```

## Recovering from a partial publish

`pnpm -r publish` is not atomic. If publish fails partway (network blip,
expired OTP), some packages may already be live. npm rejects re-publishing
the same version, so simply retrying `pnpm publish --tag <dist_tag>` is
safe — it'll skip the already-published packages and try the rest.

If a published version is broken, `npm deprecate @apicity/<pkg>@<version>
"reason"` from the publishing account. Within 72h of publish you can
`npm unpublish` instead, but deprecate is preferred for any version
consumers might already have installed.
