/**
 * CHIMEIDIY smart-recipe DEMO seed/remove — shared by CLI scripts and admin API.
 * Uses service-role Supabase client (no Next-only imports).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEMO_KEY = "chimeidiy-smart-recipe-demo-v1";
export const DEMO_SLUG = "chocolate-nut-soft-cookies-demo";
export const DEMO_TITLE = "巧克力堅果軟餅乾｜CHIMEIDIY 智慧食譜示範";
export const DEMO_CATEGORY_SLUG = "cookie";

const DEMO_ALT = "DEMO 烘焙示意媒材｜正式上線前請換成 CHIMEIDIY 教學片與實拍圖";

/**
 * DEMO instructional video: no YouTube embeds.
 * Seed creates inactive placeholders until admin uploads MP4 to recipe-media.
 */

/** Soft chocolate-chip cookies — primary cover */
const COVER_IMAGE =
  "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1400&q=80";

const SUBMISSION_IMAGES = [
  "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
];

/** Baking-topic Unsplash stills (no picsum). Swap for studio shots before launch. */
const STORY_IMAGES = {
  crossSection:
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80",
  dough:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
  butterSoft:
    "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80",
  butterHard:
    "https://images.unsplash.com/photo-1628088062853-85c5a8d0f8c3?auto=format&fit=crop&w=800&q=80",
  butterMelted:
    "https://images.unsplash.com/photo-1621335830559-9b33ea7b9f9c?auto=format&fit=crop&w=800&q=80",
  egg1:
    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3e8f?auto=format&fit=crop&w=800&q=80",
  egg2:
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80",
  egg3:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
  emulsionOk:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
  emulsionSplit:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  doughOk:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  doughDry:
    "https://images.unsplash.com/photo-1574323828958-00e6c02e3b6a?auto=format&fit=crop&w=800&q=80",
  doughSticky:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
  mixins1:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  mixins2:
    "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
  mixins3:
    "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=800&q=80",
  portion1:
    "https://images.unsplash.com/photo-1590080875515-58e70ffe4b70?auto=format&fit=crop&w=800&q=80",
  portion2:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  portion3:
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
  bakeUnder:
    "https://images.unsplash.com/photo-1590080875515-58e70ffe4b70?auto=format&fit=crop&w=800&q=80",
  bakePerfect: COVER_IMAGE,
  bakeOver:
    "https://images.unsplash.com/photo-1486427944299-d2390fdfb8b4?auto=format&fit=crop&w=800&q=80",
  finish:
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1400&q=80",
  chapter2:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80",
  chapter3:
    "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80",
  flour:
    "https://images.unsplash.com/photo-1574323828958-00e6c02e3b6a?auto=format&fit=crop&w=800&q=80",
  chocolate:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  nuts:
    "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
  spatula:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
  scale:
    "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
  gift:
    "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80",
};

/** Listed on /dev/recipe-demo — production swap checklist */
export const DEMO_MEDIA_PENDING_REPLACE = [
  "完整教學影片：尚未上傳正式 MP4（seed 僅建立 inactive placeholder）",
  "步驟影片：Step 影片待後台上傳後再啟用",
  "Story Page 影片：目前以圖片＋文字顯示，上傳後綁定並設 clip start/end",
  "封面與章節全版圖（目前為 Unsplash 示意，需換實拍）",
  "[DEMO] 商品圖（需換成實際上架 SKU 實拍）",
];

export type DemoRecipeCounts = {
  ingredients: number;
  steps: number;
  tools: number;
  preparations: number;
  media: number;
  markers: number;
  aiPrompts: number;
  faqs: number;
  recommendations: number;
  discussions: number;
  submissions: number;
  storyChapters: number;
  storyPages: number;
  storyPageMedia: number;
};

export type DemoVideoInventoryItem = {
  id: string;
  scope: "full" | "step" | "other";
  stepId: string | null;
  stepNumber: number | null;
  label: string;
  sourceType: string;
  processingStatus: string | null;
  uploadStatus: string | null;
  isActive: boolean;
  isDemo: boolean;
  hasFile: boolean;
  storagePath: string | null;
  originalFilename: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  urlPreview: string | null;
  status: "pending" | "uploaded";
};

export type DemoRecipeStatus = {
  exists: boolean;
  recipeId: string | null;
  slug: string;
  demoKey: string;
  counts: DemoRecipeCounts;
  videos?: DemoVideoInventoryItem[];
  missingOfficialVideos?: boolean;
  checks?: {
    bucketConfigured: boolean;
    activeYoutubeMedia: number;
    placeholderCount: number;
    uploadedOfficialCount: number;
    noYoutubeInAdminForm: true;
  };
};

export type DemoSeedResult = {
  recipeId: string;
  slug: string;
  demoKey: string;
  counts: DemoRecipeCounts;
  createdDemoProducts: number;
};

const EMPTY_COUNTS: DemoRecipeCounts = {
  ingredients: 0,
  steps: 0,
  tools: 0,
  preparations: 0,
  media: 0,
  markers: 0,
  aiPrompts: 0,
  faqs: 0,
  recommendations: 0,
  discussions: 0,
  submissions: 0,
  storyChapters: 0,
  storyPages: 0,
  storyPageMedia: 0,
};

type StepSeed = {
  step_number: number;
  title: string;
  description: string;
  chef_notes: string;
  common_failures: string[];
  recovery_actions: string[];
  duration_seconds?: number | null;
  temperature_value?: number | null;
  temperature_unit?: string | null;
  timer_enabled?: boolean;
  ai_context?: string;
  ai_keywords?: string[];
  prompts: Array<{ label: string; prompt: string }>;
};

