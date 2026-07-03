# 門市團購 APP

門市團購是一個以 Next.js 14 建置的團購電商平台，支援團購活動、直播帶貨、分享分潤與管理後台。介面採用繁體中文，行動裝置優先設計。

## 功能特色

- **團購商城**：商品瀏覽、購物車、結帳、付款回報
- **團購活動**：限時團購、特價商品
- **直播帶貨**：直播專區與影音內容
- **分享分潤**：推薦碼、分享連結追蹤、多層分潤計算
- **麵包小怪獸**：購後分享小遊戲，餵食小怪獸解鎖獎勵（`/monster`）
- **管理後台**：商品、訂單、付款、分潤規則與紀錄管理

## 技術棧

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL)

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

複製 `.env.example` 為 `.env.local` 並填入 Supabase 專案資訊：

```bash
cp .env.example .env.local
```

若未設定 Supabase（或仍為 placeholder 值），應用程式會自動使用內建 mock 資料運作，方便本地預覽。

### 3. 資料庫遷移

```bash
# 使用 Supabase CLI
supabase db push
```

或手動執行 `supabase/migrations/` 中的 SQL 檔案。

## Supabase SQL Editor 設定

1. 登入 Supabase Dashboard → SQL Editor
2. 貼上 `supabase/complete-schema.sql` 全部內容
3. 點擊 Run
4. （選用）執行 `supabase/seed-data.sql` 建立範例資料

> **注意**：`complete-schema.sql` 採全新安裝模式，會刪除並重建所有業務資料表，僅適用於新專案或開發環境重置。已有正式資料的專案請改用 `supabase/migrations/` 增量遷移。

### 4. 種子資料（選用）

```bash
npm run seed
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看前台，管理後台位於 `/admin`。

正式部署請見 **[部署指南](docs/APP-DEPLOYMENT-GUIDE.md)**。

## 後台管理

從零建立後台（資料庫、環境變數、管理員帳號、初始設定）請見 **[後台建立流程](docs/ADMIN-SETUP-FLOW.md)**。功能與日常操作說明見 [後台管理指南](docs/ADMIN-GUIDE.md)。

## 專案結構

```
src/
├── app/              # Next.js 頁面與 API 路由
│   ├── (main)/       # 前台頁面（含底部導覽）
│   ├── admin/        # 管理後台
│   ├── auth/         # 登入/註冊
│   └── api/          # REST API
├── components/       # UI 與版面元件
├── lib/              # 工具、認證、服務
│   └── services/     # 訂單、分潤業務邏輯
└── hooks/            # React Hooks
```

## 分潤歸因優先序

1. 結帳推薦碼
2. 最後點擊的分享連結
3. 註冊推薦人
4. 直播來源
5. 手動指定

## 授權

私有專案
