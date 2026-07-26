# 價格牌列印中心（Phase 1）

路徑：`/admin/products/labels`

## 已完成

- 搜尋（名稱／條碼／SKU／品牌／分類／上架／最近新增）
- 勾選 → 加入列印清單（可設張數）
- 價格來源：App／建議／門市／會員／自訂（僅影響此次列印）
- 五種模板：一般、特價、會員、批發、極簡
- 尺寸預設＋自由 mm、欄位勾選、字級拖拉、字重、條碼類型
- 右側即時預覽
- A4 拼版／標籤紙熱感尺寸，經瀏覽器列印
- 商品編輯頁「列印價格牌」深連結
- 資料表：`label_templates`、`print_jobs`、`print_job_items`

Migration：`supabase/migrations/20260726210000_product_label_printing.sql`

## 後續階段

- Phase 2：印表機預設設定管理
- Phase 3：QZ Tray 一鍵直連 Brother／Zebra／TSC
- 拖拉式 Canva 設計器、Excel 批次匯入列印、調價後批次重印
