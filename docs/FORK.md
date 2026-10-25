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
`0023_footer_date_format_dmy.sql` (allows the date format patterns such as
`DD-MMM-YYYY`; run it after 0022, safe to re-run). Run each once on Supabase (SQL Editor, paste the file). Until then the code treats the
columns as missing, so the footer is simply off; only saving the footer
settings fails.

- The strip is drawn by the server, so recipes render with less height (34px on
  800x480). Recipes pick their layout from the size they are given.
- The image URL carries `access_token` when the footer is on, because the
  server's own precache fetch sends no headers.
- Battery is the same linear voltage estimate as the dashboard
  (`estimateBatteryLife`), shown with two decimals. A calendar icon sits before
  the date and a four-segment battery icon before the level.
- Web previews (device edit, playlist) have no device identity, so they do not
  show the footer.

### weather-yin picks its place from the device timezone

No free-text location (it was easy to mistype, and Open-Meteo's geocoder does
not know districts such as North York). `/api/bitmap/*` resolves the device
from `access_token`, passes its timezone to `getData(params, { deviceTimezone })`,
and `weather-yin` uses the matching city from `lib/geo/timezone-location.ts`
(one entry per timezone in `utils/helpers.ts`). Optional latitude and longitude
override it. Web previews have no device, so they use the default city
(Toronto).

### Fork-only recipes and writing recipes here

Fork recipes: `ttc-arrivals`, `weather-yin`, `year-progress` (year dot grid plus the
next public holidays for a province, from Nager.Date).
Each adapts to the four mixup slot shapes through `lib/trmnl/slot-kind.ts`
(full, half, banner, quarter). `getData(params, { deviceTimezone })` gets the
device timezone when the image is fetched by a device (not in web previews).

Font gotcha: `utils/pre-satori.tsx` gives every element a default pixel font
(`blockkie`) unless its `className` has a `font-*` class, and it injects that
into `style` too. Use `className="font-inter"` (or `font-interBold` for the
real bold cut) on text elements, and when a wrapper component spreads a `style`
prop, set `fontFamily` after the spread.

## Deploying to Cloud Run

`.github/workflows/deploy-prod.yaml` runs on push to the `prod` branch (or by hand): `test` (lint, typecheck, jest) -> `migrate` (`node scripts/migrate.js`) -> `deploy` (docker build, push to Artifact Registry, Cloud Run). Secrets come from 1Password (`1password/load-secrets-action`); GCP login uses Workload Identity Federation. Only `OP_SERVICE_ACCOUNT_TOKEN` is a GitHub secret.

- Project `my-side-projects-462703`, region `us-east4` (next to the Supabase `us-east-1` pooler), Artifact Registry repo `byos`, service `byos-next`, public URL `https://byos.iamyin.me`.
- 1Password item `BYOS-next` (vault `7bp5z4r2xyzha6aactkrobqxye`, dedicated to this repo, with its own read-only service account) needs: `DATABASE_URL` (Supabase **Session pooler**, port 5432), `BETTER_AUTH_SECRET`, `WIF_PROVIDER`, `GCP_DEPLOY_SA_EMAIL`, `GCP_RUNTIME_SA_EMAIL`.
- The Dockerfile's default target is a Node-only image (Takumi/Satori renderers, no Chrome) plus `fonts-liberation`: sharp draws the SVG text of the claim-code/error screens with system fonts, and without any every glyph is an empty box. Use `--target runner-browser` for `REACT_RENDERER=browser`.
- `scripts/migrate.js` applies `migrations/*.sql` in order and records them in `schema_migrations` with the same names/checksums as the in-app Initialize button. A migration that was run by hand but never recorded would be applied again, so check the ledger before the first run.
- `yarn.lock` must be produced by the pinned Yarn (`packageManager` in `package.json`, via `corepack enable`); a different Yarn rewrites the `resolve` patch hash and `yarn install --immutable` fails in Docker/CI.
- The Cloud Run service is public (devices call `/api/setup`, `/api/display`, `/api/bitmap/*`, `/api/log` without a browser session); the dashboard is protected by Better Auth (`AUTH_ENABLED=true`).

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
