/**
 * Flipbook recipe seed payloads — 5 published smart recipes (Traditional Chinese).
 * Used by `seedFlipbookRecipes` / `npm run seed:flipbook-recipes`.
 */

import type { RecipeDifficulty } from "@/lib/types/database";
import type { RecipeStoryLayoutType, RecipeStoryPageType } from "@/lib/recipes/story-types";

export type FlipbookIngredientSeed = {
  seed_key: string;
  group_name: string;
  name: string;
  quantity_numeric: number;
  amount: string;
  unit: string;
  note?: string;
  sort_order: number;
};

export type FlipbookToolSeed = {
  seed_key: string;
  name: string;
  notes?: string | null;
  sort_order: number;
};

export type FlipbookStepSeed = {
  seed_key: string;
  step_number: number;
  title: string;
  description: string;
  timer_seconds?: number | null;
  temperature?: string | null;
  chef_notes?: string | null;
  common_mistakes?: string | string[];
};

export type FlipbookComparisonOption = {
  id: string;
  label: string;
  caption: string;
  outcome?: "correct" | "wrong";
};

export type FlipbookComparisonSeed = {
  seed_key: string;
  title: string;
  body?: string;
  prompt: string;
  options: FlipbookComparisonOption[];
};

export type FlipbookTimerPageSeed = {
  seed_key: string;
  title: string;
  subtitle?: string;
  body?: string;
  timerSeconds: number;
  timerLabel: string;
  step_number?: number;
};

export type FlipbookPageSeed = {
  seed_key: string;
  chapter_index: 0 | 1 | 2;
  page_type: RecipeStoryPageType;
  layout_type: RecipeStoryLayoutType;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  eyebrow?: string | null;
  alignment?: string | null;
  step_number?: number | null;
  content_config?: Record<string, unknown>;
  completion_config?: Record<string, unknown>;
  ai_context?: string | null;
};

export type FlipbookChapterSeed = {
  title: string;
  subtitle: string;
  chapter_number: number;
  sort_order: number;
};

export type FlipbookRecipeSeed = {
  slug: string;
  title: string;
  category_slug: string;
  category_name: string;
  summary: string;
  content: string;
  difficulty: RecipeDifficulty;
  servings: string;
  prep_time: number;
  cook_time: number;
  total_time: number;
  storage_method: string;
  tips: string;
  allergens: string[];
  tags: string[];
  ingredients: FlipbookIngredientSeed[];
  tools: FlipbookToolSeed[];
  steps: FlipbookStepSeed[];
  preparations: string[];
  chapters: FlipbookChapterSeed[];
  pages: FlipbookPageSeed[];
};

export const FLIPBOOK_CATEGORIES: Array<{ slug: string; name: string; sort_order: number }> = [
  { slug: "cookie", name: "餅乾", sort_order: 30 },
  { slug: "cake", name: "蛋糕", sort_order: 10 },
  { slug: "chinese-dessert", name: "中式點心", sort_order: 50 },
  { slug: "bread", name: "麵包", sort_order: 20 },
  { slug: "scone", name: "司康", sort_order: 35 },
];

export const CHECKPOINT_ITEMS = [
  "已完成所有製作步驟",
  "成品外觀符合食譜說明",
  "已確認烘烤或冷卻時間",
  "已閱讀保存方式",
] as const;

export const COMPLETION_CONFIG = {
  ctaPrimary: "分享我的作品",
  ctaSecondary: "查看更多食譜",
  showConfetti: true,
} as const;

export const AUTHOR_LABEL = "CHIMEIDIY 烘焙教室";

const SHARED_CHAPTERS: FlipbookChapterSeed[] = [
  {
    title: "第一章｜準備材料",
    subtitle: "備齊材料、器具與前置作業",
    chapter_number: 1,
    sort_order: 1,
  },
  {
    title: "第二章｜開始製作",
    subtitle: "跟著步驟完成製作",
    chapter_number: 2,
    sort_order: 2,
  },
  {
    title: "第三章｜完成",
    subtitle: "檢查、保存與分享",
    chapter_number: 3,
    sort_order: 3,
  },
];

function key(slug: string, kind: string, id: string) {
  return `${slug}:${kind}:${id}`;
}

function prepChecklistConfig(items: string[]) {
  return {
    guidedRequired: true,
    ctaPrimary: "準備完成，開始製作",
    checklist: items.map((text, i) => ({ id: `prep-${i + 1}`, text })),
  };
}

function checkpointConfigs() {
  return {
    content_config: {
      guidedRequired: true,
      items: [...CHECKPOINT_ITEMS],
      ctaPrimary: "確認完成",
    },
    completion_config: {
      checklist: CHECKPOINT_ITEMS.map((text, i) => ({
        id: `check-${i + 1}`,
        text,
      })),
      continueLabel: "完成檢查",
    },
  };
}

