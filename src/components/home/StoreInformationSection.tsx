"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Navigation } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { Store } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type StoreServiceTag = { label: string; icon?: string | null };
type StoreHighlights = { title?: string; items?: string[] };

function parseServices(raw: unknown): StoreServiceTag[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { label: item };
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? row.name ?? "").trim();
      if (!label) return null;
      return { label, icon: row.icon ? String(row.icon) : null };
    })
    .filter(Boolean) as StoreServiceTag[];
}

function parseHighlights(raw: unknown): StoreHighlights {
  if (!raw || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  const items = Array.isArray(row.items)
    ? row.items.map((x) => String(x).trim()).filter(Boolean)
    : [];
  return {
    title: row.title ? String(row.title) : undefined,
    items,
  };
}

type StoreInformationSectionProps = {
  title?: string;
  viewAllHref?: string;
  storeId?: string | null;
  className?: string;
};

export function StoreInformationSection({
  title = "門市資訊",
  viewAllHref = "/stores",
  storeId,
  className,
}: StoreInformationSectionProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/stores")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setStores(d.stores ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const store = useMemo(() => {
    if (!stores.length) return null;
    if (storeId) return stores.find((s) => s.id === storeId) ?? stores[0];
    return stores[0];
  }, [stores, storeId]);

  const services = parseServices(store?.services);
  const highlights = parseHighlights(store?.daily_highlights);
  const cover = store?.cover_image_url || store?.image_url;
  const navUrl = store?.navigation_url || store?.map_url;

  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-warning" />

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={load}
        empty={!loading && !error && !store}
        emptyTitle="尚無門市資訊"
        emptyActionHref={viewAllHref}
        emptyActionLabel="查看門市"
        skeletonCount={1}
      >
        {store ? (
          <article className="overflow-hidden rounded-[22px] border border-[#F2D8BF] bg-[#FFF9EA] shadow-soft">
            <div className="relative aspect-[21/9] bg-white sm:aspect-[3/1]">
              {cover ? (
                <Image src={cover} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#6B3F24]/50">
                  門市照片
                </div>
              )}
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#6B3F24]">{store.name}</h3>
                  {store.business_hours ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-foreground-secondary">
                      <Clock className="h-4 w-4 shrink-0" aria-hidden />
                      {store.business_hours}
                    </p>
                  ) : null}
                  <p className="mt-1 inline-flex items-start gap-1.5 text-sm text-foreground-secondary">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {store.address}
                  </p>
                  {store.phone ? (
                    <p className="mt-1 text-sm text-foreground-secondary">電話 {store.phone}</p>
                  ) : null}
                </div>
                {navUrl ? (
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FF5A5F] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <Navigation className="h-4 w-4" aria-hidden />
                    導航
                  </a>
                ) : (
                  <Link
                    href={viewAllHref}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#F2D8BF] bg-white px-4 py-2 text-xs font-bold text-[#6B3F24]"
                  >
                    所有門市
                  </Link>
                )}
              </div>

              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((svc) => (
                    <span
                      key={svc.label}
                      className="inline-flex items-center gap-1 rounded-full border border-[#F2D8BF] bg-white px-3 py-1 text-xs font-medium text-[#6B3F24]"
                    >
                      {svc.icon ? <span aria-hidden>{svc.icon}</span> : null}
                      {svc.label}
                    </span>
                  ))}
                </div>
              ) : null}

              {highlights.items && highlights.items.length > 0 ? (
                <div className="rounded-[16px] border border-[#F2D8BF] bg-white px-3.5 py-3">
                  <p className="text-xs font-bold text-[#FF5A5F]">
                    {highlights.title || "今日推薦"}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[#6B3F24]">
                    {highlights.items.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </article>
        ) : null}
      </HomeSectionFrame>
    </section>
  );
}
