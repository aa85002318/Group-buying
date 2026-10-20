"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StocktakeScanClient } from "./StocktakeScanClient";

type Store = { id: string; name: string };

export default function StocktakeScanPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [defaultStoreId, setDefaultStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stores").then((r) => r.json()).catch(() => ({})),
      // 門市人員只能操作自己的門市，這支在伺服器端用 resolveOpsStoreId 解析，
      // 不能在前端猜（猜錯會讓店員預設盤到別間門市）。
      fetch("/api/admin/store/unknown-barcodes").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([storeRes, scopeRes]) => {
        const list = ((storeRes.stores ?? []) as Array<Record<string, unknown>>)
          .map((s) => ({ id: String(s.id), name: String(s.name ?? "未命名門市") }))
          .filter((s) => s.id);
        setStores(list);
        const preferred = scopeRes?.store_id ? String(scopeRes.store_id) : null;
        setDefaultStoreId(preferred ?? list[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-lg">
      <AdminPageHeader
        title="手機盤點"
        description="掃商品條碼，輸入架上實際數量。套用後會更新門市庫存並留下異動紀錄。"
      />
      {loading ? (
        <p className="p-6 text-sm text-[#8A94A6]">載入中…</p>
      ) : stores.length === 0 ? (
        <p className="p-6 text-sm text-[#8A94A6]">
          找不到可操作的門市。請先在「門市管理」建立門市，或確認你的帳號有綁定門市。
        </p>
      ) : (
        <StocktakeScanClient stores={stores} defaultStoreId={defaultStoreId} />
      )}
    </div>
  );
}