const STEP_SEEDS: StepSeed[] = [
  {
    step_number: 1,
    title: "奶油與糖混合",
    description:
      "將回溫無鹽奶油與細砂糖、二砂糖放入攪拌盆，用刮刀或攪拌器攪至顏色略淡、體積膨脹，呈現輕盈乳霜狀。",
    chef_notes: "奶油應可輕易按下凹陷、不融化流油。室溫約 18–22°C 最適合。",
    common_failures: ["奶油過硬無法融合", "奶油融化呈油狀", "糖沒有拌勻"],
    recovery_actions: ["過硬可 macroscopic加熱 5–8 秒再拌", "融化則冷藏 10 分鐘再攪", "用刮刀壓拌直到無乾糖粒"],
    duration_seconds: 180,
    ai_context: "本步驟重點是奶油軟硬度與糖融合狀態。",
    ai_keywords: ["奶油", "軟硬", "乳化"],
    prompts: [
      { label: "奶油要軟到什麼程度？", prompt: "奶油要軟到什麼程度？" },
      { label: "奶油融化了怎麼辦？", prompt: "奶油融化了怎麼辦？" },
      { label: "可以使用植物油嗎？", prompt: "可以使用植物油嗎？" },
      { label: "為什麼奶油與糖無法融合？", prompt: "為什麼奶油與糖無法融合？" },
    ],
  },
  {
    step_number: 2,
    title: "分次加入蛋液",
    description:
      "將全蛋液分 3–4 次加入奶油糖霜，每次拌至完全吸收再加下一批，直到乳化均勻、表面光滑有光澤。",
    chef_notes: "蛋液也需回溫。一次倒入過多容易油水分離。",
    common_failures: ["油水分離", "蛋液一次倒入過多", "出現粗顆粒"],
    recovery_actions: ["分離時加一小匙麵粉拌勻", "改分次加入並充分攪拌", "顆粒可繼續低速拌至平滑"],
    duration_seconds: 240,
    ai_context: "本步驟重點是分次加蛋與乳化判斷。",
    ai_keywords: ["蛋液", "乳化", "油水分離"],
    prompts: [
      { label: "油水分離怎麼補救？", prompt: "油水分離怎麼補救？" },
      { label: "蛋液可以一次加入嗎？", prompt: "蛋液可以一次加入嗎？" },
      { label: "雞蛋需要回溫多久？", prompt: "雞蛋需要回溫多久？" },
      { label: "出現顆粒正常嗎？", prompt: "出現顆粒正常嗎？" },
    ],
  },
  {
    step_number: 3,
    title: "加入粉類",
    description:
      "將低筋麵粉、中筋麵粉、鹽、小蘇打粉、泡打粉過篩後加入，用刮刀切拌至無乾粉即可，避免過度攪拌。",
    chef_notes: "看到無乾粉即可停手。過度攪拌會讓餅乾變硬。",
    common_failures: ["麵糰過乾", "麵糰過黏", "攪拌過度"],
    recovery_actions: ["過乾可加 5–10g 蛋液", "過黏可撒少許麵粉", "已過度則避免再攪，直接整形"],
    duration_seconds: 180,
    ai_context: "本步驟重點是粉類比例與切拌手法。",
    ai_keywords: ["麵粉", "切拌", "乾粉"],
    prompts: [
      { label: "為什麼麵糰很乾？", prompt: "為什麼麵糰很乾？" },
      { label: "為什麼麵糰非常黏？", prompt: "為什麼麵糰非常黏？" },
      { label: "可以全部使用低筋麵粉嗎？", prompt: "可以全部使用低筋麵粉嗎？" },
      { label: "怎麼判斷攪拌過度？", prompt: "怎麼判斷攪拌過度？" },
    ],
  },
  {
    step_number: 4,
    title: "加入巧克力與堅果",
    description:
      "將綜合堅果、巧克力、巧克力豆倒入麵糰，用刮刀快速拌勻，堅果與巧克力需均勻分布。",
    chef_notes: "堅果可先輕烤更香。巧克力勿過碎以免整團融化。",
    common_failures: ["堅果分布不均", "巧克力融化沾手", "過度攪拌"],
    recovery_actions: ["再輕輕翻拌幾下", "手沾粉再整形", "停止攪拌立刻冷藏"],
    duration_seconds: 120,
    ai_context: "本步驟可省略堅果；過敏者務必替換。",
    ai_keywords: ["堅果", "巧克力", "過敏"],
    prompts: [
      { label: "可以不放堅果嗎？", prompt: "可以不放堅果嗎？" },
      { label: "可以使用鈕扣巧克力嗎？", prompt: "可以使用鈕扣巧克力嗎？" },
      { label: "堅果需要先烤嗎？", prompt: "堅果需要先烤嗎？" },
      { label: "巧克力融化怎麼辦？", prompt: "巧克力融化怎麼辦？" },
    ],
  },
  {
    step_number: 5,
    title: "分割與冷藏",
    description:
      "用分割勺將麵糰分成約 12 份，滾圓後間隔排放於鋪烘焙紙的烤盤，冷藏 30 分鐘定型。",
    chef_notes: "冷藏可減少攤平、口感更佳。可隔夜冷藏，密封防乾。",
    common_failures: ["份量不均", "麵糰太黏難整形", "省略冷藏導致攤太開"],
    recovery_actions: ["用電子秤分份", "手沾水或粉再滾圓", "至少冷藏 15 分鐘再烤"],
    duration_seconds: 1800,
    timer_enabled: true,
    ai_context: "本步驟有 30 分鐘冷藏計時。",
    ai_keywords: ["冷藏", "分割", "定型"],
    prompts: [
      { label: "沒時間冷藏可以直接烤嗎？", prompt: "沒時間冷藏可以直接烤嗎？" },
      { label: "麵糰可以冷藏隔夜嗎？", prompt: "麵糰可以冷藏隔夜嗎？" },
      { label: "每顆要分多大？", prompt: "每顆要分多大？" },
      { label: "麵糰太黏怎麼整形？", prompt: "麵糰太黏怎麼整形？" },
    ],
  },
  {
    step_number: 6,
    title: "烘烤",
    description:
      "烤箱預熱至 170°C，放入餅乾烘烤約 12 分鐘。邊緣上色、中心仍略軟即可出爐；可依烤箱再加 1 分鐘。",
    chef_notes: "出爐後會繼續受熱定型，不要烤到整顆硬才拿出來。",
    common_failures: ["溫度不準", "餅乾攤太平", "烘烤過度"],
    recovery_actions: ["用烤箱溫度計校正", "下次加強冷藏", "縮短 1–2 分鐘並提早觀察"],
    duration_seconds: 720,
    temperature_value: 170,
    temperature_unit: "C",
    timer_enabled: true,
    ai_context: "本步驟重點是 170°C 與出爐判斷。",
    ai_keywords: ["烘烤", "170", "出爐"],
    prompts: [
      { label: "怎麼判斷可以出爐？", prompt: "怎麼判斷可以出爐？" },
      { label: "我的烤箱溫度怎麼調？", prompt: "我的烤箱溫度怎麼調？" },
      { label: "餅乾攤太平怎麼辦？", prompt: "餅乾攤太平怎麼辦？" },
      { label: "中間看起來沒熟正常嗎？", prompt: "中間看起來沒熟正常嗎？" },
    ],
  },
  {
    step_number: 7,
    title: "冷卻與完成判斷",
    description:
      "出爐後在烤盤靜置 5 分鐘，再移至網架完全冷卻。冷卻後外層微酥、內部柔軟即為成功。",
    chef_notes: "趁熱包裝會回潮變軟甚至發霉，務必冷卻後再裝袋。",
    common_failures: ["冷卻不足就包裝", "黏在烘焙紙上", "冷掉過硬"],
    recovery_actions: ["再冷卻 10–15 分鐘", "烘焙紙一併掀起慢慢撕離", "密封袋放一片吐司回軟"],
    duration_seconds: 900,
    ai_context: "本步驟重點是冷卻完成判斷與保存。",
    ai_keywords: ["冷卻", "保存", "柔軟"],
    prompts: [
      { label: "為什麼冷掉變硬？", prompt: "為什麼冷掉變硬？" },
      { label: "餅乾黏在烘焙紙上怎麼辦？", prompt: "餅乾黏在烘焙紙上怎麼辦？" },
      { label: "可以趁熱包裝嗎？", prompt: "可以趁熱包裝嗎？" },
      { label: "怎麼恢復柔軟？", prompt: "怎麼恢復柔軟？" },
    ],
  },
];

type IngredientSeed = {
  group_name: string;
  name: string;
  amount: string;
  unit: string;
  quantity_numeric: number;
  sort_order: number;
};

const INGREDIENTS: IngredientSeed[] = [
  { group_name: "餅乾麵糰", name: "無鹽奶油", amount: "200", unit: "g", quantity_numeric: 200, sort_order: 1 },
  { group_name: "餅乾麵糰", name: "細砂糖", amount: "30", unit: "g", quantity_numeric: 30, sort_order: 2 },
  { group_name: "餅乾麵糰", name: "二砂糖", amount: "75", unit: "g", quantity_numeric: 75, sort_order: 3 },
  { group_name: "餅乾麵糰", name: "全蛋液", amount: "110", unit: "g", quantity_numeric: 110, sort_order: 4 },
  { group_name: "餅乾麵糰", name: "低筋麵粉", amount: "120", unit: "g", quantity_numeric: 120, sort_order: 5 },
  { group_name: "餅乾麵糰", name: "中筋麵粉", amount: "200", unit: "g", quantity_numeric: 200, sort_order: 6 },
  { group_name: "餅乾麵糰", name: "鹽", amount: "3", unit: "g", quantity_numeric: 3, sort_order: 7 },
  { group_name: "餅乾麵糰", name: "小蘇打粉", amount: "3", unit: "g", quantity_numeric: 3, sort_order: 8 },
  { group_name: "餅乾麵糰", name: "泡打粉", amount: "4", unit: "g", quantity_numeric: 4, sort_order: 9 },
  { group_name: "拌入材料", name: "綜合堅果", amount: "180", unit: "g", quantity_numeric: 180, sort_order: 10 },
  { group_name: "拌入材料", name: "巧克力", amount: "150", unit: "g", quantity_numeric: 150, sort_order: 11 },
  { group_name: "拌入材料", name: "巧克力豆", amount: "50", unit: "g", quantity_numeric: 50, sort_order: 12 },
];

const TOOLS = ["刮刀", "電子秤", "攪拌盆", "烤箱", "烘焙紙", "分割勺"];

const PREPARATIONS = [
  { title: "奶油回溫", content: "無鹽奶油提前放置室溫，軟到可輕壓凹陷但不融化。" },
  { title: "材料秤重", content: "依配方將所有材料秤好分裝，粉類可先混合過篩。" },
  { title: "烤箱預熱", content: "烘烤前預熱烤箱至 170°C，預留足夠時間讓溫度穩定。" },
];

const FAQS = [
  {
    question: "一定要冷藏 30 分鐘嗎？",
    answer: "建議至少冷藏 15–30 分鐘，可減少攤平並讓口感更佳。時間緊迫可縮短，但成品可能較扁。",
  },
  {
    question: "可以用有鹽奶油嗎？",
    answer: "可以，但請將配方中的鹽減半或不加，避免過鹹。",
  },
  {
    question: "堅果過敏怎麼辦？",
    answer:
      "【食品安全提醒】可完全省略堅果或以種子類（如南瓜籽）替換，並避免交叉污染。過敏體質請依個人狀況謹慎食用。",
  },
  {
    question: "如何保存？",
    answer: "完全冷卻後密封：常溫約 2 天、冷藏約 5 天、冷凍約 14 天。食用前可回溫。",
  },
];

type ProductNeed = {
  keywords: string[];
  demoName: string;
  recommendation_type: "ingredient" | "tool" | "packaging" | "teacher_choice";
  reason: string;
  price: number;
  linkIngredientName?: string;
  imageUrl?: string;
};

