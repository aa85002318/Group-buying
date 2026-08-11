/** Rule-based AI baking knowledge — works offline without OpenAI */

export const INGREDIENT_ALIASES: Record<string, string[]> = {
  butter: ["奶油", "無鹽奶油", "有鹽奶油", "butter"],
  egg: ["雞蛋", "蛋", "蛋黃", "蛋白", "egg"],
  cake_flour: ["低粉", "低筋麵粉", "蛋糕粉", "低筋"],
  milk: ["牛奶", "鮮奶", "全脂牛奶", "milk"],
  sugar: ["糖", "細砂糖", "糖粉", "二砂糖"],
  flour: ["中粉", "中筋麵粉", "高粉", "高筋麵粉", "麵粉"],
  oil: ["植物油", "沙拉油", "橄欖油", "油"],
  cream: ["鮮奶油", "動物性鮮奶油", "植物性鮮奶油"],
  yeast: ["酵母", "乾酵母", "即發乾酵母"],
  chocolate: ["巧克力", "可可粉", "苦甜巧克力"],
};

export type RecipeSuggest = {
  id: string;
  name: string;
  matchScore: number;
  needed: string[];
  missing: string[];
  difficulty: "簡單" | "中等" | "進階";
  tip: string;
};

const RECIPES: Array<{
  id: string;
  name: string;
  ingredients: string[];
  difficulty: RecipeSuggest["difficulty"];
  tip: string;
}> = [
  { id: "scone", name: "司康", ingredients: ["butter", "flour", "milk", "sugar", "egg"], difficulty: "簡單", tip: "奶油要保持冰冷，切勿過度揉麵。" },
  { id: "cookie", name: "餅乾", ingredients: ["butter", "sugar", "flour", "egg"], difficulty: "簡單", tip: "烤前冷藏麵團可減少攤開。" },
  { id: "madeleine", name: "瑪德蓮", ingredients: ["butter", "cake_flour", "egg", "sugar"], difficulty: "中等", tip: "麵糊冷藏後烤出蜂腰更好看。" },
  { id: "pancake", name: "鬆餅", ingredients: ["flour", "milk", "egg", "sugar", "butter"], difficulty: "簡單", tip: "麵糊靜置 10 分鐘口感更鬆軟。" },
  { id: "pound_cake", name: "磅蛋糕", ingredients: ["butter", "sugar", "egg", "cake_flour"], difficulty: "中等", tip: "奶油與糖要充分打發。" },
  { id: "choux", name: "泡芙", ingredients: ["butter", "flour", "egg", "milk"], difficulty: "進階", tip: "麵糊要燙熟，蛋分次加入。" },
  { id: "muffin", name: "瑪芬", ingredients: ["flour", "egg", "milk", "oil", "sugar"], difficulty: "簡單", tip: "攪拌至剛好結合即可，避免筋性過強。" },
  { id: "bread", name: "基礎吐司", ingredients: ["flour", "milk", "butter", "sugar", "yeast", "egg"], difficulty: "進階", tip: "發酵至兩倍大再整形。" },
];

