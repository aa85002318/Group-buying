"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { AIEntryCard } from "@/components/consumer/AIEntryCard";
import { SectionHeader } from "@/components/consumer/SectionHeader";
import type { AIRecommendation } from "@/lib/consumer-hub";
import { mockPantryRecipes, mockPickProduct } from "@/lib/mock/consumer-hub";

const COMMON = ["奶油", "雞蛋", "低粉", "高筋", "牛奶", "糖", "鮮奶油", "酵母", "巧克力"];

export function AiToolsClient() {
  const [goal, setGoal] = useState("杯子蛋糕");
  const [experience, setExperience] = useState("初學");
  const [budget, setBudget] = useState("中階");
  const [ingredients, setIngredients] = useState<string[]>(["奶油", "雞蛋", "低粉"]);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickResults, setPickResults] = useState<AIRecommendation[]>([]);
  const [pantryResults, setPantryResults] = useState<AIRecommendation[]>([]);

  const runPick = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setPickResults(mockPickProduct({ goal, experience, budget }));
    setLoading(false);
  };

  const runPantry = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setPantryResults(mockPantryRecipes(ingredients));
    setLoading(false);
  };

  const toggleIng = (name: string) => {
    setIngredients((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-8 page-enter">
      <header>
        <h1 className="text-2xl font-black text-foreground">AI 烘焙助手</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          第一階段為 UI + rules-based fallback（無付費 API）。進階工具見既有{" "}
          <Link href="/ai" className="font-bold text-primary">
            /ai
          </Link>
          。
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <AIEntryCard
          title="不知道怎麼挑產品"
          description="依目標、經驗與預算給建議"
          href="#pick-product"
        />
        <AIEntryCard
          title="手上的食材能做什麼"
          description="勾選材料找出可做甜點"
          href="#pantry"
        />
      </div>

      <section id="pick-product" className="card-surface space-y-4 p-5 scroll-mt-28">
        <SectionHeader title="1. 不知道怎麼挑產品" accentClass="bg-primary" />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-bold text-foreground">
            想做什麼
            <Input className="mt-1" value={goal} onChange={(e) => setGoal(e.target.value)} />
          </label>
          <label className="text-sm font-bold text-foreground">
            烘焙經驗
            <Input
              className="mt-1"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            />
          </label>
          <label className="text-sm font-bold text-foreground">
            預算
            <Input className="mt-1" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </label>
        </div>
        <Button onClick={() => void runPick()} loading={loading}>
          產生推薦
        </Button>
        <ResultList items={pickResults} empty="填寫後按下產生推薦" />
      </section>

      <section id="pantry" className="card-surface space-y-4 p-5 scroll-mt-28">
        <SectionHeader title="2. 手上的食材能做什麼" accentClass="bg-info" />
        <div className="flex flex-wrap gap-2">
          {COMMON.map((name) => (
            <Chip
              key={name}
              tone="primary"
              active={ingredients.includes(name)}
              onClick={() => toggleIng(name)}
            >
              {name}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="自訂新增食材"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => {
              const v = custom.trim();
              if (!v) return;
              setIngredients((p) => (p.includes(v) ? p : [...p, v]));
              setCustom("");
            }}
          >
            新增
          </Button>
        </div>
        <Button variant="groupBuy" onClick={() => void runPantry()} loading={loading}>
          找出可做甜點
        </Button>
        <ResultList items={pantryResults} empty="勾選食材後產生結果" />
      </section>
    </div>
  );
}

function ResultList({
  items,
  empty,
}: {
  items: AIRecommendation[];
  empty: string;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl bg-surface-soft p-4 text-sm text-foreground-secondary">
        {empty}
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="font-black text-foreground">{item.title}</h3>
          <p className="mt-1 text-sm text-foreground-secondary">{item.reason}</p>
          {item.notes && (
            <p className="mt-2 text-xs text-foreground-secondary">{item.notes}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {item.href && (
              <Link href={item.href} className="text-sm font-bold text-primary">
                查看相關入口 →
              </Link>
            )}
            <span className="text-xs text-foreground-secondary">
              預留：加入購物車／缺少材料一鍵購買
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
