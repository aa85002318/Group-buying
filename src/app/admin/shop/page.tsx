import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/admin/shop/hero-banners",
    title: "商城 Hero Banner",
    desc: "滿版主視覺。桌面 1500×600（5:2）、手機 1080×900（6:5）。",
  },
  {
    href: "/admin/shop/categories",
    title: "商品主分類",
    desc: "搜尋欄下方圓形主分類：素材圖、色卡底色、排序與啟用。",
  },
  {
    href: "/admin/shop/promo-banners",
    title: "5:2 活動 Banner 輪播",
    desc: "分類選單下方活動輪播。桌面 1500×600、手機 1080×432。",
  },
  {
    href: "/admin/shop/popular-products",
    title: "熱門商品",
    desc: "人工精選與排序；不足時依瀏覽／加購自動補足。",
  },
  {
    href: "/shop",
    title: "前台商城預覽",
    desc: "開啟 /shop 查看實際呈現。",
  },
];

export default function AdminShopCmsHubPage() {
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="商城頁面 CMS"
        description="管理商城首頁 Header／Hero、主分類、活動 Banner 與熱門商品。"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-border bg-white p-4 shadow-card transition hover:border-[#153E73]/30"
          >
            <h2 className="text-base font-bold text-coffee">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            <span className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-3")}>
              前往設定
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
