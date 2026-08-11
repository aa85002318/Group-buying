"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { AiHeroSection } from "@/components/ai/AiHeroSection";
import { useCart } from "@/hooks/useCart";
import { APP_ROUTES } from "@/lib/site-links";
import { AI_DISCLAIMER } from "@/lib/ai/types";

type Tab = "recipes" | "scale" | "oven" | "substitute" | "failure";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "recipes", label: "材料推薦" },
  { id: "scale", label: "份量換算" },
  { id: "oven", label: "烤箱換算" },
  { id: "substitute", label: "材料替代" },
  { id: "failure", label: "失敗分析" },
];

const SUGGESTED_INGREDIENTS = ["奶油", "雞蛋", "低筋麵粉", "牛奶", "糖", "中筋麵粉", "鮮奶油", "酵母"];
const OVEN_TYPES = ["家用小烤箱", "上下火烤箱", "旋風烤箱", "對流烤箱", "商用烤箱", "氣炸鍋"];
const SUB_REASONS = ["材料不足", "過敏", "素食", "無麩質", "降糖", "降油", "無乳製品"];
const FAILURE_TAGS = [
  "蛋糕塌陷",
  "未熟",
  "表面開裂",
  "麵包發不起來",
  "餅乾攤平",
  "油水分離",
  "奶油霜失敗",
  "上色不均",
  "成品過乾",
  "成品過硬",
];

const DISCLAIMER_KEY = "chimeidiy-ai-disclaimer-v1";

type Usage = { used: number; remaining: number; resetAt: string };
type ProductCard = {
  id: string;
  name: string;
  href: string;
  image: string | null;
  spec: string | null;
  price: number;
  stock: number;
  inStock: boolean;
};

