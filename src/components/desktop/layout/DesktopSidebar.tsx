"use client";

import Link from "next/link";
import type { DesktopSidebarProps } from "@/components/desktop/layout/types";
import { cn } from "@/lib/utils";

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
      <nav className="space-y-1">
        {items.map((item) => {
          const active = activeKey === item.key;
          const className = cn(
            "block w-full rounded-[12px] px-3 py-2.5 text-left text-sm font-semibold transition",
            active
              ? "bg-[#FFF5CC] text-[#153E73]"
              : "bg-transparent text-[#153E73] hover:bg-[#EEF8FC]"
          );
          if (item.href && !onItemSelect) {
            return (
              <Link key={item.key} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          }
          return (
            <button
              key={item.key}
              type="button"
              className={className}
              onClick={() => onItemSelect?.(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

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
 * Phones / tablets (< lg): the category list becomes a horizontal chip row
 * and filters fold into a collapsible panel, so content is not pushed below
 * a long vertical menu. Computers keep the full sidebar.
 */
export function DesktopSidebar(props: DesktopSidebarProps) {
  const { title = "分類", items, activeKey, onItemSelect, filters = [] } = props;
  return (
    <>
      <div className="lg:hidden">
        <nav aria-label={title} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {items.map((item) => {
            const active = activeKey === item.key;
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
              <button key={item.key} type="button" className={cls} onClick={() => onItemSelect?.(item.key)}>
                {item.label}
              </button>
            );
          })}
        </nav>
        {filters.length ? (
          <details className="mt-3 rounded-2xl bg-white">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[#153E73]">篩選條件</summary>
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
