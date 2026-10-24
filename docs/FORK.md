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

## Local dev behind Cloudflare Tunnel

```bash
PORT=8000 yarn dev          # Next.js dev server
cloudflared tunnel run dev  # dev.iamyin.me -> http://localhost:8000
```

- `.env.local` needs `BETTER_AUTH_URL=https://dev.iamyin.me`. If it is empty the
  base URL falls back to `http://localhost:3000` and sign-up fails with
  `Invalid origin`. Always open the app via `https://dev.iamyin.me`.
- `DATABASE_URL` must be the Supabase **Session pooler** (port 5432); the app
  uses `SET ROLE byos_app`, which breaks under the transaction pooler.
- Cloudflare Bot Fight Mode / managed challenges block devices (they cannot
  solve a JS challenge). Skip them for `/api/setup`, `/api/display`,
  `/api/bitmap/*` and `/api/log`.
- The Mac must stay awake, with both processes running, for the device to fetch
  screens.

## Database role hardening

Migration `0009_add_user_tenancy.sql` creates `byos_app` as
`LOGIN PASSWORD 'byos_app_password'`, a password that is public in the repo.
The app never logs in as `byos_app`: it connects as `postgres` and runs
`SET ROLE byos_app` per query so RLS applies (`lib/database/scoped-db.ts`).
The login password is therefore unused, but anyone who knows the database
host and project ref could sign in with it.

Run once on Supabase (SQL Editor), applied 2026-10-24:

```sql
ALTER ROLE byos_app NOLOGIN;
```

`SET ROLE byos_app` keeps working because it only needs membership in the role,
not the right to log in. Check with:

```sql
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'byos_app';  -- f
```

Re-running the migrations (or the in-app Initialize button) only creates the
role when it is missing (`IF NOT EXISTS`), so this setting is not undone. If
you ever recreate the database, run the `ALTER ROLE` again.

## Fork-only code changes

### `/api/setup` issues a key to unowned devices

File: `app/api/setup/route.ts` (+ `route.test.ts`).

Upstream returns 403 from `/api/setup` when `AUTH_ENABLED=true` and the request
has no session or known API key. Stock firmware calls `/api/setup` first with no
credentials, so a new device never reaches `/api/display`, never shows its
claim code, and stays on the "connect to TRMNL wifi" screen.

Fork behaviour: with no owner, respond 200 with an API key (the device's own
`Access-Token` if sent, otherwise a generated one) and write nothing to the
database. The device then calls `/api/display`, shows a claim code, and the
owner claims it in the dashboard, which creates the device row.

Not reported upstream as of 2026-10-24 (no matching issue or PR). When syncing,
check whether upstream fixed it; if so, drop this change.

Known gap: if an already-claimed device is factory-reset, it gets a new key and
claim code, and claiming it again fails on the `devices.mac_address` UNIQUE
constraint.

### Mixup as a playlist frame

A playlist frame stores a mixup in `playlist_items.screen_id` as `mixup/<id>`
(no schema change). Helpers: `lib/playlists/screen-ref.ts`. `/api/display`
builds the mixup image URL with the device `access_token`, and
`/api/bitmap/mixup/[id]` accepts a device only for the mixup assigned to it or
one that is an item of its own playlist (`lib/device/mixup-access.ts`).

### Global footer

Per-device strip under every screen: date left, fixed text in the middle,
battery right. Off by default. Code: `lib/footer/*`, applied in
`renderRecipeForDevice` and `/api/bitmap/mixup/[id]`; settings are in the
device edit page, Content tab.

Needs migrations `0022_add_global_footer.sql` (four `devices` columns) and
`0023_footer_date_format_dmy.sql` (allows the `24-Oct-2026` format; run it after
0022). Run each once on Supabase (SQL Editor, paste the file). Until then the code treats the
columns as missing, so the footer is simply off; only saving the footer
settings fails.

- The strip is drawn by the server, so recipes render with less height (34px on
  800x480). Recipes pick their layout from the size they are given.
- The image URL carries `access_token` when the footer is on, because the
  server's own precache fetch sends no headers.
- Battery is a linear voltage estimate rounded to 5% so the strip rarely
  changes (a changed pixel costs a partial refresh). A calendar icon sits before
  the date and a four-segment battery icon before the level.
- Web previews (device edit, playlist) have no device identity, so they do not
  show the footer.

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
