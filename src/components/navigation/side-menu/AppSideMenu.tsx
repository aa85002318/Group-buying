"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  SideMenuOverlay,
  SideMenuPanelShell,
} from "@/components/navigation/side-menu/SideMenuOverlay";
import { SideMenuHeader } from "@/components/navigation/side-menu/SideMenuHeader";
import { SideMenuMemberCard } from "@/components/navigation/side-menu/SideMenuMemberCard";
import { SideMenuPrimaryNav } from "@/components/navigation/side-menu/SideMenuPrimaryNav";
import { SideMenuQuickActions } from "@/components/navigation/side-menu/SideMenuQuickActions";
import { SideMenuCategoryPanel } from "@/components/navigation/side-menu/SideMenuCategoryPanel";
import { SideMenuSearchPanel } from "@/components/navigation/side-menu/SideMenuSearchPanel";
import { useSideMenuHistory } from "@/hooks/useSideMenuHistory";
import { useRecentItems } from "@/hooks/useRecentItems";
import { DEFAULT_SIDE_MENU_PRIMARY } from "@/lib/navigation/side-menu-registry";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import { APP_ROUTES } from "@/lib/site-links";
import type {
  SideMenuCategory,
  SideMenuPrimaryItem,
  SideMenuSectionKey,
} from "@/types/navigation";
import { cn } from "@/lib/utils";

type AppSideMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
};

export function AppSideMenu({ open, onOpenChange, triggerRef }: AppSideMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
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
  const scrollYRef = useMemo(() => ({ current: 0 }), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      history.reset();
      setQuery("");
      return;
    }
    scrollYRef.current = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const triggerEl = triggerRef?.current;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollYRef.current);
      triggerEl?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (history.canPop) history.pop();
        else onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, history, onOpenChange]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, history.canPop, history, onOpenChange]);

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
    if (!open || !loggedIn) return;
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
          orders: (d.summary.awaitingPayment ?? 0) + (d.summary.readyForPickup ?? 0),
          pickup: d.summary.readyForPickup ?? 0,
          favorites: d.summary.favoriteCount ?? 0,
        });
      })
      .catch(() => {});
  }, [open, loggedIn]);

  const close = () => onOpenChange(false);

  const navigateAway = (href?: string) => {
    close();
    if (href) router.push(href);
  };

  const handlePrimary = (item: SideMenuPrimaryItem) => {
    if (item.comingSoon) {
      window.alert("團購功能即將開放，敬請期待。");
      return;
    }
    if (item.section === "home") {
      navigateAway(item.route || APP_ROUTES.home);
      return;
    }
    if (item.section) {
      history.pushSection(item.section);
    } else if (item.route) {
      navigateAway(item.route);
    }
  };

  const handleCategory = (cat: SideMenuCategory, asDrill: boolean) => {
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
    navigateAway(cat.route);
  };

  const peekWidth = "18%";

  if (!mounted || !open) return null;

  return createPortal(
    <SideMenuOverlay open={open} onClose={close}>
      <div
        className="absolute bottom-0 left-0 top-0 w-[max(300px,min(92vw,430px))] max-[374px]:w-[94vw] md:w-[420px] lg:w-[440px]"
        role="dialog"
        aria-modal="true"
        aria-label="全站選單"
        tabIndex={-1}
      >
        {/* Stacked panels with peek of previous */}
        <div className="relative h-full w-full overflow-hidden rounded-r-[24px]">
          {history.panels.map((panel, index) => {
            const isTop = index === history.panels.length - 1;
            const depthFromTop = history.panels.length - 1 - index;
            const translate =
              depthFromTop === 0
                ? "0%"
                : `calc(-${Math.min(depthFromTop, 2) * 8}%)`;

            return (
              <SideMenuPanelShell
                key={panel.id}
                className={cn(
                  "transition-transform duration-[240ms] ease-out",
                  !isTop && "pointer-events-none"
                )}
                style={{
                  left: isTop && history.panels.length > 1 ? peekWidth : 0,
                  width:
                    isTop && history.panels.length > 1
                      ? `calc(100% - ${peekWidth})`
                      : "100%",
                  zIndex: 10 + index,
                  transform: `translateX(${isTop ? "0" : translate})`,
                  boxShadow: isTop
                    ? "4px 0 24px rgba(21,62,115,0.12)"
                    : undefined,
                }}
              >
                <SideMenuHeader
                  showLogo={panel.level === 1 && !panel.isSearch}
                  showBack={panel.level > 1 || Boolean(panel.isSearch)}
                  title={panel.title}
                  onBack={() => history.pop()}
                  onSearch={
                    panel.isSearch
                      ? undefined
                      : () => history.pushSection("search")
                  }
                  onClose={close}
                />

                {panel.level === 1 && !panel.isSearch ? (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <SideMenuCategoryPanel
                      section={panel.section as SideMenuSectionKey}
                      categoryId={panel.categoryId}
                      loggedIn={loggedIn}
                      recentBrowse={recent.recentBrowse}
                      onOpenCategory={handleCategory}
                      onNavigate={close}
                      onPushBrowse={recent.pushBrowse}
                    />
                  </div>
                ) : null}
              </SideMenuPanelShell>
            );
          })}
        </div>
      </div>
    </SideMenuOverlay>,
    document.body
  );
}
