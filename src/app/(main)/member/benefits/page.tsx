"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/site-links";
import { BENEFIT_STATUS_LABEL } from "@/lib/benefits/status";
import type { MemberBenefitAssignmentStatus } from "@/lib/types/database";

type BenefitRow = {
  id: string;
  displayStatus: MemberBenefitAssignmentStatus;
  starts_at: string | null;
  ends_at: string | null;
  used_at: string | null;
  member_benefits?: {
    title: string;
    summary?: string | null;
    description?: string | null;
    image_url?: string | null;
    usage_instructions?: string | null;
    usage_location?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
};

const TONE: Record<MemberBenefitAssignmentStatus, "success" | "error" | "warning" | "info" | "disabled"> = {
  available: "success",
  used: "disabled",
  expired: "error",
  upcoming: "info",
  disabled: "warning",
  revoked: "error",
};

export default function MemberBenefitsPage() {
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/member/benefits")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setBenefits(d.benefits ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <RequireAuth>
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.member}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-caramel">會員福利</h1>
            <p className="text-sm text-foreground-secondary">僅顯示 App 活動發放的福利</p>
          </div>
        </div>

        <p className="rounded-2xl bg-butter-soft/80 px-4 py-3 text-xs text-foreground-secondary">
          福利來自管理員手動發放或 App／團購／課程活動，不會依門市 POS 消費金額自動發放。本階段不含點數、會員等級或優惠券錢包。
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-[20px] bg-surface" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[20px] bg-error-soft p-6 text-center text-sm text-error">
            {error}
            <button type="button" className="mt-2 block w-full underline" onClick={load}>
              重試
            </button>
          </div>
        ) : benefits.length === 0 ? (
          <div className="rounded-[20px] bg-surface p-8 text-center shadow-card">
            <Gift className="mx-auto h-12 w-12 text-caramel" />
            <p className="mt-4 font-bold text-foreground">目前尚無福利紀錄</p>
            <p className="mt-2 text-sm text-foreground-secondary">有新福利時會顯示在這裡</p>
          </div>
        ) : (
          <div className="space-y-3">
            {benefits.map((row) => {
              const b = row.member_benefits;
              const start = row.starts_at ?? b?.starts_at;
              const end = row.ends_at ?? b?.ends_at;
              return (
                <article key={row.id} className="rounded-[20px] bg-surface p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold text-foreground">{b?.title ?? "福利"}</h2>
                    <StatusBadge tone={TONE[row.displayStatus]} label={BENEFIT_STATUS_LABEL[row.displayStatus]} />
                  </div>
                  {b?.summary && (
                    <p className="mt-2 text-sm text-foreground-secondary">{b.summary}</p>
                  )}
                  {b?.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{b.description}</p>
                  )}
                  {b?.usage_instructions && (
                    <p className="mt-2 text-sm text-caramel">使用方式：{b.usage_instructions}</p>
                  )}
                  {b?.usage_location && (
                    <p className="mt-1 text-sm text-foreground-secondary">使用地點：{b.usage_location}</p>
                  )}
                  <p className="mt-3 text-xs text-foreground-secondary">
                    {start ? `開始 ${formatDate(start)}` : "不限開始日"}
                    {" · "}
                    {end ? `到期 ${formatDate(end)}` : "不限到期日"}
                    {row.used_at ? ` · 已於 ${formatDate(row.used_at)} 使用` : ""}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
