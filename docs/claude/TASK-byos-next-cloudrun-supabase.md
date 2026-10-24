# TASK: BYOS Next.js (TRMNL server)：轉 Yarn + 本地 dev 經 Cloudflare Tunnel + Supabase

## 背景

- 硬件：Seeed TRMNL 7.5" (OG) DIY Kit（XIAO ESP32-S3 Plus，800×480 1-bit），行 TRMNL 官方 firmware，Captive Portal 支援「Custom Server」
- 目標：自己 host TRMNL BYOS server，唔用 TRMNL 官方雲（唔買 BYOD license）
- 揀咗 `usetrmnl/byos_next`（MIT，Next.js 16 + React 19 + Tailwind v4 + Postgres），**唔用 Inker**（只支援 SQLite + 本地檔案）
- 之後會有第二部機（女朋友），靠 Better Auth 帳號系統分開
- **唔用 Cloudflare Workers**：render pipeline 靠 `sharp`、`@takumi-rs/core`（native），`lib/fonts.ts` 用 `fs`。唔好再試

## 現況（已完成）

- Fork：`lo2003058/byos_next`，本地 clone 喺 `~/p/my_project/byos_next`
- Remote：
  - `origin` = `git@p-github.com:lo2003058/byos_next.git`（SSH alias `p-github.com`，個人帳號，經 1Password agent）
  - `upstream` = `https://github.com/usetrmnl/byos_next.git`
- `git config user.email` 已設做 `lo2003058@gmail.com`
- Cloudflare Tunnel 已開：名 `dev`，UUID `409e1dac-0d66-4eab-aa08-8d580619eafe`
  - `~/.cloudflared/config.yml`：`dev.iamyin.me` → `http://localhost:8000`
  - DNS `dev.iamyin.me` 已 route 去 tunnel
- Supabase project 已開（region ca-central-1），Data API / auto-expose / automatic RLS **全部熄咗**

## 目標架構（今個階段）

```
TRMNL device ──HTTPS──▶ dev.iamyin.me (Cloudflare Tunnel)
                              │
                              ▼
                   Mac: Next.js dev server :8000
                              │
                              ▼
                   Supabase Postgres (Session pooler :5432)
```

- Renderer：`REACT_RENDERER=takumi`
- Auth：`AUTH_ENABLED=true`

## Hard constraints

1. **唔好改 render pipeline**（`lib/render/*`、`lib/recipes/render/*`）。要改先問我
2. **唔好 commit 任何 secret**：`.env*`、`DATABASE_URL`、`BETTER_AUTH_SECRET`。每次 commit 前 `git status` 確認
3. **唔好 push 去 upstream**。第一步執行：`git remote set-url --push upstream DISABLED`
4. 同上游要 sync 得到：除咗 Step 1 嘅 Yarn 轉換，其他改動盡量**加新檔**，少改上游檔案
5. 每步完成要實際驗證（跑指令睇輸出），唔好估。Claude Code 睇唔到實體塊屏，涉及塊屏嘅步驟寫低等我做
6. Node 版本跟 `.nvmrc`（22.22.3）

## Step 1：pnpm 轉 Yarn

> ⚠️ 已知代價：以下全部係上游檔案，之後每次 `git merge upstream/main` 都有機會 conflict，lockfile 要重新生成。所以**成個轉換做一個獨立 commit**，message 寫明 `chore: switch package manager from pnpm to yarn (fork-only)`，方便日後處理 conflict。

用 **Yarn 4（Berry）+ `nodeLinker: node-modules`**。唔好用 PnP：Next.js `output: "standalone"` 嘅 file tracing、`sharp` native binary、Takumi 喺 PnP 下會出事。

### 1.1 安裝

```bash
corepack enable
corepack use yarn@4    # 會寫入 package.json 嘅 packageManager
```

建立 `.yarnrc.yml`：

```yaml
nodeLinker: node-modules
enableTelemetry: false
```

### 1.2 改檔（逐個改，全部要改晒）

| 檔案 | 改咩 |
|---|---|
| `package.json` → `packageManager` | 由 `pnpm@11.8.0+sha512...` 改成 corepack 寫入嘅 `yarn@4.x.x` |
| `package.json` → `engines` | 刪 `"pnpm": "11.8.0"`，保留 `node` |
| `package.json` → `scripts` | 所有 `pnpm <script>` 改 `yarn <script>`（`generate:sql`、`prebuild`、`dev`、`release:*`）。`pnpm version` 改 `yarn version`，留意 Yarn 4 語法唔同，release scripts 可以標註「fork 唔用」 |
| `pnpm-workspace.yaml` | 刪除。佢入面嘅 `onlyBuiltDependencies` / `allowBuilds`（`@biomejs/biome`、`@tailwindcss/oxide`、`msw`、`sharp`、`unrs-resolver`）係 pnpm 嘅 build script 白名單；Yarn 4 預設會跑 build scripts，確認 `enableScripts` 冇被設做 `false` 即可 |
| `pnpm-lock.yaml` | 刪除，由 `yarn install` 生成 `yarn.lock` |
| `Dockerfile` | `corepack prepare pnpm@...` 改 `corepack enable`（用 packageManager 欄位）；`COPY package.json pnpm-lock.yaml pnpm-workspace.yaml` 改 `COPY package.json yarn.lock .yarnrc.yml`；`pnpm install --frozen-lockfile --prod=false` 改 `yarn install --immutable`；`pnpm run build` 改 `yarn build`；清 cache 嘅路徑改 Yarn 嘅 |
| `.github/workflows/ci.yml`、`release.yml` | pnpm setup action 同指令改 Yarn。如果 release workflow 係上游發版用，fork 入面直接 disable（加 `if: false` 或刪咗），唔好亂發版 |
| `scripts/generate-sql-statements.js`、`scripts/generate-recipes-index.mjs` | 搵入面 call `pnpm` 嘅地方改 `yarn` |
| `.gitignore` | 加 Yarn 4 嘅：`.yarn/*`、`!.yarn/patches`、`!.yarn/plugins`、`!.yarn/releases`、`!.yarn/sdks`、`!.yarn/versions`、`.pnp.*` |

