"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/consumer/SectionHeader";

/* ─── Types ─── */
export type IngredientCategoryItem = {
  id: string;
  displayName: string;
  desktopIcon: string | null;
  mobileIcon: string | null;
  alt: string | null;
  categoryId: string | null;
  customUrl: string | null;
  sortOrder: number;
  enabled: boolean;
  badge: "HOT" | "NEW" | "限時" | "推薦" | null;
  iconMode: "ip" | "product" | "brand";
};

export type IngredientCategoriesBlock = {
  title: string;
  subtitle: string | null;
  viewAllLabel: string;
  viewAllHref: string;
  desktopCols: number;
  mobileCols: number;
  items: IngredientCategoryItem[];
};

/* ─── Default seed (shown until CMS loads) ─── */
const DEFAULT_ITEMS: IngredientCategoryItem[] = [
  { id: "flour",   displayName: "麵粉",    desktopIcon: null, mobileIcon: null, alt: "麵粉",    categoryId: null, customUrl: "/products?category=flour",   sortOrder: 10, enabled: true, badge: null, iconMode: "ip" },
  { id: "choco",   displayName: "巧克力",  desktopIcon: null, mobileIcon: null, alt: "巧克力",  categoryId: null, customUrl: "/products?category=chocolate",sortOrder: 20, enabled: true, badge: "HOT", iconMode: "ip" },
  { id: "dairy",   displayName: "乳製品",  desktopIcon: null, mobileIcon: null, alt: "乳製品",  categoryId: null, customUrl: "/products?category=dairy",    sortOrder: 30, enabled: true, badge: null, iconMode: "ip" },
  { id: "raw",     displayName: "烘焙原料",desktopIcon: null, mobileIcon: null, alt: "烘焙原料",categoryId: null, customUrl: "/products?category=raw",     sortOrder: 40, enabled: true, badge: null, iconMode: "ip" },
  { id: "premix",  displayName: "預拌粉",  desktopIcon: null, mobileIcon: null, alt: "預拌粉",  categoryId: null, customUrl: "/products?category=premix",  sortOrder: 50, enabled: true, badge: "NEW", iconMode: "ip" },
  { id: "tools",   displayName: "器具",    desktopIcon: null, mobileIcon: null, alt: "器具",    categoryId: null, customUrl: "/products?category=tools",   sortOrder: 60, enabled: true, badge: null, iconMode: "ip" },
  { id: "pack",    displayName: "包裝材料",desktopIcon: null, mobileIcon: null, alt: "包裝材料",categoryId: null, customUrl: "/products?category=packaging",sortOrder: 70, enabled: true, badge: null, iconMode: "ip" },
  { id: "frozen",  displayName: "冷凍食品",desktopIcon: null, mobileIcon: null, alt: "冷凍食品",categoryId: null, customUrl: "/products?category=frozen",  sortOrder: 80, enabled: true, badge: null, iconMode: "ip" },
  { id: "chilled", displayName: "冷藏食品",desktopIcon: null, mobileIcon: null, alt: "冷藏食品",categoryId: null, customUrl: "/products?category=chilled", sortOrder: 90, enabled: true, badge: null, iconMode: "ip" },
  { id: "more",    displayName: "更多分類",desktopIcon: null, mobileIcon: null, alt: "更多",    categoryId: null, customUrl: "/products",                   sortOrder: 99, enabled: true, badge: null, iconMode: "ip" },
];

/* ─── Badge chip ─── */
const BADGE_STYLE: Record<string, string> = {
  HOT:  "bg-[#FF6B5B] text-white",
  NEW:  "bg-[#4CAF50] text-white",
  限時:  "bg-[#FF9800] text-white",
  推薦:  "bg-[#9C27B0] text-white",
};

function BadgeChip({ badge }: { badge: string }) {
  return (
    <span
      className={`absolute -right-1 -top-1 z-10 rounded-full px-1.5 text-[9px] font-bold leading-[18px] ${BADGE_STYLE[badge] ?? "bg-gray-400 text-white"}`}
    >
      {badge}
    </span>
  );
}

