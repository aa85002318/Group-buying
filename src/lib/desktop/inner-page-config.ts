import type { DesktopFilterGroup, DesktopNavItem } from "@/components/desktop/layout/types";
import { DEFAULT_RECIPE_HERO_DESKTOP } from "@/lib/recipes/page-settings";
import { APP_ROUTES } from "@/lib/site-links";

export const RECIPE_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "all", label: "全部食譜" },
  { key: "cake", label: "蛋糕甜點" },
  { key: "bread", label: "麵包烘焙" },
  { key: "cookie", label: "餅乾點心" },
  { key: "tart", label: "塔派甜點" },
  { key: "festival", label: "節慶食譜" },
  { key: "beginner", label: "新手入門" },
  { key: "tips", label: "烘焙技巧" },
  { key: "video", label: "影片食譜" },
];

export const RECIPE_FILTERS: DesktopFilterGroup[] = [
  {
    key: "time",
    title: "料理時間",
    options: [
      { value: "lt30", label: "30分鐘內" },
      { value: "30to60", label: "30–60分鐘" },
      { value: "gt60", label: "60分鐘以上" },
    ],
  },
  {
    key: "difficulty",
    title: "難易程度",
    options: [
      { value: "easy", label: "初級" },
      { value: "medium", label: "中級" },
      { value: "hard", label: "進階" },
    ],
  },
];

export const SHOP_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "all", label: "全部商品" },
  { key: "麵粉", label: "麵粉" },
  { key: "乳製品", label: "乳製品" },
  { key: "巧克力", label: "巧克力" },
  { key: "堅果果乾", label: "堅果果乾" },
  { key: "包材", label: "包材" },
  { key: "烘焙器具", label: "烘焙器具" },
];

export const SHOP_FILTERS: DesktopFilterGroup[] = [
  {
    key: "stock",
    title: "庫存",
    options: [{ value: "in_stock", label: "僅顯示有庫存" }],
  },
  {
    key: "tag",
    title: "熱門／新品",
    type: "radio",
    options: [
      { value: "all", label: "全部" },
      { value: "hot", label: "熱門" },
      { value: "new", label: "新品" },
    ],
  },
];

export const ACTIVITY_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "all", label: "全部活動" },
  { key: "會員活動", label: "會員活動" },
  { key: "門市活動", label: "門市活動" },
  { key: "限時優惠", label: "限時優惠" },
  { key: "新品活動", label: "新品活動" },
  { key: "優惠活動", label: "優惠活動" },
];

export const BRAND_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "all", label: "全部品牌" },
  { key: "season", label: "季節主題" },
  { key: "origin", label: "產地分類" },
];

export const MEMBER_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "profile", label: "會員資料", href: APP_ROUTES.memberProfile },
  { key: "orders", label: "我的訂單", href: APP_ROUTES.memberOrders },
  { key: "benefits", label: "會員禮", href: APP_ROUTES.memberBenefits },
  { key: "favorites", label: "收藏", href: APP_ROUTES.favorites },
  { key: "stores", label: "門市會員", href: APP_ROUTES.memberStores },
  { key: "carrier", label: "發票載具", href: APP_ROUTES.memberCarrier },
  { key: "addresses", label: "地址管理", href: APP_ROUTES.memberAddresses },
  { key: "support", label: "客服", href: APP_ROUTES.support },
];

export const AI_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "chat", label: "開始對話", href: "/ai" },
  { key: "tools", label: "AI 工具", href: "/ai-tools" },
  { key: "recipes", label: "食譜靈感", href: APP_ROUTES.recipes },
  { key: "shop", label: "推薦材料", href: APP_ROUTES.shop },
];

export const STORE_SIDEBAR_ITEMS: DesktopNavItem[] = [
  { key: "all", label: "全部門市" },
  { key: "pickup", label: "可取貨門市" },
];

export const INNER_PAGE_HEROES = {
  recipes: {
    title: "美味食譜，\n讓烘焙走進生活",
    subtitle: "從新手到進階，與你一起發現烘焙的美好",
    imageUrl: DEFAULT_RECIPE_HERO_DESKTOP,
    height: 360 as const,
  },
  shop: {
    title: "烘焙好物商城",
    subtitle: "嚴選材料、器具與包材，一次購足",
    imageUrl: "/images/shop/hero-desktop.jpg",
    height: 360 as const,
  },
  activities: {
    title: "最新活動",
    subtitle: "會員活動、門市優惠與限時專案一次掌握",
    imageUrl: "/images/home/latest-campaigns/01-free-shipping.jpg",
    height: 360 as const,
  },
  brands: {
    title: "品牌專區",
    subtitle: "探索季節主題與品牌企劃",
    imageUrl: "/images/home/group-buy-banner/slide-season.png",
    height: 360 as const,
  },
  member: {
    title: "會員中心",
    subtitle: "管理您的會員資料與訂單",
    imageUrl: null,
    height: 220 as const,
  },
  ai: {
    title: "AI 烘焙助手",
    subtitle: "問配方、找靈感、推薦材料",
    imageUrl: "/brand/hero-ai-banner.jpg",
    height: 360 as const,
  },
  stores: {
    title: "門市資訊",
    subtitle: "鄰近門市、營業時間與取貨服務",
    imageUrl: "/images/shop/categories/food.png",
    height: 360 as const,
  },
};

/** Homepage desktop hero CMS placement (pure 16:9 image + link). */
export const DESKTOP_HOME_HERO_PLACEMENT = "desktop_home_hero";