function buildBasePages(
  slug: string,
  title: string,
  prepItems: string[],
  steps: FlipbookStepSeed[],
  extras?: {
    comparison?: FlipbookComparisonSeed;
    timer?: FlipbookTimerPageSeed;
  }
): FlipbookPageSeed[] {
  const pages: FlipbookPageSeed[] = [
    {
      seed_key: key(slug, "page", "cover"),
      chapter_index: 0,
      page_type: "cover",
      layout_type: "full_bleed",
      title,
      subtitle: "CHIMEIDIY 翻頁食譜",
      eyebrow: AUTHOR_LABEL,
      alignment: "bottom_left",
      content_config: {
        overlayOpacity: 0.35,
        ctaPrimary: "開始閱讀",
        chapterAccent: "#153E73",
      },
    },
    {
      seed_key: key(slug, "page", "toc"),
      chapter_index: 0,
      page_type: "toc",
      layout_type: "list",
      title: "食譜目錄",
      subtitle: "點選章節或步驟快速跳轉",
      body: "從準備材料、製作步驟到完成分享，依序翻頁即可完成。",
      content_config: { ctaPrimary: "開始準備" },
    },
    {
      seed_key: key(slug, "page", "chapter-prep"),
      chapter_index: 0,
      page_type: "chapter",
      layout_type: "full_bleed",
      title: "第一章｜準備材料",
      subtitle: "先備齊材料與器具，再進入製作",
      alignment: "center",
      content_config: {
        overlayOpacity: 0.4,
        chapterAccent: "#153E73",
        ctaPrimary: "查看材料",
      },
    },
    {
      seed_key: key(slug, "page", "ingredients"),
      chapter_index: 0,
      page_type: "ingredients",
      layout_type: "list",
      title: "材料",
      subtitle: "請依份量秤重備料",
      content_config: {
        ctaPrimary: "材料已備齊",
        ctaSecondary: "稍後再看",
      },
    },
    {
      seed_key: key(slug, "page", "tools"),
      chapter_index: 0,
      page_type: "tools",
      layout_type: "list",
      title: "器具",
      subtitle: "製作前請確認器具齊全",
      content_config: { ctaPrimary: "器具已備齊" },
    },
    {
      seed_key: key(slug, "page", "preparation"),
      chapter_index: 0,
      page_type: "preparation",
      layout_type: "list",
      title: "前置作業",
      subtitle: "開始前請完成以下準備",
      body: "完成勾選後再進入製作步驟。",
      content_config: prepChecklistConfig(prepItems),
      completion_config: {
        checklist: prepItems.map((text, i) => ({ id: `prep-${i + 1}`, text })),
        continueLabel: "開始製作",
      },
    },
    {
      seed_key: key(slug, "page", "chapter-make"),
      chapter_index: 1,
      page_type: "chapter",
      layout_type: "full_bleed",
      title: "第二章｜開始製作",
      subtitle: "跟著步驟完成每一動作",
      alignment: "center",
      content_config: {
        overlayOpacity: 0.4,
        chapterAccent: "#F16458",
        ctaPrimary: "進入步驟",
      },
    },
  ];

  for (const step of steps) {
    pages.push({
      seed_key: key(slug, "page", `step-${step.step_number}`),
      chapter_index: 1,
      page_type: "step",
      layout_type: "split_image_text",
      title: step.title,
      subtitle: `步驟 ${step.step_number}`,
      body: step.description,
      step_number: step.step_number,
      content_config: {
        splitDirection: "image_top",
        ...(step.timer_seconds
          ? {
              timerSeconds: step.timer_seconds,
              timerLabel: step.title,
            }
          : {}),
        ...(step.temperature
          ? {
              temperatureLabel: "烘烤溫度",
              temperatureValue: Number.parseInt(step.temperature, 10) || undefined,
              temperatureUnit: "C",
            }
          : {}),
        cautionEnabled: Boolean(step.common_mistakes),
        cautionTitle: "容易失敗",
        cautionItems: step.common_mistakes
          ? Array.isArray(step.common_mistakes)
            ? step.common_mistakes
            : [step.common_mistakes]
          : undefined,
        ctaPrimary: "完成本步驟",
      },
      ai_context: step.chef_notes ?? null,
    });
  }

  if (extras?.timer) {
    const t = extras.timer;
    pages.push({
      seed_key: t.seed_key,
      chapter_index: 1,
      page_type: "timer",
      layout_type: "timer",
      title: t.title,
      subtitle: t.subtitle ?? null,
      body: t.body ?? null,
      step_number: t.step_number ?? null,
      content_config: {
        guidedRequired: true,
        timerSeconds: t.timerSeconds,
        timerLabel: t.timerLabel,
        ctaPrimary: "計時結束，繼續",
        skipAllowed: false,
      },
    });
  }

  if (extras?.comparison) {
    const c = extras.comparison;
    pages.push({
      seed_key: c.seed_key,
      chapter_index: 1,
      page_type: "comparison",
      layout_type: "comparison",
      title: c.title,
      body: c.body ?? "請對照下列狀態，選擇最接近的一種。",
      content_config: {
        guidedRequired: true,
        comparisonPrompt: c.prompt,
        comparisonOptions: c.options.map((o) => ({
          id: o.id,
          label: o.label,
          caption: o.caption,
          outcome: o.outcome,
        })),
        ctaPrimary: "狀態正確，繼續",
      },
    });
  }

  const cp = checkpointConfigs();
  pages.push(
    {
      seed_key: key(slug, "page", "chapter-done"),
      chapter_index: 2,
      page_type: "chapter",
      layout_type: "full_bleed",
      title: "第三章｜完成",
      subtitle: "檢查成品、保存與分享",
      alignment: "center",
      content_config: {
        overlayOpacity: 0.35,
        chapterAccent: "#79C7E8",
        ctaPrimary: "完成檢查",
      },
    },
    {
      seed_key: key(slug, "page", "checkpoint"),
      chapter_index: 2,
      page_type: "checkpoint",
      layout_type: "checkpoint",
      title: "完成前確認",
      body: "請確認以下項目。",
      content_config: cp.content_config,
      completion_config: cp.completion_config,
    },
    {
      seed_key: key(slug, "page", "recommendations"),
      chapter_index: 2,
      page_type: "recommendations",
      layout_type: "embed",
      title: "商品推薦",
      subtitle: "材料與器具（尚未綁定商品時顯示空狀態）",
      body: "此食譜尚未綁定商城商品，可於後台材料列選擇對應商品。",
      content_config: { ctaPrimary: "分享作品" },
    },
    {
      seed_key: key(slug, "page", "submissions"),
      chapter_index: 2,
      page_type: "submissions",
      layout_type: "embed",
      title: "分享作品",
      subtitle: "可略過",
      body: "完成後歡迎上傳成品照片與製作心得；也可設為僅自己查看。此步驟可略過。",
      content_config: { ctaPrimary: "繼續", skipAllowed: true },
    },
    {
      seed_key: key(slug, "page", "completion"),
      chapter_index: 2,
      page_type: "completion",
      layout_type: "full_bleed",
      title: "恭喜完成！",
      subtitle: "為自己的烘焙作品留下紀錄吧。",
      body: "你可以上傳成品照片、分享製作心得，或繼續探索其他食譜。",
      alignment: "center",
      completion_config: { ...COMPLETION_CONFIG },
      content_config: { ...COMPLETION_CONFIG },
    }
  );

  return pages;
}

