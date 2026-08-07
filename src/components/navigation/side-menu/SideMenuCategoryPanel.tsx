"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SideMenuCategoryChips } from "@/components/navigation/side-menu/SideMenuCategoryChips";
import { SideMenuCategoryRow } from "@/components/navigation/side-menu/SideMenuCategoryRow";
import {
  SideMenuEmptyState,
  SideMenuSkeleton,
} from "@/components/navigation/side-menu/SideMenuEmptyState";
import { SideMenuRecentItems } from "@/components/navigation/side-menu/SideMenuRecentItems";
import { useCategoryNavigation } from "@/hooks/useCategoryNavigation";
import {
  GROUP_BUY_STATUS_LINKS,
  RECIPE_QUICK_LINKS,
} from "@/lib/navigation/side-menu-registry";
import { sideMenuAuthHref } from "@/lib/navigation/side-menu-routes";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";
import { APP_ROUTES } from "@/lib/site-links";
import type {
  RecentBrowseItem,
  SideMenuCategory,
  SideMenuCategorySource,
  SideMenuSectionKey,
} from "@/types/navigation";

function sourceOf(section: SideMenuSectionKey): SideMenuCategorySource | null {
  if (section === "materials") return "materials";
  if (section === "recipes") return "recipes";
  if (section === "group_buy") return "group_buy";
  return null;
}

