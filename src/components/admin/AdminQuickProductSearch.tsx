"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency } from "@/lib/utils";

type QuickProduct = {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  price?: number;
};

export function AdminQuickProductSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const [results, setResults] = useState<QuickProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = debounced.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=12`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setResults((d.products ?? []) as QuickProduct[]);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const goAll = () => {
    const q = query.trim();
    setOpen(false);
    router.push(q ? `/admin/products?q=${encodeURIComponent(q)}` : "/admin/products");
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className="admin-icon-btn"
        aria-label="快速搜尋商品"
        title="快速搜尋商品"
        onClick={() => setOpen((v) => !v)}
      >
        <Search className="h-4 w-4" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] rounded-xl border border-[var(--admin-border)] bg-white p-2 shadow-lg">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[#FFFEFA] px-2">
            <Search className="h-4 w-4 shrink-0 text-[var(--admin-muted)]" aria-hidden />
            <input
              autoFocus
              className="h-10 flex-1 bg-transparent text-sm outline-none"
              placeholder="名稱、SKU、條碼、供應商…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goAll();
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>

          <div className="mt-2 max-h-64 overflow-y-auto">
            {loading ? <p className="px-2 py-3 text-xs text-[var(--admin-muted)]">搜尋中…</p> : null}
            {!loading && debounced.trim() && results.length === 0 ? (
              <p className="px-2 py-3 text-xs text-[var(--admin-muted)]">找不到符合的商品</p>
            ) : null}
            {results.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}/edit`}
                className="block rounded-lg px-2 py-2 hover:bg-[var(--admin-hover)]"
                onClick={() => setOpen(false)}
              >
                <p className="truncate text-sm font-semibold text-[var(--admin-title)]">{p.name}</p>
                <p className="truncate text-[10px] text-[var(--admin-muted)]">
                  {[p.sku, p.barcode].filter(Boolean).join(" · ") || "無 SKU"}
                  {p.price != null ? ` · ${formatCurrency(p.price)}` : ""}
                </p>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="mt-2 w-full rounded-lg px-2 py-2 text-left text-xs font-semibold text-[#153E73] hover:bg-[var(--admin-hover)]"
            onClick={goAll}
          >
            在商品總覽查看全部結果
          </button>
        </div>
      ) : null}
    </div>
  );
}
