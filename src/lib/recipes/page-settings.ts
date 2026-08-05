export type RecipeHeroLinkType =
  | "none"
  | "internal"
  | "recipe"
  | "article"
  | "product"
  | "external";

export type RecipePageHeroSettings = {
  title: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  alt_text: string;
  link_type: RecipeHeroLinkType;
  link_value: string | null;
  open_in_new_tab: boolean;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
};

export type RecipePageSettings = {
  page_key: "recipes";
  section_key: "hero";
  hero: RecipePageHeroSettings;
};

export type RecipeCategoryChip = {
  slug: string;
  label: string;
  aliases: string[];
};

export const RECIPES_PAGE_SETTINGS_KEY = "recipes_page";

export const RECIPE_PAGE_CATEGORY_CHIPS: RecipeCategoryChip[] = [
  { slug: "all", label: "全部", aliases: ["all", "全部"] },
  { slug: "cake", label: "蛋糕", aliases: ["cake", "cakes", "蛋糕"] },
  { slug: "bread", label: "麵包", aliases: ["bread", "breads", "麵包"] },
  { slug: "cookie", label: "餅乾", aliases: ["cookie", "cookies", "餅乾"] },
  { slug: "tart", label: "塔類", aliases: ["tart", "pie", "pies", "塔類"] },
  {
    slug: "chinese-dessert",
    label: "中式點心",
    aliases: ["chinese-dessert", "chinese_pastry", "中式點心"],
  },
  {
    slug: "kids-baking",
    label: "親子烘焙",
    aliases: ["kids-baking", "family", "親子烘焙"],
  },
  {
    slug: "knowledge",
    label: "烘焙知識",
    aliases: ["knowledge", "baking-knowledge", "烘焙知識"],
  },
];

export const DEFAULT_RECIPE_PAGE_SETTINGS: RecipePageSettings = {
  page_key: "recipes",
  section_key: "hero",
  hero: {
    title: "烘焙圖書館主視覺",
    desktop_image_url: null,
    mobile_image_url: null,
    alt_text: "CHIMEIDIY 烘焙圖書館",
    link_type: "none",
    link_value: null,
    open_in_new_tab: false,
    is_active: true,
    start_at: null,
    end_at: null,
  },
};

const VALID_LINK_TYPES = new Set<RecipeHeroLinkType>([
  "none",
  "internal",
  "recipe",
  "article",
  "product",
  "external",
]);

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown) {
  const v = asString(value).trim();
  return v ? v : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asLinkType(value: unknown): RecipeHeroLinkType {
  const raw = asString(value).trim() as RecipeHeroLinkType;
  return VALID_LINK_TYPES.has(raw) ? raw : "none";
}

export function mergeRecipePageSettings(raw: unknown): RecipePageSettings {
  const base = structuredClone(DEFAULT_RECIPE_PAGE_SETTINGS);
  if (!raw || typeof raw !== "object") return base;
  const input = raw as Partial<RecipePageSettings> & {
    hero?: Partial<RecipePageHeroSettings>;
  };
  const hero: Partial<RecipePageHeroSettings> = input.hero ?? {};
  return {
    page_key: "recipes",
    section_key: "hero",
    hero: {
      title: asString(hero.title).trim() || base.hero.title,
      desktop_image_url: asNullableString(hero.desktop_image_url),
      mobile_image_url: asNullableString(hero.mobile_image_url),
      alt_text: asString(hero.alt_text).trim() || base.hero.alt_text,
      link_type: asLinkType(hero.link_type),
      link_value: asNullableString(hero.link_value),
      open_in_new_tab: asBoolean(hero.open_in_new_tab, base.hero.open_in_new_tab),
      is_active: asBoolean(hero.is_active, base.hero.is_active),
      start_at: asNullableString(hero.start_at),
      end_at: asNullableString(hero.end_at),
    },
  };
}

export function validateRecipePageSettings(settings: RecipePageSettings): string | null {
  if (!settings.hero.alt_text.trim()) {
    return "Hero 圖片 Alt 不可為空";
  }
  if (settings.hero.link_type === "external" && settings.hero.link_value) {
    if (!isHttpUrl(settings.hero.link_value)) {
      return "自訂網址必須為 http 或 https";
    }
  }
  if (
    settings.hero.start_at &&
    settings.hero.end_at &&
    new Date(settings.hero.start_at).getTime() > new Date(settings.hero.end_at).getTime()
  ) {
    return "排程開始時間不可晚於結束時間";
  }
  return null;
}

export function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function isRecipeHeroLive(hero: RecipePageHeroSettings, now = Date.now()) {
  if (!hero.is_active) return false;
  if (hero.start_at && new Date(hero.start_at).getTime() > now) return false;
  if (hero.end_at && new Date(hero.end_at).getTime() < now) return false;
  return true;
}

export function resolveRecipeHeroHref(
  hero: Pick<RecipePageHeroSettings, "link_type" | "link_value">
) {
  const raw = hero.link_value?.trim();
  if (!raw || hero.link_type === "none") return null;
  if (hero.link_type === "external") {
    return isHttpUrl(raw) ? raw : null;
  }
  if (hero.link_type === "internal") {
    return raw.startsWith("/") ? raw : null;
  }
  if (hero.link_type === "recipe") {
    return raw.startsWith("/") ? raw : `/recipes/${raw}`;
  }
  if (hero.link_type === "article") {
    return raw.startsWith("/") ? raw : `/articles/${raw}`;
  }
  if (hero.link_type === "product") {
    return raw.startsWith("/") ? raw : `/products/${raw}`;
  }
  return null;
}

export function normalizeRecipeCategorySlug(value: string | null | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return "all";
  const match = RECIPE_PAGE_CATEGORY_CHIPS.find((chip) =>
    chip.aliases.some((alias) => alias.toLowerCase() === raw)
  );
  return match?.slug ?? "all";
}
