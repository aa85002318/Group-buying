"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ProductCategory } from "@/types/product-category";
import { cn } from "@/lib/utils";

export function CategoryAccordion({
  categories,
  onNavigate,
}: {
  categories: ProductCategory[];
  onNavigate: () => void;
}) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "baking-materials": true,
    "group-buy": false,
  });

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ul className="home-category-accordion">
      {categories.map((cat) => {
        const hasChildren = Boolean(cat.children?.length);
        const open = Boolean(openIds[cat.id]);
        const tone =
          cat.id === "baking-materials"
            ? "home-category-card--baking"
            : cat.id === "group-buy"
              ? "home-category-card--group"
              : "";

        return (
          <li key={cat.id} className={cn("home-category-card", tone, open && "is-open")}>
            {hasChildren ? (
              <button
                type="button"
                className="home-category-card__toggle"
                aria-expanded={open}
                onClick={() => toggle(cat.id)}
              >
                <span>{cat.name}</span>
                {open ? (
                  <ChevronDown className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                )}
              </button>
            ) : (
              <Link
                href={cat.href}
                className="home-category-card__toggle"
                onClick={onNavigate}
              >
                <span>{cat.name}</span>
                <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
              </Link>
            )}

            {hasChildren && open ? (
              <ul className="home-category-children">
                {cat.children!.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.href}
                      className="home-category-child"
                      onClick={onNavigate}
                    >
                      <span className="home-category-child__dot" aria-hidden />
                      {child.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={cat.href}
                    className="home-category-child home-category-child--all"
                    onClick={onNavigate}
                  >
                    查看全部{cat.name}
                  </Link>
                </li>
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
