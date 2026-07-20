import type {
  AIRecommendation,
  MemberBenefit,
  NewsItem,
  ProductLocation,
  RecipeSummary,
  SocialChannel,
  StoreZone,
  VideoSummary,
} from "@/lib/consumer-hub";

export const MOCK_RECIPES: RecipeSummary[] = [
  {
    id: "r1",
    title: "奶油餅乾（新手友善）",
    coverImage: null,
    difficulty: "easy",
    durationMinutes: 45,
    category: "餅乾",
    hasVideo: true,
    href: "/recipes/butter-cookies",
  },
  {
    id: "r2",
    title: "生乳捲基礎版",
    coverImage: null,
    difficulty: "medium",
    durationMinutes: 90,
    category: "蛋糕",
    hasVideo: true,
    href: "/recipes/swiss-roll",
  },
  {
    id: "r3",
    title: "法式布里歐",
    coverImage: null,
    difficulty: "hard",
    durationMinutes: 180,
    category: "麵包",
    hasVideo: false,
    href: "/recipes/brioche",
  },
];

export const MOCK_VIDEOS: VideoSummary[] = [
  {
    id: "v1",
    title: "一分鐘教你過篩麵粉",
    coverImage: null,
    durationLabel: "1:12",
    href: "/videos/sift-flour-1min",
  },
  {
    id: "v2",
    title: "奶油乳化失敗怎麼救",
    coverImage: null,
    durationLabel: "2:40",
    href: "/videos/butter-emulsion-fix",
  },
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: "n1",
    title: "本週新品：進口高筋麵粉到貨",
    summary: "適合歐式麵包與吐司，門市與線上同步上架。",
    category: "new",
    publishedAt: "2026-07-20",
    imageUrl: null,
    pinned: true,
    important: false,
    href: "/news",
  },
  {
    id: "n2",
    title: "週末烘焙體驗課開放報名",
    summary: "名額有限，歡迎至課程中心報名。",
    category: "course",
    publishedAt: "2026-07-18",
    imageUrl: null,
    href: "/courses",
  },
  {
    id: "n3",
    title: "門市營業時間調整公告",
    summary: "週日延長營業至 20:00，詳見門市資訊。",
    category: "store",
    publishedAt: "2026-07-15",
    imageUrl: null,
    important: true,
    href: "/stores",
  },
];

export const MOCK_BENEFITS: MemberBenefit[] = [
  {
    id: "b1",
    title: "會員福利公告",
    description: "門市與線上活動將於此公布，點數與券系統開發中。",
    status: "coming_soon",
  },
  {
    id: "b2",
    title: "福利使用說明",
    description: "線上會員與門市會員資料不會自動合併，請分別使用。",
    status: "announced",
  },
];

export const SOCIAL_CHANNELS: SocialChannel[] = [
  {
    id: "line",
    label: "LINE 官方帳號",
    href: "https://line.me/R/ti/p/@diy_chimei",
    description: "訂單與活動諮詢",
    external: true,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/",
    description: "官方粉專（外部連結）",
    external: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/",
    description: "烘焙靈感與新品（外部連結）",
    external: true,
  },
];

export const STORE_ZONES: StoreZone[] = [
  { code: "A", name: "A 區｜麵粉與預拌粉", hint: "入口右側" },
  { code: "B", name: "B 區｜糖與乳製品", hint: "中央走道" },
  { code: "C", name: "C 區｜巧克力與香料", hint: "後段" },
  { code: "CHILL", name: "冷藏區", hint: "靠牆冷藏櫃" },
  { code: "FREEZE", name: "冷凍區", hint: "冷藏區旁" },
  { code: "TOOL", name: "器具區", hint: "左側牆面" },
  { code: "PACK", name: "包裝區", hint: "收銀台前" },
  { code: "COUNTER", name: "櫃台", hint: "結帳與諮詢" },
];

export const MOCK_PRODUCT_LOCATIONS: ProductLocation[] = [
  {
    productId: "p-flour-1",
    productName: "駱駝高筋麵粉",
    sku: "SKU-FLOUR-01",
    barcode: "471000000001",
    zoneCode: "A",
    aisle: "第 3 排",
    shelf: "第 2 層",
    level: "2",
    description: "靠近麵粉與預拌粉專區",
  },
  {
    productId: "p-butter-1",
    productName: "無鹽奶油 454g",
    sku: "SKU-BUTTER-01",
    barcode: "471000000002",
    zoneCode: "CHILL",
    aisle: "冷藏櫃 1",
    shelf: "中層",
    description: "請留意保存溫度",
  },
  {
    productId: "p-choc-1",
    productName: "苦甜巧克力磚",
    sku: "SKU-CHOC-01",
    barcode: "471000000003",
    zoneCode: "C",
    aisle: "第 1 排",
    shelf: "第 1 層",
    description: "巧克力與香料區",
  },
  {
    productId: "p-mold-1",
    productName: "圓形蛋糕模 6 吋",
    sku: "SKU-MOLD-01",
    zoneCode: "TOOL",
    aisle: "掛架 B",
    shelf: "中段",
    description: "器具區掛架",
  },
];

/** Rules-based AI fallback (no paid API) */
export function mockPickProduct(input: {
  goal: string;
  experience: string;
  budget: string;
}): AIRecommendation[] {
  const goal = input.goal.trim() || "甜點";
  return [
    {
      id: "rec-1",
      title: `${goal}｜基礎麵粉組合`,
      reason: `依「${input.experience || "初學"}」經驗與預算「${input.budget || "中階"}」建議先備齊高筋／低粉。`,
      notes: "本結果為規則引擎預覽，後續可串接 AI API。",
      href: "/shop",
    },
    {
      id: "rec-2",
      title: "常用乳製品與油脂",
      reason: "多數烘焙甜點需要奶油與雞蛋，建議先確認冷藏保存空間。",
      href: "/products?search=奶油",
    },
  ];
}

export function mockPantryRecipes(ingredients: string[]): AIRecommendation[] {
  const list = ingredients.length ? ingredients.join("、") : "基本材料";
  return [
    {
      id: "pantry-1",
      title: "奶油餅乾",
      reason: `依現有食材（${list}）可先嘗試簡易餅乾。`,
      notes: "缺少材料可至商城補齊（預留一鍵購買）。",
      href: "/recipes",
    },
    {
      id: "pantry-2",
      title: "原味杯子蛋糕",
      reason: "材料門檻低，適合新手練習乳化與烤焙時間。",
      href: "/recipes",
    },
  ];
}

export function searchProductLocations(query: string): ProductLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_PRODUCT_LOCATIONS.filter(
    (p) =>
      p.productName.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q) ||
      p.zoneCode.toLowerCase().includes(q)
  );
}
