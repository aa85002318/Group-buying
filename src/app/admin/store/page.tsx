"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminMetricCard } from "@/components/admin/store/AdminMetricCard";
import { STORE_QUICK_ACTIONS } from "@/lib/admin/store-ops";
import { formatCurrency } from "@/lib/utils";

type Metrics = {
  productCount: number;
  batchCount: number;
  expiring7: number;
  expiring30: number;
  expiredOpen: number;
  disposalMonthLoss: number;
  openIssues: number;
  openReturns: number;
  lowStock: number;
  lastBackupAt: string | null;
};

type Todo = { priority: number; label: string; href: string; count?: number };

export default function AdminStoreHomePage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/summary");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setMetrics(data.metrics);
      setTodos(data.todos ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="門市總覽"
        description="Store Ops V2：以批次為核心。商品請在商品主檔建立；此處管理進貨批次、效期、報廢、退貨、異常與盤點。"
        actions={
          <Link
            href="/admin/store/batches?receive=1"
            className="rounded-[12px] bg-[#6F4E37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5D402E]"
          >
            快速進貨
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#756B64]">快速功能</h2>
        <div className="flex flex-wrap gap-2">
          {STORE_QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className="rounded-[12px] border border-[#E9DED4] bg-white px-3 py-2 text-sm font-medium text-[#2F2925] hover:border-[#6F4E37]/40"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : error ? (
        <p className="text-sm text-[#C94C4C]">{error}</p>
      ) : metrics ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard label="主檔商品（門市上架）" value={metrics.productCount} href="/admin/products" />
            <AdminMetricCard label="批次總數" value={metrics.batchCount} href="/admin/store/batches" />
            <AdminMetricCard
              label="7 天內到期批次"
              value={metrics.expiring7}
              href="/admin/store/expiry?range=7"
              tone={metrics.expiring7 ? "warning" : "default"}
            />
            <AdminMetricCard
              label="30 天內到期批次"
              value={metrics.expiring30}
              href="/admin/store/expiry?range=30"
            />
            <AdminMetricCard
              label="本月報廢金額"
              value={formatCurrency(metrics.disposalMonthLoss)}
              href="/admin/store/disposals"
              tone={metrics.disposalMonthLoss ? "danger" : "default"}
            />
            <AdminMetricCard
              label="待處理異常"
              value={metrics.openIssues}
              href="/admin/store/issues?status=open"
              tone={metrics.openIssues ? "warning" : "default"}
            />
            <AdminMetricCard
              label="待處理退貨"
              value={metrics.openReturns}
              href="/admin/store/returns?status=open"
            />
            <AdminMetricCard
              label="最後備份時間"
              value={
                metrics.lastBackupAt
                  ? new Date(metrics.lastBackupAt).toLocaleString("zh-TW")
                  : "尚未備份"
              }
              href="/admin/store/backups"
              tone={metrics.lastBackupAt ? "success" : "info"}
            />
          </section>

          <section className="rounded-[16px] border border-[#E9DED4] bg-white p-4">
            <h2 className="text-base font-bold text-[#2F2925]">今日待辦</h2>
            {todos.length === 0 ? (
              <p className="mt-3 text-sm text-[#756B64]">目前沒有緊急待辦。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {todos.map((t) => (
                  <li key={t.label}>
                    <Link
                      href={t.href}
                      className="flex items-center justify-between rounded-[12px] border border-[#E9DED4] px-3 py-2 text-sm hover:bg-[#FFF8F5]"
                    >
                      <span className="font-medium text-[#2F2925]">{t.label}</span>
                      <span className="text-[#756B64]">{t.count != null ? t.count : "→"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
