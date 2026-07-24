"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminBarcodeInput } from "@/components/admin/store/AdminBarcodeInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ProductRow = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  stock?: number | null;
  publish_store?: boolean | null;
  supplier_name?: string | null;
  unit?: string | null;
};

export default function StoreProductsPage() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/store/products?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setItems(data.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="商品資料庫"
        description="平台唯一 Product Master（products）。門市／團購／食譜皆引用同一 product_id。"
        actions={
          <Link
            href="/admin/products/new"
            className="rounded-[12px] bg-[#6F4E37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5D402E]"
          >
            ＋新增商品
          </Link>
        }
      />

      <AdminBarcodeInput
        onSelect={(p) => {
          setQ(p.barcode || p.sku || p.name);
        }}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋名稱／SKU／條碼"
          className="rounded-[10px]"
        />
        <Button type="button" variant="outline" onClick={() => void load()}>
          搜尋
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-[#756B64]">載入中…</p>
      ) : error ? (
        <p className="text-sm text-[#C94C4C]">{error}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-[16px] border border-[#E9DED4] bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6F1] text-left text-[#756B64]">
                <tr>
                  <th className="px-4 py-3">商品</th>
                  <th className="px-4 py-3">SKU／條碼</th>
                  <th className="px-4 py-3">庫存</th>
                  <th className="px-4 py-3">門市</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-[#E9DED4]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[#FAF6F1]">
                          {p.image_url ? (
                            <Image src={p.image_url} alt={p.name} fill className="object-contain" sizes="40px" />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-[#2F2925]">{p.name}</p>
                          <p className="text-xs text-[#756B64]">{p.supplier_name ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#756B64]">
                      {p.sku ?? "—"}
                      <br />
                      {p.barcode ?? "—"}
                    </td>
                    <td className="px-4 py-3">{p.stock ?? 0}</td>
                    <td className="px-4 py-3">{p.publish_store ? "啟用" : "關閉"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-[#6F4E37] underline">
                        編輯
                      </Link>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#756B64]">
                      尚無商品
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((p) => (
              <div key={p.id} className="rounded-[16px] border border-[#E9DED4] bg-white p-4">
                <p className="font-semibold text-[#2F2925]">{p.name}</p>
                <p className="mt-1 text-xs text-[#756B64]">
                  {p.sku ?? "—"} · {p.barcode ?? "—"} · 庫存 {p.stock ?? 0}
                </p>
                <Link href={`/admin/products/${p.id}/edit`} className="mt-2 inline-block text-sm text-[#6F4E37] underline">
                  編輯
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
