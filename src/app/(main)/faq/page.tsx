"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/lib/site-links";

type Faq = { id: string; category: string; question: string; answer: string };

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [faqs, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    for (const f of filtered) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#173F75]">常見問題</h1>
        <Link href={APP_ROUTES.support} className="text-sm text-[#173F75]">聯絡客服</Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <Input className="min-h-12 pl-10" placeholder="搜尋問題…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-center text-[#6B7280]">載入中…</p>
      ) : grouped.length === 0 ? (
        <p className="py-12 text-center text-[#6B7280]">找不到相關問題</p>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-2 px-1 text-sm font-medium text-[#6B7280]">{category}</h2>
            <div className="divide-y overflow-hidden rounded-[20px] bg-white shadow-[0_4px_24px_rgba(23,63,117,0.06)]">
              {items.map((f) => (
                <div key={f.id}>
                  <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left" onClick={() => setOpenId(openId === f.id ? null : f.id)}>
                    <span className="font-medium text-[#202124]">{f.question}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-[#6B7280] transition ${openId === f.id ? "rotate-180" : ""}`} />
                  </button>
                  {openId === f.id && <div className="border-t px-4 pb-4 pt-2 text-sm leading-relaxed text-[#6B7280]">{f.answer}</div>}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
