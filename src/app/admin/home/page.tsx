"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { HomepageBlock } from "@/lib/types/database";

export default function AdminHomePage() {
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/cms?type=blocks")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setBlocks(d.blocks ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, updates: Record<string, unknown>) => {
    await fetch("/api/admin/cms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "block", id, ...updates }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="首頁管理"
        description="啟用／停用首頁區塊、調整排序與顯示數量。第一版使用上下移動，不引入拖曳套件。"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button type="button" className="ml-2 underline" onClick={load}>重試</button>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => (
            <div key={block.id} className="rounded-xl border border-border bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-coffee">{block.title}</p>
                  <p className="text-xs text-muted-foreground">key: {block.block_key}</p>
                  {block.subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">{block.subtitle}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => patch(block.id, { sort_order: block.sort_order - 10 })}>
                    上移
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => patch(block.id, { sort_order: block.sort_order + 10 })}>
                    下移
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => patch(block.id, { is_visible: !block.is_visible })}
                  >
                    {block.is_visible ? "停用" : "啟用"}
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <Input
                  defaultValue={block.title}
                  onBlur={(e) => {
                    if (e.target.value !== block.title) patch(block.id, { title: e.target.value });
                  }}
                  placeholder="標題"
                />
                <Input
                  defaultValue={block.subtitle ?? ""}
                  onBlur={(e) => {
                    if (e.target.value !== (block.subtitle ?? "")) {
                      patch(block.id, { subtitle: e.target.value || null });
                    }
                  }}
                  placeholder="副標"
                />
                <Input
                  type="number"
                  defaultValue={String(block.display_count ?? 6)}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (n !== (block.display_count ?? 6)) patch(block.id, { display_count: n });
                  }}
                  placeholder="顯示數量"
                />
              </div>
              {block.block_key === "hot_search" ? (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    熱門關鍵字（每行一個；存入 config.keywords）
                  </label>
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                    defaultValue={
                      Array.isArray(block.config?.keywords)
                        ? (block.config.keywords as Array<string | { label?: string }>)
                            .map((k) => (typeof k === "string" ? k : k.label ?? ""))
                            .filter(Boolean)
                            .join("\n")
                        : "麵粉\n奶油\n杜拜巧克力\n中秋禮盒\n蛋塔\n鮮奶油\n預拌粉\n可頌\n吐司\n餅乾"
                    }
                    onBlur={(e) => {
                      const keywords = e.target.value
                        .split("\n")
                        .map((s) => s.trim().replace(/^#/, ""))
                        .filter(Boolean);
                      patch(block.id, {
                        config: { ...(block.config ?? {}), keywords },
                      });
                    }}
                  />
                </div>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                狀態：{block.is_visible ? "顯示中" : "已隱藏"} · 排序 {block.sort_order} · 來源{" "}
                {block.source_mode === "manual" ? "手動" : "自動"}
              </p>
            </div>
          ))}
          {blocks.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              尚無首頁區塊（套用 migration 後會種子預設區塊）
            </p>
          )}
        </div>
      )}
    </div>
  );
}
