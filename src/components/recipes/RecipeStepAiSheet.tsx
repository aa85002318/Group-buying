"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import {
  buildStepPromptSuggestions,
  type StepAiStructuredReply,
} from "@/lib/ai/recipeStepAssistant";
import type { RecipePlaybackContext } from "@/lib/recipes/media";
import type { Recipe, RecipeIngredient, RecipeStep, RecipeTool } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type RecipeStepAiSheetProps = {
  open: boolean;
  onClose: () => void;
  recipe: Recipe;
  step: RecipeStep;
  multiplier: number;
  ingredients: RecipeIngredient[];
  tools: RecipeTool[];
  playbackCtx: RecipePlaybackContext | null;
  previousStepSummary?: string | null;
};

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
  structured?: StepAiStructuredReply;
};

function sessionKey(recipeId: string) {
  if (typeof window === "undefined") return `recipe-${recipeId}`;
  const key = `sgb_recipe_ai_session_${recipeId}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `recipe-${recipeId}-${Date.now()}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function RecipeStepAiSheet({
  open,
  onClose,
  recipe,
  step,
  multiplier,
  ingredients,
  tools,
  playbackCtx,
  previousStepSummary,
}: RecipeStepAiSheetProps) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  const suggestions = useMemo(() => buildStepPromptSuggestions(step), [step]);

  useEffect(() => {
    if (!open) return;
    setInput("");
    setError(null);
    setTurns([]);
    setConversationId(null);
  }, [open, step.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    setTurns((prev) => [...prev, { role: "user", text: q }]);
    setInput("");

    try {
      const stepIngs = ingredients.filter(
        (i) => !i.used_in_step_ids?.length || i.used_in_step_ids.includes(step.id)
      );
      const res = await fetch(`/api/recipes/${recipe.id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          step_id: step.id,
          conversation_id: conversationId,
          session_id: sessionKey(recipe.id),
          multiplier,
          recipe_title: recipe.title,
          servings: recipe.servings,
          step_number: step.step_number,
          step_title: step.title,
          step_content: step.description,
          chef_notes: step.chef_notes ?? step.note,
          safety_notes: step.safety_notes,
          common_failures: step.common_failures ?? [],
          recovery_actions: step.recovery_actions ?? [],
          prohibited_actions: step.prohibited_actions ?? [],
          ai_context: step.ai_context,
          ai_keywords: step.ai_keywords ?? [],
          ingredients: (stepIngs.length ? stepIngs : ingredients).map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
            quantity_numeric: i.quantity_numeric,
          })),
          tools: tools.map((t) => t.name),
          previous_step_summary: previousStepSummary,
          current_media_id: playbackCtx?.mediaId ?? null,
          current_time_seconds: playbackCtx?.currentTimeSeconds ?? null,
          current_marker_id: playbackCtx?.markerId ?? null,
          marker_title: playbackCtx?.markerTitle ?? null,
          marker_ai_context: playbackCtx?.markerAiContext ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "無法取得回覆");
      if (data.conversation_id) setConversationId(String(data.conversation_id));
      const reply = data.reply as StepAiStructuredReply;
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: reply.plainText, structured: reply },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "無法取得回覆");
      setTurns((prev) => prev.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="關閉" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="問這一步"
        className="relative z-10 flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#F2D8BF] px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-[#6B3F24]">
              <Sparkles className="h-4 w-4 text-[#FF8A3D]" />
              問這一步
            </p>
            <p className="mt-0.5 truncate text-xs text-foreground-secondary">
              Step {step.step_number}
              {step.title ? ` · ${step.title}` : ""}
              {playbackCtx?.markerTitle ? ` · ${playbackCtx.markerTitle}` : ""}
              {playbackCtx?.currentTimeSeconds != null
                ? ` · ${Math.floor(playbackCtx.currentTimeSeconds)}s`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6B3F24]"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {turns.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground-secondary">
                依本步驟老師設定、影片標記與烘焙知識庫回答。不會編造站外商品。
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled={busy}
                    onClick={() => ask(s.prompt)}
                    className="rounded-full border border-[#F2D8BF] bg-[#FFF9EA] px-3 py-1.5 text-left text-xs font-medium text-[#6B3F24] disabled:opacity-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {turns.map((t, i) => (
            <div
              key={`${t.role}-${i}`}
              className={cn(
                "rounded-2xl px-3 py-2.5 text-sm",
                t.role === "user"
                  ? "ml-8 bg-[#FF5A5F] text-white"
                  : "mr-4 border border-[#F2D8BF] bg-[#FFF9EA] text-[#6B3F24]"
              )}
            >
              {t.role === "assistant" && t.structured ? (
                <StructuredBlocks reply={t.structured} />
              ) : (
                <p className="whitespace-pre-wrap">{t.text}</p>
              )}
            </div>
          ))}

          {busy ? (
            <p className="flex items-center gap-2 text-xs text-foreground-secondary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              思考中…
            </p>
          ) : null}
          {error ? <p className="text-xs text-[#FF5A5F]">{error}</p> : null}
        </div>

        <form
          className="border-t border-[#F2D8BF] p-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：這一步怎麼判斷成功？"
              className="min-h-11 flex-1 rounded-2xl border border-[#F2D8BF] bg-white px-3 text-sm text-[#6B3F24] outline-none focus:border-[#FF5A5F]"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="min-h-11 rounded-2xl bg-[#FF5A5F] px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              送出
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StructuredBlocks({ reply }: { reply: StepAiStructuredReply }) {
  const blocks = [
    { title: "可能原因", items: reply.possibleCauses },
    { title: "現在先這樣做", items: reply.doNow },
    { title: "這一步不要做什麼", items: reply.doNot },
    { title: "下次如何避免", items: reply.nextTime },
  ];
  return (
    <div className="space-y-3">
      {blocks.map((b) =>
        b.items.length ? (
          <div key={b.title}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#FF8A3D]">{b.title}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
              {b.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}
