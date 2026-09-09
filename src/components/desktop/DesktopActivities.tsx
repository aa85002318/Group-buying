"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { DesktopPagination } from "@/components/desktop/layout/DesktopPagination";
import {
  ACTIVITY_SIDEBAR_ITEMS,
  INNER_PAGE_HEROES,
} from "@/lib/desktop/inner-page-config";
import { APP_ROUTES } from "@/lib/site-links";

type Article = {
  id: string;
  title: string;
  slug?: string | null;
  cover_image?: string | null;
  excerpt?: string | null;
  category?: string | null;
};

const PAGE_SIZE = 9;

export function DesktopActivities() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setArticles(d.articles ?? []);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (category === "all") return articles;
    return articles.filter((a) => (a.category || "").includes(category));
  }, [articles, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [category]);

  return (
    <DesktopInnerPageLayout
      hero={INNER_PAGE_HEROES.activities}
      breadcrumb={[
        { label: "首頁", href: APP_ROUTES.home },
        { label: "最新活動" },
      ]}
      sidebar={{
        title: "活動分類",
        items: ACTIVITY_SIDEBAR_ITEMS,
        activeKey: category,
        onItemSelect: setCategory,
      }}
      toolbar={{
        title: "最新活動",
        description: "掌握門市與線上優惠、會員活動與新品資訊。",
        totalLabel: loading ? "載入中…" : `共 ${filtered.length} 則活動`,
      }}
      footerSlot={
        <DesktopPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((a) => (
          <Link
            key={a.id}
            href={a.slug ? `/articles/${a.slug}` : `/articles/${a.id}`}
            className="group overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="relative aspect-[16/10] bg-[#EEF8FC]">
              {a.cover_image ? (
                <Image
                  src={a.cover_image}
                  alt={a.title}
                  fill
                  className="object-cover"
                  sizes="30vw"
                />
              ) : null}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-semibold text-[#153E73]">{a.title}</h3>
              {a.excerpt ? (
                <p className="mt-1 line-clamp-2 text-sm text-[#687386]">{a.excerpt}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
      {!loading && pageItems.length === 0 ? (
        <p className="py-16 text-center text-[#687386]">目前沒有活動</p>
      ) : null}
    </DesktopInnerPageLayout>
  );
}
