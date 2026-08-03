import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Shop homepage CMS hub — ordered to match /shop section stack. */
const LINKS = [
  {
    href: "/admin/shop/categories",
    title: "1. 商品分類",
    desc: "搜尋欄下方圓形主分類：可換文字、logo 圖與色卡底色。",
  },
  {
    href: "/admin/shop/features",
    title: "2. 三格商城特色",
    desc: "固定 3 格 banner 圖（無區塊標題），可換圖樣與連結。",
  },
  {
    href: "/admin/shop/promo-banners",
    title: "3. 5:2 活動 Banner",
    desc: "可新增多張、刪除或停用；前台輪播 5:2 比例。",
  },
  {
    href: "/admin/shop/popular-products",
    title: "4. 熱門商品",
    desc: "依商城主分類自動排序預覽（互動分數補足）。",
  },
  {
    href: "/admin/shop/new-products",
    title: "5. 新品上架",
    desc: "依商城主分類自動排序預覽（新品旗標／上架時間）。",
  },
  {
    href: "/admin/shop/inspiration",
    title: "6. 烘焙靈感牆",
    desc: "精選食譜、滿版 banner、排序與牆上露出開關。",
  },
  {
    href: "/admin/shop/recipe-categories",
    title: "7. 食譜分類",
    desc: "靈感牆分類：新增／刪除、更換上方圖案。",
  },
  {
    href: "/admin/shop/info-banners",
    title: "8. 訂購須知／企業詢問",
    desc: "兩張 5:2 banner：可換圖，連結文章、選單或站內頁。",
  },
  {
    href: "/admin/shop/appearance",
    title: "（附）頁首／Hero 外觀",
    desc: "頁首底色、Hero 底色（建議同色銜接）。",
  },
  {
    href: "/admin/shop/hero-banners",
    title: "（附）商城 Hero Banner",
    desc: "滿寬主視覺圖，高度隨圖、不裁切。",
  },
  {
    href: "/admin/shop/ai-assistant",
    title: "（附）AI 食譜助手",
    desc: "暖黃功能卡：標題、搜尋、智慧 Prompt、IP 圖。",
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
        title="商城首頁 CMS"
        description="依商城首頁區塊順序管理：分類、特色、活動 Banner、熱門／新品、靈感牆與訂購資訊。"
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
