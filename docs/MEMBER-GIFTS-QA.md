# 門市會員禮／滿額贈 — 驗收清單

對應規格 20 項業務驗收。建議先在目標環境：

1. 後台儀表板 → **建立示範活動**，或 CLI：`npm run seed:member-gifts-demo`
2. 開啟 `/api/admin/member-gifts/health`（需登入有讀取權限）
3. 後台 **驗收清單** `/admin/member-gifts/qa`
4. 本機執行 `npm run check:member-gifts`

> 注意：`check:member-gifts` 連的是 `.env.local` 的 Supabase。  
> - staging：`daypinpjxhpaeckvgzhh`（chimeidiy-staging）  
> - 正式／本機常見：`gquavtvbbuabphzgztkb`（Group buying）  
> Phase 16 已將會員禮 schema（含 `store_manager`、`member_points`、redeem RPC）套用至 **Group buying**。  
> 若其他專案仍缺表，請依序套用 `supabase/migrations/20260807190000*`～`20260807250000*`。

## 自動化／半自動

| # | 項目 | 建議驗證 |
|---|------|----------|
| A | Schema／RPC | Health + `check:member-gifts` |
| B | 點數門檻邏輯 | smoke 內 eligibility 測試 |
| C | QR 60 秒簽名 | smoke 內 qr 測試 |
| D | Cron／維運 | 儀表板「立即執行維運」或 `/api/cron/member-gifts`（需 `CRON_SECRET`） |

## 手動業務驗收（規格二十）

| # | 項目 | 通過條件 |
|---|------|----------|
| 1 | 會員查看本月兌換項目 | `/member/benefits` 或 `/member/gifts` 顯示活動卡 |
| 2 | 顯示兌換數量與剩餘數量 | 卡片有剩餘／限領資訊 |
| 3 | 顯示兌換條件 | terms／資格文案可見 |
| 4 | 顯示指定兌換門市 | 有門市名稱或「全部门市」 |
| 5 | 數量為 0 顯示兌換完畢 | 灰階＋停用領取 |
| 6 | 數量為 0 不能繼續領券 | API 回 `exhausted` |
| 7 | 不超過個人領取上限 | 第二次領取失敗（除非勾「允許重複參加」且無可用券） |
| 8 | 滿額訂單產生資格 | 訂單 `completed` 後產生 claim |
| 9 | 未達金額不產生 | 低於門檻無券 |
| 10 | 同訂單不重複產生 | `source_order_id + campaign` 唯一 |
| 11 | 指定門市以外不能核銷 | staff 顯示不適用 |
| 12 | 同 QR 不能重複兌換 | 第二次確認失敗 |
| 13 | 並行核銷只有一台成功 | 雙裝置同時確認 |
| 14 | 重複掃描顯示原兌換資訊 | 含原門市／時間／編號 |
| 15 | 核銷後 QR 失效 | 詳情頁不再產生 token |
| 16 | 會員端同步已兌換 | `/member/benefits/vouchers/[id]` |
| 17 | 取消訂單作廢未用資格 | spend-qualify reverse path |
| 18 | 過期券不能兌換 | 狀態 expired 或 RPC 擋下 |
| 19 | 成功／失敗有稽核 | `gift_redemption_logs`／報表失敗原因 |
| 20 | TS／Lint／build | `npm run typecheck`、`npm run build` |

## 角色快速抽樣

| 角色 | 應可 | 不可 |
|------|------|------|
| admin | 全模組、補發、沖銷、維運 | — |
| content_editor | 建編活動、示範活動、報表 | 核銷、補發 |
| store_manager | 核銷、申請沖銷 | 改活動 |
| store_staff | 核銷 | 後台活動寫入 |
| customer_service | 讀儀表板／券／紀錄／報表 | 核銷／改活動 |
| member | 領券、出示 QR | 核銷 API |

## 入口

| 端 | 路徑 |
|----|------|
| 會員 | `/member`、`/member/benefits`、`/member/gifts`（別名） |
| 後台 | `/admin/member-gifts` |
| 門市 | `/staff/redemptions` |
