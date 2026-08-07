"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

type Claim = {
  id: string;
  status: string;
  expires_at?: string | null;
  redeemed_at?: string | null;
  redemption_number?: string | null;
  quantity?: number;
  gift_campaigns?: {
    gift_name?: string;
    gift_image_url?: string | null;
    campaign_type?: string;
  } | null;
};

type Filter = "available" | "redeemed" | "expired" | "cancelled";

export default function MemberGiftVouchersPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState<Filter>("available");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/member/gifts")
      .then((r) => r.json())
      .then((d) => setClaims(d.claims ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return claims.filter((c) => {
      if (filter === "available") {
        return (
          c.status === "available" &&
          (!c.expires_at || new Date(c.expires_at).getTime() >= now)
        );
      }
      if (filter === "redeemed") return c.status === "redeemed";
      if (filter === "cancelled") return c.status === "cancelled";
      return (
        c.status === "expired" ||
        (c.status === "available" &&
          c.expires_at &&
          new Date(c.expires_at).getTime() < now)
      );
    });
  }, [claims, filter]);

  const tabs: Array<{ id: Filter; label: string }> = [
    { id: "available", label: "可使用" },
    { id: "redeemed", label: "已兌換" },
    { id: "expired", label: "已過期" },
    { id: "cancelled", label: "已作廢" },
  ];

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] pt-2">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberBenefits}>
            <ArrowLeft className="h-5 w-5 text-[#153E73]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#153E73]">我的兌換券</h1>
            <p className="text-sm text-[#687386]">可兌換、已兌換及已過期</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[#E8E1D7] bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={cn(
                "flex-1 rounded-xl px-2 py-2.5 text-xs font-bold",
                filter === t.id ? "bg-[#FEE169] text-[#153E73]" : "text-[#687386]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-sm text-[#687386]">載入中…</p> : null}

        {!loading && filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8E1D7] px-4 py-10 text-center text-sm text-[#687386]">
            目前沒有此分類的兌換券
          </p>
        ) : null}

        <ul className="space-y-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/member/benefits/vouchers/${c.id}`}
                className="flex gap-3 rounded-2xl border border-[#E8E1D7] bg-white p-3"
              >
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#FFFEFA]">
                  {c.gift_campaigns?.gift_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.gift_campaigns.gift_image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[#153E73]">
                    {c.gift_campaigns?.gift_name ?? "兌換券"}
                  </p>
                  <p className="text-xs text-[#687386]">
                    {c.status === "available" ? "出示兌換碼" : c.status}
                    {c.expires_at
                      ? ` · 期限 ${new Date(c.expires_at).toLocaleDateString("zh-TW")}`
                      : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
