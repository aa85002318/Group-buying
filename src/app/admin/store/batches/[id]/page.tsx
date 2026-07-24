"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysUntil, expiryStatusLabel } from "@/lib/admin/store-ops";
import { formatDate } from "@/lib/utils";

type BatchDetail = {
  id: string;
  product_id: string;
  batch_no: string;
  barcode?: string | null;
  quantity: number;
  remaining_quantity?: number | null;
  expiry_date?: string | null;
  manufactured_at?: string | null;
  received_at?: string | null;
  location?: string | null;
  cost_price?: number | null;
  status?: string | null;
  notes?: string | null;
  products?: { id?: string; name?: string; sku?: string; barcode?: string } | null;
};

export default function StoreBatchDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [movements, setMovements] = useState<Array<{ id: string; movement_type: string; quantity_delta: number; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/store/batches/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "載入失敗");
      setBatch(data.batch);
      setRemaining(String(data.batch.remaining_quantity ?? data.batch.quantity ?? ""));
      setLocation(data.batch.location ?? "");
      setMovements(data.movements ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) void load();
  }, [id, load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/store/batches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remaining_quantity: Number(remaining),
          location: location || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-[#756B64]">載入中…</p>;
  if (error || !batch) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-[#C94C4C]">{error ?? "找不到批次"}</p>
        <Link href="/admin/store/batches" className="text-sm text-primary underline">
          返回批次管理
        </Link>
      </div>
    );
  }

  const days = daysUntil(batch.expiry_date);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`批次 ${batch.batch_no}`}
        description={`${batch.products?.name ?? "商品"} · ${expiryStatusLabel(days)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/products/${batch.product_id}/edit`}>
              <Button variant="outline">查看商品</Button>
            </Link>
            <Link href={`/admin/store/disposals?new=1&batch_id=${batch.id}&product_id=${batch.product_id}`}>
              <Button variant="secondary">報廢</Button>
            </Link>
            <Link href={`/admin/store/returns?new=1&batch_id=${batch.id}&product_id=${batch.product_id}`}>
              <Button variant="secondary">退貨</Button>
            </Link>
            <Link href={`/admin/store/issues?new=1&batch_id=${batch.id}&product_id=${batch.product_id}`}>
              <Button variant="secondary">異常</Button>
            </Link>
            <Link href="/admin/store/batches">
              <Button variant="ghost">返回列表</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[16px] border border-[#E9DED4] bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-3 font-semibold text-[#2F2925]">批次資訊</h2>
          <dl className="space-y-2">
            <div className="flex justify-between gap-2">
              <dt className="text-[#756B64]">商品</dt>
              <dd>
                <Link
                  href={`/admin/products/${batch.product_id}/edit`}
                  className="text-primary hover:underline"
                >
                  {batch.products?.name ?? batch.product_id}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#756B64]">批號</dt>
              <dd className="font-mono">{batch.batch_no}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#756B64]">到期日</dt>
              <dd>
                {batch.expiry_date ?? "—"}
                {days != null ? `（${days}天）` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#756B64]">原始數量</dt>
              <dd>{batch.quantity}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#756B64]">狀態</dt>
              <dd>{batch.status ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 rounded-[16px] border border-[#E9DED4] bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-[#2F2925]">編輯</h2>
          <label className="block space-y-1 text-sm">
            <span className="text-[#756B64]">剩餘數量</span>
            <Input
              type="number"
              value={remaining}
              onChange={(e) => setRemaining(e.target.value)}
              className="rounded-[10px]"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[#756B64]">儲位</span>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-[10px]"
            />
          </label>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "儲存中…" : "儲存"}
          </Button>
        </section>
      </div>

      <section className="rounded-[16px] border border-[#E9DED4] bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-[#2F2925]">庫存異動</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-[#756B64]">尚無異動（套用 V2 migration 後會記錄）</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {movements.map((m) => (
              <li key={m.id} className="flex justify-between border-b border-[#E9DED4]/80 py-1.5">
                <span>
                  {m.movement_type} · {m.quantity_delta > 0 ? "+" : ""}
                  {m.quantity_delta}
                </span>
                <span className="text-xs text-[#756B64]">{formatDate(m.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