function AiBakingPageInner() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("recipes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; title: string | null; tool?: string | null; updated_at: string }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [saveHistory, setSaveHistory] = useState(true);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<string[]>(["奶油", "雞蛋", "低筋麵粉", "牛奶"]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [promptHint, setPromptHint] = useState<string | null>(null);

  const [fromServings, setFromServings] = useState("4");
  const [toServings, setToServings] = useState("12");
  const [fromPan, setFromPan] = useState("8吋圓模");
  const [toPan, setToPan] = useState("6吋圓模");
  const [scaleRows, setScaleRows] = useState([
    { name: "低筋麵粉", amount: 200, unit: "g" },
    { name: "奶油", amount: 100, unit: "g" },
    { name: "糖", amount: 80, unit: "g" },
    { name: "雞蛋", amount: 2, unit: "顆" },
  ]);

  const [celsius, setCelsius] = useState("180");
  const [minutes, setMinutes] = useState("25");
  const [fromMode, setFromMode] = useState("上下火烤箱");
  const [toMode, setToMode] = useState("旋風烤箱");
  const [ovenItem, setOvenItem] = useState("磅蛋糕");
  const [ovenPan, setOvenPan] = useState("8吋圓模");

  const [subIngredient, setSubIngredient] = useState("奶油");
  const [subReason, setSubReason] = useState("材料不足");
  const [recipeType, setRecipeType] = useState("蛋糕");

  const [item, setItem] = useState("戚風蛋糕");
  const [formula, setFormula] = useState("");
  const [steps, setSteps] = useState("");
  const [failTemp, setFailTemp] = useState("170");
  const [failTime, setFailTime] = useState("40");
  const [failPan, setFailPan] = useState("8吋活動模");
  const [symptom, setSymptom] = useState("蛋糕塌陷");

  const [confirmProducts, setConfirmProducts] = useState<ProductCard[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(DISCLAIMER_KEY)) setShowDisclaimer(true);
  }, []);

  useEffect(() => {
    fetch("/api/ai/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d?.data) setUsage(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (!q) return;
    setPromptHint(q);
    setTab("recipes");
    setIngredientInput(q);
    const seeds = SUGGESTED_INGREDIENTS.filter((token) => q.includes(token));
    if (seeds.length) setIngredients(seeds);
  }, [searchParams]);

  const loadHistory = async () => {
    const res = await fetch("/api/ai/conversations");
    const d = await res.json().catch(() => ({}));
    setHistory(d?.data?.conversations ?? []);
  };

  const continueConversation = async (id: string) => {
    const res = await fetch(`/api/ai/conversations/${id}`);
    const json = await res.json().catch(() => ({}));
    if (!json.success) {
      setError(json.error?.message ?? "無法載入對話");
      return;
    }
    const conv = json.data.conversation as { id: string; tool?: string };
    const messages = (json.data.messages ?? []) as Array<{ role: string; payload?: Record<string, unknown> }>;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastAssist = [...messages].reverse().find((m) => m.role === "assistant");
    const nextTab = (["recipes", "scale", "oven", "substitute", "failure"] as Tab[]).includes(
      conv.tool as Tab
    )
      ? (conv.tool as Tab)
      : "recipes";
    setConversationId(conv.id);
    setTab(nextTab);
    restorePayload(lastUser?.payload ?? {}, nextTab, {
      setIngredients,
      setFromServings,
      setToServings,
      setFromPan,
      setToPan,
      setScaleRows,
      setCelsius,
      setMinutes,
      setFromMode,
      setToMode,
      setOvenItem,
      setOvenPan,
      setSubIngredient,
      setSubReason,
      setRecipeType,
      setItem,
      setFormula,
      setSteps,
      setFailTemp,
      setFailTime,
      setFailPan,
      setSymptom,
    });
    setResult(lastAssist?.payload ?? null);
    setError(null);
    setHistoryOpen(false);
  };

  const uploadPhoto = async (file: File) => {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/ai/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.success) {
        setPhotoError(json.error?.message ?? "圖片上傳失敗");
        return;
      }
      setPhotoPath(String(json.data.path));
      setPhotoPreview(json.data.previewUrl ?? null);
    } catch {
      setPhotoError("圖片上傳失敗，請改以文字描述。");
    } finally {
      setPhotoBusy(false);
    }
  };

  const run = async (action: Tab, payload: Record<string, unknown>, isRetry = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setRetryable(false);
    if (!isRetry) setResult(null);
    const body = {
      tool: action,
      ...payload,
      conversationId,
      save: saveHistory,
    };
    setLastPayload(body);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.usage) setUsage(json.usage);
      if (!json.success) {
        setError(json.error?.message ?? "分析失敗");
        setRetryable(Boolean(json.error?.retryable) || json.error?.code === "TIMEOUT");
        return;
      }
      setResult(json.data);
      if (json.data?.conversationId) setConversationId(String(json.data.conversationId));
    } catch {
      setError("網路中斷，請確認連線後再試。");
      setRetryable(true);
    } finally {
      setLoading(false);
    }
  };

  const acceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "1");
    setShowDisclaimer(false);
  };

  const remainingLabel = useMemo(() => {
    if (!usage) return null;
    if (usage.remaining <= 0) return "今天的AI使用次數已用完，明天可以繼續使用。";
    return `今日剩餘 ${usage.remaining} 次，將於明日 00:00 重置`;
  }, [usage]);

  return (
    <div className="ai-hub space-y-0 bg-white">
      <div className="w-full max-w-none bg-[#FDE045]">
        <AiHeroSection />
      </div>

      <div className="mx-auto w-full max-w-[720px] space-y-6 bg-white px-4 py-6 md:px-6 md:py-8">
        <div>
          <h1 className="text-xl font-black text-[#153E73]">AI 烘焙助手</h1>
          <p className="mt-1 text-sm text-[#687386]">
            材料推薦 · 份量換算 · 烤箱換算 · 替代方案 · 失敗分析
          </p>
          {remainingLabel ? (
            <p className="mt-2 text-sm font-medium text-[#153E73]">{remainingLabel}</p>
          ) : null}
          {promptHint ? (
            <p className="mt-3 rounded-xl bg-[#FFF7E3] px-3 py-2 text-sm text-[#153E73]">
              來自提問：{promptHint}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="text-sm text-[#153E73] underline"
              onClick={() => {
                setHistoryOpen((v) => !v);
                void loadHistory();
              }}
            >
              {historyOpen ? "關閉歷史對話" : "查看歷史對話"}
            </button>
            <button
              type="button"
              className="text-sm text-[#153E73] underline"
              onClick={() => {
                setConversationId(null);
                setResult(null);
                setError(null);
              }}
            >
              新對話
            </button>
            <label className="flex min-h-11 items-center gap-2 text-sm text-[#687386]">
              <input
                type="checkbox"
                checked={saveHistory}
                onChange={(e) => setSaveHistory(e.target.checked)}
              />
              保存對話紀錄
            </label>
          </div>
          {conversationId ? (
            <p className="mt-1 text-xs text-[#8A94A6]">正在繼續先前對話</p>
          ) : null}
        </div>

        {historyOpen ? (
          <section className="card-surface space-y-2 p-4">
            {history.length === 0 ? (
              <p className="text-sm text-[#687386]">尚無對話，或請先登入後查看。</p>
            ) : (
              history.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F8FA] px-3 py-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                    onClick={() => void continueConversation(c.id)}
                  >
                    {c.title || "未命名對話"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-[#153E73] underline"
                      onClick={() => void continueConversation(c.id)}
                    >
                      繼續提問
                    </button>
                    <button
                      type="button"
                      className="text-xs text-[#153E73] underline"
                      onClick={async () => {
                        const title = window.prompt("重新命名對話", c.title ?? "");
                        if (!title) return;
                        await fetch("/api/ai/conversations", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: c.id, title }),
                        });
                        void loadHistory();
                      }}
                    >
                      重新命名
                    </button>
                    <button
                      type="button"
                      className="text-xs text-[#C0392B] underline"
                      onClick={async () => {
                        if (!window.confirm("確定刪除此對話嗎？刪除後無法復原。")) return;
                        await fetch("/api/ai/conversations/delete", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: c.id }),
                        });
                        if (conversationId === c.id) {
                          setConversationId(null);
                          setResult(null);
                        }
                        void loadHistory();
                      }}
                    >
                      刪除
                    </button>
                  </div>
                </div>
              ))
            )}
            {history.length > 0 ? (
              <Button
                variant="secondary"
                className="min-h-11"
                onClick={async () => {
                  if (!window.confirm("確定刪除此對話嗎？刪除後無法復原。")) return;
                  await fetch("/api/ai/conversations/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ all: true }),
                  });
                  void loadHistory();
                }}
              >
                刪除全部對話
              </Button>
            ) : null}
          </section>
        ) : null}

        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <Chip
              key={t.id}
              active={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setResult(null);
                setError(null);
              }}
            >
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
                placeholder="例如：奶油、雞蛋、低筋麵粉、牛奶"
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
            <p className="text-sm text-foreground-secondary">
              已選：{ingredients.join("、") || "尚未選擇"}
            </p>
            <Button
              disabled={loading || ingredients.length === 0}
              onClick={() => run("recipes", { ingredients, text: ingredients.join("、") })}
            >
              {loading ? "分析中…" : "AI 推薦食譜"}
            </Button>
          </section>
        )}

        {tab === "scale" && (
          <section className="card-surface space-y-4 p-5">
            <h2 className="font-bold text-foreground">食譜份量換算</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="原始份量">
                <Input className="min-h-12" type="number" value={fromServings} onChange={(e) => setFromServings(e.target.value)} />
              </Field>
              <Field label="目標份量">
                <Input className="min-h-12" type="number" value={toServings} onChange={(e) => setToServings(e.target.value)} />
              </Field>
              <Field label="原始模具">
                <Input className="min-h-12" value={fromPan} onChange={(e) => setFromPan(e.target.value)} />
              </Field>
              <Field label="目標模具">
                <Input className="min-h-12" value={toPan} onChange={(e) => setToPan(e.target.value)} />
              </Field>
            </div>
            <div className="space-y-2">
              {scaleRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_60px] gap-2">
                  <Input value={row.name} onChange={(e) => {
                    const next = [...scaleRows];
                    next[idx] = { ...row, name: e.target.value };
                    setScaleRows(next);
                  }} />
                  <Input type="number" value={row.amount} onChange={(e) => {
                    const next = [...scaleRows];
                    next[idx] = { ...row, amount: Number(e.target.value) };
                    setScaleRows(next);
                  }} />
                  <Input value={row.unit} onChange={(e) => {
                    const next = [...scaleRows];
                    next[idx] = { ...row, unit: e.target.value };
                    setScaleRows(next);
                  }} />
                </div>
              ))}
            </div>
            <Button
              disabled={loading}
              onClick={() =>
                run("scale", {
                  fromServings: Number(fromServings),
                  toServings: Number(toServings),
                  fromPan,
                  toPan,
                  ingredients: scaleRows,
                  text: `${fromServings}→${toServings}`,
                })
              }
            >
              {loading ? "換算中…" : "開始換算"}
            </Button>
          </section>
        )}

        {tab === "oven" && (
          <section className="card-surface space-y-4 p-5">
            <h2 className="font-bold text-foreground">烤箱溫度換算</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="原食譜溫度 °C">
                <Input className="min-h-12" type="number" value={celsius} onChange={(e) => setCelsius(e.target.value)} />
              </Field>
              <Field label="烘烤時間（分）">
                <Input className="min-h-12" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
              </Field>
              <Field label="原烤箱類型">
                <select className="input-field min-h-12" value={fromMode} onChange={(e) => setFromMode(e.target.value)}>
                  {OVEN_TYPES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="我的烤箱">
                <select className="input-field min-h-12" value={toMode} onChange={(e) => setToMode(e.target.value)}>
                  {OVEN_TYPES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="烘焙品項">
                <Input className="min-h-12" value={ovenItem} onChange={(e) => setOvenItem(e.target.value)} />
              </Field>
              <Field label="模具尺寸">
                <Input className="min-h-12" value={ovenPan} onChange={(e) => setOvenPan(e.target.value)} />
              </Field>
            </div>
            <Button
              disabled={loading}
              onClick={() =>
                run("oven", {
                  celsius: Number(celsius),
                  minutes: Number(minutes),
                  from: fromMode,
                  to: toMode,
                  item: ovenItem,
                  pan: ovenPan,
                  text: `${ovenItem} ${celsius}°C`,
                })
              }
            >
              {loading ? "換算中…" : "換算溫度"}
            </Button>
          </section>
        )}

        {tab === "substitute" && (
          <section className="card-surface space-y-4 p-5">
            <h2 className="font-bold text-foreground">材料替代建議</h2>
            <Field label="原材料">
              <Input className="min-h-12" value={subIngredient} onChange={(e) => setSubIngredient(e.target.value)} />
            </Field>
            <Field label="替代原因">
              <select className="input-field min-h-12" value={subReason} onChange={(e) => setSubReason(e.target.value)}>
                {SUB_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="食譜類型">
              <Input className="min-h-12" value={recipeType} onChange={(e) => setRecipeType(e.target.value)} />
            </Field>
            <Button
              disabled={loading}
              onClick={() =>
                run("substitute", {
                  ingredient: subIngredient,
                  reason: subReason,
                  recipeType,
                  text: `${subIngredient} ${subReason}`,
                })
              }
            >
              {loading ? "分析中…" : "尋找替代"}
            </Button>
          </section>
        )}

        {tab === "failure" && (
          <section className="card-surface space-y-4 p-5">
            <h2 className="font-bold text-foreground">烘焙失敗分析</h2>
            <Field label="製作品項">
              <Input className="min-h-12" value={item} onChange={(e) => setItem(e.target.value)} />
            </Field>
            <Field label="使用配方">
              <Input className="min-h-12" value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="可貼上材料與克數" />
            </Field>
            <Field label="實際步驟">
              <Input className="min-h-12" value={steps} onChange={(e) => setSteps(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="烤箱溫度">
                <Input className="min-h-12" value={failTemp} onChange={(e) => setFailTemp(e.target.value)} />
              </Field>
              <Field label="時間（分）">
                <Input className="min-h-12" value={failTime} onChange={(e) => setFailTime(e.target.value)} />
              </Field>
            </div>
            <Field label="使用模具">
              <Input className="min-h-12" value={failPan} onChange={(e) => setFailPan(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {FAILURE_TAGS.map((s) => (
                <Chip key={s} tone="warning" active={symptom === s} onClick={() => setSymptom(s)}>
                  {s}
                </Chip>
              ))}
            </div>
            <Field label="失敗照片（選填）">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
              {photoBusy ? <p className="mt-1 text-xs text-[#687386]">上傳中…</p> : null}
              {photoError ? <p className="mt-1 text-xs text-error">{photoError}</p> : null}
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="失敗照片預覽" className="mt-2 h-28 rounded-xl object-cover" />
              ) : null}
              <p className="mt-1 text-xs text-[#8A94A6]">照片僅供分析、不會產生永久公開網址。</p>
            </Field>
            <Button
              disabled={loading}
              onClick={() =>
                run("failure", {
                  symptom,
                  item,
                  formula,
                  steps,
                  celsius: failTemp,
                  minutes: failTime,
                  pan: failPan,
                  photoPath,
                  text: `${item} ${symptom}`,
                })
              }
            >
              {loading ? "分析中…" : "分析原因"}
            </Button>
          </section>
        )}

        {error && (
          <div className="space-y-3 rounded-xl bg-error-soft px-4 py-3 text-sm text-error">
            <p>{error}</p>
            <div className="flex flex-wrap gap-2">
              {retryable && lastPayload ? (
                <Button disabled={loading} onClick={() => run(tab, lastPayload, true)}>
                  重新送出
                </Button>
              ) : null}
              <Link href={`${APP_ROUTES.recipes}?q=${encodeURIComponent(ingredientInput || symptom || "")}`} className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 text-[#153E73]">
                改用關鍵字搜尋食譜
              </Link>
              <Link href={APP_ROUTES.support} className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 text-[#153E73]">
                聯絡客服
              </Link>
            </div>
          </div>
        )}

        {result != null && (
          <section className="card-surface space-y-3 p-5">
            <h2 className="font-bold text-foreground">分析結果</h2>
            <ResultView
              tab={tab}
              result={result}
              onConfirmProducts={setConfirmProducts}
              onTrack={(eventType, label) => {
                void fetch("/api/ai/events", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventType, tool: tab, label }),
                });
              }}
            />
            <p className="text-xs leading-relaxed text-[#8A94A6]">{AI_DISCLAIMER}</p>
          </section>
        )}
      </div>

      {showDisclaimer ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-black text-[#153E73]">使用前請先了解</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#687386]">{AI_DISCLAIMER}</p>
            <Button className="mt-4 min-h-11 w-full" onClick={acceptDisclaimer}>
              我了解，開始使用
            </Button>
          </div>
        </div>
      ) : null}

      {confirmProducts ? (
        <ConfirmAddModal
          products={confirmProducts}
          onClose={() => setConfirmProducts(null)}
          onAdded={(names) => {
            void fetch("/api/ai/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventType: "add_to_cart", tool: tab, label: names.join("、") }),
            });
          }}
        />
      ) : null}
    </div>
  );
}

function restorePayload(
  payload: Record<string, unknown>,
  tab: Tab,
  setters: {
    setIngredients: (v: string[]) => void;
    setFromServings: (v: string) => void;
    setToServings: (v: string) => void;
    setFromPan: (v: string) => void;
    setToPan: (v: string) => void;
    setScaleRows: (v: Array<{ name: string; amount: number; unit: string }>) => void;
    setCelsius: (v: string) => void;
    setMinutes: (v: string) => void;
    setFromMode: (v: string) => void;
    setToMode: (v: string) => void;
    setOvenItem: (v: string) => void;
    setOvenPan: (v: string) => void;
    setSubIngredient: (v: string) => void;
    setSubReason: (v: string) => void;
    setRecipeType: (v: string) => void;
    setItem: (v: string) => void;
    setFormula: (v: string) => void;
    setSteps: (v: string) => void;
    setFailTemp: (v: string) => void;
    setFailTime: (v: string) => void;
    setFailPan: (v: string) => void;
    setSymptom: (v: string) => void;
  }
) {
  if (tab === "recipes" && Array.isArray(payload.ingredients)) {
    setters.setIngredients(payload.ingredients.map(String));
  }
  if (tab === "scale") {
    if (payload.fromServings != null) setters.setFromServings(String(payload.fromServings));
    if (payload.toServings != null) setters.setToServings(String(payload.toServings));
    if (payload.fromPan) setters.setFromPan(String(payload.fromPan));
    if (payload.toPan) setters.setToPan(String(payload.toPan));
    if (Array.isArray(payload.ingredients)) {
      setters.setScaleRows(
        payload.ingredients.map((row) => {
          const r = row as { name?: string; amount?: number; unit?: string };
          return { name: String(r.name ?? ""), amount: Number(r.amount ?? 0), unit: String(r.unit ?? "g") };
        })
      );
    }
  }
  if (tab === "oven") {
    if (payload.celsius != null) setters.setCelsius(String(payload.celsius));
    if (payload.minutes != null) setters.setMinutes(String(payload.minutes));
    if (payload.from) setters.setFromMode(String(payload.from));
    if (payload.to) setters.setToMode(String(payload.to));
    if (payload.item) setters.setOvenItem(String(payload.item));
    if (payload.pan) setters.setOvenPan(String(payload.pan));
  }
  if (tab === "substitute") {
    if (payload.ingredient) setters.setSubIngredient(String(payload.ingredient));
    if (payload.reason) setters.setSubReason(String(payload.reason));
    if (payload.recipeType) setters.setRecipeType(String(payload.recipeType));
  }
  if (tab === "failure") {
    if (payload.item) setters.setItem(String(payload.item));
    if (payload.formula) setters.setFormula(String(payload.formula));
    if (payload.steps) setters.setSteps(String(payload.steps));
    if (payload.celsius != null) setters.setFailTemp(String(payload.celsius));
    if (payload.minutes != null) setters.setFailTime(String(payload.minutes));
    if (payload.pan) setters.setFailPan(String(payload.pan));
    if (payload.symptom) setters.setSymptom(String(payload.symptom));
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      {children}
    </div>
  );
}

function ResultView({
  tab,
  result,
  onConfirmProducts,
  onTrack,
}: {
  tab: Tab;
  result: unknown;
  onConfirmProducts: (p: ProductCard[]) => void;
  onTrack: (eventType: "recipe_click" | "product_click" | "add_to_cart", label: string) => void;
}) {
  const data = result as Record<string, unknown>;
  const explain = typeof data.explain === "string" ? data.explain : null;

  if (tab === "recipes") {
    const recipes = (data.recipes as Array<Record<string, unknown>>) ?? [];
    const products = (data.products as ProductCard[]) ?? [];
    if (!recipes.length) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-foreground-secondary">
            {String(data.fallback ?? "找不到足夠匹配的正式食譜，試試加入更多材料或改用關鍵字搜尋。")}
          </p>
          <Link href={APP_ROUTES.recipes} className="text-sm font-semibold text-[#153E73] underline">
            前往食譜中心
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {recipes.map((r) => (
          <div key={String(r.id)} className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(r.image)} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-price">{String(r.name)}</h3>
                <p className="mt-1 text-xs text-foreground-secondary">
                  難度：{String(r.difficulty)}
                  {r.timeMinutes ? ` · ${String(r.timeMinutes)} 分鐘` : ""}
                  {r.servings ? ` · ${String(r.servings)}` : ""}
                </p>
                {(r.missing as string[])?.length > 0 && (
                  <p className="mt-2 text-sm">還缺：{(r.missing as string[]).join("、")}</p>
                )}
                <p className="mt-1 text-sm text-foreground">{String(r.reason ?? r.tip ?? "")}</p>
                <Link
                  href={String(r.href || APP_ROUTES.recipes)}
                  className="mt-2 inline-block text-sm font-semibold text-[#153E73] underline"
                  onClick={() => onTrack("recipe_click", String(r.name))}
                >
                  查看完整食譜
                </Link>
              </div>
            </div>
          </div>
        ))}
        <ProductList products={products} onConfirm={onConfirmProducts} onTrack={onTrack} />
        {explain ? <p className="text-sm text-[#687386]">{explain}</p> : null}
      </div>
    );
  }

  if (tab === "scale") {
    const ingredients = (data.ingredients as Array<Record<string, unknown>>) ?? [];
    return (
      <div className="space-y-3">
        <p className="text-sm">換算倍率：<strong>{String(data.factor)}</strong></p>
        {data.panRatio != null ? <p className="text-sm">模具容量比：{String(data.panRatio)}</p> : null}
        <ul className="space-y-2">
          {ingredients.map((i, idx) => (
            <li key={idx} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <span>{String(i.name)}</span>
              <span className="font-bold text-primary">
                {String(i.amount)} {String(i.unit)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm">{String(data.roundingNote ?? "")}</p>
        <p className="text-sm">{String(data.bakeTimeHint ?? "")}</p>
        <ul className="list-inside list-disc text-sm text-foreground-secondary">
          {((data.notes as string[]) ?? []).map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>
    );
  }

  if (tab === "oven") {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-3xl font-black text-price">{String(data.temp)}°C</p>
        {data.timeMin != null ? (
          <p>建議時間：{String(data.timeMin)}–{String(data.timeMax)} 分鐘</p>
        ) : null}
        <p>是否預熱：{data.preheat ? "建議預熱" : "可視情況預熱"}</p>
        <p>烤盤位置：{String(data.rack)}</p>
        <p>中途轉向：{data.rotate ? "建議轉向" : "通常不必"}</p>
        <p>上色觀察：{String(data.colorCheck)}</p>
        <p className="text-foreground-secondary">{String(data.note)}</p>
        {explain ? <p className="text-sm text-[#687386]">{explain}</p> : null}
      </div>
    );
  }

  if (tab === "substitute") {
    const alts = (data.alternatives as Array<Record<string, string>>) ?? [];
    const products = (data.products as ProductCard[]) ?? [];
    return (
      <div className="space-y-3">
        <p className="text-sm">針對「{String(data.ingredient)}／{String(data.reason)}」建議：</p>
        {alts.map((a, i) => (
          <div key={i} className="rounded-2xl border border-border p-3">
            <p className="font-bold text-foreground">
              {a.alt} <span className="text-xs font-medium text-primary">{a.ratio}</span>
            </p>
            <p className="mt-1 text-sm text-foreground-secondary">{a.note}</p>
          </div>
        ))}
        <p className="text-sm">需同步調整：{((data.adjustTogether as string[]) ?? []).join("、")}</p>
        {((data.warnings as string[]) ?? []).map((w) => (
          <p key={w} className="rounded-xl bg-[#FFF7E3] px-3 py-2 text-sm text-[#153E73]">{w}</p>
        ))}
        <ProductList products={products} onConfirm={onConfirmProducts} onTrack={onTrack} />
        {explain ? <p className="text-sm text-[#687386]">{explain}</p> : null}
      </div>
    );
  }

  const products = (data.products as ProductCard[]) ?? [];
  const recipes = (data.recipes as Array<Record<string, unknown>>) ?? [];
  return (
    <div className="space-y-3">
      <h3 className="font-black text-price">{String(data.title)}</h3>
      {data.photoNote ? <p className="text-sm text-[#687386]">{String(data.photoNote)}</p> : null}
      {explain ? <p className="text-sm text-[#687386]">{explain}</p> : null}
      {data.uncertain ? (
        <p className="rounded-xl bg-[#FFF7E3] px-3 py-2 text-sm">
          目前無法確定原因，請補充：{((data.needMore as string[]) ?? []).join("、")}
        </p>
      ) : null}
      <div>
        <p className="text-sm font-bold">最可能原因</p>
        <p className="text-sm">{String(data.primary ?? ((data.causes as string[]) ?? [])[0] ?? "—")}</p>
      </div>
      <div>
        <p className="text-sm font-bold">次要可能原因</p>
        <ul className="mt-1 list-inside list-disc text-sm text-foreground-secondary">
          {((data.secondary as string[]) ?? (data.causes as string[]) ?? []).slice(data.primary ? 0 : 1).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-sm font-bold">本次補救／下次修正</p>
        <ul className="mt-1 list-inside list-disc text-sm text-foreground-secondary">
          {((data.fixes as string[]) ?? []).map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>
      {recipes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-bold">建議參考食譜</p>
          {recipes.slice(0, 3).map((r) => (
            <Link key={String(r.id)} href={String(r.href)} className="block text-sm text-[#153E73] underline">
              {String(r.name)}
            </Link>
          ))}
        </div>
      ) : null}
      <ProductList products={products} onConfirm={onConfirmProducts} onTrack={onTrack} />
    </div>
  );
}

function ProductList({
  products,
  onConfirm,
  onTrack,
}: {
  products: ProductCard[];
  onConfirm: (p: ProductCard[]) => void;
  onTrack: (eventType: "recipe_click" | "product_click" | "add_to_cart", label: string) => void;
}) {
  if (!products.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-bold">可購買相關商品</p>
      {products.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-[#F3F4F6]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.name}</p>
            <p className="text-xs text-[#687386]">{p.spec || "標準規格"} · {p.inStock ? `庫存 ${p.stock}` : "補貨中"}</p>
            <p className="text-sm font-bold text-[#153E73]">NT$ {p.price}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Link href={p.href} className="text-xs underline" onClick={() => onTrack("product_click", p.name)}>查看商品</Link>
            {p.inStock ? (
              <button type="button" className="text-xs font-semibold text-[#C0392B]" onClick={() => onConfirm([p])}>
                加入購物車
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {products.filter((p) => p.inStock).length > 1 ? (
        <Button className="min-h-11 w-full" onClick={() => onConfirm(products.filter((p) => p.inStock))}>
          一鍵加入缺少材料
        </Button>
      ) : null}
    </div>
  );
}

function ConfirmAddModal({
  products,
  onClose,
  onAdded,
}: {
  products: ProductCard[];
  onClose: () => void;
  onAdded: (names: string[]) => void;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, 1]))
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const total = products.reduce((s, p) => s + p.price * (qty[p.id] ?? 1), 0);

  const confirm = async () => {
    setBusy(true);
    setMsg(null);
    let ok = 0;
    for (const p of products) {
      try {
        await addItem({
          productId: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.image,
          quantity: qty[p.id] ?? 1,
        });
        ok += 1;
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "加入失敗");
      }
    }
    setBusy(false);
    if (ok === products.length) {
      setMsg(`已加入 ${ok} 項，可前往購物車確認。`);
      onAdded(products.map((p) => p.name));
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5">
        <h2 className="text-lg font-black text-[#153E73]">確認加入購物車</h2>
        <p className="mt-1 text-xs text-[#687386]">AI 不會自動建立訂單，請確認商品、規格、數量與金額。</p>
        <ul className="mt-3 space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{p.name}{p.spec ? `（${p.spec}）` : ""}</span>
              <input
                type="number"
                min={1}
                className="input-field h-10 w-16"
                value={qty[p.id] ?? 1}
                onChange={(e) => setQty((q) => ({ ...q, [p.id]: Number(e.target.value) || 1 }))}
              />
              <span className="w-16 text-right font-semibold">{p.price * (qty[p.id] ?? 1)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right font-black text-[#153E73]">合計 NT$ {total}</p>
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="min-h-11 flex-1" onClick={onClose}>取消</Button>
          <Button className="min-h-11 flex-1" disabled={busy} onClick={confirm}>
            {busy ? "加入中…" : "確認加入"}
          </Button>
        </div>
        {msg?.includes("已加入") ? (
          <Link href={APP_ROUTES.cart} className="mt-3 block text-center text-sm underline">前往購物車</Link>
        ) : null}
      </div>
    </div>
  );
}

export default function AiBakingPage() {
  return (
    <Suspense fallback={<div className="page-enter p-6 text-sm text-muted-foreground">載入中…</div>}>
      <AiBakingPageInner />
    </Suspense>
  );
}