const PRODUCT_NEEDS: ProductNeed[] = [
  {
    keywords: ["無鹽奶油", "奶油"],
    demoName: "[DEMO] 無鹽奶油 200g",
    recommendation_type: "ingredient",
    reason: "配方主油脂，建議使用無鹽奶油方便控制鹹度。",
    price: 89,
    linkIngredientName: "無鹽奶油",
    imageUrl: STORY_IMAGES.butterSoft,
  },
  {
    keywords: ["低筋麵粉", "低筋"],
    demoName: "[DEMO] 低筋麵粉 1kg",
    recommendation_type: "ingredient",
    reason: "提供柔軟口感的粉類基礎。",
    price: 65,
    linkIngredientName: "低筋麵粉",
    imageUrl: STORY_IMAGES.flour,
  },
  {
    keywords: ["中筋麵粉", "中筋", "麵粉"],
    demoName: "[DEMO] 中筋麵粉 1kg",
    recommendation_type: "ingredient",
    reason: "與低筋搭配，餅乾更有結構。",
    price: 55,
    linkIngredientName: "中筋麵粉",
    imageUrl: STORY_IMAGES.flour,
  },
  {
    keywords: ["巧克力豆"],
    demoName: "[DEMO] 巧克力豆 200g",
    recommendation_type: "ingredient",
    reason: "拌入後受熱微融，增加層次。",
    price: 120,
    linkIngredientName: "巧克力豆",
    imageUrl: STORY_IMAGES.chocolate,
  },
  {
    keywords: ["巧克力"],
    demoName: "[DEMO] 烘焙巧克力磚",
    recommendation_type: "ingredient",
    reason: "切塊拌入，入口有明顯巧克力塊。",
    price: 150,
    linkIngredientName: "巧克力",
    imageUrl: STORY_IMAGES.chocolate,
  },
  {
    keywords: ["堅果", "綜合堅果"],
    demoName: "[DEMO] 綜合烘焙堅果",
    recommendation_type: "ingredient",
    reason: "增加香氣與口感對比。",
    price: 180,
    linkIngredientName: "綜合堅果",
    imageUrl: STORY_IMAGES.nuts,
  },
  {
    keywords: ["刮刀", "矽膠刮刀"],
    demoName: "[DEMO] 矽膠刮刀",
    recommendation_type: "tool",
    reason: "切拌粉類與收刮盆邊好用。",
    price: 79,
    imageUrl: STORY_IMAGES.spatula,
  },
  {
    keywords: ["烘焙紙"],
    demoName: "[DEMO] 烘焙紙",
    recommendation_type: "tool",
    reason: "防沾、好撕離，烘烤必備。",
    price: 49,
    imageUrl: COVER_IMAGE,
  },
  {
    keywords: ["電子秤", "秤"],
    demoName: "[DEMO] 廚房電子秤",
    recommendation_type: "tool",
    reason: "精準秤重才能穩定倍率換算。",
    price: 299,
    imageUrl: STORY_IMAGES.scale,
  },
  {
    keywords: ["分割勺", "冰淇淋勺"],
    demoName: "[DEMO] 分割勺",
    recommendation_type: "tool",
    reason: "份量一致，烘烤更均勻。",
    price: 99,
    imageUrl: STORY_IMAGES.portion1,
  },
  {
    keywords: ["餅乾袋", "包裝袋"],
    demoName: "[DEMO] 餅乾袋",
    recommendation_type: "packaging",
    reason: "冷卻後分裝送禮或保存。",
    price: 39,
    imageUrl: STORY_IMAGES.gift,
  },
  {
    keywords: ["餅乾禮盒", "禮盒"],
    demoName: "[DEMO] 餅乾禮盒",
    recommendation_type: "teacher_choice",
    reason: "老師推薦的送禮包裝組合。",
    price: 69,
    imageUrl: STORY_IMAGES.gift,
  },
];

type StoryMediaSeed = {
  media_type: "image" | "video" | "keyframe";
  source_type?: "upload" | "storage" | "cdn";
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  duration_seconds?: number | null;
  sort_order?: number;
  metadata?: Record<string, unknown>;
};

type StoryPageSeed = {
  page_type: string;
  layout_type: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  alignment?: string | null;
  step_number?: number | null;
  content_config?: Record<string, unknown>;
  completion_config?: Record<string, unknown>;
  ai_context?: string | null;
  media?: StoryMediaSeed[];
};

type StoryChapterSeed = {
  chapter_number: number;
  title: string;
  subtitle: string;
  cover_image: string;
  pages: StoryPageSeed[];
};

/** Story video pages use still poster until real MP4 is uploaded in admin. */
function videoClip(
  start: number,
  end: number,
  caption: string
): StoryMediaSeed {
  return {
    media_type: "image",
    source_type: "cdn",
    url: COVER_IMAGE,
    thumbnail_url: COVER_IMAGE,
    caption: `${caption}（影片待上傳 · 示意 ${start}-${end}s）`,
    alt_text: DEMO_ALT,
    duration_seconds: null,
    metadata: {
      start_seconds: start,
      end_seconds: end,
      pending_video_upload: true,
    },
  };
}

function imageMedia(
  url: string,
  caption?: string,
  sort_order = 0
): StoryMediaSeed {
  return {
    media_type: "image",
    url,
    thumbnail_url: url,
    caption: caption ?? null,
    alt_text: DEMO_ALT,
    sort_order,
  };
}

