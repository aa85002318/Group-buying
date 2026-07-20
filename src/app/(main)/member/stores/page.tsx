"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { APP_ROUTES } from "@/lib/site-links";

type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  business_hours: string | null;
  notes: string | null;
};

export default function MemberStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-3">
        <Link href={APP_ROUTES.profile} className="text-[#173F75]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#173F75]">門市資訊</h1>
      </div>

      {loading ? (
        <p className="py-12 text-center text-[#6B7280]">載入中…</p>
      ) : stores.length === 0 ? (
        <p className="py-12 text-center text-[#6B7280]">目前尚無門市資訊</p>
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <div key={store.id} className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
              <h2 className="font-bold text-[#173F75]">{store.name}</h2>
              <div className="mt-3 space-y-2 text-sm text-[#6B7280]">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E9285C]" />
                  {store.address}
                </p>
                {store.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-[#E9285C]" />
                    <a href={`tel:${store.phone}`} className="text-[#173F75]">{store.phone}</a>
                  </p>
                )}
                {store.business_hours && <p>營業時間：{store.business_hours}</p>}
                {store.notes && <p className="text-xs">{store.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