/* -------------------------------------------------------------------------- */
/* Recipe 1: 巧克力堅果軟餅乾                                                   */
/* -------------------------------------------------------------------------- */

const COOKIE_SLUG = "chocolate-nut-soft-cookies";
const COOKIE_PREP = [
  "奶油與蛋液恢復室溫",
  "核桃預先烤香並切碎",
  "低筋麵粉、小蘇打粉及鹽混合",
  "烤盤鋪烘焙紙",
];
const COOKIE_STEPS: FlipbookStepSeed[] = [
  {
    seed_key: key(COOKIE_SLUG, "step", "mix-butter-sugar"),
    step_number: 1,
    title: "奶油與糖拌勻",
    description:
      "將軟化奶油、二砂糖及細砂糖放入攪拌盆，以打蛋器攪拌至均勻滑順。",
    timer_seconds: 120,
    chef_notes: "奶油只需拌勻，不需要打發到泛白。",
    common_mistakes: "奶油融化會使餅乾攤得過薄。",
  },
  {
    seed_key: key(COOKIE_SLUG, "step", "add-egg"),
    step_number: 2,
    title: "加入蛋液",
    description:
      "將蛋液分2次加入，每次攪拌至完全吸收後再加入下一次。",
    timer_seconds: 120,
    chef_notes: "蛋液需接近室溫，避免油水分離。",
  },
  {
    seed_key: key(COOKIE_SLUG, "step", "add-flour"),
    step_number: 3,
    title: "拌入粉類",
    description:
      "加入低筋麵粉、小蘇打粉及鹽，用刮刀切拌至仍有少量乾粉。",
    chef_notes: "不要畫圈過度攪拌，以免產生筋性。",
  },
  {
    seed_key: key(COOKIE_SLUG, "step", "add-mixins"),
    step_number: 4,
    title: "加入巧克力與核桃",
    description: "加入巧克力豆及核桃，翻拌至分布均勻。",
    timer_seconds: 60,
  },
  {
    seed_key: key(COOKIE_SLUG, "step", "portion-chill"),
    step_number: 5,
    title: "分割與冷藏",
    description: "每份分割約48克，搓圓後冷藏30分鐘。",
    timer_seconds: 1800,
  },
  {
    seed_key: key(COOKIE_SLUG, "step", "bake"),
    step_number: 6,
    title: "烘烤",
    description: "放入預熱至170°C的烤箱，烘烤13至15分鐘。",
    timer_seconds: 840,
    temperature: "170°C",
    chef_notes: "中心看起來稍微柔軟即可出爐。",
  },
];

const RECIPE_COOKIE: FlipbookRecipeSeed = {
  slug: COOKIE_SLUG,
  title: "巧克力堅果軟餅乾",
  category_slug: "cookie",
  category_name: "餅乾",
  summary: "外層微酥、中心柔軟，充滿巧克力與堅果香氣的美式軟餅乾。",
  content:
    "外層微酥、中心柔軟的美式軟餅乾，搭配耐烤巧克力豆與烤香核桃。適合親子與新手練習乳化、切拌與出爐判斷。",
  difficulty: "easy",
  servings: "約12片",
  prep_time: 20,
  cook_time: 15,
  total_time: 35,
  storage_method: "密封室溫保存2天，冷藏保存5天；食用前回烤可恢復口感。",
  tips: "麵糰不要過度攪拌，烘烤至邊緣定型但中心仍稍軟即可出爐。",
  allergens: ["蛋", "奶", "麩質", "堅果"],
  tags: ["餅乾", "巧克力", "親子烘焙", "新手"],
  ingredients: [
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "butter"),
      group_name: "餅乾麵糰",
      name: "無鹽奶油",
      quantity_numeric: 100,
      amount: "100",
      unit: "g",
      note: "室溫軟化",
      sort_order: 1,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "brown-sugar"),
      group_name: "餅乾麵糰",
      name: "二砂糖",
      quantity_numeric: 60,
      amount: "60",
      unit: "g",
      sort_order: 2,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "sugar"),
      group_name: "餅乾麵糰",
      name: "細砂糖",
      quantity_numeric: 30,
      amount: "30",
      unit: "g",
      sort_order: 3,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "egg"),
      group_name: "餅乾麵糰",
      name: "全蛋液",
      quantity_numeric: 50,
      amount: "50",
      unit: "g",
      note: "室溫",
      sort_order: 4,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "cake-flour"),
      group_name: "餅乾麵糰",
      name: "低筋麵粉",
      quantity_numeric: 180,
      amount: "180",
      unit: "g",
      note: "過篩",
      sort_order: 5,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "baking-soda"),
      group_name: "餅乾麵糰",
      name: "小蘇打粉",
      quantity_numeric: 2,
      amount: "2",
      unit: "g",
      sort_order: 6,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "salt"),
      group_name: "餅乾麵糰",
      name: "鹽",
      quantity_numeric: 1,
      amount: "1",
      unit: "g",
      sort_order: 7,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "chocolate-chips"),
      group_name: "配料",
      name: "耐烤巧克力豆",
      quantity_numeric: 100,
      amount: "100",
      unit: "g",
      sort_order: 8,
    },
    {
      seed_key: key(COOKIE_SLUG, "ingredient", "walnut"),
      group_name: "配料",
      name: "核桃",
      quantity_numeric: 60,
      amount: "60",
      unit: "g",
      note: "烤香切碎",
      sort_order: 9,
    },
  ],
  tools: [
    { seed_key: key(COOKIE_SLUG, "tool", "scale"), name: "電子秤", sort_order: 1 },
    {
      seed_key: key(COOKIE_SLUG, "tool", "bowl"),
      name: "攪拌盆",
      notes: "x2",
      sort_order: 2,
    },
    { seed_key: key(COOKIE_SLUG, "tool", "whisk"), name: "打蛋器", sort_order: 3 },
    { seed_key: key(COOKIE_SLUG, "tool", "spatula"), name: "刮刀", sort_order: 4 },
    { seed_key: key(COOKIE_SLUG, "tool", "tray"), name: "烤盤", sort_order: 5 },
    { seed_key: key(COOKIE_SLUG, "tool", "paper"), name: "烘焙紙", sort_order: 6 },
    { seed_key: key(COOKIE_SLUG, "tool", "oven"), name: "烤箱", sort_order: 7 },
  ],
  steps: COOKIE_STEPS,
  preparations: COOKIE_PREP,
  chapters: SHARED_CHAPTERS,
  pages: buildBasePages(COOKIE_SLUG, "巧克力堅果軟餅乾", COOKIE_PREP, COOKIE_STEPS),
};

