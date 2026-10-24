# Fork notes

This fork uses **Yarn 4 (Berry)** with `nodeLinker: node-modules`, not pnpm.
PnP is intentionally off: Next.js `output: "standalone"` tracing, `sharp` and
`@takumi-rs/core` native binaries break under PnP.

- Setup: `corepack enable && yarn install`
- Dev: `yarn dev` (`PORT=8000 yarn dev` behind the Cloudflare Tunnel)
- `README.md` / `CONTRIBUTING.md` still say `pnpm`; they are upstream files and
  left untouched to avoid merge conflicts. Substitute `yarn`.
- `release:*` scripts and `.github/workflows/release.yml` are upstream-only and
  not used here (the release workflow is disabled with `if: false`). Yarn 4's
  `yarn version` does not accept `-m`, so the `release:*` scripts won't work as-is.

## Syncing with upstream

```bash
git fetch upstream
git merge upstream/main
# expected conflicts: package.json, Dockerfile, .github/workflows/*, scripts/*
# lockfile: delete pnpm-lock.yaml if upstream brings it back, then `yarn install`
# run any new migrations on Supabase
yarn build
git push origin main
```