export function SideMenuCategoryPanel({
  section,
  categoryId,
  loggedIn,
  recentBrowse,
  onOpenCategory,
  onNavigate,
  onPushBrowse,
}: {
  section: SideMenuSectionKey;
  categoryId?: string;
  loggedIn: boolean;
  recentBrowse: RecentBrowseItem[];
  onOpenCategory: (cat: SideMenuCategory, asDrill: boolean) => void;
  onNavigate: () => void;
  onPushBrowse: (item: { id: string; label: string; href: string }) => void;
}) {
  const source = sourceOf(section);
  const isMaterialsRoot = section === "materials" && !categoryId;
  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);

  const roots = useCategoryNavigation(
    source,
    null,
    Boolean(source) && (isMaterialsRoot || section !== "materials" || !categoryId)
  );

  // For materials L2: load children of selected chip
  const childrenParentId = isMaterialsRoot
    ? selectedMainId
    : categoryId ?? null;

  const children = useCategoryNavigation(
    source,
    childrenParentId,
    Boolean(source) &&
      (section === "materials"
        ? Boolean(childrenParentId)
        : section === "recipes" || section === "group_buy"
          ? !categoryId
          : Boolean(categoryId))
  );

  // Level 3+: load children of categoryId
  const drilled = useCategoryNavigation(
    source,
    categoryId ?? null,
    Boolean(source && categoryId && section === "materials" && !isMaterialsRoot)
  );

  useEffect(() => {
    if (!isMaterialsRoot) return;
    if (roots.categories.length && !selectedMainId) {
      setSelectedMainId(roots.categories[0]!.id);
    }
  }, [isMaterialsRoot, roots.categories, selectedMainId]);

  if (section === "group_buy" && !GROUP_BUY_CONSUMER_VISIBLE) {
    return (
      <SideMenuEmptyState message="團購功能即將開放，敬請期待。" />
    );
  }

  if (section === "group_buy" && !categoryId) {
    return (
      <div className="space-y-4 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-[#153E73]">團購狀態</h3>
          <ul className="mt-2 divide-y divide-[#F0ECE5] rounded-2xl border border-[#F0ECE5]">
            {GROUP_BUY_STATUS_LINKS.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="flex min-h-12 items-center px-3 text-sm font-semibold text-[#153E73]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#153E73]">團購分類</h3>
          {roots.loading ? <SideMenuSkeleton /> : null}
          {roots.error ? (
            <SideMenuEmptyState
              message="分類載入失敗，請稍後再試。"
              actionLabel="重新載入"
              onAction={roots.reload}
            />
          ) : null}
          {!roots.loading && !roots.error && roots.categories.length === 0 ? (
            <SideMenuEmptyState message="目前尚未建立分類" />
          ) : null}
          {roots.categories.map((cat) => (
            <SideMenuCategoryRow
              key={cat.id}
              category={cat}
              onClick={() => onOpenCategory(cat, cat.childCount > 0)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (section === "recipes" && !categoryId) {
    return (
      <div className="space-y-4 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          {RECIPE_QUICK_LINKS.map((link) => (
            <Link
              key={link.id}
              href={sideMenuAuthHref(link.href, loggedIn || !link.requiresAuth)}
              onClick={onNavigate}
              className="flex min-h-12 items-center justify-center rounded-2xl bg-[#EEF8FC] px-2 text-center text-sm font-semibold text-[#153E73]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#153E73]">食譜分類</h3>
          {roots.loading ? <SideMenuSkeleton /> : null}
          {roots.error ? (
            <SideMenuEmptyState
              message="分類載入失敗，請稍後再試。"
              actionLabel="重新載入"
              onAction={roots.reload}
            />
          ) : null}
          {!roots.loading && roots.categories.length === 0 ? (
            <SideMenuEmptyState message="目前尚未建立分類" />
          ) : null}
          {roots.categories.map((cat) => (
            <SideMenuCategoryRow
              key={cat.id}
              category={
                cat.imageUrl || cat.iconUrl
                  ? cat
                  : cat
              }
              onClick={() => onOpenCategory(cat, cat.childCount > 0)}
            />
          ))}
          {!roots.loading &&
            roots.categories.map((cat) =>
              !cat.imageUrl && !cat.iconUrl ? null : null
            )}
        </div>
      </div>
    );
  }

  // Materials L2 with chips
  if (isMaterialsRoot) {
    const list = children;
    return (
      <div className="space-y-3 py-3">
        <div className="px-4">
          {roots.loading ? <SideMenuSkeleton rows={1} /> : null}
          {roots.error ? (
            <SideMenuEmptyState
              message="分類載入失敗，請稍後再試。"
              actionLabel="重新載入"
              onAction={roots.reload}
            />
          ) : null}
          {!roots.loading && roots.categories.length === 0 ? (
            <SideMenuEmptyState message="目前尚未建立分類" />
          ) : (
            <SideMenuCategoryChips
              categories={roots.categories}
              selectedId={selectedMainId}
              onSelect={(cat) => setSelectedMainId(cat.id)}
            />
          )}
        </div>

        <div className="px-4">
          {list.loading ? <SideMenuSkeleton /> : null}
          {list.error ? (
            <SideMenuEmptyState
              message="分類載入失敗，請稍後再試。"
              actionLabel="重新載入"
              onAction={list.reload}
            />
          ) : null}
          {!list.loading && selectedMainId && list.categories.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-[#687386]">此分類尚無次分類</p>
              <Link
                href={
                  roots.categories.find((c) => c.id === selectedMainId)?.route ||
                  APP_ROUTES.shop
                }
                onClick={() => {
                  const main = roots.categories.find((c) => c.id === selectedMainId);
                  if (main) onPushBrowse({ id: main.id, label: main.name, href: main.route });
                  onNavigate();
                }}
                className="mt-3 inline-flex h-11 items-center justify-center rounded-2xl bg-[#FFD454] px-4 text-sm font-bold text-[#153E73]"
              >
                查看全部商品
              </Link>
            </div>
          ) : null}
          {list.categories.map((cat) => (
            <SideMenuCategoryRow
              key={cat.id}
              category={cat}
              onClick={() => {
                onPushBrowse({ id: cat.id, label: cat.name, href: cat.route });
                onOpenCategory(cat, cat.childCount > 0);
              }}
            />
          ))}
        </div>

        <div className="px-4 pt-2">
          <Link
            href={APP_ROUTES.shop}
            onClick={onNavigate}
            className="flex h-12 items-center justify-center rounded-2xl border border-[#E8E1D7] text-sm font-bold text-[#153E73]"
          >
            查看全部烘焙材料
          </Link>
        </div>

        <SideMenuRecentItems items={recentBrowse} onNavigate={onNavigate} />

        <FavoritesPreview loggedIn={loggedIn} onNavigate={onNavigate} />
      </div>
    );
  }

  // Drilled category level
  const layer = categoryId ? drilled : children;
  return (
    <div className="px-4 py-3">
      {layer.loading ? <SideMenuSkeleton /> : null}
      {layer.error ? (
        <SideMenuEmptyState
          message="分類載入失敗，請稍後再試。"
          actionLabel="重新載入"
          onAction={layer.reload}
        />
      ) : null}
      {!layer.loading && layer.categories.length === 0 ? (
        <div className="py-6 text-center">
          <Link
            href={APP_ROUTES.shop}
            onClick={onNavigate}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#FFD454] px-4 text-sm font-bold text-[#153E73]"
          >
            查看全部商品
          </Link>
        </div>
      ) : null}
      {categoryId ? (
        <Link
          href={
            // parent route approximated — use first child's parent via browse
            "#"
          }
          className="mb-2 hidden"
        />
      ) : null}
      {layer.categories.map((cat) => (
        <SideMenuCategoryRow
          key={cat.id}
          category={cat}
          onClick={() => {
            onPushBrowse({ id: cat.id, label: cat.name, href: cat.route });
            onOpenCategory(cat, cat.childCount > 0);
          }}
        />
      ))}
      {section === "recipes" && !layer.categories.some((c) => c.imageUrl) ? (
        <p className="sr-only">
          <BookOpen />
        </p>
      ) : null}
    </div>
  );
}

function FavoritesPreview({
  loggedIn,
  onNavigate,
}: {
  loggedIn: boolean;
  onNavigate: () => void;
}) {
  const [items, setItems] = useState<Array<{ id: string; name: string; href: string }>>([]);

  useEffect(() => {
    if (!loggedIn) return;
    fetch("/api/member/favorites?type=product")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list = (d?.favorites ?? []).slice(0, 3) as Array<{
          id: string;
          target_id: string;
          target_type: string;
        }>;
        setItems(
          list.map((f) => ({
            id: String(f.id),
            name: "收藏商品",
            href:
              f.target_type === "recipe"
                ? `/recipes/${f.target_id}`
                : `/products/${f.target_id}`,
          }))
        );
      })
      .catch(() => {});
  }, [loggedIn]);

  return (
    <section className="mt-2 px-4 pb-4">
      <h3 className="text-sm font-bold text-[#153E73]">我的最愛</h3>
      {!loggedIn ? (
        <Link
          href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.memberFavorites)}`}
          onClick={onNavigate}
          className="mt-2 block rounded-2xl bg-[#EEF8FC] px-3 py-3 text-sm font-medium text-[#153E73]"
        >
          登入後查看收藏
        </Link>
      ) : items.length === 0 ? (
        <p className="mt-2 text-sm text-[#687386]">尚無收藏</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block rounded-xl px-2 py-2 text-sm font-medium text-[#153E73] hover:bg-[#FFF5CC]"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
