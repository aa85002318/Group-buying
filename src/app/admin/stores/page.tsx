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

const EDITOR_TABS = [
  "basic",
  "company",
  "social",
  "hours",
  "map",
  "services",
  "images",
  "announce",
  "system",
] as const;

type EditorTab = (typeof EDITOR_TABS)[number];

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialTab, setInitialTab] = useState<EditorTab>("basic");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [storesRes, meRes] = await Promise.all([
        fetch("/api/admin/stores"),
        fetch("/api/auth/me", { cache: "no-store" }).catch(() => null),
      ]);
      const data = await storesRes.json();
      if (!storesRes.ok) throw new Error(data.error ?? "載入失敗");
      const list = (data.stores ?? []) as StoreProfile[];
      setStores(list);

      if (meRes?.ok) {
        const me = await meRes.json().catch(() => ({}));
        const role = me?.profile?.role;
        setIsAdmin(role === "admin");
      }

      const params =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const fromUrl = params?.get("id") || params?.get("store");
      const tabParam = params?.get("tab") as EditorTab | null;
      if (tabParam && (EDITOR_TABS as readonly string[]).includes(tabParam)) {
        setInitialTab(tabParam);
      }

      setSelectedId((prev) => {
        if (fromUrl && list.some((s) => s.id === fromUrl)) return fromUrl;
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
        description="左側選分店、右側分頁編輯。含 Google Maps 連結、經緯度、導航測試與地圖預覽。"
        actions={
          isAdmin ? (
            <Button
              type="button"
              className="border-[#FFE149] bg-[#FFE149] font-bold text-[#153E73] hover:bg-[#FFE149]/90"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              新增分店
            </Button>
          ) : null
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-2xl border border-[#E7EAF0] bg-white p-3 shadow-[0_4px_14px_rgba(21,62,115,0.05)]">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="h-4 w-4 text-[#153E73]" />
            <h2 className="font-semibold text-[#153E73]">分店列表</h2>
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋分店…"
            className="rounded-xl"
          />
          {loading ? (
            <p className="px-2 py-6 text-center text-sm text-[#687386]">載入中…</p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-[#687386]">尚無分店</p>
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
                      onClick={() => {
                        setSelectedId(s.id);
                        if (typeof window !== "undefined") {
                          const url = new URL(window.location.href);
                          url.searchParams.set("id", s.id);
                          window.history.replaceState({}, "", url.toString());
                        }
                      }}
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition",
                        active
                          ? "border-[#FFE149] bg-[#FFFBEA]"
                          : "border-[#E7EAF0] bg-white hover:bg-[#F7F8FA]",
                        !s.is_active && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[#153E73]">{s.name}</p>
                        <span className="shrink-0 text-xs text-[#687386]">
                          {!s.is_active ? "已停用" : open ? "營業中" : "休息中"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#8A94A6]">{hours}</p>
                      {s.map_url || (s.latitude != null && s.longitude != null) ? (
                        <p className="mt-1 text-[11px] font-semibold text-[#153E73]/60">
                          已設定 Maps
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-amber-700">尚未設定 Maps</p>
                      )}
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
              key={`${selected.id}-${initialTab}`}
              store={selected}
              canEditAdminFields={isAdmin}
              initialTab={initialTab}
              onUpdated={(next) => {
                setStores((list) => list.map((s) => (s.id === next.id ? { ...s, ...next } : s)));
              }}
            />
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#E7EAF0] bg-white text-sm text-[#687386]">
              請選擇左側分店，或新增分店開始編輯
            </div>
          )}
        </div>
      </div>

      {isAdmin ? (
        <StoreCreateWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onCreated={(store) => {
            setStores((list) => [...list, store]);
            setSelectedId(store.id);
          }}
        />
      ) : null}
    </div>
  );
}
