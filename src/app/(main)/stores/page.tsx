"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  business_hours: string | null;
  map_url: string | null;
  line_url: string | null;
  image_url: string | null;
  pickup_available: boolean;
  sort_order?: number;
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...stores].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [stores]
  );

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-caramel">門市資訊</h1>
        <Link href={APP_ROUTES.member} className="text-sm text-caramel">返回我的</Link>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-[20px] bg-surface" />)}</div>
      ) : sorted.length === 0 ? (
        <p className="py-12 text-center text-foreground-secondary">目前尚無門市資訊</p>
      ) : (
        sorted.map((store) => (
          <article key={store.id} className="overflow-hidden rounded-[20px] bg-surface shadow-card">
            {store.image_url && (
              <div className="relative h-40 w-full">
                <Image src={store.image_url} alt={store.name} fill className="object-cover" />
              </div>
            )}
            <div className="space-y-3 p-5">
              <h2 className="text-lg font-bold text-caramel">{store.name}</h2>
              <p className="flex items-start gap-2 text-sm text-foreground-secondary"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{store.address}</p>
              {store.phone && (
                <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-primary" /><a href={`tel:${store.phone}`} className="text-caramel">{store.phone}</a></p>
              )}
              {store.business_hours && <p className="text-sm text-foreground-secondary">營業時間：{store.business_hours}</p>}
              <p className="text-sm text-foreground-secondary">{store.pickup_available !== false ? "✓ 提供團購取貨" : "不提供取貨"}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {store.map_url && (
                  <a href={store.map_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-caramel px-4 text-sm text-white">
                    <ExternalLink className="mr-1.5 h-4 w-4" />Google 地圖
                  </a>
                )}
                {store.line_url && (
                  <a href={store.line_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-xl border border-[#06C755] px-4 text-sm text-[#06C755]">LINE 聯絡</a>
                )}
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
