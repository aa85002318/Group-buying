"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GroupBuyCategory } from "@/lib/types/database";

export default function AdminGroupBuyCategoriesPage() {
  const [categories, setCategories] = useState<GroupBuyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/admin/group-buy-categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, []);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/group-buy-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      setName("");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("刪除此團購分類？")) return;
    await fetch(`/api/admin/group-buy-categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="團購分類"
        description="供團購商品選擇；與商品主檔共用，不另建第二套商品系統。"
        actions={
          <Link href="/admin/products/new">
            <Button>新增團購商品</Button>
          </Link>
        }
      />

      <div className="rounded-[20px] border border-border bg-white p-5 shadow-card space-y-3">
        <p className="text-sm font-semibold">新增分類</p>
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="分類名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button disabled={busy || !name.trim()} onClick={() => void add()}>
            新增
          </Button>
        </div>
      </div>

      <div className="rounded-[20px] border border-border bg-white p-5 shadow-card">
        {loading ? (
          <p className="text-sm text-foreground-secondary">載入中…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-foreground-secondary">尚無分類</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-foreground-secondary">
              <tr>
                <th className="px-2 py-2">分類</th>
                <th className="px-2 py-2">slug</th>
                <th className="px-2 py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-2 py-2 font-medium">{r.name}</td>
                  <td className="px-2 py-2 text-foreground-secondary">{r.slug}</td>
                  <td className="px-2 py-2 text-right">
                    <Button size="sm" variant="secondary" onClick={() => void remove(r.id)}>
                      刪除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
