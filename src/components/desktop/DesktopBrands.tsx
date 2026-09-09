"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { DesktopPagination } from "@/components/desktop/layout/DesktopPagination";
import { BRAND_SIDEBAR_ITEMS, INNER_PAGE_HEROES } from "@/lib/desktop/inner-page-config";
import { APP_ROUTES } from "@/lib/site-links";
import type { SeasonalTheme } from "@/lib/types/database";

const PAGE_SIZE = 12;

export function DesktopBrands() {
  const [items, setItems] = useState<SeasonalTheme[]>([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/themes")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.themes ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items;
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DesktopInnerPageLayout
      hero={INNER_PAGE_HEROES.brands}
      breadcrumb={[
        { label: "首頁", href: APP_ROUTES.home },
        { label: "品牌專區" },
      ]}
      sidebar={{
        title: "品牌分類",
        items: BRAND_SIDEBAR_ITEMS,
        activeKey: filter,
        onItemSelect: setFilter,
      }}
      toolbar={{
        title: "品牌專區",
        description: "探索季節主題與品牌企劃，發現更多烘焙靈感。",
        totalLabel: loading ? "載入中…" : `共 ${filtered.length} 個主題`,
      }}
      footerSlot={
        <DesktopPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((t) => (
          <Link
            key={t.id}
            href={`/themes/${t.slug}`}
            className="group overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="relative aspect-[4/3] bg-[#EEF8FC]">
              {(t.cover_image_url || t.mobile_cover_image_url) && (
                <Image
                  src={(t.cover_image_url || t.mobile_cover_image_url)!}
                  alt={t.title}
                  fill
                  className="object-cover"
                  sizes="30vw"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-semibold text-[#153E73]">{t.title}</h3>
              {t.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-[#687386]">{t.description}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
      {!loading && pageItems.length === 0 ? (
        <p className="py-16 text-center text-[#687386]">目前沒有品牌主題</p>
      ) : null}
    </DesktopInnerPageLayout>
  );
}
