# Supabase SQL 安裝指南

本目錄包含門市團購 APP 的資料庫 Schema、種子資料與增量遷移檔。請依下列步驟在 **Supabase Dashboard → SQL Editor** 執行。

> 後台操作說明請見 [`docs/ADMIN-GUIDE.md`](../docs/ADMIN-GUIDE.md)

---

## 快速開始（三步驟）

### 步驟 1：執行完整 Schema

1. 開啟專案中的 [`complete-schema.sql`](./complete-schema.sql)
2. 複製全部內容，貼到 Supabase SQL Editor
3. 點擊 **Run**

此步驟會建立所有資料表、ENUM 型別、索引、觸發器、RLS 政策與 Storage 儲存桶。

### 步驟 2：執行種子資料（選用）

1. 開啟 [`seed-data.sql`](./seed-data.sql)
2. 複製全部內容，貼到 SQL Editor 並 **Run**

種子資料包含範例門市、商品分類（食品、烘焙材料、冷凍商品、生活用品、保健品）、商品、團購活動（含首頁輪播橫幅）、影音、直播與分潤規則。所有 `INSERT` 使用 `ON CONFLICT DO NOTHING`，可重複執行。

> **注意：** 種子資料不含 `profiles`。請先透過 Supabase Auth 註冊使用者，`handle_new_user` 觸發器會自動建立 profile 與購物車。

### 步驟 3：設定管理員

註冊完成後，擇一方式將帳號設為管理員：

**方式 A — SQL Editor：**

```sql
UPDATE profiles SET role = 'admin' WHERE email = '你的@email.com';
```

**方式 B — 本機腳本：**

```bash
# .env.local 需有 SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAIL=你的@email.com npm run set-admin
```

設定完成後，以該帳號登入 `/auth/login`，即可進入 [`/admin`](../docs/ADMIN-GUIDE.md) 後台。

---

## ⚠️ 重要警告

`complete-schema.sql` 開頭包含 **DROP CASCADE**，會刪除 public schema 內所有業務資料表、型別、函式與相關政策後重建。

| 適用情境 | 不適用情境 |
|---------|-----------|
| 全新 Supabase 專案 | 已有正式資料的生產環境 |
| 開發／測試環境重置 | 僅需新增欄位或小幅變更 |

若專案已有資料，請改用 `supabase/migrations/` 內的增量遷移檔，**勿**執行 `complete-schema.sql`。

---

## 檔案說明

| 檔案 | 用途 |
|------|------|
| [`complete-schema.sql`](./complete-schema.sql) | **完整 Schema（一鍵全新安裝）**。含 DROP CASCADE、30 張資料表、ENUM、RLS、Storage 政策、`profiles.store_credit_balance` 等最新欄位。 |
| [`seed-data.sql`](./seed-data.sql) | **範例種子資料**。門市、分類、商品、團購（含輪播橫幅）、影音、直播、分潤規則。無 DROP，可重複執行。 |
| [`ALL-IN-ONE.sql`](./ALL-IN-ONE.sql) | **合併版**：區段 1 = Schema，區段 2 = 種子資料。適合開發環境一次執行。 |
| [`migrations/`](./migrations/) | **增量遷移**（Supabase CLI / 正式環境）。依時間戳記順序套用，不會 DROP 既有資料。 |
| [`docs/ADMIN-GUIDE.md`](../docs/ADMIN-GUIDE.md) | **後台管理系統指南**（繁體中文）。模組說明、操作流程、權限矩陣。 |

### migrations/ 內容

| 檔案 | 說明 |
|------|------|
| `20240629000001_initial_schema.sql` | 早期初始 Schema（歷史版本，已由 complete-schema 取代） |
| `20250629000000_initial_schema.sql` | 中期初始 Schema（歷史版本） |
| `20250630000000_add_store_credit_balance.sql` | 為 `profiles` 新增 `store_credit_balance` 欄位 |
| `20250630100000_sync_schema.sql` | **同步修補**：補齊舊庫缺少的欄位與 ENUM 值（可重複執行） |

---

## 執行順序總覽

### 全新專案

```
1. complete-schema.sql     → 建立資料庫結構
2. seed-data.sql           → （選用）插入範例資料
3. UPDATE profiles ...     → 設定管理員角色
```

或使用 `ALL-IN-ONE.sql` 一次完成步驟 1 + 2，再執行步驟 3。

### 既有專案（增量升級）

```
1. 20250630000000_add_store_credit_balance.sql  （若尚未執行）
2. 20250630100000_sync_schema.sql
3. UPDATE profiles SET role = 'admin' WHERE ...
```

---

## Schema 涵蓋範圍

- **擴充套件**：`uuid-ossp`、`pgcrypto`
- **30 張資料表**：profiles、stores、products、orders、commission_*、support_* 等
- **profiles 欄位**：含 `store_credit_balance`（儲值金餘額，預設 0）
- **首頁分類**：`product_categories`（食品、烘焙材料、冷凍商品、生活用品、保健品）
- **首頁輪播**：來自 `group_buy_events.banner_url`（`status = 'active'`）
- **RLS 政策**：member / admin / store_staff / group_leader / promoter / livestream_host
- **觸發器**：`updated_at` 自動更新、註冊時建立 profile 與購物車
- **Storage**：product-images、payment-proofs、avatars 儲存桶與存取政策

---

## 執行順序（Schema 內部）

PostgreSQL 建立函式時會驗證所參照資料表，因此 `complete-schema.sql` 順序為：

1. DROP（Storage 政策 → auth 觸發器 → 資料表 → ENUM → 函式 CASCADE）
2. Extensions → ENUM → `update_updated_at_column`（不依賴資料表）
3. 所有 `CREATE TABLE`（含 `profiles.store_credit_balance`）
4. 角色／業務函式（`is_admin` 等，**必須在 profiles 之後**）
5. `handle_new_user` 觸發器
6. RLS 啟用與政策
7. Storage 儲存桶與政策
