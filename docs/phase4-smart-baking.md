# CHIMEIDIY Phase 4 — Smart Baking Platform

## 新增路由
- `/ai` AI 烘焙助手（5 工具）
- `/corporate` 企業福委詢價
- `/courses/[id]` 課程詳情／報名／票券
- `/member/settings/subscriptions` 訂閱偏好
- `/admin/corporate` 企業詢價管理
- `/admin/courses` 課程管理

## Migration
`supabase/migrations/20260720200000_smart_baking_phase4.sql`

## 核心服務
- `src/lib/ai/bakingKnowledge.ts`
- `src/lib/services/recommendationService.ts`
- `src/lib/services/courseTicketService.ts`
- `src/lib/security/rateLimit.ts`
- `src/lib/seo.ts`
- `src/components/analytics/*`

## Analytics Env（選填）
```
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_LINE_TAG_ID=
```

## 尚未完整（明確標註）
- 課程綠界／線上付款串接
- 直播即時聊天室（Realtime）
- Web Push 正式發送
- 後台 2FA
- ISR 全站策略細化
- 官網 www.chimeidiy.shop 仍為外部平台
