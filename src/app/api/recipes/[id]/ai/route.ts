import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  answerRecipeStepQuestion,
  type StepAiContextInput,
} from "@/lib/ai/recipeStepAssistant";
import { rateLimit } from "@/lib/security/rateLimit";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/recipes/[id]/ai
 * Server-side only recipe step assistant. Never exposes API keys.
 */
export async function POST(request: Request, { params }: Params) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`recipe-ai:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const { id: recipeId } = await params;
  const body = await request.json();
  const question = String(body.question ?? body.prompt ?? "").trim();
  if (!question) return NextResponse.json({ error: "請輸入問題" }, { status: 400 });

  const stepId = body.step_id ? String(body.step_id) : null;
  const storyPageId = body.story_page_id ? String(body.story_page_id) : null;
  const sessionId = String(body.session_id ?? `recipe-${recipeId}-${Date.now()}`);
  const multiplier = Number(body.multiplier ?? 1) || 1;

  let ctx: StepAiContextInput = {
    recipeTitle: String(body.recipe_title ?? "食譜"),
    servings: body.servings ?? null,
    multiplier,
    stepNumber: Number(body.step_number ?? 1),
    stepTitle: body.step_title ?? null,
    stepContent: String(body.step_content ?? body.story_page_body ?? ""),
    chefNotes: body.chef_notes ?? null,
    safetyNotes: body.safety_notes ?? null,
    commonFailures: Array.isArray(body.common_failures) ? body.common_failures : [],
    recoveryActions: Array.isArray(body.recovery_actions) ? body.recovery_actions : [],
    prohibitedActions: Array.isArray(body.prohibited_actions) ? body.prohibited_actions : [],
    aiContext: body.ai_context ?? null,
    aiKeywords: Array.isArray(body.ai_keywords) ? body.ai_keywords.map(String) : [],
    ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
    tools: Array.isArray(body.tools) ? body.tools.map(String) : [],
    temperature: body.temperature ?? null,
    durationLabel: body.duration_label ?? null,
    mediaTimeSeconds: body.current_time_seconds != null ? Number(body.current_time_seconds) : null,
    markerTitle: body.marker_title ?? body.comparison_choice ?? null,
    markerAiContext: body.marker_ai_context ?? null,
    previousStepSummary: body.previous_step_summary ?? body.chapter_title ?? null,
    substitutionsNote: body.substitutions_note ?? null,
    ovenInfo: body.oven_info ?? null,
  };

  // Enrich from DB when configured
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: recipe } = await supabase
      .from("recipes")
      .select("id, title, servings, ai_enabled, status")
      .eq("id", recipeId)
      .eq("status", "published")
      .maybeSingle();

    if (!recipe) {
      return NextResponse.json({ error: "食譜不存在或未發布" }, { status: 404 });
    }
    if (recipe.ai_enabled === false) {
      return NextResponse.json({ error: "此食譜未啟用 AI" }, { status: 403 });
    }

    ctx.recipeTitle = recipe.title;
    ctx.servings = recipe.servings;

    if (storyPageId) {
      const { data: storyPage } = await supabase
        .from("recipe_story_pages")
        .select("*, recipe_story_chapters(title, chapter_number)")
        .eq("id", storyPageId)
        .eq("recipe_id", recipeId)
        .maybeSingle();
      if (storyPage) {
        const ch = storyPage.recipe_story_chapters as
          | { title?: string; chapter_number?: number }
          | null
          | undefined;
        ctx = {
          ...ctx,
          stepTitle: storyPage.title ?? ctx.stepTitle,
          stepContent: storyPage.body ?? ctx.stepContent,
          aiContext: [storyPage.ai_context, ctx.aiContext].filter(Boolean).join("\n") || null,
          previousStepSummary:
            ch?.title != null
              ? `章節 ${ch.chapter_number ?? ""} ${ch.title}`
              : ctx.previousStepSummary,
        };
        if (storyPage.step_id && !stepId) {
          // fall through to load step below via assigned id
          (body as { step_id?: string }).step_id = storyPage.step_id;
        }
      }
    }

    const resolvedStepId = body.step_id ? String(body.step_id) : stepId;
    if (resolvedStepId) {
      const { data: step } = await supabase
        .from("recipe_steps")
        .select(
          "*, recipe_step_ai_prompts(label, prompt, is_active, sort_order)"
        )
        .eq("id", resolvedStepId)
        .eq("recipe_id", recipeId)
        .maybeSingle();

      if (step) {
        if (step.ai_enabled === false && !storyPageId) {
          return NextResponse.json({ error: "此步驟未啟用 AI" }, { status: 403 });
        }
        ctx = {
          ...ctx,
          stepNumber: step.step_number,
          stepTitle: step.title ?? ctx.stepTitle,
          stepContent: step.description || ctx.stepContent,
          chefNotes: step.chef_notes ?? step.note ?? ctx.chefNotes,
          safetyNotes: step.safety_notes ?? ctx.safetyNotes,
          commonFailures: step.common_failures?.length ? step.common_failures : ctx.commonFailures,
          recoveryActions: step.recovery_actions?.length ? step.recovery_actions : ctx.recoveryActions,
          prohibitedActions: step.prohibited_actions?.length
            ? step.prohibited_actions
            : ctx.prohibitedActions,
          aiContext: [ctx.aiContext, step.ai_context].filter(Boolean).join("\n") || null,
          aiKeywords: step.ai_keywords?.length ? step.ai_keywords : ctx.aiKeywords,
          temperature:
            step.temperature_value != null
              ? `${step.temperature_value}${step.temperature_unit === "F" ? "°F" : "°C"}`
              : ctx.temperature,
          durationLabel: step.duration_seconds
            ? `${Math.round(step.duration_seconds / 60)} 分鐘`
            : ctx.durationLabel,
        };
      }
    }
  }

  const reply = answerRecipeStepQuestion(question, ctx);
  const auth = await getAuthUser();

  let conversationId: string | null = body.conversation_id
    ? String(body.conversation_id)
    : null;

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      if (!conversationId) {
        const { data: conv } = await admin
          .from("recipe_ai_conversations")
          .insert({
            recipe_id: recipeId,
            step_id: stepId,
            user_id: auth?.profile.id ?? null,
            session_id: sessionId,
            current_media_id: body.current_media_id || null,
            current_time_seconds: body.current_time_seconds ?? null,
            current_marker_id: body.current_marker_id || null,
            recipe_multiplier: multiplier,
            is_public: false,
          })
          .select("id")
          .single();
        conversationId = conv?.id ?? null;
      }

      if (conversationId) {
        await admin.from("recipe_ai_messages").insert([
          {
            conversation_id: conversationId,
            role: "user",
            content: question,
            metadata: {
              step_id: stepId,
              media: {
                media_id: body.current_media_id ?? null,
                time: body.current_time_seconds ?? null,
                marker_id: body.current_marker_id ?? null,
              },
            },
          },
          {
            conversation_id: conversationId,
            role: "assistant",
            content: reply.plainText,
            metadata: { structured: reply },
          },
        ]);
      }
    } catch {
      // logging optional — reply still returned
    }
  }

  return NextResponse.json({
    conversation_id: conversationId,
    session_id: sessionId,
    reply,
  });
}
