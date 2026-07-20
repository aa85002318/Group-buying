"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/lib/site-links";
import { cn } from "@/lib/utils";

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_featured?: boolean;
};

const CATEGORY_TABS = [
  "全部",
  "購物",
  "付款",
  "配送",
  "團購",
  "門市取貨",
  "會員",
  "發票載具",
  "App 訂單",
  "退換貨",
  "課程",
];

const CATEGORY_ALIAS: Record<string, string> = {
  order: "App 訂單",
  pickup: "門市取貨",
  product: "購物",
  payment: "付款",
  carrier: "發票載具",
  account: "會員",
  shipping: "配送",
  returns: "退換貨",
};

export default function FaqClient() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [featured, setFeatured] = useState<Faq[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(
    initialCat ? CATEGORY_ALIAS[initialCat] ?? initialCat : "全部"
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((d) => {
        setFaqs(d.faqs ?? []);
        setFeatured(d.featured ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = faqs;
    if (category !== "全部") list = list.filter((f) => f.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqs, search, category]);

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
        <h1 className="text-xl font-bold text-caramel">常見問題</h1>
        <Link href={APP_ROUTES.support} className="inline-flex items-center gap-1 text-sm text-caramel">
          聯絡客服 <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary" />
        <Input
          className="min-h-12 pl-10"
          placeholder="搜尋問題…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm",
              category === c ? "bg-primary text-white" : "border border-border bg-surface text-foreground-secondary"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {!loading && featured.length > 0 && category === "全部" && !search && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-medium text-caramel">熱門問題</h2>
          <div className="divide-y overflow-hidden rounded-[20px] bg-butter-soft/50 shadow-card">
            {featured.slice(0, 5).map((f) => (
              <button
                key={`hot-${f.id}`}
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setOpenId(openId === f.id ? null : f.id)}
              >
                <span className="text-sm font-medium text-foreground">{f.question}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition", openId === f.id && "rotate-180")} />
              </button>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <p className="text-center text-foreground-secondary">載入中…</p>
      ) : grouped.length === 0 ? (
        <div className="space-y-3 py-12 text-center">
          <p className="text-foreground-secondary">找不到相關問題</p>
          <Link
            href={APP_ROUTES.support}
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            聯絡客服取得協助
          </Link>
        </div>
      ) : (
        grouped.map(([cat, items]) => (
          <section key={cat}>
            <h2 className="mb-2 px-1 text-sm font-medium text-foreground-secondary">{cat}</h2>
            <div className="divide-y overflow-hidden rounded-[20px] bg-surface shadow-card">
              {items.map((f) => (
                <div key={f.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  >
                    <span className="font-medium text-foreground">{f.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-foreground-secondary transition",
                        openId === f.id && "rotate-180"
                      )}
                    />
                  </button>
                  {openId === f.id && (
                    <div className="whitespace-pre-wrap border-t px-4 pb-4 pt-2 text-sm leading-relaxed text-foreground-secondary">
                      {f.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
