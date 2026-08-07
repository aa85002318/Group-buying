"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { GiftCampaignCard, type GiftCampaignCardData } from "@/components/member/gifts/GiftCampaignCard";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

type Tab = "monthly" | "spend" | "vouchers" | "history";

function parseTab(raw: string | null | undefined, fallback: Tab): Tab {
  if (raw === "monthly" || raw === "spend" || raw === "vouchers" || raw === "history") return raw;
  return fallback;
}

export function MemberGiftsHubClient({ initialTab = "monthly" as Tab }: { initialTab?: Tab }) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => parseTab(searchParams.get("tab"), initialTab));
  const [campaigns, setCampaigns] = useState<GiftCampaignCardData[]>([]);
  const [claims, setClaims] = useState<Array<Record<string, unknown>>>([]);
  const [usableCount, setUsableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab"), initialTab));
  }, [searchParams, initialTab]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/member/gifts")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setCampaigns(d.campaigns ?? []);
        setClaims(d.claims ?? []);
        setUsableCount(d.usable_claim_count ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const monthly = useMemo(
    () => campaigns.filter((c) => c.campaign_type === "monthly_member_gift"),
    [campaigns]
  );
  const spend = useMemo(
    () => campaigns.filter((c) => c.campaign_type === "store_spend_gift"),
    [campaigns]
  );

  const onClaim = async (
    campaignId: string,
    opts?: { store_id?: string; gift_item_id?: string }
  ) => {
    setClaimingId(campaignId);
    try {
      const res = await fetch("/api/member/gifts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          ...(opts?.store_id ? { store_id: opts.store_id } : {}),
          ...(opts?.gift_item_id ? { gift_item_id: opts.gift_item_id } : {}),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "領取失敗");
      load();
      setTab("vouchers");
    } catch (e) {
      alert(e instanceof Error ? e.message : "領取失敗");
    } finally {
      setClaimingId(null);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "monthly", label: "本月會員禮" },
    { id: "spend", label: "門市滿額贈" },
    { id: "vouchers", label: "我的兌換券" },
    { id: "history", label: "兌換紀錄" },
  ];

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] pt-2">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member} aria-label="返回會員中心">
            <ArrowLeft className="h-5 w-5 text-[#153E73]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#153E73]">會員禮</h1>
            <p className="text-sm text-[#687386]">本月兌換禮、門市滿額贈與我的兌換券</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[#E8E1D7] bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition",
                tab === t.id ? "bg-[#FEE169] text-[#153E73]" : "text-[#687386]"
              )}
            >
              {t.label}
              {t.id === "vouchers" && usableCount > 0 ? ` (${usableCount})` : ""}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-2xl bg-[#FDE8E6] px-3 py-2 text-sm text-[#B42318]">{error}</p>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <div className="h-40 animate-pulse rounded-2xl bg-[#F3F4F6]" />
            <div className="h-40 animate-pulse rounded-2xl bg-[#F3F4F6]" />
          </div>
        ) : null}

        {!loading && tab === "monthly" ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-[#153E73]">本月會員禮</h2>
              <p className="text-sm text-[#687386]">
                每月精選會員專屬好禮，數量有限，換完為止
              </p>
            </div>
            {monthly.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#E8E1D7] px-4 py-8 text-center text-sm text-[#687386]">
                目前沒有進行中的本月會員禮
              </p>
            ) : (
              monthly.map((item) => (
                <GiftCampaignCard
                  key={item.id}
                  item={item}
                  onClaim={onClaim}
                  claiming={claimingId === item.id}
                />
              ))
            )}
          </section>
        ) : null}

        {!loading && tab === "spend" ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-[#153E73]">門市滿額贈</h2>
              <p className="text-sm text-[#687386]">符合消費門檻的訂單，完成後即可取得兌換資格</p>
            </div>
            {spend.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#E8E1D7] px-4 py-8 text-center text-sm text-[#687386]">
                目前沒有進行中的門市滿額贈
              </p>
            ) : (
              spend.map((item) => (
                <GiftCampaignCard key={item.id} item={item} />
              ))
            )}
          </section>
        ) : null}

        {!loading && tab === "vouchers" ? (
          <section className="space-y-3">
            <Link
              href="/member/benefits/vouchers"
              className="flex items-center justify-between rounded-2xl border border-[#E8E1D7] bg-white px-4 py-4"
            >
              <div>
                <p className="font-bold text-[#153E73]">我的兌換券</p>
                <p className="text-xs text-[#687386]">查看可兌換、已兌換及已過期的會員禮</p>
              </div>
              {usableCount > 0 ? (
                <span className="rounded-full bg-[#F16458] px-2.5 py-1 text-xs font-bold text-white">
                  {usableCount} 張可使用
                </span>
              ) : (
                <span className="text-xs text-[#687386]">目前沒有待兌換票券</span>
              )}
            </Link>
            {claims
              .filter((c) => c.status === "available")
              .map((c) => {
                const camp = c.gift_campaigns as { gift_name?: string; gift_image_url?: string } | null;
                return (
                  <Link
                    key={String(c.id)}
                    href={`/member/benefits/vouchers/${c.id}`}
                    className="flex gap-3 rounded-2xl border border-[#E8E1D7] bg-white p-3"
                  >
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#FFFEFA]">
                      {camp?.gift_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={camp.gift_image_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#153E73]">{camp?.gift_name ?? "兌換券"}</p>
                      <p className="text-xs text-[#687386]">點擊出示兌換條碼</p>
                    </div>
                  </Link>
                );
              })}
          </section>
        ) : null}

        {!loading && tab === "history" ? (
          <section className="space-y-3">
            {claims.filter((c) => c.status !== "available").length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#E8E1D7] px-4 py-8 text-center text-sm text-[#687386]">
                尚無兌換紀錄
              </p>
            ) : (
              claims
                .filter((c) => c.status !== "available")
                .map((c) => {
                  const camp = c.gift_campaigns as { gift_name?: string } | null;
                  return (
                    <Link
                      key={String(c.id)}
                      href={`/member/benefits/vouchers/${c.id}`}
                      className="block rounded-2xl border border-[#E8E1D7] bg-white px-4 py-3"
                    >
                      <p className="font-bold text-[#153E73]">{camp?.gift_name ?? "兌換券"}</p>
                      <p className="text-xs text-[#687386]">
                        狀態：{String(c.status)}
                        {c.redemption_number ? ` · ${String(c.redemption_number)}` : ""}
                      </p>
                    </Link>
                  );
                })
            )}
          </section>
        ) : null}
      </div>
    </RequireAuth>
  );
}
