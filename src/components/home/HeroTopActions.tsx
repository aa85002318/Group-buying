"use client";

import { useCallback, useRef, useState } from "react";
import { Menu, Search } from "lucide-react";
import { CartButton } from "@/components/navigation/CartButton";
import { NotificationButton } from "@/components/navigation/NotificationButton";
import { HomeCategoryDrawer } from "@/components/navigation/HomeCategoryDrawer";

type HeroTopActionsProps = {
  onSearchClick: () => void;
};

export function HeroTopActions({ onSearchClick }: HeroTopActionsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <div className="hero-top-actions">
        <button
          ref={menuBtnRef}
          type="button"
          className="hero-icon-button"
          aria-label="開啟商品分類選單"
          aria-expanded={drawerOpen}
          aria-haspopup="dialog"
          onClick={openDrawer}
        >
          <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
        </button>

        <div className="hero-action-group">
          <NotificationButton className="hero-icon-button" />
          <CartButton className="hero-icon-button" />
          <button
            type="button"
            className="hero-icon-button"
            aria-label="搜尋商品與食譜"
            onClick={onSearchClick}
          >
            <Search className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <HomeCategoryDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        returnFocusRef={menuBtnRef}
      />
    </>
  );
}
