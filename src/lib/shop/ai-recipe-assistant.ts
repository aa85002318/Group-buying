/** Shop hub — AI 食譜助手 Version A（功能卡，非聊天框） */

export type ShopAiAssistantTag = {
  id: string;
  label: string;
  /** Full smart prompt sent to /ai?q=… */
  prompt: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
};

export type ShopAiAssistantSettings = {
  is_visible: boolean;
  title: string;
  subtitle: string;
  placeholder: string;
  cta_text: string;
  cta_href: string;
  ip_image_url: string;
  background_image_url: string | null;
  background_color: string;
  popular_tags: ShopAiAssistantTag[];
};

export const DEFAULT_AI_ASSISTANT_TAGS: ShopAiAssistantTag[] = [
  {
    id: "t1",
    label: "雞蛋",
    prompt: "家裡只有雞蛋可以做什麼？",
    emoji: "🥚",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "t2",
    label: "巧克力",
    prompt: "巧克力怎麼消耗？",
    emoji: "🍫",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "t3",
    label: "30分鐘內",
    prompt: "我只有30分鐘，可以做什麼甜點？",
    emoji: "⏱",
    sort_order: 3,
    is_active: true,
  },
  {
    id: "t4",
    label: "生日蛋糕",
    prompt: "適合新手的生日蛋糕？",
    emoji: "🎂",
    sort_order: 4,
    is_active: true,
  },
  {
    id: "t5",
    label: "無麩質",
    prompt: "無麩質可以做什麼甜點？",
    emoji: "🌿",
    sort_order: 5,
    is_active: true,
  },
  {
    id: "t6",
    label: "吐司變身",
    prompt: "吐司可以變什麼甜點？",
    emoji: "🍞",
    sort_order: 6,
    is_active: true,
  },
  {
    id: "t7",
    label: "可頌靈感",
    prompt: "可頌還可以做什麼？",
    emoji: "🥐",
    sort_order: 7,
    is_active: true,
  },
];

export const DEFAULT_AI_ASSISTANT_SETTINGS: ShopAiAssistantSettings = {
  is_visible: true,
  title: "想做什麼？\n告訴 AI 吧！",
  subtitle: "輸入食材、口味或製作時間，AI 幫你找到適合的食譜。",
  placeholder: "例如：雞蛋、牛奶、30分鐘、巧克力...",
  cta_text: "去問 AI",
  cta_href: "/ai",
  ip_image_url: "/branding/chimeidiy-ip-angel.png",
  background_image_url: null,
  background_color: "#FFF8E8",
  popular_tags: DEFAULT_AI_ASSISTANT_TAGS,
};

function asTag(raw: unknown, index: number): ShopAiAssistantTag | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const label = String(row.label ?? "").trim();
  if (!label) return null;
  const prompt = String(row.prompt ?? label).trim() || label;
  return {
    id: String(row.id ?? `tag-${index}`),
    label,
    prompt,
    emoji: row.emoji ? String(row.emoji) : undefined,
    sort_order: Number(row.sort_order ?? index) || index,
    is_active: row.is_active !== false,
  };
}

export function parseAiAssistantTags(raw: unknown): ShopAiAssistantTag[] {
  if (!Array.isArray(raw)) return DEFAULT_AI_ASSISTANT_TAGS;
  const mapped = raw
    .map((item, i) => asTag(item, i))
    .filter((t): t is ShopAiAssistantTag => Boolean(t));
  return mapped.length ? mapped : DEFAULT_AI_ASSISTANT_TAGS;
}

export function parseAiAssistantSettings(
  row: Record<string, unknown> | null | undefined
): ShopAiAssistantSettings {
  if (!row) return { ...DEFAULT_AI_ASSISTANT_SETTINGS };
  const title = String(row.title ?? "").trim();
  const subtitle = String(row.subtitle ?? "").trim();
  const placeholder = String(row.placeholder ?? "").trim();
  const cta_text = String(row.cta_text ?? "").trim();
  const cta_href = String(row.cta_href ?? "").trim();
  const ip = String(row.ip_image_url ?? "").trim();
  const bgImg = String(row.background_image_url ?? "").trim();
  const bg = String(row.background_color ?? "").trim();

  return {
    is_visible: row.is_visible !== false,
    title: title || DEFAULT_AI_ASSISTANT_SETTINGS.title,
    subtitle: subtitle || DEFAULT_AI_ASSISTANT_SETTINGS.subtitle,
    placeholder: placeholder || DEFAULT_AI_ASSISTANT_SETTINGS.placeholder,
    cta_text: cta_text || DEFAULT_AI_ASSISTANT_SETTINGS.cta_text,
    cta_href: cta_href || DEFAULT_AI_ASSISTANT_SETTINGS.cta_href,
    ip_image_url: ip || DEFAULT_AI_ASSISTANT_SETTINGS.ip_image_url,
    background_image_url: bgImg || null,
    background_color: /^#[0-9A-Fa-f]{6}$/.test(bg)
      ? bg
      : DEFAULT_AI_ASSISTANT_SETTINGS.background_color,
    popular_tags: parseAiAssistantTags(row.popular_tags),
  };
}

export function buildAiAssistantHref(baseHref: string, query: string) {
  const q = query.trim();
  const base = (baseHref || "/ai").trim() || "/ai";
  if (!q) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}q=${encodeURIComponent(q)}`;
}
