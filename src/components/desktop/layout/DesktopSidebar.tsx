"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DesktopNavItem, DesktopSidebarProps } from "@/components/desktop/layout/types";
import { cn } from "@/lib/utils";

function itemContainsKey(item: DesktopNavItem, key: string | undefined): boolean {
  if (!key) return false;
  if (item.key === key) return true;
  return Boolean(item.children?.some((c) => itemContainsKey(c, key)));
}

function CategoryNavList({
  items,
  activeKey,
  onItemSelect,
}: {
  items: DesktopNavItem[];
  activeKey?: string;
  onItemSelect?: (key: string) => void;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // 目前選中的小分類所屬大分類自動展開
  useEffect(() => {
    if (!activeKey) return;
    const parent = items.find(
      (item) =>
        item.children?.length &&
        item.children.some((c) => itemContainsKey(c, activeKey))
    );
    if (parent) setExpandedKey(parent.key);
  }, [activeKey, items]);

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <nav className="space-y-1" aria-label="商品分類">
      {items.map((item) => {
        const kids = item.children ?? [];
        const hasKids = kids.length > 0;
        const isOpen = expandedKey === item.key;
        const active = activeKey === item.key;
        const childActive = hasKids && itemContainsKey(item, activeKey) && !active;

        const rowClass = cn(
          "flex w-full items-center gap-1 rounded-[12px] text-left text-sm font-semibold transition",
          active || childActive
            ? "bg-[#FFF5CC] text-[#153E73]"
            : "bg-transparent text-[#153E73] hover:bg-[#EEF8FC]"
        );

        if (!hasKids) {
          if (item.href && !onItemSelect) {
            return (
              <Link key={item.key} href={item.href} className={cn(rowClass, "px-3 py-2.5")}>
                {item.label}
              </Link>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              className={cn(rowClass, "px-3 py-2.5")}
              onClick={() => onItemSelect?.(item.key)}
            >
              {item.label}
            </button>
          );
        }

        return (
          <div key={item.key}>
            <div className={rowClass}>
              <button
                type="button"
                className="min-w-0 flex-1 truncate px-3 py-2.5 text-left"
                onClick={() => {
                  onItemSelect?.(item.key);
                  setExpandedKey(item.key);
                }}
              >
                {item.label}
              </button>
              <button
                type="button"
                className="mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-white/70"
                aria-expanded={isOpen}
                aria-label={isOpen ? `收合 ${item.label}` : `展開 ${item.label}`}
                onClick={() => toggleExpand(item.key)}
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                ) : (
                  <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>

            {isOpen ? (
              <ul className="mb-1 ml-2 space-y-0.5 rounded-xl border border-[#E9EDF2] bg-[#FFFEFA] py-1 pl-1 pr-1">
                {kids.map((child) => {
                  const childIsActive = activeKey === child.key;
                  const childClass = cn(
                    "block w-full rounded-[10px] px-3 py-2 text-left text-sm transition",
                    childIsActive
                      ? "bg-[#FFF5CC] font-semibold text-[#153E73]"
                      : "font-medium text-[#465467] hover:bg-[#EEF8FC] hover:text-[#153E73]"
                  );
                  if (child.href && !onItemSelect) {
                    return (
                      <li key={child.key}>
                        <Link href={child.href} className={childClass}>
                          {child.label}
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={child.key}>
                      <button
                        type="button"
                        className={childClass}
                        onClick={() => onItemSelect?.(child.key)}
                      >
                        {child.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function FullSidebar({
  title = "分類",
  items,
  activeKey,
  onItemSelect,
  filters = [],
  selectedFilters = {},
  onFilterChange,
  onClearFilters,
}: DesktopSidebarProps) {
  return (
    <aside className="h-fit rounded-2xl bg-white p-4">
      <p className="mb-3 px-2 text-sm font-bold text-[#153E73]">{title}</p>
      <CategoryNavList items={items} activeKey={activeKey} onItemSelect={onItemSelect} />

      {filters.map((group) => {
        const selected = selectedFilters[group.key] ?? [];
        return (
          <div key={group.key} className="mt-5 border-t border-[#E9EDF2] pt-5">
            <p className="mb-3 px-2 text-sm font-bold text-[#153E73]">{group.title}</p>
            <ul className="space-y-2 px-2">
              {group.options.map((opt) => {
                const checked = selected.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#687386]">
                      <input
                        type={group.type === "radio" ? "radio" : "checkbox"}
                        name={`filter-${group.key}`}
                        checked={checked}
                        onChange={() => {
                          if (!onFilterChange) return;
                          if (group.type === "radio") {
                            onFilterChange(group.key, [opt.value]);
                            return;
                          }
                          onFilterChange(
                            group.key,
                            checked
                              ? selected.filter((v) => v !== opt.value)
                              : [...selected, opt.value]
                          );
                        }}
                        className="h-4 w-4 rounded border-[#E9EDF2] accent-[#153E73]"
                      />
                      {opt.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-5 w-full rounded-xl border border-[#E9EDF2] bg-white px-3 py-2.5 text-sm font-semibold text-[#153E73]"
        >
          清除篩選
        </button>
      ) : null}
    </aside>
  );
}

/**
 * Phones / tablets (< lg): top-level categories as chips (subs stay in accordion
 * on the full sidebar at lg+). Filters fold into a collapsible panel.
 */
export function DesktopSidebar(props: DesktopSidebarProps) {
  const { title = "分類", items, activeKey, onItemSelect, filters = [] } = props;
  return (
    <>
      <div className="lg:hidden">
        <nav aria-label={title} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {items.map((item) => {
            const active =
              activeKey === item.key || itemContainsKey(item, activeKey);
            const cls = cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              active
                ? "border-[#FFD454] bg-[#FFF5CC] text-[#153E73]"
                : "border-[#E9EDF2] bg-white text-[#153E73]"
            );
            if (item.href && !onItemSelect) {
              return (
                <Link key={item.key} href={item.href} className={cls}>
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                type="button"
                className={cls}
                onClick={() => onItemSelect?.(item.key)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        {filters.length ? (
          <details className="mt-3 rounded-2xl bg-white">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[#153E73]">
              篩選條件
            </summary>
            <div className="px-0 pb-2 [&>aside]:bg-transparent [&>aside]:pt-0">
              <FullSidebar {...props} items={[]} />
            </div>
          </details>
        ) : null}
      </div>
      <div className="hidden lg:block">
        <FullSidebar {...props} />
      </div>
    </>
  );
}