/* -------------------------------------------------------------------------- */
/* Recipe 2: 經典香草戚風蛋糕                                                   */
/* -------------------------------------------------------------------------- */

const CHIFFON_SLUG = "classic-vanilla-chiffon-cake";
const CHIFFON_PREP = [
  "蛋黃與蛋白分開",
  "蛋白冷藏備用",
  "低筋麵粉過篩",
  "烤箱預熱至160°C",
  "模具不可抹油",
];
const CHIFFON_STEPS: FlipbookStepSeed[] = [
  {
    seed_key: key(CHIFFON_SLUG, "step", "yolk-batter"),
    step_number: 1,
    title: "製作蛋黃糊",
    description: "蛋黃加入植物油攪拌乳化，再加入鮮奶與香草精拌勻。",
  },
  {
    seed_key: key(CHIFFON_SLUG, "step", "add-flour"),
    step_number: 2,
    title: "加入低筋麵粉",
    description: "加入過篩低筋麵粉，以打蛋器輕柔拌至無乾粉。",
    chef_notes: "不要過度攪拌。",
  },
  {
    seed_key: key(CHIFFON_SLUG, "step", "whip-meringue"),
    step_number: 3,
    title: "打發蛋白霜",
    description: "蛋白加入檸檬汁，細砂糖分3次加入，打至中性發泡。",
    timer_seconds: 300,
    chef_notes: "提起打蛋器呈現微彎小尖角。",
  },
  {
    seed_key: key(CHIFFON_SLUG, "step", "fold"),
    step_number: 4,
    title: "混合麵糊",
    description: "先取三分之一蛋白霜與蛋黃糊拌勻，再倒回剩餘蛋白霜翻拌。",
    chef_notes: "使用由底部向上翻拌的方式。",
  },
  {
    seed_key: key(CHIFFON_SLUG, "step", "pan"),
    step_number: 5,
    title: "入模",
    description: "將麵糊倒入模具，輕震排出大型氣泡。",
  },
  {
    seed_key: key(CHIFFON_SLUG, "step", "bake"),
    step_number: 6,
    title: "烘烤",
    description: "以160°C烘烤約38至42分鐘。",
    timer_seconds: 2400,
    temperature: "160°C",
  },
  {
    seed_key: key(CHIFFON_SLUG, "step", "invert"),
    step_number: 7,
    title: "倒扣脫模",
    description: "出爐後立即倒扣，完全冷卻後再脫模。",
    timer_seconds: 3600,
  },
];

const RECIPE_CHIFFON: FlipbookRecipeSeed = {
  slug: CHIFFON_SLUG,
  title: "經典香草戚風蛋糕",
  category_slug: "cake",
  category_name: "蛋糕",
  summary: "組織柔軟、香氣清爽，適合新手學習蛋白霜與翻拌技巧的經典戚風。",
  content:
    "經典香草戚風強調蛋白霜狀態與翻拌手法。掌握中性發泡與倒扣冷卻，就能烤出柔軟有彈性的蛋糕。",
  difficulty: "medium",
  servings: "6吋中空模1個",
  prep_time: 25,
  cook_time: 40,
  total_time: 65,
  storage_method: "密封室溫保存1天，冷藏保存3天。",
  tips: "蛋白霜狀態與翻拌手法是戚風成功的關鍵。",
  allergens: ["蛋", "奶", "麩質"],
  tags: ["戚風蛋糕", "蛋白霜", "基礎蛋糕"],
  ingredients: [
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "yolk"),
      group_name: "蛋黃糊",
      name: "蛋黃",
      quantity_numeric: 3,
      amount: "3",
      unit: "顆",
      sort_order: 1,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "oil"),
      group_name: "蛋黃糊",
      name: "植物油",
      quantity_numeric: 30,
      amount: "30",
      unit: "g",
      sort_order: 2,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "milk"),
      group_name: "蛋黃糊",
      name: "鮮奶",
      quantity_numeric: 40,
      amount: "40",
      unit: "g",
      sort_order: 3,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "cake-flour"),
      group_name: "蛋黃糊",
      name: "低筋麵粉",
      quantity_numeric: 60,
      amount: "60",
      unit: "g",
      note: "過篩",
      sort_order: 4,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "vanilla"),
      group_name: "蛋黃糊",
      name: "香草精",
      quantity_numeric: 2,
      amount: "2",
      unit: "g",
      sort_order: 5,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "egg-white"),
      group_name: "蛋白霜",
      name: "蛋白",
      quantity_numeric: 3,
      amount: "3",
      unit: "顆",
      sort_order: 6,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "sugar"),
      group_name: "蛋白霜",
      name: "細砂糖",
      quantity_numeric: 55,
      amount: "55",
      unit: "g",
      sort_order: 7,
    },
    {
      seed_key: key(CHIFFON_SLUG, "ingredient", "lemon"),
      group_name: "蛋白霜",
      name: "檸檬汁",
      quantity_numeric: 3,
      amount: "3",
      unit: "g",
      sort_order: 8,
    },
  ],
  tools: [
    {
      seed_key: key(CHIFFON_SLUG, "tool", "chiffon-pan"),
      name: "6吋中空戚風模",
      sort_order: 1,
    },
    {
      seed_key: key(CHIFFON_SLUG, "tool", "bowl"),
      name: "攪拌盆",
      notes: "x2",
      sort_order: 2,
    },
    {
      seed_key: key(CHIFFON_SLUG, "tool", "electric-mixer"),
      name: "電動打蛋器",
      sort_order: 3,
    },
    {
      seed_key: key(CHIFFON_SLUG, "tool", "hand-whisk"),
      name: "手持打蛋器",
      sort_order: 4,
    },
    { seed_key: key(CHIFFON_SLUG, "tool", "spatula"), name: "刮刀", sort_order: 5 },
    { seed_key: key(CHIFFON_SLUG, "tool", "sieve"), name: "篩網", sort_order: 6 },
    { seed_key: key(CHIFFON_SLUG, "tool", "oven"), name: "烤箱", sort_order: 7 },
  ],
  steps: CHIFFON_STEPS,
  preparations: CHIFFON_PREP,
  chapters: SHARED_CHAPTERS,
  pages: buildBasePages(CHIFFON_SLUG, "經典香草戚風蛋糕", CHIFFON_PREP, CHIFFON_STEPS, {
    comparison: {
      seed_key: key(CHIFFON_SLUG, "page", "comparison-meringue"),
      title: "蛋白霜狀態比較",
      prompt: "哪一種蛋白霜最適合戚風？",
      body: "提起打蛋器觀察尖角狀態，選擇正確的中性發泡。",
      options: [
        {
          id: "soft",
          label: "濕性發泡",
          caption: "尖角明顯下垂",
          outcome: "wrong",
        },
        {
          id: "medium",
          label: "中性發泡",
          caption: "尖角微彎，適合戚風",
          outcome: "correct",
        },
        {
          id: "stiff",
          label: "乾性發泡",
          caption: "尖角直立，容易翻拌不均",
          outcome: "wrong",
        },
      ],
    },
  }),
};

