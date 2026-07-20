# Phase 5 — API 文件

## 公開

### `GET /api/products`
既有參數：`category`, `search`, `tag`  
**新增**：`channel=website|group_buy|store_only`（依 `publish_*` 篩選）

### `GET /api/categories`
回傳分類（含 `parent_id`, `banner_url`, icon 欄位）

### `GET /api/search?q=`
統一搜尋。回傳 `{ results: [{ type, id, title, href, snippet }] }`  
types: `product|article|course|livestream|faq|brand`

### `GET /api/cms`
- 預設：`{ banners, blocks, announcements }`
- `?type=page&slug=`：單一已發布 CMS 頁

### `GET /api/orders` / 既有訂單 API
維持不變。新單可寫入 `orders.channel`。

---

## 門市（需 admin / store_staff）

### `GET /api/store?resource=`
`inventory|batches|anomalies|returns|disposals|reservations|announcements|export`  
可選 `store_id`

### `POST /api/store`
Body：`{ resource, ...fields }` — 寫入對應表；商品 FK 必須為 Product Master id

### `PATCH /api/store`
Body：`{ resource, id, ...updates }`

### `GET /api/store-members`
可選 `?phone=`

### `POST /api/store-members`
Body：`{ phone, store_member_no?, store_id?, source?, notes? }`  
**拒絕** `name` / `email` / `address`  
回傳 `{ member, phoneMatch }` — `phoneMatch.matched` 時僅提示

### `PUT /api/store-members`
僅檢查電話是否與線上會員相同：`{ phoneMatch }`

---

## 後台

### `GET|POST|PATCH /api/admin/cms`
`kind=page|banner|block`

### `GET /api/admin/orders?channel=`
渠道篩選

### `POST|PUT /api/admin/products`
新增欄位：`barcode`, `unit`, `video_url`, `website_price`, `group_buy_price`, `msrp`, `publish_*`  
可選 `channels: string[]` → 同步 `product_channels`

---

## 權限 / Audit
- Staff API 使用 `requireStaffOrAdmin`
- CMS 使用 `requireAdmin`
- 變更寫入 `audit_logs`（via `logAudit`）
- RLS：見 migration `phase5_c_rls`