export function normalizeIngredient(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  for (const [key, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    if (aliases.some((a) => t.includes(a.toLowerCase()) || a.toLowerCase().includes(t))) {
      return key;
    }
  }
  return null;
}

export function suggestRecipes(haveRaw: string[]): RecipeSuggest[] {
  const have = new Set(
    haveRaw.map(normalizeIngredient).filter((x): x is string => Boolean(x))
  );
  return RECIPES.map((r) => {
    const matched = r.ingredients.filter((i) => have.has(i));
    const missing = r.ingredients.filter((i) => !have.has(i));
    const matchScore = matched.length / r.ingredients.length;
    return {
      id: r.id,
      name: r.name,
      matchScore,
      needed: r.ingredients.map((k) => INGREDIENT_ALIASES[k]?.[0] ?? k),
      missing: missing.map((k) => INGREDIENT_ALIASES[k]?.[0] ?? k),
      difficulty: r.difficulty,
      tip: r.tip,
    };
  })
    .filter((r) => r.matchScore >= 0.4)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export type ScaleIngredient = { name: string; amount: number; unit: string };

export function scaleRecipe(ingredients: ScaleIngredient[], fromServings: number, toServings: number) {
  const factor = toServings / Math.max(1, fromServings);
  return ingredients.map((i) => ({
    ...i,
    amount: Math.round(i.amount * factor * 100) / 100,
  }));
}

export type OvenMode =
  | "家用小烤箱"
  | "上下火烤箱"
  | "旋風烤箱"
  | "對流烤箱"
  | "商用烤箱"
  | "氣炸鍋"
  | "上下火"
  | "旋風"
  | "瓦斯";

const OVEN_TO_CONVENTIONAL: Record<string, (c: number) => number> = {
  家用小烤箱: (c) => c + 5,
  上下火烤箱: (c) => c,
  上下火: (c) => c,
  旋風烤箱: (c) => c + 15,
  旋風: (c) => c + 15,
  對流烤箱: (c) => c + 15,
  商用烤箱: (c) => c + 10,
  氣炸鍋: (c) => c + 20,
  瓦斯: (c) => c + 10,
};

const CONVENTIONAL_TO_OVEN: Record<string, (c: number) => { temp: number; note: string; timeFactor: number }> = {
  家用小烤箱: (c) => ({
    temp: c - 5,
    note: "小烤箱熱源近，建議略降溫並放中下層，避免表面過快上色。",
    timeFactor: 1.05,
  }),
  上下火烤箱: (c) => ({ temp: c, note: "以上下火為基準溫度。", timeFactor: 1 }),
  上下火: (c) => ({ temp: c, note: "以上下火為基準溫度。", timeFactor: 1 }),
  旋風烤箱: (c) => ({
    temp: c - 15,
    note: "旋風熱對流較強，通常降溫 10–20°C，時間可略縮短。",
    timeFactor: 0.9,
  }),
  旋風: (c) => ({
    temp: c - 15,
    note: "旋風熱對流較強，通常降溫 10–20°C，時間可略縮短。",
    timeFactor: 0.9,
  }),
  對流烤箱: (c) => ({
    temp: c - 15,
    note: "對流烤箱類似旋風，建議降溫並觀察上色。",
    timeFactor: 0.9,
  }),
  商用烤箱: (c) => ({
    temp: c - 10,
    note: "商用烤箱蓄熱強，建議略降溫並確認實際爐溫。",
    timeFactor: 0.95,
  }),
  氣炸鍋: (c) => ({
    temp: c - 20,
    note: "氣炸鍋空間小、風量大，務必降溫並縮短時間，中途檢查。",
    timeFactor: 0.8,
  }),
  瓦斯: (c) => ({
    temp: c - 10,
    note: "瓦斯烤箱上下火溫差較大，建議中層並適時轉向。",
    timeFactor: 1,
  }),
};

/** Approximate oven conversion — programmatic, not model-guessed. */
export function convertOvenTemp(
  celsius: number,
  from: OvenMode,
  to: OvenMode,
  minutes?: number
): {
  temp: number;
  timeMin: number | null;
  timeMax: number | null;
  preheat: boolean;
  rack: string;
  rotate: boolean;
  colorCheck: string;
  note: string;
} {
  const toConv = OVEN_TO_CONVENTIONAL[from] ?? ((c: number) => c);
  const fromTarget = CONVENTIONAL_TO_OVEN[to] ?? CONVENTIONAL_TO_OVEN["上下火烤箱"];
  const conventional = toConv(celsius);
  const result = fromTarget(conventional);
  const baseTime = minutes && minutes > 0 ? minutes : null;
  return {
    temp: Math.round(result.temp),
    timeMin: baseTime ? Math.max(5, Math.round(baseTime * result.timeFactor * 0.9)) : null,
    timeMax: baseTime ? Math.round(baseTime * result.timeFactor * 1.05) : null,
    preheat: to !== "氣炸鍋",
    rack: to === "家用小烤箱" ? "中下層" : "中層",
    rotate: to === "氣炸鍋" || to === "家用小烤箱" || to.includes("瓦斯"),
    colorCheck: "最後 5–8 分鐘以目視確認上色，勿只依賴時間。",
    note: `${result.note} 此為經驗換算，不同品牌與爐況差異很大，請以成品狀態為準。`,
  };
}

export function panVolumeRatio(fromSize: string, toSize: string): number | null {
  const parse = (s: string) => {
    const nums = s.match(/(\d+(\.\d+)?)/g)?.map(Number) ?? [];
    if (nums.length >= 2) return nums[0] * nums[1];
    if (nums.length === 1) return Math.PI * Math.pow(nums[0] / 2, 2);
    return null;
  };
  const a = parse(fromSize);
  const b = parse(toSize);
  if (!a || !b) return null;
  return Math.round((b / a) * 100) / 100;
}

export const SUBSTITUTIONS: Record<string, Array<{ alt: string; ratio: string; note: string }>> = {
  奶油: [
    { alt: "植物油", ratio: "約 80% 用量", note: "口感較濕潤，香氣較淡。" },
    { alt: "乳瑪琳", ratio: "1:1", note: "可直接替換，風味偏人造奶油。" },
    { alt: "椰子油", ratio: "1:1（室溫固態）", note: "會帶椰子香，適合特定甜點。" },
  ],
  雞蛋: [
    { alt: "亞麻籽粉 + 水", ratio: "1 湯匙粉 + 3 湯匙水 ≈ 1 顆蛋", note: "適合餅乾、鬆餅；發泡類不建議。" },
    { alt: "蘋果泥", ratio: "1/4 杯 ≈ 1 顆蛋", note: "成品較濕潤偏甜。" },
  ],
  牛奶: [
    { alt: "植物奶（燕麥／杏仁）", ratio: "1:1", note: "發酵麵團可略增酵母。" },
    { alt: "水 + 奶粉", ratio: "依奶粉包裝比例", note: "接近鮮奶效果。" },
  ],
  低粉: [
    { alt: "中粉過篩 + 玉米粉", ratio: "中粉 80% + 玉米粉 20%", note: "近似低筋效果。" },
  ],
  鮮奶油: [
    { alt: "冷藏全脂牛奶 + 無鹽奶油", ratio: "3/4 杯牛奶 + 1/4 杯融化奶油", note: "僅適合烹調，不宜打發。" },
  ],
};

export function suggestSubstitutions(ingredient: string) {
  const key = Object.keys(SUBSTITUTIONS).find((k) => ingredient.includes(k) || k.includes(ingredient));
  if (!key) {
    return {
      ingredient,
      alternatives: [{ alt: "請提供更多細節", ratio: "-", note: "目前知識庫尚無此材料，建議詢問老師或客服。" }],
    };
  }
  return { ingredient: key, alternatives: SUBSTITUTIONS[key] };
}

export const FAILURE_CAUSES: Array<{ keywords: string[]; title: string; causes: string[]; fixes: string[] }> = [
  {
    keywords: ["太硬", "硬邦邦", "咬不動"],
    title: "餅乾／成品太硬",
    causes: ["麵粉比例偏高", "烤太久或溫度偏高", "奶油不足", "過度攪拌產生筋性"],
    fixes: ["減少麵粉或增加油脂", "提前 2–3 分鐘觀察上色", "確認奶油用量", "拌至剛好結合即可"],
  },
  {
    keywords: ["消泡", "塌陷", "消下去", "塌掉"],
    title: "蛋糕消泡／塌陷",
    causes: ["蛋白打發不足或過度", "拌粉太用力", "烤箱中途開門", "模具太小膨脹受限"],
    fixes: ["蛋白打至硬性發泡", "翻拌手法要輕", "前 2/3 時間勿開門", "選擇合適模具尺寸"],
  },
  {
    keywords: ["不起來", "沒發酵", "扁扁", "死麵"],
    title: "麵包不起來",
    causes: ["酵母過期或水溫過高燙死", "環境太冷發酵不足", "鹽直接接觸酵母", "揉麵不足"],
    fixes: ["用約 35–40°C 溫水活化酵母", "延長發酵或放溫暖處", "鹽與酵母分開加入", "揉至擴展階段"],
  },
  {
    keywords: ["開裂", "裂開", "表面裂"],
    title: "表面開裂",
    causes: ["烤箱溫度偏高", "麵糊水分不足", "入爐前靜置過久表面乾燥"],
    fixes: ["略降溫 10°C", "增加少許液體", "入爐前可輕噴水霧"],
  },
  {
    keywords: ["攤平", "攤開", "太薄"],
    title: "餅乾攤平",
    causes: ["奶油過軟或融化", "糖油比例偏高", "烤盤太熱、麵團未冷藏"],
    fixes: ["奶油保持冰冷", "烤前冷藏 20–30 分鐘", "使用冷烤盤"],
  },
  {
    keywords: ["油水分離", "乳化失敗", "結塊"],
    title: "油水分離",
    causes: ["材料溫差過大", "一次加水太多", "奶油溫度不對"],
    fixes: ["材料接近室溫再拌", "分次加液體", "隔熱水隔回溫再乳化"],
  },
  {
    keywords: ["奶油霜", "霜失敗", "消掉"],
    title: "奶油霜失敗",
    causes: ["奶油過軟或過硬", "糖粉受潮", "打發不足或過度"],
    fixes: ["奶油約 18–20°C", "糖粉過篩", "打發至挺立即可"],
  },
  {
    keywords: ["上色不均", "一邊焦", "顏色不均"],
    title: "上色不均",
    causes: ["烤箱熱點", "烤盤位置偏一邊", "未轉向"],
    fixes: ["中途轉向", "使用中層", "避免貼近發熱管"],
  },
  {
    keywords: ["過乾", "太乾", "乾柴"],
    title: "成品過乾",
    causes: ["烤太久", "液體不足", "低筋粉過量"],
    fixes: ["提前觀察上色", "增加油脂或液體", "確認秤重"],
  },
  {
    keywords: ["濕黏", "沒熟", "中心濕", "未熟"],
    title: "中心未熟／濕黏",
    causes: ["溫度過高外表先上色", "烘烤時間不足", "模具材質導熱差"],
    fixes: ["略降溫並延長時間", "用竹籤測試中心", "使用淺色金屬模較均勻"],
  },
];

export function analyzeFailure(symptom: string) {
  const hit = FAILURE_CAUSES.find((f) => f.keywords.some((k) => symptom.includes(k)));
  if (!hit) {
    return {
      title: "需要更多資訊",
      causes: ["症狀描述較模糊，無法精準判斷"],
      fixes: ["請補充：成品類型、烤箱溫度、時間、是否有打發步驟"],
    };
  }
  return { title: hit.title, causes: hit.causes, fixes: hit.fixes };
}

/** FAQ-style AI support replies */
export function aiSupportReply(content: string): string {
  const q = content.toLowerCase();
  if (/訂單|查單|order/.test(q)) return "請至「我的訂單」查看狀態，或提供訂單編號。待付款請完成匯款／門市繳費後回報。";
  if (/配送|宅配|運費|寄送/.test(q)) return "目前以門市取貨為主；宅配與超商取貨即將開放。取貨請出示訂單 QR Code。";
  if (/付款|匯款|刷卡|金流/.test(q)) return "支援門市付款與銀行匯款。匯款後請於訂單頁回報後五碼；線上刷卡即將開放。";
  if (/課程|報名|教室/.test(q)) return "請至「課程中心」查看場次與剩餘名額。報名成功後會產生電子票券 QR Code 供報到。";
  if (/直播|live|youtube|fb/.test(q)) return "請至「直播專區」觀看進行中或回放內容。直播中商品可於直播頁同步選購。";
  if (/退貨|退款|換貨/.test(q)) return "生鮮與客製商品退換貨依服務條款辦理。請於客服表單選擇「訂單問題」並附上訂單編號。";
  if (/門市|地址|營業|取貨/.test(q)) return "棋美點心屋：台北市大安區復興南路二段292號，電話 02-2737-5508。詳見「門市資訊」。";
  if (/發票|載具|條碼/.test(q)) return "請至「我的 → 發票載具」設定手機條碼，結帳時可快速出示。";
  if (/收藏|推薦/.test(q)) return "收藏商品在「我的收藏」；首頁也有猜你喜歡與老師推薦，依據瀏覽與購買行為更新。";
  return "感謝您的詢問。我可以協助：商品、配送、付款、課程、直播、退貨、門市。也可改填客服表單，我們會盡快回覆。";
}
