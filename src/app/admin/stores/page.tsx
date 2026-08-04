"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StoreCreateWizard } from "@/components/admin/stores/StoreCreateWizard";
import { StoreProfileEditor } from "@/components/admin/stores/StoreProfileEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isStoreOpenNow,
  summarizeTodayHours,
  type StoreProfile,
} from "@/lib/admin/store-profile";
import { cn } from "@/lib/utils";

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stores");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      const list = (data.stores ?? []) as StoreProfile[];
      setStores(list);
      setSelectedId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return stores;
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.address.toLowerCase().includes(needle) ||
        (s.code ?? "").toLowerCase().includes(needle) ||
        (s.phone ?? "").includes(needle)
    );
  }, [stores, q]);

  const selected = stores.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="分店資訊"
        description="門市／取貨點共用主檔：官網、APP 取貨、Google 導航、社群、營業時間與公告皆維護於此。"
        actions={
          <Button type="button" onClick={() => setWizardOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            新增分店
          </Button>
        }
      />

      {error ? <p className="text-sm text-[#C94C4C]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-[16px] border border-[#E9DED4] bg-white p-3">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="h-4 w-4 text-[#6F4E37]" />
            <h2 className="font-semibold text-[#2F2925]">分店列表</h2>
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋分店…"
            className="rounded-[10px]"
          />
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-[#756B64]">載入中…</p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#756B64]">尚無分店</p>
          ) : (
            <ul className="max-h-[70vh] space-y-2 overflow-y-auto">
              {filtered.map((s) => {
                const open = isStoreOpenNow(s.weekly_hours, s.holidays);
                const hours = summarizeTodayHours(s.weekly_hours, s.holidays);
                const active = s.id === selectedId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        "w-full rounded-[14px] border px-3 py-3 text-left transition",
                        active
                          ? "border-[#FFE149] bg-[#FFF5C7]"
                          : "border-[#E9DED4] bg-white hover:bg-[#FFFBEA]",
                        !s.is_active && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[#2F2925]">{s.name}</p>
                        <span className="shrink-0 text-xs">
                          {s.is_active ? (open ? "營業中 🟢" : "休息中") : "已停用"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#756B64]">{hours}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#756B64]">
                        <span>今天訂單 {s.today_orders ?? "—"}</span>
                        <span>庫存 {s.inventory_qty ?? "—"}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div>
          {selected ? (
            <StoreProfileEditor
              key={selected.id}
              store={selected}
              onUpdated={(next) => {
                setStores((list) => list.map((s) => (s.id === next.id ? { ...s, ...next } : s)));
              }}
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-[16px] border border-dashed border-[#E9DED4] bg-white text-sm text-[#756B64]">
              請選擇左側分店，或新增分店開始編輯
            </div>
          )}
        </div>
      </div>

      <StoreCreateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(store) => {
          setStores((list) => [...list, store]);
          setSelectedId(store.id);
        }}
      />
    </div>
  );
}
