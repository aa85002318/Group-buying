"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SideMenuCategoryRow } from "@/components/navigation/side-menu/SideMenuCategoryRow";
import {
  SideMenuEmptyState,
  SideMenuSkeleton,
} from "@/components/navigation/side-menu/SideMenuEmptyState";
import { SideMenuCategorySkeleton } from "@/components/navigation/side-menu/SideMenuCategorySkeleton";
import { SideMenuRecentItems } from "@/components/navigation/side-menu/SideMenuRecentItems";
import { useCategoryNavigation } from "@/hooks/useCategoryNavigation";
import {
  GROUP_BUY_STATUS_LINKS,
  RECIPE_QUICK_LINKS,
} from "@/lib/navigation/side-menu-registry";
import { sideMenuAuthHref } from "@/lib/navigation/side-menu-routes";
import { setLastMaterialsCategoryId } from "@/lib/navigation/side-menu-category-cache";
import { GROUP_BUY_CONSUMER_VISIBLE } from "@/lib/features/group-buy-visibility";
import { APP_ROUTES } from "@/lib/site-links";
import type {
  RecentBrowseItem,
  SideMenuCategory,
  SideMenuCategorySource,
  SideMenuSectionKey,
} from "@/types/navigation";
import { cn } from "@/lib/utils";

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

  // 大分類手風琴：預設全部收合，點擊才展開小分類，避免一次攤開太長
  const [expandedMainId, setExpandedMainId] = useState<string | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);

  const roots = useCategoryNavigation(
    source,
    null,
    Boolean(source) &&
      (isMaterialsRoot ||
        ((section === "recipes" || section === "group_buy") && !categoryId))
  );

  const children = useCategoryNavigation(
    source,
    isMaterialsRoot ? expandedMainId : categoryId ?? null,
    Boolean(source) &&
      (isMaterialsRoot
        ? Boolean(expandedMainId)
        : Boolean(categoryId && section === "materials"))
  );

  const drilled = useCategoryNavigation(
    source,
    categoryId ?? null,
    Boolean(source && categoryId && section === "materials" && !isMaterialsRoot)
  );

  useEffect(() => {
    if (!children.loading) {
      setSlowLoad(false);
      return;
    }
    const t = window.setTimeout(() => setSlowLoad(true), 300);
    return () => window.clearTimeout(t);
  }, [children.loading]);

  const expandedMain = useMemo(
    () => roots.categories.find((c) => c.id === expandedMainId) ?? null,
    [roots.categories, expandedMainId]
  );

  const toggleMain = (cat: SideMenuCategory) => {
    // 沒有小分類：直接進該大分類商品頁
    if (cat.childCount <= 0) {
      onPushBrowse({ id: cat.id, label: cat.name, href: cat.route });
      onOpenCategory(cat, false);
      return;
    }
    if (expandedMainId === cat.id) {
      setExpandedMainId(null);
      return;
    }
    setExpandedMainId(cat.id);
    setLastMaterialsCategoryId(cat.id);
  };

  if (section === "group_buy" && !GROUP_BUY_CONSUMER_VISIBLE) {
    return <SideMenuEmptyState message="團購功能即將開放，敬請期待。" />;
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
          {roots.loading && !roots.categories.length ? <SideMenuSkeleton /> : null}
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
              className="flex min-h-12 items-center justify-center rounded-2xl bg-[#EEF8FC] px-2 text-center text-sm font-semibold text-[#153E73] active:scale-[0.985] active:bg-[#FFF5CC]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#153E73]">食譜分類</h3>
          {roots.loading && !roots.categories.length ? (
            <SideMenuCategorySkeleton chips={0} rows={5} />
          ) : null}
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
              category={cat}
              onClick={() => onOpenCategory(cat, cat.childCount > 0)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Materials root — 大分類常駐，小分類手風琴展開
  if (isMaterialsRoot) {
    const list = children;
    const showRootSkeleton = roots.loading && roots.categories.length === 0;
    const showChildSkeleton =
      Boolean(expandedMainId) && list.loading && list.categories.length === 0;
    const emptyChildren =
      Boolean(expandedMainId) &&
      !list.loading &&
      !list.error &&
      list.categories.length === 0;

    return (
      <div className="grid min-h-0 min-w-0 w-full flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
        <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div className="px-4 pt-2">
            {showRootSkeleton ? (
              <SideMenuCategorySkeleton chips={0} rows={8} showLabel={slowLoad} />
            ) : null}

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

            {roots.categories.map((main) => {
              const isOpen = expandedMainId === main.id;
              return (
                <div key={main.id} className="border-b border-[#F0ECE5] last:border-b-0">
                  <SideMenuCategoryRow
                    category={main}
                    compact
                    borderless
                    expanded={isOpen}
                    onClick={() => toggleMain(main)}
                  />

                  {isOpen ? (
                    <div className="mb-2 ml-2 space-y-0.5 rounded-2xl border border-[#F0ECE5] bg-[#FFFEFA] py-1 pl-2 pr-1">
                      {showChildSkeleton ? (
                        <SideMenuCategorySkeleton
                          chips={0}
                          rows={4}
                          showLabel={slowLoad}
                        />
                      ) : null}

                      {list.error ? (
                        <SideMenuEmptyState
                          message="分類載入失敗，請稍後再試。"
                          actionLabel="重新載入"
                          onAction={list.reload}
                        />
                      ) : null}

                      {emptyChildren && expandedMain ? (
                        <div className="px-2 py-3 text-center">
                          {(expandedMain.productCount ?? 0) > 0 ? (
                            <>
                              <p className="text-sm text-[#687386]">
                                {expandedMain.name}目前共有{" "}
                                {expandedMain.productCount} 項商品
                              </p>
                              <Link
                                href={expandedMain.route}
                                onClick={() => {
                                  onPushBrowse({
                                    id: expandedMain.id,
                                    label: expandedMain.name,
                                    href: expandedMain.route,
                                  });
                                  onNavigate();
                                }}
                                className="mt-3 inline-flex h-11 items-center justify-center rounded-2xl bg-[#FFD454] px-4 text-sm font-bold text-[#153E73] active:scale-[0.985]"
                              >
                                查看全部{expandedMain.name}商品
                              </Link>
                            </>
                          ) : (
                            <p className="text-sm text-[#687386]">
                              此分類目前尚未上架商品
                            </p>
                          )}
                        </div>
                      ) : null}

                      {list.categories.map((cat) => (
                        <SideMenuCategoryRow
                          key={cat.id}
                          category={cat}
                          compact
                          onClick={() => {
                            onPushBrowse({
                              id: cat.id,
                              label: cat.name,
                              href: cat.route,
                            });
                            onOpenCategory(cat, cat.childCount > 0);
                          }}
                        />
                      ))}

                      {expandedMain && list.categories.length > 0 ? (
                        <Link
                          href={expandedMain.route}
                          onClick={onNavigate}
                          className="mx-1 mb-1 flex min-h-10 items-center justify-center rounded-xl px-2 text-sm font-semibold text-[#153E73] underline-offset-2 hover:underline active:bg-[#FFF5CC]"
                        >
                          查看「{expandedMain.name}」全部商品
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <SideMenuRecentItems items={recentBrowse} onNavigate={onNavigate} />
          </div>
        </div>

        <div className="min-w-0 w-full shrink-0 space-y-2 border-t border-[#F0ECE5] px-4 pb-7 pr-6 pt-3">
          <Link
            href={APP_ROUTES.shop}
            onClick={onNavigate}
            className="box-border flex min-h-12 w-full min-w-0 max-w-full items-center justify-center rounded-2xl border border-[#E8E1D7] px-3 py-2 text-center text-sm font-bold leading-snug text-[#153E73] active:scale-[0.985] active:bg-[#FFF5CC]"
          >
            查看全部烘焙材料
          </Link>
          <FavoritesPreview loggedIn={loggedIn} onNavigate={onNavigate} />
        </div>
      </div>
    );
  }

  const layer = categoryId ? drilled : children;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-6">
      {layer.loading && !layer.categories.length ? (
        <SideMenuCategorySkeleton chips={0} rows={6} />
      ) : null}
      {layer.error ? (
        <SideMenuEmptyState
          message="分類載入失敗，請稍後再試。"
          actionLabel="重新載入"
          onAction={layer.reload}
        />
      ) : null}
      {!layer.loading && layer.categories.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[#687386]">此分類目前尚未上架商品</p>
          <Link
            href={APP_ROUTES.shop}
            onClick={onNavigate}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#FFD454] px-4 text-sm font-bold text-[#153E73]"
          >
            查看全部商品
          </Link>
        </div>
      ) : null}
      {layer.categories.map((cat) => (
        <SideMenuCategoryRow
          key={cat.id}
          category={cat}
          compact
          onClick={() => {
            onPushBrowse({ id: cat.id, label: cat.name, href: cat.route });
            onOpenCategory(cat, cat.childCount > 0);
          }}
        />
      ))}
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
  const [items, setItems] = useState<Array<{ id: string; name: string; href: string }>>(
    []
  );

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
    <section className="min-w-0 w-full">
      <h3 className="text-sm font-bold text-[#153E73]">我的最愛</h3>
      {!loggedIn ? (
        <Link
          href={`${APP_ROUTES.login}?next=${encodeURIComponent(APP_ROUTES.memberFavorites)}`}
          onClick={onNavigate}
          className="mt-2 block w-full min-w-0 max-w-full rounded-2xl bg-[#EEF8FC] px-3 py-3 text-sm font-medium text-[#153E73]"
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
                className="block rounded-xl px-2 py-2 text-sm font-medium text-[#153E73] hover:bg-[#FFF5CC] active:bg-[#FFF5CC]"
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
