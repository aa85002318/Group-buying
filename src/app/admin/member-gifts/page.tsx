"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useAdminShell } from "@/components/admin/AdminShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Kpi = {
  active_campaigns: number;
  claimed_today: number;
  redeemed_today: number;
  pending_redeem: number;
  remaining_stock: number;
  low_stock_campaigns: number;
  expiring_soon: number;
  anomaly_logs: number;
  pending_reversals: number;
  auto_issued_today: number;
};

const KPI_CARDS: Array<{ key: keyof Kpi; label: string; href?: string }> = [
  { key: "active_campaigns", label: "進行中活動", href: "/admin/member-gifts/campaigns" },
  { key: "claimed_today", label: "今日領取數" },
  { key: "redeemed_today", label: "今日核銷數" },
  { key: "pending_redeem", label: "待兌換數", href: "/admin/member-gifts/vouchers" },
  { key: "remaining_stock", label: "剩餘庫存" },
  { key: "low_stock_campaigns", label: "即將額滿活動" },
  { key: "expiring_soon", label: "即將到期活動" },
  { key: "auto_issued_today", label: "今日自動發券" },
  { key: "anomaly_logs", label: "核銷異常", href: "/admin/member-gifts/logs" },
  { key: "pending_reversals", label: "待審沖銷", href: "/admin/member-gifts/reversals" },
];

export default function MemberGiftsDashboardPage() {
  const { profile } = useAdminShell();
  const canEdit =
    profile?.role === "admin" || profile?.role === "content_editor";
  const isAdmin = profile?.role === "admin";
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [active, setActive] = useState<Array<Record<string, unknown>>>([]);
  const [lowStock, setLowStock] = useState<Array<Record<string, unknown>>>([]);
  const [expiring, setExpiring] = useState<Array<Record<string, unknown>>>([]);
  const [anomalies, setAnomalies] = useState<Array<Record<string, unknown>>>([]);
  const [maintBusy, setMaintBusy] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);

  const load = () => {
    fetch("/api/admin/member-gifts/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setKpi(d.kpi ?? null);
        setActive(d.active_campaigns ?? []);
        setLowStock(d.low_stock ?? []);
        setExpiring(d.expiring ?? []);
        setAnomalies(d.anomalies ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const runSeedDemo = async () => {
    setSeedBusy(true);
    try {
      const res = await fetch("/api/admin/member-gifts/seed-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "建立失敗");
      const created = Array.isArray(d.created) ? d.created.length : 0;
      const skipped = Array.isArray(d.skipped) ? d.skipped.length : 0;
      alert(`示範活動：新建 ${created}、略過已存在 ${skipped}`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSeedBusy(false);
    }
  };

  const runMaintenance = async () => {
    setMaintBusy(true);
    try {
      const res = await fetch("/api/admin/member-gifts/maintenance", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "維運失敗");
      alert(
        `維運完成：過期 ${d.expired ?? 0}、發布 ${d.published ?? 0}、結束 ${d.ended ?? 0}、低庫存通知 ${d.notified ?? 0}、到期提醒 ${d.reminded ?? 0}、自動發券 ${d.auto_issue?.issued ?? 0}`
      );
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "維運失敗");
    } finally {
      setMaintBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="門市會員禮"
        description="獨立於一般商品與優惠券：活動、庫存、兌換券與門市核銷集中管理（行銷可建編、門市可核銷、稽核可唯讀）"
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Button
                variant="outline"
                disabled={seedBusy}
                onClick={() => void runSeedDemo()}
              >
                {seedBusy ? "建立中…" : "建立示範活動"}
              </Button>
            ) : null}
            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  disabled={maintBusy}
                  onClick={() => void runMaintenance()}
                >
                  {maintBusy ? "執行中…" : "立即執行維運"}
                </Button>
                <Link
                  href="/api/admin/member-gifts/health"
                  target="_blank"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  健全檢查
                </Link>
              </>
            ) : null}
            {canEdit ? (
              <Link
                href="/admin/member-gifts/campaigns/new"
                className={cn(buttonVariants({ className: "bg-[#FEE169] font-bold text-[#153E73]" }))}
              >
                新增活動
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {KPI_CARDS.map((card) => {
          const value = kpi?.[card.key] ?? "—";
          const inner = (
            <div className="rounded-2xl border border-[#E7EAF0] bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-[#8A94A6]">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-[#153E73]">{value}</p>
            </div>
          );
          return card.href ? (
            <Link key={card.key} href={card.href} className="block transition hover:opacity-90">
              {inner}
            </Link>
          ) : (
            <div key={card.key}>{inner}</div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#153E73]">進行中活動</h2>
            <Link href="/admin/member-gifts/campaigns" className="text-xs font-semibold text-[#153E73] underline">
              全部活動
            </Link>
          </div>
          {active.length === 0 ? (
            <p className="text-sm text-[#8A94A6]">目前沒有進行中活動</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {active.map((c) => (
                <li key={String(c.id)}>
                  <Link
                    href={`/admin/member-gifts/campaigns/${String(c.id)}`}
                    className="flex items-center justify-between rounded-xl bg-[#FFFDF6] px-3 py-2 hover:bg-[#FFF5CC]"
                  >
                    <div>
                      <p className="font-semibold text-[#153E73]">{String(c.name)}</p>
                      <p className="text-xs text-[#8A94A6]">{String(c.gift_name)}</p>
                    </div>
                    <span className="text-xs font-bold text-[#153E73]">
                      剩 {String(c.available_quantity)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-[#153E73]">即將額滿／到期</h2>
          <div className="space-y-3 text-sm">
            {lowStock.length === 0 && expiring.length === 0 ? (
              <p className="text-[#8A94A6]">目前沒有警示項目</p>
            ) : null}
            {lowStock.map((c) => (
              <Link
                key={`low-${String(c.id)}`}
                href={`/admin/member-gifts/campaigns/${String(c.id)}`}
                className="block rounded-xl bg-[#FDE8E6] px-3 py-2 text-[#B42318] hover:opacity-90"
              >
                即將額滿：{String(c.name)}（剩 {String(c.available_quantity)}）
              </Link>
            ))}
            {expiring.map((c) => (
              <Link
                key={`exp-${String(c.id)}`}
                href={`/admin/member-gifts/campaigns/${String(c.id)}`}
                className="block rounded-xl bg-[#FFF5CC] px-3 py-2 text-[#153E73] hover:opacity-90"
              >
                即將到期：{String(c.name)}
                {c.redeem_end_at
                  ? ` · ${new Date(String(c.redeem_end_at)).toLocaleDateString("zh-TW")}`
                  : ""}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E7EAF0] bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#153E73]">核銷異常紀錄</h2>
          <Link href="/admin/member-gifts/logs" className="text-xs font-semibold text-[#153E73] underline">
            查看全部
          </Link>
        </div>
        {anomalies.length === 0 ? (
          <p className="text-sm text-[#8A94A6]">沒有異常紀錄</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {anomalies.slice(0, 8).map((a) => (
              <li key={String(a.id)} className="rounded-xl bg-[#FFFDF6] px-3 py-2 text-[#687386]">
                <span className="font-semibold text-[#B42318]">{String(a.result)}</span>
                {" · "}
                {String(a.failure_reason ?? a.action ?? "—")}
                {" · "}
                {a.created_at ? new Date(String(a.created_at)).toLocaleString("zh-TW") : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
