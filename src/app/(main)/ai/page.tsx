"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { BrandIcon } from "@/components/brand/BrandIcon";

type Tab = "recipes" | "scale" | "oven" | "substitute" | "failure";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "recipes", label: "材料推薦" },
  { id: "scale", label: "份量換算" },
  { id: "oven", label: "烤箱換算" },
  { id: "substitute", label: "材料替代" },
  { id: "failure", label: "失敗分析" },
];

const SUGGESTED_INGREDIENTS = ["奶油", "雞蛋", "低粉", "牛奶", "糖", "中粉", "鮮奶油", "酵母"];

export default function AiBakingPage() {
  const [tab, setTab] = useState<Tab>("recipes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);

  // recipes
  const [ingredients, setIngredients] = useState<string[]>(["奶油", "雞蛋", "低粉", "牛奶"]);
  const [ingredientInput, setIngredientInput] = useState("");

  // scale
  const [fromServings, setFromServings] = useState("4");
  const [toServings, setToServings] = useState("12");
  const [scaleRows, setScaleRows] = useState([
    { name: "低粉", amount: 200, unit: "g" },
    { name: "奶油", amount: 100, unit: "g" },
    { name: "糖", amount: 80, unit: "g" },
    { name: "雞蛋", amount: 2, unit: "顆" },
  ]);

  // oven
  const [celsius, setCelsius] = useState("180");
  const [fromMode, setFromMode] = useState("上下火");
  const [toMode, setToMode] = useState("旋風");

  // substitute / failure
  const [subIngredient, setSubIngredient] = useState("奶油");
  const [symptom, setSymptom] = useState("餅乾太硬");

  const run = async (action: Tab, payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/baking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "分析失敗");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6 pb-8">
      <div className="rounded-[22px] bg-hero-gradient p-6 text-white shadow-lift">
        <div className="flex items-start gap-3">
          <BrandIcon name="articles" size="lg" className="bg-surface/20 text-white" />
          <div>
            <h1 className="text-2xl font-black">AI 烘焙助手</h1>
            <p className="mt-1 text-sm text-white/90">材料推薦 · 份量換算 · 烤箱換算 · 替代方案 · 失敗分析</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <Chip key={t.id} active={tab === t.id} onClick={() => { setTab(t.id); setResult(null); setError(null); }}>
            {t.label}
          </Chip>
        ))}
      </div>

      {tab === "recipes" && (
        <section className="card-surface space-y-4 p-5">
          <h2 className="font-bold text-foreground">我有這些材料</h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_INGREDIENTS.map((ing) => (
              <Chip
                key={ing}
                tone="secondary"
                active={ingredients.includes(ing)}
                onClick={() =>
                  setIngredients((prev) =>
                    prev.includes(ing) ? prev.filter((x) => x !== ing) : [...prev, ing]
                  )
                }
              >
                {ing}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              className="min-h-12"
              placeholder="自行輸入材料"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && ingredientInput.trim()) {
                  setIngredients((p) => [...p, ingredientInput.trim()]);
                  setIngredientInput("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!ingredientInput.trim()) return;
                setIngredients((p) => [...p, ingredientInput.trim()]);
                setIngredientInput("");
              }}
            >
              加入
            </Button>
          </div>
          <p className="text-sm text-foreground-secondary">已選：{ingredients.join("、") || "尚未選擇"}</p>
          <Button disabled={loading || ingredients.length === 0} onClick={() => run("recipes", { ingredients })}>
            {loading ? "分析中…" : "AI 推薦食譜"}
          </Button>
        </section>
      )}

      {tab === "scale" && (
        <section className="card-surface space-y-4 p-5">
          <h2 className="font-bold text-foreground">食譜份量換算</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm">原份量（人）</label>
              <Input className="min-h-12" type="number" value={fromServings} onChange={(e) => setFromServings(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm">目標份量（人）</label>
              <Input className="min-h-12" type="number" value={toServings} onChange={(e) => setToServings(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            {scaleRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_60px] gap-2">
                <Input
                  value={row.name}
                  onChange={(e) => {
                    const next = [...scaleRows];
                    next[idx] = { ...row, name: e.target.value };
                    setScaleRows(next);
                  }}
                />
                <Input
                  type="number"
                  value={row.amount}
                  onChange={(e) => {
                    const next = [...scaleRows];
                    next[idx] = { ...row, amount: Number(e.target.value) };
                    setScaleRows(next);
                  }}
                />
                <Input
                  value={row.unit}
                  onChange={(e) => {
                    const next = [...scaleRows];
                    next[idx] = { ...row, unit: e.target.value };
                    setScaleRows(next);
                  }}
                />
              </div>
            ))}
          </div>
          <Button disabled={loading} onClick={() => run("scale", { fromServings: Number(fromServings), toServings: Number(toServings), ingredients: scaleRows })}>
            {loading ? "換算中…" : "開始換算"}
          </Button>
        </section>
      )}

      {tab === "oven" && (
        <section className="card-surface space-y-4 p-5">
          <h2 className="font-bold text-foreground">烤箱溫度換算</h2>
          <Input className="min-h-12" type="number" value={celsius} onChange={(e) => setCelsius(e.target.value)} placeholder="溫度 °C" />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field min-h-12" value={fromMode} onChange={(e) => setFromMode(e.target.value)}>
              {["上下火", "旋風", "瓦斯"].map((m) => <option key={m}>{m}</option>)}
            </select>
            <select className="input-field min-h-12" value={toMode} onChange={(e) => setToMode(e.target.value)}>
              {["上下火", "旋風", "瓦斯"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <Button disabled={loading} onClick={() => run("oven", { celsius: Number(celsius), from: fromMode, to: toMode })}>
            {loading ? "換算中…" : "換算溫度"}
          </Button>
        </section>
      )}

      {tab === "substitute" && (
        <section className="card-surface space-y-4 p-5">
          <h2 className="font-bold text-foreground">材料替代建議</h2>
          <Input className="min-h-12" value={subIngredient} onChange={(e) => setSubIngredient(e.target.value)} placeholder="例如：奶油" />
          <Button disabled={loading} onClick={() => run("substitute", { ingredient: subIngredient })}>
            {loading ? "分析中…" : "尋找替代"}
          </Button>
        </section>
      )}

      {tab === "failure" && (
        <section className="card-surface space-y-4 p-5">
          <h2 className="font-bold text-foreground">烘焙失敗分析</h2>
          <Input className="min-h-12" value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="例如：蛋糕消泡、麵包不起來" />
          <div className="flex flex-wrap gap-2">
            {["餅乾太硬", "蛋糕消泡", "麵包不起來", "中心未熟"].map((s) => (
              <Chip key={s} tone="warning" onClick={() => setSymptom(s)}>{s}</Chip>
            ))}
          </div>
          <Button disabled={loading} onClick={() => run("failure", { symptom })}>
            {loading ? "分析中…" : "分析原因"}
          </Button>
        </section>
      )}

      {error && <p className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">{error}</p>}

      {result != null && (
        <section className="card-surface space-y-3 p-5">
          <h2 className="font-bold text-foreground">分析結果</h2>
          <ResultView tab={tab} result={result} />
        </section>
      )}
    </div>
  );
}

function ResultView({ tab, result }: { tab: Tab; result: unknown }) {
  const data = result as Record<string, unknown>;

  if (tab === "recipes") {
    const recipes = (data.recipes as Array<Record<string, unknown>>) ?? [];
    if (!recipes.length) return <p className="text-sm text-foreground-secondary">找不到足夠匹配的食譜，試試加入更多材料。</p>;
    return (
      <div className="space-y-3">
        {recipes.map((r) => (
          <div key={String(r.id)} className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-price">{String(r.name)}</h3>
              <span className="text-xs font-bold text-foreground-secondary">{Math.round(Number(r.matchScore) * 100)}% 匹配</span>
            </div>
            <p className="mt-1 text-xs text-foreground-secondary">難度：{String(r.difficulty)}</p>
            {(r.missing as string[])?.length > 0 && (
              <p className="mt-2 text-sm">還缺：{(r.missing as string[]).join("、")}</p>
            )}
            <p className="mt-2 text-sm text-foreground">{String(r.tip)}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "scale") {
    const ingredients = (data.ingredients as Array<Record<string, unknown>>) ?? [];
    return (
      <ul className="space-y-2">
        {ingredients.map((i, idx) => (
          <li key={idx} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
            <span>{String(i.name)}</span>
            <span className="font-bold text-primary">{String(i.amount)} {String(i.unit)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "oven") {
    return (
      <div>
        <p className="text-3xl font-black text-price">{String(data.temp)}°C</p>
        <p className="mt-2 text-sm text-foreground-secondary">{String(data.note)}</p>
      </div>
    );
  }

  if (tab === "substitute") {
    const alts = (data.alternatives as Array<Record<string, string>>) ?? [];
    return (
      <div className="space-y-3">
        <p className="text-sm">針對「{String(data.ingredient)}」建議：</p>
        {alts.map((a, i) => (
          <div key={i} className="rounded-2xl border border-border p-3">
            <p className="font-bold text-foreground">{a.alt} <span className="text-xs font-medium text-primary">{a.ratio}</span></p>
            <p className="mt-1 text-sm text-foreground-secondary">{a.note}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-black text-price">{String(data.title)}</h3>
      <div>
        <p className="text-sm font-bold">可能原因</p>
        <ul className="mt-1 list-inside list-disc text-sm text-foreground-secondary">
          {((data.causes as string[]) ?? []).map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
      <div>
        <p className="text-sm font-bold">建議調整</p>
        <ul className="mt-1 list-inside list-disc text-sm text-foreground-secondary">
          {((data.fixes as string[]) ?? []).map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
    </div>
  );
}
