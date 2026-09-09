"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { DesktopInnerPageLayout } from "@/components/desktop/layout/DesktopInnerPageLayout";
import { INNER_PAGE_HEROES, STORE_SIDEBAR_ITEMS } from "@/lib/desktop/inner-page-config";
import { APP_ROUTES } from "@/lib/site-links";

type PublicStore = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  map_url: string | null;
  image_url: string | null;
  pickup_available: boolean;
  sort_order?: number;
};

export function DesktopStores() {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores?channel=website")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...stores].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    if (filter === "pickup") return sorted.filter((s) => s.pickup_available);
    return sorted;
  }, [stores, filter]);

  return (
    <DesktopInnerPageLayout
      hero={INNER_PAGE_HEROES.stores}
      breadcrumb={[
        { label: "首頁", href: APP_ROUTES.home },
        { label: "門市資訊" },
      ]}
      sidebar={{
        title: "門市",
        items: STORE_SIDEBAR_ITEMS,
        activeKey: filter,
        onItemSelect: setFilter,
      }}
      toolbar={{
        title: "門市資訊",
        description: "查找鄰近門市、營業資訊與取貨服務。",
        totalLabel: loading ? "載入中…" : `共 ${filtered.length} 家門市`,
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((store) => (
          <article
            key={store.id}
            className="overflow-hidden rounded-[16px] border border-[#E9EDF2] bg-white"
          >
            <div className="relative aspect-[16/10] bg-[#EEF8FC]">
              {store.image_url ? (
                <Image src={store.image_url} alt={store.name} fill className="object-cover" />
              ) : null}
            </div>
            <div className="space-y-2 p-4">
              <h3 className="text-lg font-bold text-[#153E73]">{store.name}</h3>
              <p className="flex items-start gap-2 text-sm text-[#687386]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {store.address}
              </p>
              {store.phone ? (
                <p className="flex items-center gap-2 text-sm text-[#687386]">
                  <Phone className="h-4 w-4" />
                  {store.phone}
                </p>
              ) : null}
              {store.map_url ? (
                <Link
                  href={store.map_url}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#79C7E8]"
                >
                  查看地圖 <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!loading && filtered.length === 0 ? (
        <p className="py-16 text-center text-[#687386]">目前沒有門市資料</p>
      ) : null}
    </DesktopInnerPageLayout>
  );
}