/* -------------------------------------------------------------------------- */
/* Recipe 3: 金鑽鳳梨酥                                                         */
/* -------------------------------------------------------------------------- */

const PINE_SLUG = "golden-pineapple-cakes";
const PINE_PREP = [
  "奶油與蛋液恢復室溫",
  "低筋麵粉與奶粉過篩",
  "鳳梨餡預先分割",
  "烤箱預熱至170°C",
];
const PINE_STEPS: FlipbookStepSeed[] = [
  {
    seed_key: key(PINE_SLUG, "step", "cream-sugar"),
    step_number: 1,
    title: "奶油拌糖",
    description: "軟化奶油加入糖粉與鹽，攪拌至均勻滑順。",
  },
  {
    seed_key: key(PINE_SLUG, "step", "add-egg"),
    step_number: 2,
    title: "加入蛋液",
    description: "蛋液分2次加入，每次完全吸收後再加入下一次。",
  },
  {
    seed_key: key(PINE_SLUG, "step", "add-flour"),
    step_number: 3,
    title: "加入粉類",
    description: "加入低筋麵粉與奶粉，以刮刀壓拌成團。",
    chef_notes: "成團後立即停止攪拌。",
  },
  {
    seed_key: key(PINE_SLUG, "step", "portion"),
    step_number: 4,
    title: "分割",
    description: "外皮每份約28克，鳳梨餡每份約25克。",
  },
  {
    seed_key: key(PINE_SLUG, "step", "wrap"),
    step_number: 5,
    title: "包餡",
    description: "外皮壓扁，包入鳳梨餡並收口。",
  },
  {
    seed_key: key(PINE_SLUG, "step", "mold"),
    step_number: 6,
    title: "入模整形",
    description: "放入模具，輕壓至四角完整。",
  },
  {
    seed_key: key(PINE_SLUG, "step", "bake-flip"),
    step_number: 7,
    title: "烘烤翻面",
    description: "以170°C烘烤12分鐘後翻面，再烤10至12分鐘。",
    timer_seconds: 1380,
    temperature: "170°C",
  },
  {
    seed_key: key(PINE_SLUG, "step", "cool"),
    step_number: 8,
    title: "冷卻",
    description: "出爐後靜置5分鐘再脫模，放涼後密封。",
  },
];

