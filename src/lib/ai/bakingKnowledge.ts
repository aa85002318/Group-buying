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

export type OvenMode = "上下火" | "旋風" | "瓦斯";

/** Approximate oven conversion table for home bakers */
export function convertOvenTemp(celsius: number, from: OvenMode, to: OvenMode): { temp: number; note: string } {
  let temp = celsius;
  if (from === to) return { temp, note: "模式相同，溫度不變。" };

  // Normalize to 上下火 first
  if (from === "旋風") temp = Math.round(celsius * 1.1);
  if (from === "瓦斯") temp = Math.round(celsius + 10);

  if (to === "旋風") {
    return { temp: Math.round(temp / 1.1), note: "旋風烤箱熱對流較強，建議降溫約 10–20°C，並縮短時間。" };
  }
  if (to === "瓦斯") {
    return { temp: Math.round(temp - 10), note: "瓦斯烤箱上下火溫差較大，建議中層烘烤並適時旋轉烤盤。" };
  }
  return { temp, note: "以電烤箱上下火為基準溫度。" };
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
    keywords: ["濕黏", "沒熟", "中心濕"],
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
  if (/配送|宅配|運費|寄送/.test(q)) return "目前團購以門市取貨為主；宅配與超商取貨即將開放。取貨請出示訂單 QR Code。";
  if (/付款|匯款|刷卡|金流/.test(q)) return "支援門市付款與銀行匯款。匯款後請於訂單頁回報後五碼；線上刷卡即將開放。";
  if (/課程|報名|教室/.test(q)) return "請至「課程中心」查看場次與剩餘名額。報名成功後會產生電子票券 QR Code 供報到。";
  if (/直播|live|youtube|fb/.test(q)) return "請至「直播專區」觀看進行中或回放內容。直播中商品可於直播頁同步選購。";
  if (/退貨|退款|換貨/.test(q)) return "生鮮與客製商品退換貨依服務條款辦理。請於客服表單選擇「訂單問題」並附上訂單編號。";
  if (/門市|地址|營業|取貨/.test(q)) return "棋美點心屋：台北市大安區復興南路二段292號，電話 02-2737-5508。詳見「門市資訊」。";
  if (/發票|載具|條碼/.test(q)) return "請至「我的 → 發票載具」設定手機條碼，結帳時可快速出示。";
  if (/收藏|推薦/.test(q)) return "收藏商品在「我的收藏」；首頁也有猜你喜歡與老師推薦，依據瀏覽與購買行為更新。";
  return "感謝您的詢問。我可以協助：商品、配送、付款、課程、直播、退貨、門市。也可改填客服表單，我們會盡快回覆。";
}