const STORY_CHAPTERS: StoryChapterSeed[] = [
  {
    chapter_number: 1,
    title: "準備開始",
    subtitle: "認識這份餅乾，備齊材料與器具",
    cover_image: COVER_IMAGE,
    pages: [
      {
        page_type: "cover",
        layout_type: "full_bleed",
        title: "巧克力堅果軟餅乾",
        subtitle: "外酥內軟 · 可跟做的智慧食譜示範",
        eyebrow: "CHIMEIDIY DEMO",
        alignment: "bottom_left",
        content_config: {
          overlayOpacity: 0.35,
          ctaPrimary: "開始閱讀",
          chapterAccent: "#5c3d2e",
        },
        media: [imageMedia(COVER_IMAGE, "成品示意封面")],
      },
      {
        page_type: "full_image",
        layout_type: "full_bleed",
        title: "成品剖面",
        subtitle: "中心柔軟濕潤，巧克力微融",
        body: "冷卻後外層微酥、內部仍帶濕潤口感，是這份配方的目標狀態。",
        alignment: "bottom_left",
        content_config: { overlayOpacity: 0.3 },
        media: [imageMedia(STORY_IMAGES.crossSection, "剖面示意")],
      },
      {
        page_type: "introduction",
        layout_type: "split_image_text",
        title: "這份食譜會學到什麼",
        body: "從奶油軟化判斷、蛋液乳化、粉類切拌，到冷藏定型與出爐時機——每一步都有影片、分鏡與完成檢查，可實際跟著做。",
        content_config: {
          splitDirection: "image_left",
          ctaPrimary: "下一步：備料",
        },
        media: [imageMedia(STORY_IMAGES.dough, "麵糰示意")],
      },
      {
        page_type: "ingredients",
        layout_type: "list",
        title: "材料清單",
        subtitle: "約 12 片 · 可於前台調整倍率",
        body: "餅乾麵糰與拌入材料已依 DEMO 配方列出；缺料可從推薦商品補齊。",
        content_config: {
          ctaPrimary: "材料已備齊",
          ctaSecondary: "稍後再看",
        },
      },
      {
        page_type: "tools",
        layout_type: "list",
        title: "器具清單",
        body: "刮刀、電子秤、攪拌盆、烤箱、烘焙紙、分割勺——備齊後再進入製作。",
        content_config: { ctaPrimary: "器具已備齊" },
      },
      {
        page_type: "preparation",
        layout_type: "list",
        title: "前置作業",
        subtitle: "開始前請完成以下準備",
        body: "奶油回溫、材料秤重、烤箱預熱時機會再提示。",
        content_config: {
          guidedRequired: true,
          ctaPrimary: "準備完成，開始製作",
        },
        completion_config: {
          checklist: [
            { id: "butter", text: "奶油已回溫至可輕壓凹陷" },
            { id: "weigh", text: "所有材料已秤重分裝" },
            { id: "paper", text: "烤盤已鋪好烘焙紙" },
          ],
          continueLabel: "開始製作麵糰",
        },
      },
      {
        page_type: "scale",
        layout_type: "list",
        title: "配方倍率",
        subtitle: "可依份量調整",
        body: "前台支援 0.5×／1×／1.5×／2× 換算。示範預設 1×（約 12 片）。",
        content_config: {
          ctaPrimary: "使用 1× 繼續",
          ctaSecondary: "稍後調整",
        },
      },
    ],
  },
  {
    chapter_number: 2,
    title: "製作麵糰",
    subtitle: "乳化、切拌、拌入巧克力與堅果",
    cover_image: STORY_IMAGES.chapter2,
    pages: [
      {
        page_type: "chapter",
        layout_type: "full_bleed",
        title: "第二章｜製作麵糰",
        subtitle: "看狀態、播片段、完成再翻頁",
        alignment: "center",
        content_config: {
          overlayOpacity: 0.4,
          chapterAccent: "#6b4423",
          ctaPrimary: "進入步驟",
        },
        media: [imageMedia(STORY_IMAGES.chapter2, "麵糰章節")],
      },
      {
        page_type: "comparison",
        layout_type: "comparison",
        title: "奶油正確軟化狀態",
        subtitle: "Step 1 開始前",
        body: "請對照三種狀態，選出最適合攪拌的奶油。",
        step_number: 1,
        ai_context: "引導使用者判斷奶油軟硬度：可輕壓凹陷但不融化。",
        content_config: {
          guidedRequired: true,
          comparisonPrompt: "哪一個是正確的回溫奶油？",
          comparisonOptions: [
            {
              id: "hard",
              label: "過硬",
              caption: "按下幾乎無凹陷",
              imageUrl: STORY_IMAGES.butterHard,
              outcome: "wrong",
              aiPrompt: "奶油太硬怎麼辦？",
            },
            {
              id: "soft",
              label: "剛好",
              caption: "輕壓凹陷、不流油",
              imageUrl: STORY_IMAGES.butterSoft,
              outcome: "correct",
            },
            {
              id: "melted",
              label: "過軟／融化",
              caption: "表面油亮、易塌",
              imageUrl: STORY_IMAGES.butterMelted,
              outcome: "wrong",
              aiPrompt: "奶油融化了怎麼辦？",
            },
          ],
          ctaPrimary: "狀態正確，繼續",
        },
        media: [
          imageMedia(STORY_IMAGES.butterHard, "過硬", 0),
          imageMedia(STORY_IMAGES.butterSoft, "剛好", 1),
          imageMedia(STORY_IMAGES.butterMelted, "融化", 2),
        ],
      },
      {
        page_type: "step_video",
        layout_type: "video_lead",
        title: "奶油與糖混合",
        subtitle: "攪至顏色略淡、體積膨脹",
        body: "用刮刀或攪拌器將回溫奶油與細砂糖、二砂糖拌成輕盈乳霜狀。",
        step_number: 1,
        ai_context: "本步驟重點是奶油軟硬度與糖融合狀態。",
        content_config: {
          startSeconds: 0,
          endSeconds: 8,
          ctaPrimary: "看完影片，去做",
        },
        media: [videoClip(0, 8, "奶油與糖混合片段")],
      },
      {
        page_type: "checkpoint",
        layout_type: "checkpoint",
        title: "Step 1 完成檢查",
        body: "確認乳霜狀混合物再進入加蛋。",
        step_number: 1,
        content_config: {
          guidedRequired: true,
          ctaPrimary: "完成，下一步",
          ctaSecondary: "還不確定，問 AI",
        },
        completion_config: {
          checklist: [
            { id: "pale", text: "顏色略淡、體積變大" },
            { id: "no_grain", text: "無明顯乾糖粒" },
            { id: "not_oily", text: "未呈油水分離" },
          ],
          mismatchLabel: "狀態不對？",
          mismatchAiPrompt: "奶油與糖拌完看起來不對，可能是什麼問題？",
        },
      },
      {
        page_type: "gallery",
        layout_type: "gallery",
        title: "分次加入蛋液",
        subtitle: "分 3–4 次，每次充分吸收",
        step_number: 2,
        content_config: {
          galleryMode: "swipe",
          galleryCount: 3,
          frames: [
            { id: "e1", number: 1, title: "第一批", caption: "少量倒入，刮刀壓拌", imageUrl: STORY_IMAGES.egg1 },
            { id: "e2", number: 2, title: "第二批", caption: "吸收後再加", imageUrl: STORY_IMAGES.egg2 },
            { id: "e3", number: 3, title: "第三批", caption: "表面漸光滑", imageUrl: STORY_IMAGES.egg3 },
          ],
          ctaPrimary: "分鏡看完，看影片",
        },
        media: [
          imageMedia(STORY_IMAGES.egg1, "第一批蛋液", 0),
          imageMedia(STORY_IMAGES.egg2, "第二批蛋液", 1),
          imageMedia(STORY_IMAGES.egg3, "第三批蛋液", 2),
        ],
      },
      {
        page_type: "step_video",
        layout_type: "video_lead",
        title: "蛋液乳化影片",
        subtitle: "直到表面光滑有光澤",
        step_number: 2,
        ai_context: "本步驟重點是分次加蛋與乳化判斷。",
        content_config: {
          startSeconds: 3,
          endSeconds: 15,
          ctaPrimary: "對照乳化狀態",
        },
        media: [videoClip(3, 15, "蛋液乳化片段")],
      },
      {
        page_type: "comparison",
        layout_type: "comparison",
        title: "正確／油水分離比較",
        body: "乳化成功應光滑有光澤；若表面一層油需立刻補救。",
        step_number: 2,
        content_config: {
          guidedRequired: true,
          comparisonPrompt: "你的麵糊比較像哪一種？",
          comparisonOptions: [
            {
              id: "ok",
              label: "乳化成功",
              caption: "光滑有光澤",
              imageUrl: STORY_IMAGES.emulsionOk,
              outcome: "correct",
            },
            {
              id: "split",
              label: "油水分離",
              caption: "表面浮油、顆粒感",
              imageUrl: STORY_IMAGES.emulsionSplit,
              outcome: "wrong",
              aiPrompt: "油水分離怎麼補救？",
            },
          ],
          ctaPrimary: "狀態正確，繼續",
        },
        media: [
          imageMedia(STORY_IMAGES.emulsionOk, "乳化成功", 0),
          imageMedia(STORY_IMAGES.emulsionSplit, "油水分離", 1),
        ],
      },
      {
        page_type: "checkpoint",
        layout_type: "checkpoint",
        title: "Step 2 完成檢查",
        step_number: 2,
        content_config: { guidedRequired: true, ctaPrimary: "完成，加粉類" },
        completion_config: {
          checklist: [
            { id: "smooth", text: "表面光滑無浮油" },
            { id: "absorbed", text: "蛋液已完全吸收" },
          ],
          mismatchAiPrompt: "加蛋後麵糊狀態不對，該怎麼辦？",
        },
      },
      {
        page_type: "step_video",
        layout_type: "video_lead",
        title: "加入粉類",
        subtitle: "刮刀切拌至無乾粉",
        body: "過篩粉類後切拌，看到無乾粉即可停手，避免過度攪拌。",
        step_number: 3,
        content_config: {
          startSeconds: 5,
          endSeconds: 18,
          ctaPrimary: "對照麵糰狀態",
        },
        media: [videoClip(5, 18, "加粉切拌片段")],
      },
      {
        page_type: "comparison",
        layout_type: "comparison",
        title: "正確麵糰狀態",
        step_number: 3,
        content_config: {
          guidedRequired: true,
          comparisonPrompt: "切拌完成後比較像哪一種？",
          comparisonOptions: [
            {
              id: "ok",
              label: "剛好",
              caption: "無乾粉、略可塑形",
              imageUrl: STORY_IMAGES.doughOk,
              outcome: "correct",
            },
            {
              id: "dry",
              label: "過乾",
              caption: "碎裂難成團",
              imageUrl: STORY_IMAGES.doughDry,
              outcome: "wrong",
              aiPrompt: "為什麼麵糰很乾？",
            },
            {
              id: "sticky",
              label: "過黏",
              caption: "嚴重沾手",
              imageUrl: STORY_IMAGES.doughSticky,
              outcome: "wrong",
              aiPrompt: "為什麼麵糰非常黏？",
            },
          ],
        },
        media: [
          imageMedia(STORY_IMAGES.doughOk, "剛好", 0),
          imageMedia(STORY_IMAGES.doughDry, "過乾", 1),
          imageMedia(STORY_IMAGES.doughSticky, "過黏", 2),
        ],
      },
      {
        page_type: "gallery",
        layout_type: "gallery",
        title: "加入巧克力與堅果",
        subtitle: "快速翻拌，均勻分布",
        step_number: 4,
        content_config: {
          galleryMode: "grid_2x2",
          galleryCount: 3,
          frames: [
            { id: "m1", title: "倒入", caption: "堅果與巧克力一次倒入", imageUrl: STORY_IMAGES.mixins1 },
            { id: "m2", title: "翻拌", caption: "刮刀由外向內翻", imageUrl: STORY_IMAGES.mixins2 },
            { id: "m3", title: "完成", caption: "顆粒分布均勻即可", imageUrl: STORY_IMAGES.mixins3 },
          ],
          ctaPrimary: "拌勻後進入整形",
        },
        ai_context: "【食品安全】堅果過敏者請省略堅果。",
        media: [
          imageMedia(STORY_IMAGES.mixins1, "倒入", 0),
          imageMedia(STORY_IMAGES.mixins2, "翻拌", 1),
          imageMedia(STORY_IMAGES.mixins3, "完成", 2),
        ],
      },
    ],
  },
  {
    chapter_number: 3,
    title: "整形與烘烤",
    subtitle: "分割、冷藏、預熱與出爐判斷",
    cover_image: STORY_IMAGES.chapter3,
    pages: [
      {
        page_type: "chapter",
        layout_type: "split_image_text",
        title: "第三章｜整形與烘烤",
        subtitle: "份量一致、冷藏定型、掌握出爐時機",
        content_config: {
          splitDirection: "image_right",
          ctaPrimary: "開始分割",
          chapterAccent: "#8b5a2b",
        },
        media: [imageMedia(STORY_IMAGES.chapter3, "烘烤章節")],
      },
      {
        page_type: "gallery",
        layout_type: "gallery",
        title: "分割麵糰",
        subtitle: "約 12 份，滾圓排放",
        step_number: 5,
        content_config: {
          galleryMode: "row",
          galleryCount: 3,
          frames: [
            { id: "p1", number: 1, title: "舀取", caption: "分割勺取份", imageUrl: STORY_IMAGES.portion1 },
            { id: "p2", number: 2, title: "滾圓", caption: "手沾粉輕輕滾圓", imageUrl: STORY_IMAGES.portion2 },
            { id: "p3", number: 3, title: "排盤", caption: "預留間距防沾黏", imageUrl: STORY_IMAGES.portion3 },
          ],
        },
        media: [
          imageMedia(STORY_IMAGES.portion1, "舀取", 0),
          imageMedia(STORY_IMAGES.portion2, "滾圓", 1),
          imageMedia(STORY_IMAGES.portion3, "排盤", 2),
        ],
      },
      {
        page_type: "timer",
        layout_type: "timer",
        title: "冷藏 30 分鐘",
        subtitle: "定型、減少攤平",
        body: "密封防乾。時間緊迫至少冷藏 15 分鐘。",
        step_number: 5,
        content_config: {
          guidedRequired: true,
          timerSeconds: 1800,
          timerLabel: "冷藏定型",
          ctaPrimary: "計時結束，預熱烤箱",
          skipAllowed: false,
        },
      },
      {
        page_type: "temperature",
        layout_type: "split_image_text",
        title: "烤箱預熱 170°C",
        body: "預熱至溫度穩定再放入。小烤箱受熱較快，可略降溫或提早觀察。",
        step_number: 6,
        content_config: {
          splitDirection: "image_top",
          temperatureLabel: "烘烤溫度",
          temperatureValue: 170,
          temperatureUnit: "C",
          ctaPrimary: "溫度就緒，開始烘烤",
        },
        media: [imageMedia(COVER_IMAGE, "烤箱示意")],
      },
      {
        page_type: "step_video",
        layout_type: "video_lead",
        title: "烘烤影片",
        subtitle: "約 12 分鐘 · 觀察邊緣上色",
        step_number: 6,
        content_config: {
          startSeconds: 2,
          endSeconds: 14,
          ctaPrimary: "對照出爐狀態",
        },
        media: [videoClip(2, 14, "烘烤片段")],
      },
      {
        page_type: "comparison",
        layout_type: "comparison",
        title: "生／正確／過度烘烤",
        body: "邊緣上色、中心仍略軟即可出爐；出爐後會繼續受熱定型。",
        step_number: 6,
        content_config: {
          guidedRequired: true,
          comparisonPrompt: "你的餅乾現在比較像？",
          comparisonOptions: [
            {
              id: "under",
              label: "尚未熟",
              caption: "邊緣未上色、中心過濕",
              imageUrl: STORY_IMAGES.bakeUnder,
              outcome: "wrong",
              aiPrompt: "中間看起來沒熟正常嗎？",
            },
            {
              id: "perfect",
              label: "正確出爐",
              caption: "邊緣金黃、中心略軟",
              imageUrl: STORY_IMAGES.bakePerfect,
              outcome: "correct",
            },
            {
              id: "over",
              label: "烘烤過度",
              caption: "整顆過深、口感偏硬",
              imageUrl: STORY_IMAGES.bakeOver,
              outcome: "wrong",
              aiPrompt: "烤太久變硬怎麼辦？",
            },
          ],
        },
        media: [
          imageMedia(STORY_IMAGES.bakeUnder, "尚未熟", 0),
          imageMedia(STORY_IMAGES.bakePerfect, "正確", 1),
          imageMedia(STORY_IMAGES.bakeOver, "過度", 2),
        ],
      },
      {
        page_type: "checkpoint",
        layout_type: "checkpoint",
        title: "烘烤完成檢查",
        step_number: 7,
        content_config: { guidedRequired: true, ctaPrimary: "完成，看成品" },
        completion_config: {
          checklist: [
            { id: "edge", text: "邊緣已上色" },
            { id: "rest", text: "烤盤靜置約 5 分鐘" },
            { id: "rack", text: "已移至網架冷卻" },
          ],
          mismatchAiPrompt: "出爐後狀態不理想，可能原因？",
        },
      },
    ],
  },
  {
    chapter_number: 4,
    title: "完成作品",
    subtitle: "保存、討論、分享與推薦",
    cover_image: STORY_IMAGES.finish,
    pages: [
      {
        page_type: "full_image",
        layout_type: "full_bleed",
        title: "完成！",
        subtitle: "外酥內軟的巧克力堅果軟餅乾",
        alignment: "bottom_left",
        step_number: 7,
        content_config: {
          overlayOpacity: 0.28,
          ctaPrimary: "了解保存方式",
        },
        media: [imageMedia(STORY_IMAGES.finish, "完成成品")],
      },
      {
        page_type: "storage",
        layout_type: "list",
        title: "保存方式",
        body: "完全冷卻後密封：常溫約 2 天、冷藏約 5 天、冷凍約 14 天。食用前可回溫。",
        step_number: 7,
        content_config: { ctaPrimary: "看看常見問題" },
      },
      {
        page_type: "discussion",
        layout_type: "embed",
        title: "問題討論",
        subtitle: "油水分離、烤箱溫差、過敏替代…",
        body: "製作中的問題可在此查看老師與官方回覆（示範資料）。",
        content_config: { ctaPrimary: "看大家的成品" },
      },
      {
        page_type: "submissions",
        layout_type: "embed",
        title: "大家的成品",
        subtitle: "DEMO 分享牆",
        body: "瀏覽其他烘焙者的成果，或分享你的作品。",
        content_config: { ctaPrimary: "商品推薦" },
      },
      {
        page_type: "recommendations",
        layout_type: "embed",
        title: "商品推薦",
        subtitle: "材料 · 器具 · 包裝",
        body: "完成後再補齊常備材料與包裝，不打斷製作流程。",
        content_config: { ctaPrimary: "結束導覽" },
      },
      {
        page_type: "completion",
        layout_type: "checkpoint",
        title: "恭喜完成 DEMO 食譜",
        subtitle: "你已走完互動式 Storybook 流程",
        content_config: {
          guidedRequired: false,
          ctaPrimary: "完成",
          ctaSecondary: "再看一次封面",
        },
        completion_config: {
          checklist: [
            { id: "read", text: "已閱讀主要製作頁" },
            { id: "guided", text: "已體驗 Guided 檢查／比較／計時" },
            { id: "share", text: "（選用）已查看討論或成品分享" },
          ],
          continueLabel: "結束",
        },
      },
    ],
  },
];