const RECIPE_PINEAPPLE: FlipbookRecipeSeed = {
  slug: PINE_SLUG,
  title: "金鑽鳳梨酥",
  category_slug: "chinese-dessert",
  category_name: "中式點心",
  summary: "奶香酥鬆外皮包裹酸甜鳳梨餡，適合伴手禮與節慶製作。",
  content:
    "酥鬆奶香外皮搭配酸甜鳳梨餡。重點是外皮不過度攪拌，以及包餡時厚薄均勻。",
  difficulty: "medium",
  servings: "約12個",
  prep_time: 35,
  cook_time: 25,
  total_time: 60,
  storage_method: "完全冷卻後密封，室溫保存5至7天。",
  tips: "外皮不要過度攪拌，包餡時厚薄應均勻。",
  allergens: ["蛋", "奶", "麩質"],
  tags: ["鳳梨酥", "伴手禮", "中式點心"],
  ingredients: [
    {
      seed_key: key(PINE_SLUG, "ingredient", "butter"),
      group_name: "外皮",
      name: "無鹽奶油",
      quantity_numeric: 120,
      amount: "120",
      unit: "g",
      note: "室溫軟化",
      sort_order: 1,
    },
    {
      seed_key: key(PINE_SLUG, "ingredient", "powdered-sugar"),
      group_name: "外皮",
      name: "糖粉",
      quantity_numeric: 35,
      amount: "35",
      unit: "g",
      sort_order: 2,
    },
    {
      seed_key: key(PINE_SLUG, "ingredient", "egg"),
      group_name: "外皮",
      name: "全蛋液",
      quantity_numeric: 35,
      amount: "35",
      unit: "g",
      sort_order: 3,
    },
    {
      seed_key: key(PINE_SLUG, "ingredient", "cake-flour"),
      group_name: "外皮",
      name: "低筋麵粉",
      quantity_numeric: 180,
      amount: "180",
      unit: "g",
      sort_order: 4,
    },
    {
      seed_key: key(PINE_SLUG, "ingredient", "milk-powder"),
      group_name: "外皮",
      name: "奶粉",
      quantity_numeric: 20,
      amount: "20",
      unit: "g",
      sort_order: 5,
    },
    {
      seed_key: key(PINE_SLUG, "ingredient", "salt"),
      group_name: "外皮",
      name: "鹽",
      quantity_numeric: 1,
      amount: "1",
      unit: "g",
      sort_order: 6,
    },
    {
      seed_key: key(PINE_SLUG, "ingredient", "filling"),
      group_name: "內餡",
      name: "鳳梨餡",
      quantity_numeric: 300,
      amount: "300",
      unit: "g",
      sort_order: 7,
    },
  ],
  tools: [
    { seed_key: key(PINE_SLUG, "tool", "bowl"), name: "攪拌盆", sort_order: 1 },
    { seed_key: key(PINE_SLUG, "tool", "whisk"), name: "打蛋器", sort_order: 2 },
    { seed_key: key(PINE_SLUG, "tool", "spatula"), name: "刮刀", sort_order: 3 },
    { seed_key: key(PINE_SLUG, "tool", "scale"), name: "電子秤", sort_order: 4 },
    {
      seed_key: key(PINE_SLUG, "tool", "mold"),
      name: "鳳梨酥模",
      notes: "x12",
      sort_order: 5,
    },
    { seed_key: key(PINE_SLUG, "tool", "tray"), name: "烤盤", sort_order: 6 },
    { seed_key: key(PINE_SLUG, "tool", "oven"), name: "烤箱", sort_order: 7 },
  ],
  steps: PINE_STEPS,
  preparations: PINE_PREP,
  chapters: SHARED_CHAPTERS,
  pages: buildBasePages(PINE_SLUG, "金鑽鳳梨酥", PINE_PREP, PINE_STEPS, {
    comparison: {
      seed_key: key(PINE_SLUG, "page", "comparison-wrap"),
      title: "外皮包餡狀態",
      prompt: "包餡後的外皮比較像哪一種？",
      body: "厚薄均勻才能保持完整外型與平衡口感。",
      options: [
        {
          id: "thin",
          label: "外皮太薄",
          caption: "烘烤後容易露餡",
          outcome: "wrong",
        },
        {
          id: "even",
          label: "厚薄均勻",
          caption: "外型完整、口感平衡",
          outcome: "correct",
        },
        {
          id: "thick",
          label: "收口太厚",
          caption: "底部口感過硬",
          outcome: "wrong",
        },
      ],
    },
  }),
};

/* -------------------------------------------------------------------------- */
/* Recipe 4: 迷迭香海鹽佛卡夏                                                   */
/* -------------------------------------------------------------------------- */

const FOC_SLUG = "rosemary-sea-salt-focaccia";
const FOC_PREP = [
  "準備室溫水",
  "烤盤抹橄欖油",
  "迷迭香洗淨並擦乾",
  "烤箱於最後發酵時預熱至210°C",
];
const FOC_STEPS: FlipbookStepSeed[] = [
  {
    seed_key: key(FOC_SLUG, "step", "mix"),
    step_number: 1,
    title: "混合麵糰",
    description: "高筋麵粉、水、酵母與糖混合至無乾粉，靜置20分鐘。",
    timer_seconds: 1200,
  },
  {
    seed_key: key(FOC_SLUG, "step", "salt-oil"),
    step_number: 2,
    title: "加入鹽與橄欖油",
    description: "加入鹽及橄欖油，以摺疊方式混合均勻。",
  },
  {
    seed_key: key(FOC_SLUG, "step", "fold-1"),
    step_number: 3,
    title: "第一次摺疊",
    description: "手沾水，將麵糰四邊向中心摺疊，靜置20分鐘。",
    timer_seconds: 1200,
  },
  {
    seed_key: key(FOC_SLUG, "step", "fold-2"),
    step_number: 4,
    title: "第二次摺疊",
    description: "再次進行四邊摺疊，靜置40至50分鐘。",
    timer_seconds: 2700,
  },
  {
    seed_key: key(FOC_SLUG, "step", "pan"),
    step_number: 5,
    title: "放入烤盤",
    description: "烤盤抹橄欖油，將麵糰移入並輕柔延展。",
  },
  {
    seed_key: key(FOC_SLUG, "step", "final-proof"),
    step_number: 6,
    title: "最後發酵",
    description: "發酵約30分鐘，至麵糰明顯膨脹。",
    timer_seconds: 1800,
  },
  {
    seed_key: key(FOC_SLUG, "step", "dimple"),
    step_number: 7,
    title: "壓洞與裝飾",
    description: "手指沾橄欖油，在麵糰表面壓出凹洞，放上迷迭香並撒海鹽。",
  },
  {
    seed_key: key(FOC_SLUG, "step", "bake"),
    step_number: 8,
    title: "烘烤",
    description: "以210°C烘烤22至25分鐘。",
    timer_seconds: 1440,
    temperature: "210°C",
  },
];

