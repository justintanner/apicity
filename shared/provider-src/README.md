# Shared Provider Source

This directory contains canonical provider helper source that is vendored into
standalone provider packages.

Vendored copies are checked into each provider so published packages remain
self-contained. Edit the canonical file here, then run:

```bash
pnpm run gen:shared
```

Use the check mode in CI and local lint gates:

```bash
pnpm run gen:shared:check
```

The sync manifest lives at `scripts/lib/shared-src-manifest.mjs`.
