import type {
  Article,
  CommissionRecord,
  CommissionRule,
  GroupBuyEvent,
  GroupBuyProduct,
  Livestream,
  Order,
  OrderItem,
  PaymentReport,
  Product,
  ProductCategory,
  Profile,
  RewardRecord,
  Store,
  SupportTicket,
  UserNotification,
  Video,
} from "@/lib/types/database";

export const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001";
export const MOCK_ADMIN_ID = "00000000-0000-4000-8000-000000000099";

export const mockAdminProfile: Profile = {
  id: MOCK_ADMIN_ID,
  email: "aa85002318@gmail.com",
  phone: "0912345678",
  full_name: "系統管理員",
  birthday: "1985-01-01",
  member_code: "ADMIN01",
  role: "admin",
  avatar_url: null,
  referrer_user_id: null,
  store_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockProfile: Profile = {
  id: MOCK_USER_ID,
  email: "demo@example.com",
  phone: "0912345678",
  full_name: "示範會員",
  birthday: "1990-05-15",
  member_code: "0912345678",
  role: "member",
  avatar_url: null,
  referrer_user_id: null,
  store_id: "00000000-0000-4000-8000-000000000010",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockStores: Store[] = [
  {
    id: "00000000-0000-4000-8000-000000000010",
    name: "台北信義門市",
    address: "台北市信義區信義路五段7號",
    phone: "02-12345678",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-4000-8000-000000000011",
    name: "台中公益門市",
    address: "台中市西區公益路100號",
    phone: "04-87654321",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

import { CATEGORY_IMAGE_PATHS } from "@/lib/category-assets";

export const mockCategories: ProductCategory[] = [
  { id: "cat-food", name: "食品", slug: "food", sort_order: 1, icon_emoji: null, icon_url: CATEGORY_IMAGE_PATHS.food, created_at: "", updated_at: "" },
  { id: "cat-fresh", name: "生鮮食材", slug: "fresh", sort_order: 2, icon_emoji: null, icon_url: CATEGORY_IMAGE_PATHS.fresh, created_at: "", updated_at: "" },
  { id: "cat-frozen", name: "冷凍食品", slug: "frozen", sort_order: 3, icon_emoji: null, icon_url: CATEGORY_IMAGE_PATHS.frozen, created_at: "", updated_at: "" },
  { id: "cat-kitchen", name: "廚房用品", slug: "kitchen", sort_order: 4, icon_emoji: null, icon_url: CATEGORY_IMAGE_PATHS.kitchen, created_at: "", updated_at: "" },
  { id: "cat-cleaning", name: "居家清潔", slug: "cleaning", sort_order: 5, icon_emoji: null, icon_url: CATEGORY_IMAGE_PATHS.cleaning, created_at: "", updated_at: "" },
  { id: "cat-seasonal", name: "季節限定", slug: "seasonal", sort_order: 6, icon_emoji: null, icon_url: CATEGORY_IMAGE_PATHS.seasonal, created_at: "", updated_at: "" },
];

const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
const today = new Date().toISOString();

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    category_id: "cat-food",
    name: "綜合維他命 B 群",
    description: "每日營養補充，維持活力。",
    price: 580,
    original_price: 680,
    stock: 120,
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    images: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      "https://images.unsplash.com/photo-1550572017-edd226b30d7?w=400",
    ],
    is_active: true,
    disclaimer: "本產品資訊僅供參考，不構成醫療建議。",
    expected_arrival_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    preorder_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: twoDaysAgo,
    updated_at: twoDaysAgo,
    product_categories: mockCategories[0],
  },
  {
    id: "prod-2",
    category_id: "cat-fresh",
    name: "深海魚油膠囊",
    description: "高純度 Omega-3。",
    price: 890,
    original_price: 990,
    stock: 80,
    image_url: "https://images.unsplash.com/photo-1550572017-edd226b30d7?w=400",
    is_active: true,
    disclaimer: "本產品資訊僅供參考，不構成醫療建議。",
    preorder_deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: today,
    updated_at: today,
    product_categories: mockCategories[1],
  },
  {
    id: "prod-3",
    category_id: "cat-kitchen",
    name: "保濕精華液",
    description: "深層補水，柔嫩肌膚。",
    price: 1280,
    original_price: 1580,
    stock: 50,
    image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
    is_active: true,
    disclaimer: "本產品資訊僅供參考，不構成醫療建議。",
    created_at: today,
    updated_at: today,
    product_categories: mockCategories[3],
  },
  {
    id: "prod-4",
    category_id: "cat-cleaning",
    name: "香氛蠟燭組",
    description: "溫暖居家氛圍。",
    price: 450,
    original_price: null,
    stock: 200,
    image_url: "https://placehold.co/400x400/F7DADA/9F2F2F?text=%E9%A6%99%E6%B0%9B%E7%87%9F%E7%87%89",
    is_active: true,
    disclaimer: null,
    created_at: weekAgo,
    updated_at: weekAgo,
    product_categories: mockCategories[4],
  },
  {
    id: "prod-5",
    category_id: "cat-fresh",
    name: "有機高麗菜",
    description: "產地直送，新鮮脆甜。",
    price: 89,
    original_price: 120,
    stock: 50,
    image_url: "https://images.unsplash.com/photo-1594282486552-05b4d3f6515a?w=400",
    is_active: true,
    disclaimer: null,
    created_at: today,
    updated_at: today,
    product_categories: mockCategories[1],
  },
  {
    id: "prod-6",
    category_id: "cat-frozen",
    name: "冷凍草蝦",
    description: "急速冷凍鎖鮮，500g/包。",
    price: 320,
    original_price: 380,
    stock: 40,
    image_url: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400",
    is_active: true,
    disclaimer: null,
    created_at: twoDaysAgo,
    updated_at: twoDaysAgo,
    product_categories: mockCategories[2],
  },
];

export const mockGroupBuyEvents: GroupBuyEvent[] = [
  {
    id: "gb-1",
    title: "春季保健團購",
    description: "精選保健食品限時優惠",
    banner_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
    banner_aspect_ratio: "16:9",
    is_homepage_featured: true,
    homepage_sort_order: 0,
    start_at: new Date(Date.now() - 86400000).toISOString(),
    end_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: "active",
    leader_user_id: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gb-2",
    title: "生鮮限時團購",
    description: "產地直送，滿額免運",
    banner_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
    banner_aspect_ratio: "16:9",
    is_homepage_featured: true,
    homepage_sort_order: 1,
    start_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    end_at: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: "active",
    leader_user_id: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockGroupBuyProducts: GroupBuyProduct[] = [
  {
    id: "gbp-1",
    group_buy_event_id: "gb-1",
    product_id: "prod-1",
    special_price: 480,
    max_quantity: 5,
    sold_count: 32,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    products: mockProducts[0],
  },
  {
    id: "gbp-2",
    group_buy_event_id: "gb-1",
    product_id: "prod-2",
    special_price: 750,
    max_quantity: 3,
    sold_count: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    products: mockProducts[1],
  },
  {
    id: "gbp-3",
    group_buy_event_id: "gb-2",
    product_id: "prod-5",
    special_price: 69,
    max_quantity: 10,
    sold_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    products: mockProducts[4],
  },
  {
    id: "gbp-4",
    group_buy_event_id: "gb-2",
    product_id: "prod-6",
    special_price: 279,
    max_quantity: 5,
    sold_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    products: mockProducts[5],
  },
];

export const mockArticles: Article[] = [
  {
    id: "art-1",
    title: "團購省錢小撇步",
    slug: "group-buy-tips",
    content: "<p>善用團購與預購，輕鬆省下日常開銷。</p>",
    cover_image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800",
    category_id: "cat-cleaning",
    status: "published",
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "art-2",
    title: "春季保健選購指南",
    slug: "spring-health-guide",
    content: "<p>春季換季，補充適當營養素維持活力。</p>",
    cover_image: null,
    category_id: "cat-seasonal",
    status: "draft",
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockVideos: Video[] = [
  {
    id: "vid-1",
    title: "一分鐘教你過篩麵粉",
    description: "快速掌握過篩技巧",
    summary: "新手必看的過篩小技巧",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
    product_id: "prod-1",
    view_count: 1250,
    is_active: true,
    slug: "sift-flour-1min",
    category: "一分鐘教你做",
    duration_seconds: 72,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "vid-2",
    title: "奶油乳化失敗怎麼救",
    description: "常見失敗與補救方式",
    summary: "乳化失敗別急著重來",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1594282486552-05b4d3f6515a?w=400",
    product_id: "prod-5",
    view_count: 890,
    is_active: true,
    slug: "butter-emulsion-fix",
    category: "烘焙技巧",
    duration_seconds: 160,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "vid-3",
    title: "烘焙入門：麵粉怎麼選",
    description: "高筋、中筋、低筋一次搞懂",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1574323828958-00e6c02e3b6a?w=400",
    view_count: 620,
    is_active: true,
    slug: "flour-basics",
    category: "完整教學",
    duration_seconds: 300,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "vid-4",
    title: "冷凍海鮮解凍技巧",
    description: "保留鮮味的正確做法",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail_url: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400",
    view_count: 430,
    is_active: true,
    slug: "seafood-thaw",
    category: "老師專欄",
    duration_seconds: 240,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockLivestreams: Livestream[] = [
  {
    id: "live-1",
    title: "週末團購直播",
    description: "限時優惠只在直播間",
    stream_url: null,
    thumbnail_url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400",
    host_user_id: MOCK_USER_ID,
    status: "scheduled",
    view_count: 320,
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    started_at: null,
    ended_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockOrderItems: OrderItem[] = [
  {
    id: "oi-1",
    order_id: "order-1",
    product_id: "prod-1",
    product_name: "綜合維他命 B 群",
    unit_price: 480,
    quantity: 2,
    subtotal: 960,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "oi-2",
    order_id: "order-2",
    product_id: "prod-1",
    product_name: "綜合維他命 B 群",
    unit_price: 480,
    quantity: 1,
    subtotal: 480,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "oi-3",
    order_id: "order-3",
    product_id: "prod-3",
    product_name: "保濕精華液",
    unit_price: 1280,
    quantity: 1,
    subtotal: 1280,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockOrders: Order[] = [
  {
    id: "order-1",
    order_number: "GB202506290001",
    user_id: MOCK_USER_ID,
    store_id: mockStores[0].id,
    group_buy_event_id: "gb-1",
    status: "awaiting_payment",
    subtotal: 960,
    discount: 0,
    shipping_fee: 0,
    store_credit_used: 0,
    total_amount: 960,
    referral_code: null,
    share_source_type: null,
    share_source_id: null,
    livestream_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_items: mockOrderItems,
    stores: mockStores[0],
  },
  {
    id: "order-2",
    order_number: "GB202506290002",
    user_id: MOCK_USER_ID,
    store_id: mockStores[0].id,
    group_buy_event_id: "gb-1",
    status: "ready_for_pickup",
    subtotal: 480,
    discount: 0,
    shipping_fee: 0,
    store_credit_used: 0,
    total_amount: 480,
    referral_code: "DEMO01",
    share_source_type: "product_share",
    share_source_id: "prod-1",
    livestream_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stores: mockStores[0],
  },
  {
    id: "order-3",
    order_number: "GB202506290003",
    user_id: MOCK_USER_ID,
    store_id: mockStores[0].id,
    group_buy_event_id: "gb-1",
    status: "completed",
    subtotal: 1280,
    discount: 0,
    shipping_fee: 0,
    store_credit_used: 0,
    total_amount: 1280,
    referral_code: null,
    share_source_type: null,
    share_source_id: null,
    livestream_id: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [mockOrderItems[1]],
    stores: mockStores[0],
  },
];

export const mockPaymentReports: PaymentReport[] = [
  {
    id: "pr-1",
    order_id: "order-1",
    user_id: MOCK_USER_ID,
    amount: 960,
    payment_method: "銀行轉帳",
    last_five_digits: "12345",
    proof_image_url: null,
    status: "pending",
    confirmed_by: null,
    confirmed_at: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockNotifications: UserNotification[] = [
  {
    id: "notif-1",
    user_id: MOCK_USER_ID,
    title: "歡迎使用門市團購",
    body: "探索最新團購優惠與直播活動！",
    is_read: false,
    link: "/group-buy",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockRewards: RewardRecord[] = [
  {
    id: "reward-1",
    user_id: MOCK_USER_ID,
    reward_type: "share_signup",
    amount: 100,
    status: "pending",
    source_type: "invite_link",
    source_id: null,
    reviewed_by: null,
    reviewed_at: null,
    issued_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockCommissionRules: CommissionRule[] = [
  {
    id: "cr-1",
    name: "一般推薦分潤",
    rule_type: "percentage",
    target_role: "member",
    calculation_base: "after_discount",
    percentage_rate: 5,
    fixed_amount: null,
    tiers_json: null,
    product_id: null,
    group_buy_event_id: null,
    livestream_id: null,
    min_order_amount: 0,
    max_commission_amount: 500,
    monthly_cap_amount: 5000,
    total_commission_cap_rate: null,
    settlement_wait_days: 7,
    is_multilevel_enabled: true,
    level_1_rate: 5,
    level_2_rate: 2,
    priority: 100,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockCommissionRecords: CommissionRecord[] = [
  {
    id: "cc-1",
    order_id: "order-1",
    order_item_id: null,
    referrer_user_id: MOCK_USER_ID,
    referred_user_id: "00000000-0000-4000-8000-000000000002",
    commission_rule_id: "cr-1",
    commission_role: "member",
    source_type: "referral_code",
    source_id: "DEMO01",
    level: 1,
    order_amount: 960,
    base_amount: 960,
    commission_rate: 5,
    commission_amount: 48,
    status: "pending_review",
    reason: "結帳推薦碼",
    reviewed_by: null,
    reviewed_at: null,
    issued_by: null,
    issued_at: null,
    payout_method: null,
    payout_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: "st-1",
    user_id: MOCK_USER_ID,
    order_id: "order-1",
    subject: "訂單付款問題",
    status: "open",
    priority: "medium",
    assigned_to: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockBanners = [
  { id: "b1", title: "春季保健團購", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800", link: "/group-buy/gb-1" },
  { id: "b2", title: "生鮮限時團購", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800", link: "/group-buy/gb-2" },
  { id: "b3", title: "直播限時優惠", image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800", link: "/live" },
];

/** Mutable in-memory store for demo mode */
export const mockStore = {
  orders: [...mockOrders],
  orderItems: [...mockOrderItems],
  productStock: Object.fromEntries(mockProducts.map((p) => [p.id, p.stock])) as Record<string, number>,
  notifications: [...mockNotifications],
  paymentReports: [...mockPaymentReports],
  commissionRecords: [...mockCommissionRecords],
  commissions: [...mockCommissionRecords],
  rewards: [...mockRewards],
  supportTickets: [...mockSupportTickets],
  shareTracking: [
    {
      id: "st-1",
      sharer_user_id: MOCK_USER_ID,
      share_type: "product",
      target_id: "prod-1",
      ref_code: "DEMO01",
      click_count: 12,
      signup_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  shareClicks: [] as Array<{
    id: string;
    sharer_user_id: string;
    share_type: string;
    target_id: string;
    ref_code: string;
    visitor_id?: string;
    clicked_at: string;
  }>,
};

export function getMockProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}

export function getMockRelatedProductsForVideo(videoId: string): Product[] {
  const video = mockVideos.find((v) => v.id === videoId);
  if (!video) return [];

  if (video.product_id) {
    const bound = getMockProductById(video.product_id);
    if (bound) {
      const sameCategory = mockProducts.filter(
        (p) => p.id !== bound.id && p.category_id === bound.category_id && p.is_active
      );
      return [bound, ...sameCategory].slice(0, 6);
    }
  }

  return mockProducts.filter((p) => p.is_active).slice(0, 4);
}

export function getMockGroupBuyEventById(id: string): GroupBuyEvent | undefined {
  return mockGroupBuyEvents.find((e) => e.id === id);
}

export function getMockGroupBuyEventsWithProducts() {
  return mockGroupBuyEvents.map((event) => ({
    ...event,
    group_buy_products: mockGroupBuyProducts.filter((p) => p.group_buy_event_id === event.id),
    stores: mockStores[0],
  }));
}
