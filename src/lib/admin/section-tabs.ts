import type { AdminSectionTab } from "@/components/admin/AdminSectionTabs";

/** 商品 › 批次工具 */
export const PRODUCT_TOOLS_TABS: AdminSectionTab[] = [
  { href: "/admin/products/tools", label: "全部工具", exact: true },
  { href: "/admin/products/content-templates", label: "商品內容公版" },
  { href: "/admin/products/content-batch", label: "內容批次編輯" },
  { href: "/admin/products/price-batch", label: "價格批次更改" },
  { href: "/admin/products/images/batch", label: "圖片批次上傳" },
  { href: "/admin/product-imports", label: "批次匯入" },
  { href: "/admin/products/batch-history", label: "批次操作紀錄" },
];

/** 內容 › 食譜中心 */
export const RECIPE_SECTION_TABS: AdminSectionTab[] = [
  { href: "/admin/recipes", label: "全部食譜", exact: true },
  { href: "/admin/shop/recipe-categories", label: "食譜分類" },
  { href: "/admin/recipes/layouts", label: "翻頁版型" },
  { href: "/admin/recipes/media", label: "素材庫" },
  { href: "/admin/recipes/submissions", label: "作品審核" },
  { href: "/admin/recipes/discussions", label: "問題與討論" },
  { href: "/admin/challenges", label: "食譜挑戰" },
  { href: "/admin/recipes/settings", label: "食譜頁設定", roles: ["admin"] },
];
