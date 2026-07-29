import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";

export default function AdminBrandContentSectionsPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="內容區塊"
        description="Brand Section 標題／副標／看更多與排序，請至首頁版面管理。"
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/brand-system/home-layout"
              className={buttonVariants({ size: "sm" })}
            >
              首頁版面
            </Link>
            <Link href="/admin/home" className={buttonVariants({ size: "sm", variant: "outline" })}>
              首頁 CMS
            </Link>
          </div>
        }
      />
      <p className="text-sm text-muted-foreground">
        區塊 metadata 存於 `brand_home_sections`；實際卡片內容仍由既有首頁 CMS／API 提供，避免影響商品與團購流程。
      </p>
    </div>
  );
}
