"use client";

import { Search } from "lucide-react";
import { AppHamburgerMenu } from "@/components/layout/AppHamburgerMenu";
import { CartButton } from "@/components/navigation/CartButton";
import { NotificationButton } from "@/components/navigation/NotificationButton";

type HeroTopActionsProps = {
  onSearchClick: () => void;
};

/** Home hero actions — side menu matches /shop AppHamburgerMenu (CMS). */
export function HeroTopActions({ onSearchClick }: HeroTopActionsProps) {
  return (
    <div className="hero-top-actions">
      <AppHamburgerMenu className="hero-icon-button !min-h-0 !min-w-0 !rounded-full" />

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
  );
}
