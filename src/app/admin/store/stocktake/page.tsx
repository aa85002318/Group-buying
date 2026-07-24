"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

type Stocktake = {
  id: string;
  title: string;
  status: string;
  notes?: string | null;
  created_at: string;
  completed_at?: string | null;
};

export default function StoreStocktakePage() {
  const [items, setItems] = useState<Stocktake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("例行盤點");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store/stocktakes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems(data.stocktakes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/store/stocktakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "建立失敗");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "建立失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="盤點管理"
        description="盤點以批次為單位。建立盤點單後，可對照系統剩餘量與實盤數量（V1 先建立單據）。"
        actions={
          <Link href="/admin/store/batches">
            <Button variant="outline">批次管理</Button>
          </Link>
        }
      />

      <section className="flex flex-col gap-2 rounded-[16px] border border-[#E9DED4] bg-[#FFF8F5] p-4 sm:flex-row sm:items-end">
        <label className="block flex-1 space-y-1 text-sm">
          <span className="text-[#756B64]">盤點名稱</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-[10px]"
          />
        </label>
        <Button type="button" disabled={saving} onClick={() => void create()}>
          {saving ? "建立中…" : "建立盤點單"}
        </Button>
      </section>

      {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[#E9DED4] bg-white px-4 py-3"
            >
              <div>
                <p className="font-semibold text-[#2F2925]">{s.title}</p>
                <p className="text-xs text-[#756B64]">
                  {s.status} · {formatDate(s.created_at)}
                </p>
              </div>
              <span className="rounded-full bg-[#FAF6F1] px-2 py-0.5 text-xs text-[#756B64]">
                {s.status}
              </span>
            </li>
          ))}
          {!items.length ? (
            <p className="rounded-[16px] border border-[#E9DED4] bg-white p-8 text-center text-sm text-[#756B64]">
              尚無盤點單。請先套用 Store Ops V2 migration 後建立。
            </p>
          ) : null}
        </ul>
      )}
    </div>
  );
}
