"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SideMenuCategoryChips } from "@/components/navigation/side-menu/SideMenuCategoryChips";
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
import {
  getLastMaterialsCategoryId,
  pickDefaultCategoryId,
  setLastMaterialsCategoryId,
} from "@/lib/navigation/side-menu-category-cache";
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

  const [selectedMainId, setSelectedMainId] = useState<string | null>(() =>
    isMaterialsRoot ? getLastMaterialsCategoryId() : null
  );
  const [contentVisible, setContentVisible] = useState(true);
  const [slowLoad, setSlowLoad] = useState(false);
  const defaultLocked = useRef(false);

  const roots = useCategoryNavigation(
    source,
    null,
    Boolean(source) &&
      (isMaterialsRoot ||
        ((section === "recipes" || section === "group_buy") && !categoryId))
  );

  const children = useCategoryNavigation(
    source,
    isMaterialsRoot ? selectedMainId : categoryId ?? null,
    Boolean(source) &&
      (isMaterialsRoot
        ? Boolean(selectedMainId)
        : Boolean(categoryId && section === "materials"))
  );

  const drilled = useCategoryNavigation(
    source,
    categoryId ?? null,
    Boolean(source && categoryId && section === "materials" && !isMaterialsRoot)
  );

  // Pick default once when roots arrive — avoid flash to empty first item
  useEffect(() => {
    if (!isMaterialsRoot) return;
    if (!roots.categories.length) return;
    if (
      defaultLocked.current &&
      selectedMainId &&
      roots.categories.some((c) => c.id === selectedMainId)
    ) {
      return;
    }
    const preferred = getLastMaterialsCategoryId();
    const next = pickDefaultCategoryId(roots.categories, preferred);
    defaultLocked.current = true;
    setSelectedMainId(next);
    if (next) setLastMaterialsCategoryId(next);
  }, [isMaterialsRoot, roots.categories, selectedMainId]);

  useEffect(() => {
    if (!children.loading) {
      setSlowLoad(false);
      return;
    }
    const t = window.setTimeout(() => setSlowLoad(true), 300);
    return () => window.clearTimeout(t);
  }, [children.loading]);

  const selectedMain = useMemo(
    () => roots.categories.find((c) => c.id === selectedMainId) ?? null,
    [roots.categories, selectedMainId]
  );

  const selectMain = (cat: SideMenuCategory) => {
    setSelectedMainId(cat.id);
    setLastMaterialsCategoryId(cat.id);
    setContentVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setContentVisible(true));
    });
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

  // Materials L2 — chips fixed, list scrolls, view-all footer stays inside the drawer
  if (isMaterialsRoot) {
    const list = children;
    const showRootSkeleton = roots.loading && roots.categories.length === 0;
    const showChildSkeleton = Boolean(selectedMainId) && list.loading && list.categories.length === 0;
    const emptyChildren =
      Boolean(selectedMainId) &&
      !list.loading &&
      !list.error &&
      list.categories.length === 0;

    return (
      <div className="grid min-h-0 min-w-0 w-full flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        <div className="min-w-0 shrink-0 space-y-2 border-b border-[#F0ECE5] py-3">
          {showRootSkeleton ? (
            <SideMenuCategorySkeleton chips={5} rows={0} showLabel={slowLoad} />
          ) : roots.error ? (
            <div className="px-4">
              <SideMenuEmptyState
                message="分類載入失敗，請稍後再試。"
                actionLabel="重新載入"
                onAction={roots.reload}
              />
            </div>
          ) : roots.categories.length === 0 ? (
            <div className="px-4">
              <SideMenuEmptyState message="目前尚未建立分類" />
            </div>
          ) : (
            <SideMenuCategoryChips
              categories={roots.categories}
              selectedId={selectedMainId}
              onSelect={selectMain}
            />
          )}
        </div>

        <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div
            className={cn(
              "px-4 pt-2 transition duration-150 ease-out",
              contentVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0"
            )}
          >
            {showChildSkeleton ? (
              <SideMenuCategorySkeleton chips={0} rows={6} showLabel={slowLoad} />
            ) : null}

            {list.error ? (
              <SideMenuEmptyState
                message="分類載入失敗，請稍後再試。"
                actionLabel="重新載入"
                onAction={list.reload}
              />
            ) : null}

            {emptyChildren && selectedMain ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center px-2 py-8 text-center">
                {(selectedMain.productCount ?? 0) > 0 ? (
                  <>
                    <p className="text-sm text-[#687386]">
                      {selectedMain.name}目前共有 {selectedMain.productCount} 項商品
                    </p>
                    <Link
                      href={selectedMain.route}
                      onClick={() => {
                        onPushBrowse({
                          id: selectedMain.id,
                          label: selectedMain.name,
                          href: selectedMain.route,
                        });
                        onNavigate();
                      }}
                      className="mt-4 inline-flex h-12 items-center justify-center rounded-2xl bg-[#FFD454] px-5 text-sm font-bold text-[#153E73] active:scale-[0.985]"
                    >
                      查看全部{selectedMain.name}商品
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#687386]">此分類目前尚未上架商品</p>
                    <button
                      type="button"
                      className="mt-4 inline-flex h-12 items-center justify-center rounded-2xl border border-[#E8E1D7] px-5 text-sm font-bold text-[#153E73]"
                      onClick={() => {
                        const next = roots.categories.find(
                          (c) => c.id !== selectedMain.id && (c.childCount > 0 || (c.productCount ?? 0) > 0)
                        );
                        if (next) selectMain(next);
                      }}
                    >
                      返回其他分類
                    </button>
                  </>
                )}
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

            <SideMenuRecentItems items={recentBrowse} onNavigate={onNavigate} />
          </div>
        </div>

        <div className="min-w-0 w-full shrink-0 space-y-2 border-t border-[#F0ECE5] px-4 pb-7 pr-6 pt-3">
          <Link
            href={selectedMain?.route || APP_ROUTES.shop}
            onClick={onNavigate}
            className="box-border flex min-h-12 w-full min-w-0 max-w-full items-center justify-center rounded-2xl border border-[#E8E1D7] px-3 py-2 text-center text-sm font-bold leading-snug text-[#153E73] active:scale-[0.985] active:bg-[#FFF5CC]"
          >
            <span className="min-w-0 max-w-full break-words">
              {selectedMain
                ? `查看「${selectedMain.name}」全部商品`
                : "查看全部烘焙材料"}
            </span>
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
