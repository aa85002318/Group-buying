"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { ChimeidiyLogo } from "@/components/branding/ChimeidiyLogo";
import { CategoryAccordion } from "@/components/navigation/CategoryAccordion";
import { CategorySearchInput } from "@/components/navigation/CategorySearchInput";
import {
  flattenProductCategories,
  getEnabledProductCategories,
} from "@/data/product-categories";

type HomeCategoryDrawerProps = {
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function HomeCategoryDrawer({
  open,
  onClose,
  returnFocusRef,
}: HomeCategoryDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const categories = useMemo(() => getEnabledProductCategories(), []);
  const flat = useMemo(() => flattenProductCategories(categories), [categories]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flat.filter((c) => c.name.toLowerCase().includes(q));
  }, [flat, query]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusReturn = returnFocusRef?.current;
    const t = window.setTimeout(() => closeRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      setQuery("");
      focusReturn?.focus();
    };
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="home-category-drawer" role="presentation">
      <button
        type="button"
        className="home-category-drawer__backdrop"
        aria-label="關閉選單"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="home-category-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="home-category-drawer__header">
          <div className="min-w-0 flex-1">
            <ChimeidiyLogo variant="sideMenu" />
            <p id={titleId} className="sr-only">
              商品分類選單
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="hero-icon-button"
            aria-label="關閉商品分類選單"
            onClick={onClose}
          >
            <X className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <div className="home-category-drawer__search">
          <CategorySearchInput value={query} onChange={setQuery} />
        </div>

        <div className="home-category-drawer__body">
          {query.trim() ? (
            <ul className="home-category-search-results">
              {searchResults.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-[#687386]">
                  找不到符合的分類
                </li>
              ) : (
                searchResults.map((item) => (
                  <li key={`${item.id}-${item.slug}`}>
                    <Link
                      href={item.href}
                      className="home-category-child"
                      onClick={onClose}
                    >
                      <span className="home-category-child__dot" aria-hidden />
                      {item.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <CategoryAccordion categories={categories} onNavigate={onClose} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
