"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { SideMenuOverlay } from "@/components/navigation/side-menu/SideMenuOverlay";
import { SideMenuPanelStack } from "@/components/navigation/side-menu/SideMenuPanelStack";
import { SideMenuHeader } from "@/components/navigation/side-menu/SideMenuHeader";
import { SideMenuMemberCard } from "@/components/navigation/side-menu/SideMenuMemberCard";
import { SideMenuPrimaryNav } from "@/components/navigation/side-menu/SideMenuPrimaryNav";
import { SideMenuQuickActions } from "@/components/navigation/side-menu/SideMenuQuickActions";
import { SideMenuCategoryPanel } from "@/components/navigation/side-menu/SideMenuCategoryPanel";
import { SideMenuSearchPanel } from "@/components/navigation/side-menu/SideMenuSearchPanel";
import { useSideMenuHistory } from "@/hooks/useSideMenuHistory";
import { useRecentItems } from "@/hooks/useRecentItems";
import { useCategoryPrefetch } from "@/hooks/useCategoryPrefetch";
import { DEFAULT_SIDE_MENU_PRIMARY } from "@/lib/navigation/side-menu-registry";
import { prefetchShopRootCategories } from "@/lib/navigation/side-menu-category-cache";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/lib/site-links";
import { sideMenuAuthHref } from "@/lib/navigation/side-menu-routes";
import type {
  SideMenuCategory,
  SideMenuPanelState,
  SideMenuPrimaryItem,
  SideMenuSectionKey,
} from "@/types/navigation";

type AppSideMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
};

