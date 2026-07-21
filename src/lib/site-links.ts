import { getSiteUrl } from "@/lib/env";

/** App routes — use relative paths in UI; combine with getSiteUrl() for absolute links. */
export const APP_ROUTES = {
  home: "/",
  register: "/auth/register",
  login: "/auth/login",
  profile: "/profile",
  member: "/member",
  profileEdit: "/profile/edit",
  memberProfile: "/member/profile",
  memberBarcode: "/member/barcode",
  memberCarrier: "/member/carrier",
  memberOrders: "/member/orders",
  memberBenefits: "/member/benefits",
  memberFavorites: "/member/favorites",
  memberAddresses: "/member/addresses",
  memberNotifications: "/member/notifications",
  memberSettings: "/member/settings",
  memberNotificationSettings: "/member/settings/notifications",
  memberAccountSettings: "/member/settings/account",
  memberStores: "/member/stores",
  stores: "/stores",
  faq: "/faq",
  support: "/support",
  profileDelete: "/profile/delete",
  privacy: "/privacy",
  terms: "/terms",
  accountDeletion: "/account-deletion",
  products: "/products",
  bakingMaterials: "/baking-materials",
  shop: "/shop",
  recipes: "/recipes",
  news: "/news",
  aiTools: "/ai-tools",
  storeMap: "/store-map",
  search: "/search",
  cart: "/cart",
  checkout: "/checkout",
  /** Legacy path — prefer memberOrders for member hub copy */
  orders: "/orders",
  live: "/live",
  articles: "/articles",
  courses: "/courses",
  ai: "/ai",
  corporate: "/corporate",
  admin: "/admin",
  staffLogin: "/staff/login",
  staffPickupScan: "/staff/pickup-scan",
} as const;

export type AppRouteKey = keyof typeof APP_ROUTES;

export interface SiteLinkItem {
  key: AppRouteKey;
  label: string;
  href: string;
  absoluteUrl: string;
  description?: string;
}

const LINK_META: Record<AppRouteKey, { label: string; description?: string }> = {
  home: { label: "前台首頁", description: "團購商城首頁" },
  register: { label: "會員註冊", description: "姓名、手機、生日、Email 註冊" },
  login: { label: "會員登入", description: "登入後可下單、查訂單" },
  profile: { label: "會員中心", description: "個人資料與功能選單" },
  member: { label: "我的", description: "會員中心" },
  profileEdit: { label: "編輯會員資料", description: "更新姓名、手機、生日" },
  memberProfile: { label: "會員資料", description: "姓名、聯絡方式與地址" },
  memberBarcode: { label: "會員條碼", description: "門市識別 App 會員身分" },
  memberCarrier: { label: "發票載具", description: "儲存及出示手機條碼" },
  memberOrders: { label: "我的 App 訂單", description: "僅 App 商城與團購訂單" },
  memberBenefits: { label: "會員福利", description: "App 活動發放的福利" },
  memberFavorites: { label: "我的收藏", description: "收藏的商品" },
  memberAddresses: { label: "收件地址", description: "宅配與聯絡地址" },
  memberNotifications: { label: "通知中心", description: "訂單與活動通知" },
  memberSettings: { label: "帳號設定", description: "隱私與通知偏好入口" },
  memberNotificationSettings: { label: "通知設定", description: "App 內通知偏好" },
  memberAccountSettings: { label: "帳號與隱私", description: "密碼與刪除帳號" },
  memberStores: { label: "門市資訊", description: "取貨門市地址與營業時間" },
  stores: { label: "門市資訊", description: "門市列表" },
  faq: { label: "常見問題", description: "FAQ" },
  support: { label: "客服中心", description: "聯絡客服" },
  profileDelete: { label: "刪除帳號", description: "匿名化個人資料並停用登入" },
  privacy: { label: "隱私權政策", description: "個人資料蒐集與使用說明" },
  terms: { label: "服務條款", description: "使用本服務之約定" },
  accountDeletion: { label: "刪除帳號說明", description: "商店審核用帳號刪除說明" },
  products: { label: "商品列表", description: "瀏覽與篩選商品" },
  bakingMaterials: { label: "烘焙材料", description: "原料、器具、包裝一次購足" },
  shop: { label: "商城", description: "商城入口與精選導覽" },
  recipes: { label: "食譜影音", description: "食譜與教學影片" },
  news: { label: "最新資訊", description: "新品活動與公告" },
  aiTools: { label: "AI 烘焙助手", description: "選品與食材食譜建議" },
  storeMap: { label: "門市地圖", description: "商品擺放位置查詢" },
  search: { label: "全站搜尋", description: "商品／內容／門市位置" },
  cart: { label: "購物車", description: "需登入" },
  checkout: { label: "結帳", description: "需登入且完成 Email 驗證" },
  orders: { label: "我的 App 訂單", description: "僅 App 商城與團購訂單（舊路徑）" },
  live: { label: "直播中心", description: "直播中、倒數、回放" },
  articles: { label: "文章中心", description: "烘焙知識與食譜" },
  courses: { label: "課程中心", description: "烘焙課程報名" },
  ai: { label: "AI 烘焙助手", description: "材料推薦與失敗分析" },
  corporate: { label: "企業福委", description: "企業詢價與合作" },
  admin: { label: "管理後台", description: "admin / store_staff" },
  staffLogin: { label: "門市登入", description: "門市人員專用登入" },
  staffPickupScan: { label: "門市掃碼", description: "取貨掃碼與確認" },
};

/** Primary shortcuts shown in dev panel (matches common test URLs). */
export const PRIMARY_SITE_LINK_KEYS: AppRouteKey[] = [
  "home",
  "register",
  "login",
  "admin",
  "staffPickupScan",
];

export function getSiteLinks(keys: AppRouteKey[] = PRIMARY_SITE_LINK_KEYS): SiteLinkItem[] {
  const base = getSiteUrl();
  return keys.map((key) => {
    const href = APP_ROUTES[key];
    const meta = LINK_META[key];
    return {
      key,
      label: meta.label,
      description: meta.description,
      href,
      absoluteUrl: `${base}${href}`,
    };
  });
}
