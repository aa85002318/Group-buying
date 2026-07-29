import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";

export default function AdminBrandOverviewPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="系統總覽"
        description="CHIMEIDIY Brand Experience System — Design Token 固定，CMS 只改內容。"
        actions={
          <Link href="/admin/brand-system" className={buttonVariants({ size: "sm", variant: "outline" })}>
            返回
          </Link>
        }
      />
      <div className="rounded-xl border border-border bg-white p-4 text-sm shadow-card">
        <p className="font-semibold text-coffee">已完成（Phase 1–2）</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Design Token：`src/styles/brand-tokens.css`</li>
          <li>共用元件：Hero／Button／Card／Search／Tag／Section／Navigation</li>
          <li>前台套用：首頁、食譜、商品、課程、團購 BrandHero</li>
          <li>前台 Hero API：`GET /api/brand-system/heroes/:key`</li>
          <li>後台：Hero／導覽／首頁版面／版本／素材列表</li>
          <li>Staging DB：`brand_*` tables + seed</li>
        </ul>
      </div>
      <div className="rounded-xl border border-border bg-white p-4 text-sm shadow-card">
        <p className="font-semibold text-coffee">下一波（Phase 3）</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>`brand-assets` Storage bucket + WebP 上傳</li>
          <li>Hero 熱門標籤拖曳 CRUD</li>
          <li>裝置預覽（390／768／1440）與版本還原</li>
          <li>前台 Header／Bottom Nav 全面切換至 Brand Navigation（需回歸測試）</li>
        </ul>
      </div>
    </div>
  );
}