async function seedDemoStorybook(
  admin: SupabaseClient,
  recipeId: string,
  stepIdByNumber: Map<number, string>
): Promise<void> {
  const chapterIdByNumber = new Map<number, string>();

  for (const ch of STORY_CHAPTERS) {
    const { data: chapter, error: chErr } = await admin
      .from("recipe_story_chapters")
      .insert({
        recipe_id: recipeId,
        title: ch.title,
        subtitle: ch.subtitle,
        chapter_number: ch.chapter_number,
        cover_image: ch.cover_image,
        sort_order: ch.chapter_number - 1,
        active: true,
      })
      .select("id")
      .single();
    throwIf(chErr, `insert story chapter ${ch.chapter_number}`);
    chapterIdByNumber.set(ch.chapter_number, chapter!.id as string);
  }

  for (const ch of STORY_CHAPTERS) {
    const chapterId = chapterIdByNumber.get(ch.chapter_number)!;
    for (let i = 0; i < ch.pages.length; i++) {
      const page = ch.pages[i]!;
      const stepId =
        page.step_number != null
          ? stepIdByNumber.get(page.step_number) ?? null
          : null;

      const { data: pageRow, error: pageErr } = await admin
        .from("recipe_story_pages")
        .insert({
          recipe_id: recipeId,
          chapter_id: chapterId,
          step_id: stepId,
          page_type: page.page_type,
          layout_type: page.layout_type,
          title: page.title,
          subtitle: page.subtitle ?? null,
          body: page.body ?? null,
          eyebrow: page.eyebrow ?? null,
          alignment: page.alignment ?? "bottom_left",
          content_config: page.content_config ?? {},
          completion_config: page.completion_config ?? {},
          ai_context: page.ai_context ?? null,
          sort_order: i,
          active: true,
        })
        .select("id")
        .single();
      throwIf(pageErr, `insert story page ${ch.chapter_number}.${i + 1}`);

      const mediaList = page.media ?? [];
      if (!mediaList.length) continue;

      const { error: mediaErr } = await admin.from("recipe_story_page_media").insert(
        mediaList.map((m, mi) => ({
          story_page_id: pageRow!.id,
          media_type: m.media_type,
          source_type: (m.source_type ?? "cdn") as "upload" | "storage" | "cdn",
          url: m.url,
          thumbnail_url: m.thumbnail_url ?? null,
          caption: m.caption ?? null,
          alt_text: m.alt_text ?? DEMO_ALT,
          duration_seconds: m.duration_seconds ?? null,
          sort_order: m.sort_order ?? mi,
          active: true,
          metadata: m.metadata ?? {},
        }))
      );
      throwIf(mediaErr, `insert story page media ${ch.chapter_number}.${i + 1}`);
    }
  }
}

