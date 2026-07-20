# Consumer Hub 2.0 — Batch 7 完成報告

## 範圍

通知中心／通知管理、FAQ 深化、客服設定集中管理

## Migration

`supabase/migrations/20260721060000_consumer_hub_phase2_batch7_notifications_faq.sql`

- 擴充 `notifications` 分類（group_buy／campaign／benefit／store）+ summary／campaign_id
- 新建 `notification_campaigns`（草稿／預約／發送／取消）+ RLS
- `faqs.is_featured` 熱門標記
- 新建 `support_settings` 單例設定 + RLS

**未建立** POS 通知來源；正式 Push 不串接付費服務。

## 前台

| 路由 | 說明 |
|------|------|
| `/member/notifications` | 分類篩選、未讀數、全部已讀、純文字內容、安全連結 |
| `/faq` | 搜尋、分類 Tabs、熱門問題、Accordion |
| `/support` | 讀取客服設定；LINE／電話／社群外部連結 |
| `/support/faq` | redirect → `/faq` |
| `/support/contact`、`/orders`、`/shipping`、`/returns` | 子頁 |

## 後台

| 路由 | 說明 |
|------|------|
| `/admin/notifications` | 草稿／預覽／立即發送／預約／取消；對象：全會員／指定 ID／App 訂單狀態 |
| `/admin/faqs` | 新增／編輯／刪除／熱門／啟停／搜尋 |
| `/admin/support-settings` | 電話、Email、社群、地址、營業、配送／退換貨說明 |

## 安全

- 通知／FAQ 輸出經 `stripHtmlToText`
- 外部連結 `isSafeLinkUrl` + `noopener`
- 通知來源文案標明不含 POS

## POS 排除

確認：無 POS 消費／刷卡／發票通知類型或發送路徑。