/* ─── Placeholder icon (no image uploaded) ─── */
function PlaceholderIcon({ name }: { name: string }) {
  const char = name.charAt(0) || "?";
  return (
    <span className="flex h-full w-full items-center justify-center text-xl font-bold text-[#c4a48e]">
      {char}
    </span>
  );
}

/* ─── Single category tile ─── */
function CategoryTile({ item }: { item: IngredientCategoryItem }) {
  const router = useRouter();

  const href = item.customUrl
    ? item.customUrl
    : item.categoryId
      ? `/products?category=${encodeURIComponent(item.categoryId)}`
      : "/products";

  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      aria-label={item.displayName}
      className="group flex w-full cursor-pointer flex-col items-center gap-1.5 focus-visible:outline-none"
    >
      {/* Icon circle */}
      <span className="relative">
        <span
          className="relative flex items-center justify-center overflow-hidden rounded-[999px] border border-[#F2E7DF] bg-[#FFF8F3] transition-all duration-200 group-hover:scale-[1.05] group-hover:shadow-md group-hover:bg-[#FFF2EB]"
          style={{
            width:  "clamp(56px, 12vw, 80px)",
            height: "clamp(56px, 12vw, 80px)",
          }}
        >
          {item.desktopIcon ? (
            <Image
              src={item.desktopIcon}
              alt={item.alt ?? item.displayName}
              fill
              className="object-contain p-2"
              sizes="80px"
              unoptimized
            />
          ) : (
            <PlaceholderIcon name={item.displayName} />
          )}
        </span>
        {item.badge ? <BadgeChip badge={item.badge} /> : null}
      </span>

      {/* Name */}
      <span className="line-clamp-2 w-full text-center text-[13px] font-[500] leading-tight text-[#43332B]">
        {item.displayName}
      </span>
    </button>
  );
}

/* ─── Skeleton ─── */
function SkeletonTile() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="animate-pulse rounded-full bg-[#F2E7DF]"
        style={{ width: "clamp(56px,12vw,80px)", height: "clamp(56px,12vw,80px)" }}
      />
      <div className="h-3 w-10 animate-pulse rounded bg-[#F2E7DF]" />
    </div>
  );
}

/* ─── Main component ─── */
export type HomeIngredientCategoriesProps = {
  /** Pre-loaded data from CMS; if omitted, fetches from API */
  block?: Partial<IngredientCategoriesBlock>;
  /** Override title from homepage block */
  title?: string;
  subtitle?: string | null;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export function HomeIngredientCategories({
  block,
  title: titleProp,
  subtitle: subtitleProp,
  viewAllHref: viewAllHrefProp,
  viewAllLabel: viewAllLabelProp,
}: HomeIngredientCategoriesProps) {
  const [data, setData] = useState<IngredientCategoriesBlock | null>(
    block?.items ? (block as IngredientCategoriesBlock) : null
  );
  const [loading, setLoading] = useState(!block?.items);

  useEffect(() => {
    if (block?.items) {
      setData(block as IngredientCategoriesBlock);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/api/home/ingredient-categories")
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (r.ok && d.block) setData(d.block as IngredientCategoriesBlock);
      })
      .catch(() => {/* silently use defaults */})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [block]);

  const title      = titleProp      ?? data?.title      ?? "找材料";
  const subtitle   = subtitleProp   ?? data?.subtitle   ?? null;
  const viewAllHref  = viewAllHrefProp  ?? data?.viewAllHref  ?? "/products";
  const viewAllLabel = viewAllLabelProp ?? data?.viewAllLabel ?? "查看全部";
  const items = (data?.items ?? DEFAULT_ITEMS)
    .filter((i) => i.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section aria-label={title} className="space-y-3">
      <SectionHeader title={title} href={viewAllHref} linkLabel={viewAllLabel} className="!mb-0" />
      {subtitle ? <p className="text-xs text-foreground-secondary">{subtitle}</p> : null}

      {loading ? (
        /* skeleton grid */
        <div className="grid grid-cols-5 gap-x-3 gap-y-4 min-[375px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 max-[374px]:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonTile key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-x-3 gap-y-4 min-[375px]:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 max-[374px]:grid-cols-4">
          {items.map((item) => (
            <CategoryTile key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