function throwIf(error: { message: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

export function isProductionLikeEnv(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

/** Scripts / API must call before mutating. */
export function assertDemoSeedAllowed(): void {
  if (isProductionLikeEnv() && process.env.ALLOW_DEMO_SEED !== "1") {
    throw new Error(
      "Production/staging-production blocked: set ALLOW_DEMO_SEED=1 to run demo seed/remove."
    );
  }
}

export function createDemoAdminClient(existing?: SupabaseClient): SupabaseClient {
  if (existing) return existing;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("請設定 NEXT_PUBLIC_SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function countForRecipe(
  admin: SupabaseClient,
  table: string,
  recipeId: string,
  column = "recipe_id"
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, recipeId);
  if (error) return 0;
  return count ?? 0;
}

export async function getDemoSmartRecipeStatus(
  client?: SupabaseClient
): Promise<DemoRecipeStatus> {
  const admin = createDemoAdminClient(client);
  const { data: recipe, error } = await admin
    .from("recipes")
    .select("id, slug")
    .eq("demo_key", DEMO_KEY)
    .maybeSingle();
  throwIf(error, "lookup demo recipe");

  if (!recipe) {
    return {
      exists: false,
      recipeId: null,
      slug: DEMO_SLUG,
      demoKey: DEMO_KEY,
      counts: { ...EMPTY_COUNTS },
      videos: [],
      missingOfficialVideos: true,
      checks: {
        bucketConfigured: true,
        activeYoutubeMedia: 0,
        placeholderCount: 0,
        uploadedOfficialCount: 0,
        noYoutubeInAdminForm: true,
      },
    };
  }

  const recipeId = recipe.id as string;
  const { data: steps } = await admin
    .from("recipe_steps")
    .select("id")
    .eq("recipe_id", recipeId);
  const stepIds = (steps ?? []).map((s) => s.id as string);

  let aiPrompts = 0;
  if (stepIds.length) {
    const { count } = await admin
      .from("recipe_step_ai_prompts")
      .select("*", { count: "exact", head: true })
      .in("step_id", stepIds);
    aiPrompts = count ?? 0;
  }

  const { data: mediaRows } = await admin
    .from("recipe_media")
    .select(
      "id, step_id, source_type, processing_status, upload_status, is_active, is_demo, storage_path, file_size_bytes, duration_seconds, url, media_type, original_filename, upload_metadata, alt_text"
    )
    .eq("recipe_id", recipeId);
  const mediaIds = (mediaRows ?? []).map((m) => m.id as string);
  let markers = 0;
  if (mediaIds.length) {
    const { count } = await admin
      .from("recipe_video_markers")
      .select("*", { count: "exact", head: true })
      .in("media_id", mediaIds);
    markers = count ?? 0;
  }

  const { data: stepRows } = await admin
    .from("recipe_steps")
    .select("id, step_number, title")
    .eq("recipe_id", recipeId);
  const stepMeta = new Map(
    (stepRows ?? []).map((s) => [
      s.id as string,
      { n: s.step_number as number | null, title: (s.title as string) || "" },
    ])
  );

  const videos: DemoVideoInventoryItem[] = (mediaRows ?? [])
    .filter((m) => m.media_type === "video")
    .map((m) => {
      const meta = (m.upload_metadata ?? {}) as Record<string, unknown>;
      const step = m.step_id ? stepMeta.get(m.step_id as string) : null;
      const label =
        typeof meta.label === "string"
          ? meta.label
          : m.step_id
            ? `Step ${step?.n ?? "?"} ${step?.title || ""}`.trim()
            : "完整教學影片";
      const hasFile = Boolean(m.url || m.storage_path);
      const ready =
        hasFile &&
        m.is_active &&
        m.processing_status === "ready" &&
        m.source_type !== "youtube" &&
        m.source_type !== "vimeo";
      return {
        id: m.id as string,
        scope: m.step_id ? ("step" as const) : ("full" as const),
        stepId: (m.step_id as string | null) ?? null,
        stepNumber: step?.n ?? null,
        label,
        sourceType: String(m.source_type ?? ""),
        processingStatus: (m.processing_status as string | null) ?? null,
        uploadStatus: (m.upload_status as string | null) ?? null,
        isActive: Boolean(m.is_active),
        isDemo: Boolean(m.is_demo),
        hasFile,
        storagePath: (m.storage_path as string | null) ?? null,
        originalFilename: (m.original_filename as string | null) ?? null,
        fileSizeBytes: m.file_size_bytes != null ? Number(m.file_size_bytes) : null,
        durationSeconds: m.duration_seconds != null ? Number(m.duration_seconds) : null,
        urlPreview: m.url ? String(m.url).slice(0, 80) : null,
        status: ready ? ("uploaded" as const) : ("pending" as const),
      };
    });

  const missingOfficialVideos =
    videos.length === 0 || videos.some((v) => v.status === "pending");

  const { count: activeYoutubeMedia } = await admin
    .from("recipe_media")
    .select("*", { count: "exact", head: true })
    .eq("source_type", "youtube")
    .eq("is_active", true);

  const placeholderCount = videos.filter((v) => v.processingStatus === "placeholder").length;
  const uploadedOfficialCount = videos.filter((v) => v.status === "uploaded").length;

  const storyPages = await countForRecipe(admin, "recipe_story_pages", recipeId);
  let storyPageMedia = 0;
  if (storyPages > 0) {
    const { data: storyPageRows } = await admin
      .from("recipe_story_pages")
      .select("id")
      .eq("recipe_id", recipeId);
    const storyPageIds = (storyPageRows ?? []).map((p) => p.id as string);
    if (storyPageIds.length) {
      const { count } = await admin
        .from("recipe_story_page_media")
        .select("*", { count: "exact", head: true })
        .in("story_page_id", storyPageIds);
      storyPageMedia = count ?? 0;
    }
  }

  const counts: DemoRecipeCounts = {
    ingredients: await countForRecipe(admin, "recipe_ingredients", recipeId),
    steps: await countForRecipe(admin, "recipe_steps", recipeId),
    tools: await countForRecipe(admin, "recipe_tools", recipeId),
    preparations: await countForRecipe(admin, "recipe_preparations", recipeId),
    media: mediaIds.length,
    markers,
    aiPrompts,
    faqs: await countForRecipe(admin, "recipe_faq", recipeId),
    recommendations: await countForRecipe(admin, "recipe_product_recommendations", recipeId),
    discussions: await countForRecipe(admin, "recipe_discussions", recipeId),
    submissions: await countForRecipe(admin, "recipe_submissions", recipeId),
    storyChapters: await countForRecipe(admin, "recipe_story_chapters", recipeId),
    storyPages,
    storyPageMedia,
  };

  return {
    exists: true,
    recipeId,
    slug: (recipe.slug as string) || DEMO_SLUG,
    demoKey: DEMO_KEY,
    counts,
    videos,
    missingOfficialVideos,
    checks: {
      bucketConfigured: true,
      activeYoutubeMedia: activeYoutubeMedia ?? 0,
      placeholderCount,
      uploadedOfficialCount,
      noYoutubeInAdminForm: true,
    },
  };
}

export async function removeDemoSmartRecipe(
  client?: SupabaseClient
): Promise<{
  deleted: boolean;
  demoted?: boolean;
  recipeId: string | null;
  preservedMedia?: number;
}> {
  assertDemoSeedAllowed();
  const admin = createDemoAdminClient(client);
  const { data: existing, error } = await admin
    .from("recipes")
    .select("id")
    .eq("demo_key", DEMO_KEY)
    .maybeSingle();
  throwIf(error, "find demo recipe");
  if (!existing) return { deleted: false, recipeId: null };

  const recipeId = existing.id as string;

  // Keep admin-uploaded formal videos: never wipe ready uploads with the demo recipe.
  const { data: formalMedia } = await admin
    .from("recipe_media")
    .select("id, storage_path, storage_bucket")
    .eq("recipe_id", recipeId)
    .or("is_demo.eq.false,processing_status.eq.ready")
    .not("url", "is", null);

  const preserved = formalMedia?.length ?? 0;

  // Only auto-clear demo placeholders
  await admin
    .from("recipe_media")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("is_demo", true)
    .eq("processing_status", "placeholder");

  if (preserved > 0) {
    await admin
      .from("recipes")
      .update({
        demo_key: null,
        is_demo: false,
        status: "draft",
        title: `${DEMO_TITLE}（已解除 DEMO，保留正式影片）`,
      })
      .eq("id", recipeId);
    return { deleted: false, demoted: true, recipeId, preservedMedia: preserved };
  }

  const { error: delError } = await admin.from("recipes").delete().eq("demo_key", DEMO_KEY);
  throwIf(delError, "delete demo recipe");
  return { deleted: true, recipeId };
}

async function findProductByKeywords(
  admin: SupabaseClient,
  keywords: string[]
): Promise<{ id: string; name: string } | null> {
  for (const kw of keywords) {
    const { data } = await admin
      .from("products")
      .select("id, name")
      .eq("is_active", true)
      .ilike("name", `%${kw}%`)
      .gt("stock", 0)
      .limit(5);
    const hit = (data ?? []).find((p) => (p.name as string).includes(kw)) ?? data?.[0];
    if (hit) return { id: hit.id as string, name: hit.name as string };
  }
  return null;
}

async function ensureDemoProducts(
  admin: SupabaseClient
): Promise<{ map: Map<string, string>; created: number }> {
  const map = new Map<string, string>();
  let created = 0;
  const canCreate = !isProductionLikeEnv();

  for (const need of PRODUCT_NEEDS) {
    const { data: existingDemo } = await admin
      .from("products")
      .select("id, name")
      .eq("name", need.demoName)
      .maybeSingle();

    if (existingDemo) {
      if (need.imageUrl) {
        await admin
          .from("products")
          .update({ image_url: need.imageUrl })
          .eq("id", existingDemo.id);
      }
      map.set(need.demoName, existingDemo.id as string);
      continue;
    }

    const found = await findProductByKeywords(admin, need.keywords);
    if (found) {
      map.set(need.demoName, found.id);
      continue;
    }
    if (!canCreate) continue;

    const { data: inserted, error } = await admin
      .from("products")
      .insert({
        name: need.demoName,
        description: "CHIMEIDIY 智慧食譜 DEMO 用商品，非正式販售資料。",
        price: need.price,
        stock: 50,
        is_active: true,
        status: "active",
        product_scope: "baking",
        image_url: need.imageUrl ?? COVER_IMAGE,
        publish_website: true,
      })
      .select("id")
      .single();
    throwIf(error, `create demo product ${need.demoName}`);
    map.set(need.demoName, inserted!.id as string);
    created += 1;
  }

  return { map, created };
}

export async function seedDemoSmartRecipe(
  client?: SupabaseClient
): Promise<DemoSeedResult> {
  assertDemoSeedAllowed();
  const admin = createDemoAdminClient(client);

  // Idempotent: wipe previous demo placeholders; preserve formal uploads
  const removed = await removeDemoSmartRecipe(admin);
  if (removed.demoted && removed.recipeId) {
    // Free DEMO_SLUG so a fresh demo recipe can be inserted
    await admin
      .from("recipes")
      .update({ slug: `${DEMO_SLUG}-kept-${Date.now()}` })
      .eq("id", removed.recipeId);
  }

  const { data: category, error: catError } = await admin
    .from("recipe_categories")
    .select("id")
    .eq("slug", DEMO_CATEGORY_SLUG)
    .maybeSingle();
  throwIf(catError, "lookup cookie category");
  if (!category) throw new Error(`找不到分類 slug=${DEMO_CATEGORY_SLUG}`);

  const { map: productMap, created: createdDemoProducts } = await ensureDemoProducts(admin);

  const now = new Date().toISOString();
  const { data: recipe, error: recipeError } = await admin
    .from("recipes")
    .insert({
      title: DEMO_TITLE,
      slug: DEMO_SLUG,
      summary:
        "外層微酥、內部柔軟濕潤，搭配巧克力與烘烤堅果。每一步皆可觀看示範內容並直接詢問 AI 烘焙助手。",
      cover_image: COVER_IMAGE,
      category_id: category.id,
      difficulty: "easy",
      prep_time: 20,
      cook_time: 15,
      total_time: 65,
      servings: "約 12 片",
      content:
        "這是 CHIMEIDIY 智慧食譜示範：含翻頁閱讀、倍率換算、分段影片、步驟 AI、討論與成品分享。",
      tips: "冷藏後再烤更不易攤平；出爐後靜置再移盤。",
      storage_method: "常溫密封約 2 天，冷藏約 5 天，冷凍約 14 天。",
      status: "published",
      published_at: now,
      seo_title: DEMO_TITLE,
      seo_description: "CHIMEIDIY 智慧食譜 DEMO：巧克力堅果軟餅乾",
      is_featured: true,
      reading_mode_default: "flip",
      flip_mode_enabled: true,
      full_reading_enabled: true,
      is_smart_recipe: true,
      ingredient_scaling_enabled: true,
      discussion_enabled: true,
      submission_enabled: true,
      ai_enabled: true,
      product_recommendation_enabled: true,
      demo_key: DEMO_KEY,
      is_demo: true,
      author_label: "CHIMEIDIY 烘焙團隊",
      tags: ["DEMO", "智慧食譜", "翻頁食譜", "AI 可提問", "分段影片", "新手友善"],
    })
    .select("id")
    .single();
  throwIf(recipeError, "insert recipe");
  const recipeId = recipe!.id as string;

  const ingredientIdByName = new Map<string, string>();
  const { data: ingRows, error: ingError } = await admin
    .from("recipe_ingredients")
    .insert(
      INGREDIENTS.map((ing) => {
        const productNeed = PRODUCT_NEEDS.find((p) => p.linkIngredientName === ing.name);
        const productId = productNeed ? productMap.get(productNeed.demoName) ?? null : null;
        return {
          recipe_id: recipeId,
          group_name: ing.group_name,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          quantity_numeric: ing.quantity_numeric,
          sort_order: ing.sort_order,
          is_required: true,
          product_id: productId,
        };
      })
    )
    .select("id, name");
  throwIf(ingError, "insert ingredients");
  for (const row of ingRows ?? []) {
    ingredientIdByName.set(row.name as string, row.id as string);
  }

  const { data: toolRows, error: toolError } = await admin
    .from("recipe_tools")
    .insert(
      TOOLS.map((name, i) => {
        const need = PRODUCT_NEEDS.find((p) => p.keywords.some((k) => name.includes(k) || k.includes(name)));
        return {
          recipe_id: recipeId,
          name,
          notes: null,
          product_id: need ? productMap.get(need.demoName) ?? null : null,
          sort_order: i + 1,
        };
      })
    )
    .select("id, name");
  throwIf(toolError, "insert tools");

  const { error: prepError } = await admin.from("recipe_preparations").insert(
    PREPARATIONS.map((p, i) => ({
      recipe_id: recipeId,
      title: p.title,
      content: p.content,
      sort_order: i + 1,
    }))
  );
  throwIf(prepError, "insert preparations");

  const stepIdByNumber = new Map<number, string>();
  for (const step of STEP_SEEDS) {
    const { data: stepRow, error: stepError } = await admin
      .from("recipe_steps")
      .insert({
        recipe_id: recipeId,
        step_number: step.step_number,
        title: step.title,
        description: step.description,
        image_url: null,
        note: step.chef_notes,
        duration_seconds: step.duration_seconds ?? null,
        temperature_value: step.temperature_value ?? null,
        temperature_unit: step.temperature_unit ?? "C",
        timer_enabled: Boolean(step.timer_enabled),
        chef_notes: step.chef_notes,
        safety_notes:
          step.step_number === 4
            ? "【食品安全】堅果過敏者請省略堅果或替換，並避免交叉污染。"
            : step.step_number === 6
              ? "使用烤箱時注意高溫燙傷，兒童需成人陪同。"
              : null,
        common_failures: step.common_failures,
        recovery_actions: step.recovery_actions,
        prohibited_actions:
          step.step_number === 6
            ? ["不要在未預熱時放入", "不要一次大幅提高溫度搶時間"]
            : [],
        ai_enabled: true,
        ai_context: step.ai_context ?? null,
        ai_keywords: step.ai_keywords ?? [],
        sort_order: step.step_number,
      })
      .select("id")
      .single();
    throwIf(stepError, `insert step ${step.step_number}`);
    const stepId = stepRow!.id as string;
    stepIdByNumber.set(step.step_number, stepId);

    const { error: promptError } = await admin.from("recipe_step_ai_prompts").insert(
      step.prompts.map((p, i) => ({
        step_id: stepId,
        label: p.label,
        prompt: p.prompt,
        sort_order: i + 1,
        is_active: true,
      }))
    );
    throwIf(promptError, `insert ai prompts step ${step.step_number}`);
  }

  // Link ingredients to steps (used_in_step_ids)
  const stepLinks: Array<{ names: string[]; steps: number[] }> = [
    { names: ["無鹽奶油", "細砂糖", "二砂糖"], steps: [1] },
    { names: ["全蛋液"], steps: [2] },
    {
      names: ["低筋麵粉", "中筋麵粉", "鹽", "小蘇打粉", "泡打粉"],
      steps: [3],
    },
    { names: ["綜合堅果", "巧克力", "巧克力豆"], steps: [4] },
  ];
  for (const link of stepLinks) {
    for (const name of link.names) {
      const ingId = ingredientIdByName.get(name);
      if (!ingId) continue;
      const used = link.steps
        .map((n) => stepIdByNumber.get(n))
        .filter(Boolean) as string[];
      await admin.from("recipe_ingredients").update({ used_in_step_ids: used }).eq("id", ingId);
      for (const stepId of used) {
        await admin.from("recipe_step_ingredients").upsert(
          { step_id: stepId, ingredient_id: ingId },
          { onConflict: "step_id,ingredient_id" }
        );
      }
    }
  }

  // Full recipe video — inactive placeholder (no YouTube)
  const { data: fullMedia, error: fullMediaError } = await admin
    .from("recipe_media")
    .insert({
      recipe_id: recipeId,
      step_id: null,
      media_type: "video",
      source_type: "upload",
      url: null,
      thumbnail_url: COVER_IMAGE,
      duration_seconds: null,
      autoplay: false,
      muted: true,
      alt_text: "DEMO 教學影片待上傳｜完整影片",
      sort_order: 0,
      is_active: false,
      upload_status: "pending",
      processing_status: "placeholder",
      original_filename: null,
      is_demo: true,
      seed_key: DEMO_KEY,
      upload_metadata: { slot: "full", label: "完整教學影片" },
    })
    .select("id")
    .single();
  throwIf(fullMediaError, "insert full media");

  const stepVideoTargets = [
    { n: 2, label: "Step 2 蛋液乳化" },
    { n: 3, label: "Step 3 粉類切拌" },
    { n: 6, label: "Step 6 烘烤與熟度判斷" },
  ];
  const mediaByStep = new Map<number, string>();
  for (const { n, label } of stepVideoTargets) {
    const stepId = stepIdByNumber.get(n)!;
    const { data: m, error: mErr } = await admin
      .from("recipe_media")
      .insert({
        recipe_id: recipeId,
        step_id: stepId,
        media_type: "video",
        source_type: "upload",
        url: null,
        thumbnail_url: COVER_IMAGE,
        duration_seconds: null,
        autoplay: false,
        muted: true,
        alt_text: `DEMO 教學影片待上傳｜${label}`,
        sort_order: n,
        is_active: false,
        upload_status: "pending",
        processing_status: "placeholder",
        is_demo: true,
        seed_key: DEMO_KEY,
        upload_metadata: { slot: `step_${n}`, label },
      })
      .select("id")
      .single();
    throwIf(mErr, `insert step ${n} media`);
    mediaByStep.set(n, m!.id as string);
  }

  const markersStep2 = [
    { time_seconds: 3, title: "加入第一批蛋液", ai_context: "第一批蛋液剛加入，觀察吸收情況。" },
    { time_seconds: 8, title: "接近乳化", ai_context: "混合物開始變順，接近乳化。" },
    { time_seconds: 15, title: "正確乳化狀態", ai_context: "表面光滑有光澤，乳化成功。" },
    { time_seconds: 20, title: "油水分離狀態", ai_context: "若呈現分離，需加少許麵粉補救。" },
  ];
  const markersStep6 = [
    { time_seconds: 3, title: "尚未熟", ai_context: "中心仍濕、邊緣未上色，繼續烤。" },
    { time_seconds: 8, title: "邊緣開始上色", ai_context: "邊緣微金黃，接近完成。" },
    { time_seconds: 12, title: "正確出爐狀態", ai_context: "邊緣上色、中心略軟即可出爐。" },
    { time_seconds: 15, title: "烘烤過度", ai_context: "整顆過深色，口感偏硬。" },
  ];
  const markersStep3 = [
    { time_seconds: 3, title: "開始加粉", ai_context: "粉類分次切拌進入麵糊。" },
    { time_seconds: 8, title: "切拌中", ai_context: "用刮刀切拌，避免畫圓過度攪打。" },
    { time_seconds: 15, title: "無乾粉即可", ai_context: "看到無乾粉就停手。" },
  ];

  async function insertMarkers(
    mediaId: string,
    markers: Array<{ time_seconds: number; title: string; ai_context: string }>
  ) {
    const { error } = await admin.from("recipe_video_markers").insert(
      markers.map((m, i) => ({
        media_id: mediaId,
        time_seconds: m.time_seconds,
        title: m.title,
        description: m.title,
        ai_context: m.ai_context,
        sort_order: i + 1,
      }))
    );
    throwIf(error, "insert markers");
  }

  await insertMarkers(mediaByStep.get(2)!, markersStep2);
  await insertMarkers(mediaByStep.get(3)!, markersStep3);
  await insertMarkers(mediaByStep.get(6)!, markersStep6);
  // keep fullMedia referenced so unused-lint doesn't fire in some configs
  void fullMedia;

  const { error: faqError } = await admin.from("recipe_faq").insert(
    FAQS.map((f, i) => ({
      recipe_id: recipeId,
      question: f.question,
      answer: f.answer,
      sort_order: i + 1,
      is_active: true,
    }))
  );
  throwIf(faqError, "insert faqs");

  const recRows: Array<{
    recipe_id: string;
    step_id: null;
    ingredient_id: string | null;
    product_id: string;
    recommendation_type: ProductNeed["recommendation_type"];
    recommendation_reason: string;
    priority: number;
    manual_override: boolean;
    is_active: boolean;
  }> = [];
  for (let i = 0; i < PRODUCT_NEEDS.length; i++) {
    const need = PRODUCT_NEEDS[i]!;
    const productId = productMap.get(need.demoName);
    if (!productId) continue;
    recRows.push({
      recipe_id: recipeId,
      step_id: null,
      ingredient_id: need.linkIngredientName
        ? ingredientIdByName.get(need.linkIngredientName) ?? null
        : null,
      product_id: productId,
      recommendation_type: need.recommendation_type,
      recommendation_reason: need.reason,
      priority: PRODUCT_NEEDS.length - i,
      manual_override: true,
      is_active: true,
    });
  }

  if (recRows.length) {
    const { error: recError } = await admin
      .from("recipe_product_recommendations")
      .insert(recRows);
    throwIf(recError, "insert recommendations");
  }

  // Discussions
  const discussions = [
    {
      category: "failure" as const,
      title: "加入蛋液後油水分離怎麼辦？",
      body: "做到 Step 2 時麵糊突然分離，表面一層油，請問怎麼補救？",
      step_number: 2,
      status: "answered" as const,
      reply: {
        author_role: "teacher" as const,
        body: "先暫停加蛋。加一小匙低筋麵粉拌勻，再改為少量分次加蛋液。通常可以救回。",
        is_best_answer: true,
      },
    },
    {
      category: "oven" as const,
      title: "小烤箱也可以使用 170°C 嗎？",
      body: "我家是小烤箱，容量較小，還是用 170°C 烤 12 分鐘嗎？",
      step_number: 6,
      status: "answered" as const,
      reply: {
        author_role: "official" as const,
        body: "可以先用 170°C，但小烤箱受熱較快，建議第 8–10 分鐘開始觀察，必要時降 5–10°C 或縮短時間。",
        is_best_answer: true,
      },
    },
    {
      category: "substitution" as const,
      title: "堅果過敏可以不放堅果嗎？",
      body: "【食品安全提醒】家人對堅果過敏，Step 4 可以完全不放堅果嗎？需要注意交叉污染嗎？",
      step_number: 4,
      status: "resolved" as const,
      reply: {
        author_role: "official" as const,
        body:
          "【食品安全提醒】可以完全省略堅果，餅乾仍可完成。請使用未接觸堅果的器具與烤盤，並在分享時標示「含／不含堅果」。過敏體質請依個人狀況謹慎食用。",
        is_best_answer: true,
      },
    },
  ];

  for (const d of discussions) {
    const { data: disc, error: dErr } = await admin
      .from("recipe_discussions")
      .insert({
        recipe_id: recipeId,
        user_id: null,
        category: d.category,
        title: d.title,
        body: d.body,
        step_id: stepIdByNumber.get(d.step_number) ?? null,
        status: d.status,
        like_count: 2,
        reply_count: 1,
        is_demo: true,
      })
      .select("id")
      .single();
    throwIf(dErr, "insert discussion");
    const { error: rErr } = await admin.from("recipe_discussion_replies").insert({
      discussion_id: disc!.id,
      user_id: null,
      body: d.reply.body,
      author_role: d.reply.author_role,
      is_helpful: true,
      is_best_answer: d.reply.is_best_answer,
      like_count: 3,
      is_demo: true,
    });
    throwIf(rErr, "insert discussion reply");
  }

  const submissions = [
    {
      title: "第一次就成功！",
      note: "依照冷藏時間與 170°C，外酥內軟超好吃。",
      rating: 5,
      success_status: "success" as const,
      is_teacher_pick: true,
      recipe_multiplier: 1,
      image: SUBMISSION_IMAGES[0],
    },
    {
      title: "略扁但味道 OK",
      note: "冷藏只放 10 分鐘，有點攤開，下次會改善。",
      rating: 4,
      success_status: "partially_successful" as const,
      is_teacher_pick: false,
      recipe_multiplier: 1,
      image: SUBMISSION_IMAGES[1],
    },
    {
      title: "烤太久變硬",
      note: "烤到 15 分鐘偏硬，下次提早觀察邊緣上色。",
      rating: 3,
      success_status: "needs_improvement" as const,
      is_teacher_pick: false,
      recipe_multiplier: 0.5,
      image: SUBMISSION_IMAGES[2],
    },
  ];

  for (const s of submissions) {
    const { data: sub, error: sErr } = await admin
      .from("recipe_submissions")
      .insert({
        recipe_id: recipeId,
        user_id: null,
        title: s.title,
        note: s.note,
        rating: s.rating,
        success_status: s.success_status,
        recipe_multiplier: s.recipe_multiplier,
        oven_settings: "170°C / 約 12 分鐘",
        moderation_status: "approved",
        is_teacher_pick: s.is_teacher_pick,
        is_demo: true,
        made_on: now.slice(0, 10),
      })
      .select("id")
      .single();
    throwIf(sErr, "insert submission");
    const { error: imgErr } = await admin.from("recipe_submission_images").insert({
      submission_id: sub!.id,
      image_url: s.image,
      sort_order: 1,
    });
    throwIf(imgErr, "insert submission image");
  }

  // Link tool rows to steps lightly (step 1 spatula, step 5 scoop)
  const spatula = (toolRows ?? []).find((t) => t.name === "刮刀");
  const scoop = (toolRows ?? []).find((t) => t.name === "分割勺");
  if (spatula) {
    await admin.from("recipe_step_tools").upsert(
      { step_id: stepIdByNumber.get(1)!, tool_id: spatula.id },
      { onConflict: "step_id,tool_id" }
    );
  }
  if (scoop) {
    await admin.from("recipe_step_tools").upsert(
      { step_id: stepIdByNumber.get(5)!, tool_id: scoop.id },
      { onConflict: "step_id,tool_id" }
    );
  }

  await seedDemoStorybook(admin, recipeId, stepIdByNumber);

  const status = await getDemoSmartRecipeStatus(admin);
  return {
    recipeId,
    slug: DEMO_SLUG,
    demoKey: DEMO_KEY,
    counts: status.counts,
    createdDemoProducts,
  };
}
