# 價格牌列印中心（Phase 1 + 黑白公版）

路徑：`/admin/products/labels`（不變）

## 黑白熱感公版（70×30）

| code | 名稱 | 必要價格 |
|------|------|----------|
| `simple` | 簡約版 | `price` |
| `app_month` | 本月 App 優惠版 | `app_price` |
| `sale` | 特價版 | `sale_price`（需低於一般售價） |

- 純白底、純黑字；不含 Logo／產地／彩色
- 勾選商品＝列印清單（份數可調，搜尋不丟選取）
- 缺價格者標示並排除列印，不中斷整批

## Migration

1. `20260726210000_product_label_printing.sql`
2. `20260726220000_price_label_mono_templates.sql`（含 `products.app_price`）

## 後續

- 商品編輯表單 UI 欄位「App 優惠價」
- QZ Tray 直連、拖拉設計器