const RECIPE_FOCACCIA: FlipbookRecipeSeed = {
  slug: FOC_SLUG,
  title: "迷迭香海鹽佛卡夏",
  category_slug: "bread",
  category_name: "麵包",
  summary: "外層金黃酥香、內部濕潤有彈性，帶有橄欖油與迷迭香氣息。",
  content:
    "高含水免揉佛卡夏，以摺疊建立筋性。完成發酵後壓洞裝飾迷迭香與海鹽，烘出金黃酥香外皮。",
  difficulty: "medium",
  servings: "20×20cm烤盤1盤",
  prep_time: 30,
  cook_time: 25,
  total_time: 145,
  storage_method: "室溫密封保存2天，食用前以烤箱回烤。",
  tips: "麵糰含水量較高，使用摺疊方式建立筋性，不需加入過多手粉。",
  allergens: ["麩質"],
  tags: ["佛卡夏", "麵包", "橄欖油", "免揉"],
  ingredients: [
    {
      seed_key: key(FOC_SLUG, "ingredient", "bread-flour"),
      group_name: "主麵糰",
      name: "高筋麵粉",
      quantity_numeric: 300,
      amount: "300",
      unit: "g",
      sort_order: 1,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "water"),
      group_name: "主麵糰",
      name: "水",
      quantity_numeric: 240,
      amount: "240",
      unit: "g",
      note: "室溫",
      sort_order: 2,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "yeast"),
      group_name: "主麵糰",
      name: "速發酵母",
      quantity_numeric: 3,
      amount: "3",
      unit: "g",
      sort_order: 3,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "sugar"),
      group_name: "主麵糰",
      name: "細砂糖",
      quantity_numeric: 8,
      amount: "8",
      unit: "g",
      sort_order: 4,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "salt"),
      group_name: "主麵糰",
      name: "鹽",
      quantity_numeric: 5,
      amount: "5",
      unit: "g",
      sort_order: 5,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "olive-oil-dough"),
      group_name: "主麵糰",
      name: "橄欖油",
      quantity_numeric: 20,
      amount: "20",
      unit: "g",
      sort_order: 6,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "olive-oil-top"),
      group_name: "表面裝飾",
      name: "橄欖油",
      quantity_numeric: 20,
      amount: "20",
      unit: "g",
      sort_order: 7,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "rosemary"),
      group_name: "表面裝飾",
      name: "新鮮迷迭香",
      quantity_numeric: 2,
      amount: "2",
      unit: "枝",
      sort_order: 8,
    },
    {
      seed_key: key(FOC_SLUG, "ingredient", "sea-salt"),
      group_name: "表面裝飾",
      name: "海鹽",
      quantity_numeric: 2,
      amount: "2",
      unit: "g",
      sort_order: 9,
    },
  ],
  tools: [
    { seed_key: key(FOC_SLUG, "tool", "bowl"), name: "攪拌盆", sort_order: 1 },
    { seed_key: key(FOC_SLUG, "tool", "scraper"), name: "刮板", sort_order: 2 },
    {
      seed_key: key(FOC_SLUG, "tool", "pan"),
      name: "20×20cm烤盤",
      sort_order: 3,
    },
    { seed_key: key(FOC_SLUG, "tool", "wrap"), name: "保鮮膜", sort_order: 4 },
    { seed_key: key(FOC_SLUG, "tool", "oven"), name: "烤箱", sort_order: 5 },
  ],
  steps: FOC_STEPS,
  preparations: FOC_PREP,
  chapters: SHARED_CHAPTERS,
  pages: buildBasePages(FOC_SLUG, "迷迭香海鹽佛卡夏", FOC_PREP, FOC_STEPS, {
    timer: {
      seed_key: key(FOC_SLUG, "page", "timer-proof"),
      title: "最後發酵計時",
      subtitle: "約 30 分鐘",
      body: "發酵至麵糰明顯膨脹、按壓後緩慢回彈即可。",
      timerSeconds: 1800,
      timerLabel: "最後發酵",
      step_number: 6,
    },
    comparison: {
      seed_key: key(FOC_SLUG, "page", "comparison-proof"),
      title: "發酵完成狀態",
      prompt: "你的麵糰比較像哪一種發酵狀態？",
      body: "正確發酵的麵糰會明顯膨脹，按壓後緩慢回彈。",
      options: [
        {
          id: "under",
          label: "發酵不足",
          caption: "體積小、按壓快速回彈",
          outcome: "wrong",
        },
        {
          id: "ready",
          label: "發酵完成",
          caption: "明顯膨脹、按壓緩慢回彈",
          outcome: "correct",
        },
        {
          id: "over",
          label: "發酵過度",
          caption: "表面脆弱、按壓後無法回彈",
          outcome: "wrong",
        },
      ],
    },
  }),
};

/* -------------------------------------------------------------------------- */
/* Recipe 5: 蔓越莓乳酪司康                                                     */
/* -------------------------------------------------------------------------- */

const SCONE_SLUG = "cranberry-cream-cheese-scones";
const SCONE_PREP = [
  "奶油及奶油乳酪切丁冷藏",
  "鮮奶保持冰冷",
  "低筋麵粉與泡打粉混合",
  "烤盤鋪烘焙紙",
  "烤箱預熱至190°C",
];
const SCONE_STEPS: FlipbookStepSeed[] = [
  {
    seed_key: key(SCONE_SLUG, "step", "mix-dry"),
    step_number: 1,
    title: "混合乾粉",
    description: "低筋麵粉、泡打粉、細砂糖及鹽混合均勻。",
  },
  {
    seed_key: key(SCONE_SLUG, "step", "cut-butter"),
    step_number: 2,
    title: "切入奶油",
    description: "加入冰冷奶油丁，以指尖搓成粗砂狀。",
    chef_notes: "保留部分小奶油顆粒可增加酥鬆層次。",
  },
  {
    seed_key: key(SCONE_SLUG, "step", "add-cheese-berry"),
    step_number: 3,
    title: "加入乳酪與蔓越莓",
    description: "加入奶油乳酪丁及蔓越莓乾，稍微拌勻。",
  },
  {
    seed_key: key(SCONE_SLUG, "step", "add-milk"),
    step_number: 4,
    title: "加入鮮奶",
    description: "倒入冰鮮奶，以刮板切拌成鬆散麵糰。",
    chef_notes: "不需要揉至光滑。",
  },
  {
    seed_key: key(SCONE_SLUG, "step", "fold"),
    step_number: 5,
    title: "摺疊麵糰",
    description: "將麵糰壓平後對折，重複2至3次。",
  },
  {
    seed_key: key(SCONE_SLUG, "step", "chill"),
    step_number: 6,
    title: "冷藏",
    description: "麵糰包好冷藏30分鐘。",
    timer_seconds: 1800,
  },
  {
    seed_key: key(SCONE_SLUG, "step", "cut"),
    step_number: 7,
    title: "分割",
    description: "麵糰擀至約2.5cm厚，切成8份，表面刷蛋液。",
  },
  {
    seed_key: key(SCONE_SLUG, "step", "bake"),
    step_number: 8,
    title: "烘烤",
    description: "以190°C烘烤18至22分鐘。",
    timer_seconds: 1200,
    temperature: "190°C",
  },
];

