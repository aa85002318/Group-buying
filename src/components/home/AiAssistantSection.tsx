"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import { Input } from "@/components/ui/input";
import { HomeSectionFrame } from "@/components/home/HomeSectionFrame";
import type { HomeAiPrompt } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type AiAssistantSectionProps = {
  title?: string;
  subtitle?: string | null;
  placeholder?: string;
  targetPath?: string;
  viewAllHref?: string;
  prompts?: HomeAiPrompt[];
  limit?: number;
  className?: string;
};

export function AiAssistantSection({
  title = "AI 烘焙助手",
  subtitle = "今天想做什麼？",
  placeholder = "輸入材料、問題或想做的甜點……",
  targetPath = "/ai",
  viewAllHref = "/ai",
  prompts: promptsProp,
  limit = 4,
  className,
}: AiAssistantSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [prompts, setPrompts] = useState<HomeAiPrompt[]>(promptsProp ?? []);
  const [loading, setLoading] = useState(!promptsProp);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = () => {
    if (promptsProp) return;
    setLoading(true);
    setError(null);
    fetch("/api/home/ai-prompts")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "載入失敗");
        setPrompts(d.prompts ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptsProp]);

  const navigate = (value: string) => {
    const q = value.trim();
    if (!q) return;
    const base = targetPath.replace(/\/$/, "");
    router.push(`${base}?q=${encodeURIComponent(q)}`);
  };

  const visiblePrompts = prompts.slice(0, limit);

  return (
    <section className={cn("space-y-4", className)} aria-label={title}>
      <SectionHeader title={title} href={viewAllHref} accentClass="bg-brand-primary" />
      {subtitle ? (
        <p className="-mt-2 text-sm text-foreground-secondary">{subtitle}</p>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(query);
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-h-12 flex-1 rounded-[16px] border-[#F2D8BF] bg-[#FFF9EA]"
          aria-label="AI 問題輸入"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-[16px] bg-[#FF5A5F] px-4 text-sm font-bold text-white transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          詢問
        </button>
      </form>

      <HomeSectionFrame
        loading={loading}
        error={error}
        onRetry={loadPrompts}
        empty={!loading && !error && visiblePrompts.length === 0}
        emptyTitle="尚無熱門提問"
        skeletonCount={3}
      >
        <ul className="flex flex-wrap gap-2">
          {visiblePrompts.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => navigate(p.prompt || p.label)}
                className="rounded-full border border-[#F2D8BF] bg-white px-3 py-1.5 text-xs font-medium text-[#6B3F24] transition hover:border-[#FF5A5F]/50 hover:text-[#FF5A5F]"
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </HomeSectionFrame>
    </section>
  );
}