export function AppSideMenu({ open, onOpenChange, triggerRef }: AppSideMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [badges, setBadges] = useState<{
    orders?: number;
    pickup?: number;
    favorites?: number;
  }>({});
  const [query, setQuery] = useState("");
  const history = useSideMenuHistory();
  const recent = useRecentItems();
  const scrollYRef = useRef(0);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useCategoryPrefetch(true);

  useEffect(() => setMounted(true), []);

  // Open / close with exit animation — never wait on APIs
  useEffect(() => {
    if (open) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      scrollYRef.current = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      setClosing(false);
      setVisible(true);
      void prefetchShopRootCategories();
      return;
    }

    if (!visible) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setVisible(false);
      setClosing(false);
      history.resetToRoot();
      setQuery("");
      const y = scrollYRef.current;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.documentElement.style.overflow = "";
      window.scrollTo(0, y);
      triggerRef?.current?.focus();
    }, 240);

    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!visible || closing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (history.canPop) history.pop();
        else onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, closing, history, onOpenChange]);

  useEffect(() => {
    if (!visible || closing) return;
    window.history.pushState({ sideMenu: true }, "");
    const onPop = () => {
      if (history.canPop) {
        history.pop();
        window.history.pushState({ sideMenu: true }, "");
      } else {
        onOpenChange(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [visible, closing, history.canPop, history, onOpenChange]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session?.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!visible || !loggedIn) return;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.profile) return;
        setMemberName(d.profile.full_name ?? null);
        setAvatarUrl(d.profile.avatar_url ?? null);
      })
      .catch(() => {});
    fetch("/api/member/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.summary) return;
        setBadges({
          orders:
            (d.summary.awaitingPayment ?? 0) + (d.summary.readyForPickup ?? 0),
          pickup: d.summary.readyForPickup ?? 0,
          favorites: d.summary.favoriteCount ?? 0,
        });
      })
      .catch(() => {});
  }, [visible, loggedIn]);

  // Restore L1 scroll when returning from L2
  useEffect(() => {
    if (history.panels.length === 1 && mainScrollRef.current) {
      const y = history.getScroll("root");
      mainScrollRef.current.scrollTop = y;
    }
  }, [history.panels.length, history]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const navigateAway = useCallback(
    (href?: string) => {
      close();
      if (href) router.push(href);
    },
    [close, router]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  }, []);

  const handlePrimary = useCallback(
    (item: SideMenuPrimaryItem) => {
      if (item.comingSoon) {
        showToast("此功能即將開放");
        return;
      }
      if (item.section === "home") {
        navigateAway(item.route || APP_ROUTES.home);
        return;
      }
      if (item.requiresAuth) {
        navigateAway(sideMenuAuthHref(item.route || APP_ROUTES.member, loggedIn));
        return;
      }
      if (item.section === "materials") {
        void prefetchShopRootCategories();
      }
      if (item.section) {
        if (mainScrollRef.current) {
          history.saveScroll("root", mainScrollRef.current.scrollTop);
        }
        history.pushSection(item.section);
        return;
      }
      if (item.route) navigateAway(item.route);
    },
    [history, loggedIn, navigateAway, showToast]
  );

  const handleCategory = useCallback(
    (cat: SideMenuCategory, asDrill: boolean) => {
      if (asDrill) {
        history.pushCategory({
          section: history.active.section,
          title: cat.name,
          categoryId: cat.id,
          parentCategoryId: history.active.categoryId,
        });
        return;
      }
      recent.pushBrowse({ id: cat.id, label: cat.name, href: cat.route });
      router.prefetch(cat.route);
      navigateAway(cat.route);
    },
    [history, navigateAway, recent, router]
  );

  const renderPanel = useCallback(
    (panel: SideMenuPanelState, isTop: boolean) => {
      return (
        <>
          <SideMenuHeader
            showLogo={panel.level === 1 && !panel.isSearch}
            showBack={panel.level > 1 || Boolean(panel.isSearch)}
            title={panel.title}
            onBack={() => history.pop()}
            onSearch={
              panel.isSearch ? undefined : () => history.pushSection("search")
            }
            onClose={close}
          />

          {panel.level === 1 && !panel.isSearch ? (
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
              <div
                ref={isTop ? mainScrollRef : undefined}
                className="min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
                onScroll={(e) => {
                  if (isTop) {
                    history.saveScroll(
                      "root",
                      (e.target as HTMLDivElement).scrollTop
                    );
                  }
                }}
              >
                <SideMenuMemberCard
                  loggedIn={loggedIn}
                  name={memberName}
                  avatarUrl={avatarUrl}
                  onNavigate={close}
                />
                <SideMenuPrimaryNav
                  items={DEFAULT_SIDE_MENU_PRIMARY}
                  activeSection={
                    pathname === "/"
                      ? "home"
                      : pathname.startsWith("/shop")
                        ? "materials"
                        : pathname.startsWith("/recipes")
                          ? "recipes"
                          : pathname.startsWith("/group-buy")
                            ? "group_buy"
                            : undefined
                  }
                  onSelect={handlePrimary}
                />
              </div>
              <SideMenuQuickActions
                loggedIn={loggedIn}
                badges={badges}
                onNavigate={close}
              />
            </div>
          ) : null}

          {panel.isSearch ? (
            <SideMenuSearchPanel
              query={query}
              onQueryChange={setQuery}
              recentSearches={recent.recentSearches}
              onPushSearch={recent.pushSearch}
              onRemoveSearch={recent.removeSearch}
              onClearSearches={recent.clearSearches}
              onNavigate={close}
            />
          ) : null}

          {panel.level > 1 && !panel.isSearch ? (
            <SideMenuCategoryPanel
              section={panel.section as SideMenuSectionKey}
              categoryId={panel.categoryId}
              loggedIn={loggedIn}
              recentBrowse={recent.recentBrowse}
              onOpenCategory={handleCategory}
              onNavigate={close}
              onPushBrowse={recent.pushBrowse}
            />
          ) : null}
        </>
      );
    },
    [
      avatarUrl,
      badges,
      close,
      handleCategory,
      handlePrimary,
      history,
      loggedIn,
      memberName,
      pathname,
      query,
      recent,
    ]
  );

  if (!mounted || !visible) return null;

  return createPortal(
    <>
      <SideMenuOverlay visible={visible} closing={closing} onClose={close}>
        <div
          className="h-full w-full"
          role="dialog"
          aria-modal="true"
          aria-label="全站選單"
          tabIndex={-1}
        >
          <SideMenuPanelStack
            panels={history.panels}
            exitingId={history.exitingId}
            renderPanel={renderPanel}
          />
        </div>
      </SideMenuOverlay>
      {toast ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[90] flex justify-center px-4"
          role="status"
        >
          <div className="rounded-2xl bg-[#153E73] px-4 py-3 text-sm font-semibold text-white shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}
    </>,
    document.body
  );
}
