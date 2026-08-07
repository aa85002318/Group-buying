"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type GiftPickerItem = { id: string; label: string; meta?: string };

type GiftEntityPickerProps = {
  title: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  kind: "product" | "category";
  hint?: string;
};

export function GiftEntityPicker({
  title,
  selectedIds,
  onChange,
  kind,
  hint,
}: GiftEntityPickerProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GiftPickerItem[]>([]);
  const [selected, setSelected] = useState<GiftPickerItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedIds.length) {
      setSelected([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      const res = await fetch(
        `/api/admin/member-gifts/catalog-search?kind=${kind}&ids=${encodeURIComponent(selectedIds.join(","))}&limit=50`
      );
      const d = await res.json().catch(() => ({ items: [] }));
      if (cancelled) return;
      const map = new Map(
        ((d.items ?? []) as GiftPickerItem[]).map((i) => [i.id, i] as const)
      );
      setSelected(
        selectedIds.map((id) => map.get(id) ?? { id, label: id.slice(0, 8) })
      );
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedIds.join(","), kind]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/admin/member-gifts/catalog-search?kind=${kind}&q=${encodeURIComponent(q.trim())}`
          );
          const d = await res.json();
          setResults((d.items ?? []) as GiftPickerItem[]);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => clearTimeout(t);
  }, [q, kind]);

  const toggle = (item: GiftPickerItem) => {
    const has = selectedIds.includes(item.id);
    const nextIds = has
      ? selectedIds.filter((id) => id !== item.id)
      : [...selectedIds, item.id];
    onChange(nextIds);
  };

  return (
    <div className="space-y-2 rounded-xl border border-[#E7EAF0] bg-[#FFFDF6] p-3 text-xs md:col-span-2">
      <p className="font-bold text-[#153E73]">{title}</p>
      {hint ? <p className="text-[#8A94A6]">{hint}</p> : null}
      <Input
        className="h-9"
        placeholder={kind === "product" ? "搜尋商品名稱／SKU…" : "搜尋分類名稱…"}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? <p className="text-[#8A94A6]">搜尋中…</p> : null}
      {results.length > 0 ? (
        <ul className="max-h-36 space-y-1 overflow-y-auto">
          {results.map((r) => {
            const on = selectedIds.includes(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left ${
                    on ? "bg-[#FEE169] text-[#153E73]" : "bg-white text-[#687386]"
                  }`}
                >
                  <span className="truncate font-medium">{r.label}</span>
                  <span className="shrink-0 text-[10px]">{on ? "已選" : r.meta || "加入"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#153E73] ring-1 ring-[#E7EAF0]"
            >
              {s.label}
              <button type="button" className="text-[#8A94A6]" onClick={() => toggle(s)}>
                ×
              </button>
            </span>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => onChange([])}>
            清空
          </Button>
        </div>
      ) : (
        <p className="text-[#8A94A6]">尚未指定（空＝不限）</p>
      )}
    </div>
  );
}
