# Releasing `@apicity/*`

Apicity ships 15 scoped npm packages in lockstep — 14 providers under
`packages/provider/*` plus `packages/mcp-server`. All share one version and
one npm dist-tag per release.

## Branch model

| Branch   | Role                                                                   |
| -------- | ---------------------------------------------------------------------- |
| `main`   | Where agents and humans land work. CI runs here on every PR.           |
| `stable` | Release branch. Releases cut from `stable`; `vX.Y.Z` tags pushed here. |

The release flow is: feature work → `main` → fast-forward `stable` → publish.

## Versioning + dist-tags

Pre-1.0 we ship under the `alpha` dist-tag. Order of stability:

```
0.1.0-alpha.N   →  --tag alpha
0.1.0-beta.N    →  --tag beta
0.1.0-rc.N      →  --tag next
0.1.0           →  --tag latest    (first stable)
```

Bump in lockstep across all 15 packages. Don't drift one package's version
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

The formula creates 10 chained beads. An agent (or you, manually) walks them:

1. `load-context` — verify clean working tree, read the release bead
2. `sync-stable` — `git checkout stable && git merge --ff-only origin/main`
3. `preflight-gates` — `pnpm run ci:local` (build + lint + tests)
4. `verify-publish-config` — every package has `publishConfig.access=public` + `LICENSE`
5. `bump-versions` — write `version` to all 15 `package.json`, commit
6. `publish-dry-run` — `pnpm publish --dry-run` and inspect tarballs
7. **`publish`** — `pnpm publish --tag <dist_tag>`. Requires `npm whoami` and 2FA OTP.
8. `tag-and-push` — `git tag v<version>`, push `stable` + tag
9. `smoke-install` — `npm install @apicity/openai@<dist_tag>` in `/tmp` and dynamic-import
10. `close` — close the release bead, `bd remember` the version

## What the formula does NOT do automatically

- **Authenticate to npm.** You must `npm login` before pouring; `npm whoami`
  must return the publishing account. The `publish` step verifies this and
  errors out otherwise.
- **Type the 2FA OTP.** If the publishing account has 2FA enabled (it should),
  pnpm pauses at each package for the OTP. A human must be at the keyboard.
- **Decide divergence resolution.** If `stable` has diverged from `main` so
  the `--ff-only` merge fails, the formula stops and you decide whether to
  rebase, cherry-pick, or abort.

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
