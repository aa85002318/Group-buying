import { analyzeFailure, suggestSubstitutions } from "@/lib/ai/bakingKnowledge";
import { scaleAmountText } from "@/lib/recipes/scaling";

export type StepAiContextInput = {
  recipeTitle: string;
  servings?: string | null;
  multiplier: number;
  stepNumber: number;
  stepTitle?: string | null;
  stepContent: string;
  chefNotes?: string | null;
  safetyNotes?: string | null;
  commonFailures?: unknown[];
  recoveryActions?: unknown[];
  prohibitedActions?: unknown[];
  aiContext?: string | null;
  aiKeywords?: string[];
  ingredients?: Array<{
    name: string;
    amount?: string | null;
    unit?: string | null;
    quantity_numeric?: number | null;
  }>;
  tools?: string[];
  temperature?: string | null;
  durationLabel?: string | null;
  mediaTimeSeconds?: number | null;
  markerTitle?: string | null;
  markerAiContext?: string | null;
  previousStepSummary?: string | null;
  substitutionsNote?: string | null;
  ovenInfo?: string | null;
};

export type StepAiStructuredReply = {
  possibleCauses: string[];
  doNow: string[];
  doNot: string[];
  nextTime: string[];
  plainText: string;
};

function asStringList(raw: unknown[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => (typeof x === "string" ? x : x && typeof x === "object" && "text" in x ? String((x as { text: unknown }).text) : null))
    .filter(Boolean) as string[];
}

/** Priority: teacher content → step AI settings → ingredients/ratio → user equipment → knowledge base */
export function answerRecipeStepQuestion(
  question: string,
  ctx: StepAiContextInput
): StepAiStructuredReply {
  const q = question.trim();
  const failures = asStringList(ctx.commonFailures);
  const recoveries = asStringList(ctx.recoveryActions);
  const prohibited = asStringList(ctx.prohibitedActions);

  const scaledIngredients =
    ctx.ingredients?.map((ing) => {
      const amt = scaleAmountText(ing.amount, ctx.multiplier, ing.quantity_numeric);
      return `${ing.name} ${[amt, ing.unit].filter(Boolean).join(" ")}`.trim();
    }) ?? [];

  // Teacher / step-specific knowledge first
  const matchedFailure = failures.find((f) => q.includes(f.slice(0, 4)) || f.includes(q.slice(0, 4)));
  const failureAnalysis = analyzeFailure(q);
  const subHit = /代替|替代|可以換成|沒有/.test(q)
    ? suggestSubstitutions(
        scaledIngredients.find((i) => q.includes(i.split(" ")[0] ?? ""))?.split(" ")[0] ??
          q.replace(/可以|嗎|呢|？|\?/g, "").trim()
      )
    : null;

  const possibleCauses: string[] = [];
  const doNow: string[] = [];
  const doNot: string[] = [...prohibited];
  const nextTime: string[] = [];

  if (ctx.aiContext?.trim()) {
    possibleCauses.push(`依本步驟老師設定：${ctx.aiContext.trim()}`);
  }
  if (ctx.markerAiContext?.trim()) {
    possibleCauses.push(`依目前影片標記「${ctx.markerTitle ?? "片段"}」：${ctx.markerAiContext.trim()}`);
  }
  if (matchedFailure) {
    possibleCauses.push(`本食譜常見狀況：${matchedFailure}`);
  }
  if (ctx.chefNotes?.trim()) {
    doNow.push(`先對照老師提醒：${ctx.chefNotes.trim()}`);
  }
  if (recoveries.length) {
    doNow.push(...recoveries.slice(0, 3));
  }

  // Knowledge base layer
  if (failureAnalysis.title !== "需要更多資訊") {
    possibleCauses.push(...failureAnalysis.causes.slice(0, 3));
    doNow.push(...failureAnalysis.fixes.slice(0, 3));
    nextTime.push(`避免再次出現「${failureAnalysis.title}」的操作誤差`);
  } else if (subHit) {
    possibleCauses.push(`你可能在尋找「${subHit.ingredient}」的替代方案`);
    doNow.push(
      ...subHit.alternatives.slice(0, 3).map((a) => `${a.alt}（${a.ratio}）— ${a.note}`)
    );
  } else if (!possibleCauses.length) {
    possibleCauses.push("可能與攪拌程度、溫度、時間或材料比例有關");
    doNow.push("先暫停繼續下一步，核對本步驟材料與溫度／時間");
    doNow.push(`回看步驟說明：${ctx.stepContent.slice(0, 80)}${ctx.stepContent.length > 80 ? "…" : ""}`);
  }

  if (ctx.safetyNotes?.trim()) {
    doNot.push(ctx.safetyNotes.trim());
  }
  if (!doNot.length) {
    doNot.push("不要一次大幅改變配方比例或烤箱溫度");
  }

  if (scaledIngredients.length) {
    nextTime.push(
      `確認倍率 ${ctx.multiplier} 倍後的材料：${scaledIngredients.slice(0, 4).join("、")}`
    );
  }
  if (ctx.temperature) nextTime.push(`記錄實際烤箱設定（建議參考 ${ctx.temperature}）`);
  if (ctx.ovenInfo?.trim()) nextTime.push(`依你的設備調整：${ctx.ovenInfo.trim()}`);
  if (!nextTime.length) {
    nextTime.push("下次先完成前置準備與材料秤重，再開始計時步驟");
  }

  const plainText = [
    `【可能原因】\n${possibleCauses.map((x) => `・${x}`).join("\n")}`,
    `【現在先這樣做】\n${doNow.map((x) => `・${x}`).join("\n")}`,
    `【這一步不要做什麼】\n${doNot.map((x) => `・${x}`).join("\n")}`,
    `【下次如何避免】\n${nextTime.map((x) => `・${x}`).join("\n")}`,
  ].join("\n\n");

  return { possibleCauses, doNow, doNot, nextTime, plainText };
}

export function buildStepPromptSuggestions(step: {
  recipe_step_ai_prompts?: Array<{ label: string; prompt: string; is_active?: boolean; sort_order?: number }>;
  ai_keywords?: string[];
  title?: string | null;
}): Array<{ label: string; prompt: string }> {
  const fromDb = [...(step.recipe_step_ai_prompts ?? [])]
    .filter((p) => p.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((p) => ({ label: p.label, prompt: p.prompt }));
  if (fromDb.length) return fromDb.slice(0, 6);

  const keywords = step.ai_keywords ?? [];
  if (keywords.length) {
    return keywords.slice(0, 4).map((k) => ({ label: k, prompt: k }));
  }

  const title = step.title ?? "這個步驟";
  return [
    { label: "這一步怎麼判斷成功？", prompt: `${title}要怎麼判斷已經完成？` },
    { label: "出現問題怎麼補救？", prompt: `${title}如果失敗了要怎麼補救？` },
    { label: "可以省略嗎？", prompt: `${title}可以跳過或縮短嗎？` },
    { label: "材料和比例對嗎？", prompt: `${title}使用的材料與比例需要注意什麼？` },
  ];
}
