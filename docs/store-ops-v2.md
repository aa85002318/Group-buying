# Store Ops V2 — 批次為核心

## 原則

1. 商品主檔只有 `/admin/products`
2. Store Ops 不建立商品，只引用 `products.id`
3. 進貨／效期／報廢／退貨／異常／盤點以 **批次（store_batches）** 為核心
4. `store_inventory` 改為批次剩餘量彙總視圖

## 選單

```
門市總覽
批次管理
庫存管理
效期管理
報廢管理
異常登記
退貨管理
盤點管理
廠商管理
備份管理
商品主檔（連到 /admin/products）
```

已移除獨立「商品資料庫」「商品分類」入口（redirect 至主檔）。

## 路由

| 路徑 | 說明 |
|------|------|
| `/admin/store/batches` | 批次列表、快速進貨、批次匯入 |
| `/admin/store/batches/[id]` | 批次詳情／異動 |
| `/admin/store/batch` | redirect → batches |
| `/admin/store/products` | redirect → `/admin/products` |
| `/admin/store/stocktake` | 盤點單 V1 |

## Migration

`supabase/migrations/20260724200000_store_ops_v2_batches.sql`

- `inventory_movements`
- `store_stocktakes` / `store_stocktake_lines`
- 確保 `batch_id` 於報廢／退貨／異常

## 驗收對照

| 條件 | 狀態 |
|------|------|
| 無第二套商品入口 | ✅ redirect |
| 快速進貨只建批次 | ✅ |
| 報廢／退貨／異常必選批次 | ✅ API + UI |
| 效期顯示商品＋批號＋天數 | ✅ |
| Dashboard 文案改批次 | ✅ |
| 庫存為批次彙總 | ✅ |

## 尚未完整（下一階段）

- 盤點明細掃條碼對帳 UI
- 通知中心「查看批次」深連結文案全面替換
- Excel 專用 `/admin/store/import` 獨立頁（目前沿用批次頁匯入）