`README.md`、`CONTRIBUTING.md` 入面嘅 pnpm 指令**唔好改**（上游文件，改咗徒增 conflict）。改為新增 `docs/FORK.md` 寫明 fork 用 Yarn。

### 1.3 驗證

```bash
rm -rf node_modules
yarn install
grep -rn "pnpm" package.json Dockerfile .github scripts    # 應該冇結果（README/CONTRIBUTING 除外）
yarn lint
yarn typecheck
yarn build
node -e "require('sharp')" && echo sharp OK
```

全部過先 commit。

## Step 2：`.env.local`

```bash
cp .env.example .env.local
```

改呢幾行，其他保留預設：

```bash
DATABASE_URL=<Supabase Session pooler 連線字串>?sslmode=require
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://dev.iamyin.me
AUTH_ENABLED=true
REACT_RENDERER=takumi
NODE_ENV=development
```

- `DATABASE_URL` 我會自己填（Supabase → Connect → **Session pooler**，port 5432）。**唔好用** Direct connection（IPv6 only）或 Transaction pooler 6543（app 用 `SET ROLE byos_app` 做 RLS，transaction mode 會亂）
- 密碼有特殊字元要 URL encode
- 確認 `.env.local` 喺 `.gitignore`

## Step 3：喺 8000 起 dev server

```bash
PORT=8000 yarn dev
```

另一個 terminal：

```bash
cloudflared tunnel run dev
```

驗證：

```bash
curl -sI http://localhost:8000 | head -1
curl -sI https://dev.iamyin.me | head -1
```

如果經 tunnel 開 dashboard 但 UI 唔郁（HMR / dev 資源被擋），`next.config.ts` 加 `allowedDevOrigins: ["dev.iamyin.me"]`。呢個係改上游檔案，改嘅話單獨 commit 並寫明原因。

## Step 4：初始化 DB

1. 開 `https://dev.iamyin.me/setup`，撳 **Initialize**，按次序跑 `migrations/`
2. 開第一個帳號（自動 admin）
3. Supabase Table Editor 確認有 `devices`、`playlists` 等 table

⚠️ `0009_add_user_tenancy.sql`：
- 會 `CREATE ROLE byos_app ... PASSWORD 'byos_app_password'`。完成後喺 Supabase SQL Editor 跑：`ALTER ROLE byos_app WITH PASSWORD '<新長密碼>';`（app 用 `postgres` 連線再 `SET ROLE`，唔會用呢個密碼登入）
- `GRANT byos_app TO CURRENT_USER` 理論上 portable。如果報 permission / superuser 錯誤，**記錄完整 error 再問我，唔好自己改 migration**

## Step 5：驗證 device API

```bash
curl -s https://dev.iamyin.me/api/setup -H "ID: AA:BB:CC:DD:EE:FF"
curl -s https://dev.iamyin.me/api/display -H "ID: AA:BB:CC:DD:EE:FF" -H "Access-Token: <api_key>"
```

- `/api/display` 嘅 `image_url` 必須係 `https://dev.iamyin.me/api/bitmap/...`（app 用 `X-Forwarded-Proto` + `X-Forwarded-Host` 砌，見 `lib/device/request-headers.ts`）。如果變咗 `http://` 或 `localhost`，報告我
- 開 `image_url`，要係 800×480 PNG
- 測試完喺 dashboard 刪咗呢部假 device

## Step 6：接塊屏（我自己做，你寫低步驟）

1. 塊屏插 USB-C，長按 **KEY3** 5 秒入配對模式
2. 手機連 `TRMNL` 熱點 → 揀 Wi-Fi → **Advanced → Custom Server → Yes**
3. 填 `https://dev.iamyin.me`（冇尾 `/`）
4. Dashboard Devices 頁認領，指派 playlist

## Step 7：`docs/FORK.md`（新檔）

記錄：
- 呢個 fork 用 Yarn 4（node-modules linker），唔係 pnpm
- 本地 dev：`PORT=8000 yarn dev` + `cloudflared tunnel run dev`
- 上游 sync 流程：

```bash
git fetch upstream
git merge upstream/main
# 預期 conflict：package.json、Dockerfile、.github/workflows/*、scripts/*
# lockfile：刪 pnpm-lock.yaml（如上游帶返嚟），再 yarn install 重新生成 yarn.lock
# 有新 migration 要喺 Supabase 跑
yarn build
git push origin main
```

## 之後先做（今次唔使）

- 搬上 Cloud Run（northamerica-northeast2，port 3000，`--set-secrets`，`BETTER_AUTH_URL` 改正式 URL，Workload Identity Federation 做 CI）
- 自訂 recipe：TTC 到站（GTFS-RT，參考 `lucasygu/ttc-cli`）、Spotify 統計（OAuth 放 server）
- 按時段變 `refresh_rate`
- 第二部機 + 第二個帳號
- Cloudflare Access 保護 dashboard，Bypass：`/api/setup`、`/api/display`、`/api/bitmap/*`、`/api/log`

## 交付

- 每個 Step 嘅驗證結果（指令 + 輸出）
- Step 1 改咗邊啲檔，逐個列出
- 遇到嘅問題同解決方法
- 未解決 / 要我決定嘅嘢列清楚