const RECIPE_SCONE: FlipbookRecipeSeed = {
  slug: SCONE_SLUG,
  title: "蔓越莓乳酪司康",
  category_slug: "scone",
  category_name: "司康",
  summary: "外層酥鬆、內部濕潤，搭配蔓越莓酸甜與乳酪奶香。",
  content:
    "冰冷奶油與乳酪是司康酥鬆的關鍵。切拌成團後少量摺疊定層，冷藏後再切割烘烤。",
  difficulty: "easy",
  servings: "約8個",
  prep_time: 25,
  cook_time: 20,
  total_time: 75,
  storage_method: "室溫密封保存1天，冷凍保存14天，食用前回烤。",
  tips: "奶油與乳酪必須保持冰冷，麵糰不要反覆揉壓。",
  allergens: ["蛋", "奶", "麩質"],
  tags: ["司康", "蔓越莓", "乳酪", "新手"],
  ingredients: [
    {
      seed_key: key(SCONE_SLUG, "ingredient", "cake-flour"),
      group_name: "司康麵糰",
      name: "低筋麵粉",
      quantity_numeric: 200,
      amount: "200",
      unit: "g",
      sort_order: 1,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "baking-powder"),
      group_name: "司康麵糰",
      name: "泡打粉",
      quantity_numeric: 8,
      amount: "8",
      unit: "g",
      sort_order: 2,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "sugar"),
      group_name: "司康麵糰",
      name: "細砂糖",
      quantity_numeric: 35,
      amount: "35",
      unit: "g",
      sort_order: 3,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "salt"),
      group_name: "司康麵糰",
      name: "鹽",
      quantity_numeric: 2,
      amount: "2",
      unit: "g",
      sort_order: 4,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "butter"),
      group_name: "司康麵糰",
      name: "無鹽奶油",
      quantity_numeric: 55,
      amount: "55",
      unit: "g",
      note: "冰冷切丁",
      sort_order: 5,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "cream-cheese"),
      group_name: "司康麵糰",
      name: "奶油乳酪",
      quantity_numeric: 60,
      amount: "60",
      unit: "g",
      note: "冰冷切丁",
      sort_order: 6,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "milk"),
      group_name: "司康麵糰",
      name: "鮮奶",
      quantity_numeric: 75,
      amount: "75",
      unit: "g",
      note: "冰冷",
      sort_order: 7,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "cranberry"),
      group_name: "司康麵糰",
      name: "蔓越莓乾",
      quantity_numeric: 50,
      amount: "50",
      unit: "g",
      sort_order: 8,
    },
    {
      seed_key: key(SCONE_SLUG, "ingredient", "egg-wash"),
      group_name: "表面",
      name: "全蛋液",
      quantity_numeric: 15,
      amount: "15",
      unit: "g",
      sort_order: 9,
    },
  ],
  tools: [
    { seed_key: key(SCONE_SLUG, "tool", "bowl"), name: "攪拌盆", sort_order: 1 },
    { seed_key: key(SCONE_SLUG, "tool", "scraper"), name: "刮板", sort_order: 2 },
    { seed_key: key(SCONE_SLUG, "tool", "rolling-pin"), name: "擀麵棍", sort_order: 3 },
    { seed_key: key(SCONE_SLUG, "tool", "cutter"), name: "切模", sort_order: 4 },
    { seed_key: key(SCONE_SLUG, "tool", "tray"), name: "烤盤", sort_order: 5 },
    { seed_key: key(SCONE_SLUG, "tool", "paper"), name: "烘焙紙", sort_order: 6 },
    { seed_key: key(SCONE_SLUG, "tool", "oven"), name: "烤箱", sort_order: 7 },
  ],
  steps: SCONE_STEPS,
  preparations: SCONE_PREP,
  chapters: SHARED_CHAPTERS,
  pages: buildBasePages(SCONE_SLUG, "蔓越莓乳酪司康", SCONE_PREP, SCONE_STEPS, {
    comparison: {
      seed_key: key(SCONE_SLUG, "page", "comparison-dough"),
      title: "司康麵糰狀態",
      prompt: "加入鮮奶拌完後，麵糰比較像哪一種？",
      body: "正確狀態應略顯粗糙但可成團，不要揉到光滑。",
      options: [
        {
          id: "dry",
          label: "太乾",
          caption: "麵糰無法聚合",
          outcome: "wrong",
        },
        {
          id: "ok",
          label: "正確",
          caption: "略顯粗糙但可成團",
          outcome: "correct",
        },
        {
          id: "over",
          label: "過度攪拌",
          caption: "表面光滑且產生筋性",
          outcome: "wrong",
        },
      ],
    },
  }),
};

export const FLIPBOOK_RECIPES: FlipbookRecipeSeed[] = [
  RECIPE_COOKIE,
  RECIPE_CHIFFON,
  RECIPE_PINEAPPLE,
  RECIPE_FOCACCIA,
  RECIPE_SCONE,
];
