"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireAuth } from "@/components/member/RequireAuth";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/site-links";

type Store = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
};

export default function PreferredStorePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stores?channel=website").then((r) => r.json()),
      fetch("/api/member/preferred-store").then((r) => r.json()),
    ])
      .then(([storesRes, preferredRes]) => {
        setStores(storesRes.stores ?? storesRes ?? []);
        setSelectedId(preferredRes.preferredStoreId ?? null);
      })
      .catch(() => setError("載入失敗"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/member/preferred-store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      setMessage("預設取貨門市已更新");
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto max-w-lg space-y-5 pb-4">
        <div className="flex items-center gap-3">
          <Link href={APP_ROUTES.memberSettings}>
            <ArrowLeft className="h-5 w-5 text-caramel" />
          </Link>
          <h1 className="text-xl font-bold text-caramel">預設取貨門市</h1>
        </div>

        <div className="space-y-3 rounded-[20px] bg-surface p-5 shadow-card">
          <p className="text-sm text-foreground-secondary">
            設定後，結帳選擇門市取貨時可快速帶入偏好門市。
          </p>

          {loading ? (
            <p className="text-sm text-foreground-secondary">載入中…</p>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-y-auto">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-3">
                <input
                  type="radio"
                  name="store"
                  checked={selectedId === null}
                  onChange={() => setSelectedId(null)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-foreground">不設定</span>
                  <span className="text-xs text-foreground-secondary">每次結帳再選擇</span>
                </span>
              </label>
              {stores.map((store) => (
                <label
                  key={store.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-3"
                >
                  <input
                    type="radio"
                    name="store"
                    checked={selectedId === store.id}
                    onChange={() => setSelectedId(store.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-foreground">{store.name}</span>
                    <span className="text-xs text-foreground-secondary">
                      {[store.city, store.address].filter(Boolean).join(" ")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-error">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <Button className="min-h-11 w-full" disabled={saving || loading} onClick={save}>
            {saving ? "儲存中…" : "儲存"}
          </Button>
        </div>
      </div>
    </RequireAuth>
  );
}
