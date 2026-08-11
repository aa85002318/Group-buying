import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAISettings, saveAISettings } from "@/lib/ai/settings";
import { getAIAdminStats } from "@/lib/ai/analytics";
import { DEFAULT_AI_SETTINGS } from "@/lib/ai/types";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await getAISettings();
  const stats = await getAIAdminStats();
  return NextResponse.json({ settings, stats });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAdmin();
  if (error) return error;
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  const keys = [
    "enabled",
    "maintenance",
    "guestDailyLimit",
    "memberDailyLimit",
    "adminDailyLimit",
    "maxInputChars",
    "maxImageBytes",
    "conversationRetentionDays",
    "replyMaxTokens",
    "systemPromptVersion",
    "disclaimer",
    "sensitiveRules",
    "saveConversationsDefault",
    "toolLimits",
  ] as const;
  for (const key of keys) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (patch.guestDailyLimit != null) patch.guestDailyLimit = Number(patch.guestDailyLimit);
  if (patch.memberDailyLimit != null) patch.memberDailyLimit = Number(patch.memberDailyLimit);
  if (patch.adminDailyLimit != null) patch.adminDailyLimit = Number(patch.adminDailyLimit);
  if (patch.maxInputChars != null) patch.maxInputChars = Number(patch.maxInputChars);
  if (patch.conversationRetentionDays != null) {
    patch.conversationRetentionDays = Number(patch.conversationRetentionDays);
  }
  const settings = await saveAISettings(
    { ...DEFAULT_AI_SETTINGS, ...(await getAISettings()), ...patch },
    auth!.profile.id
  );
  return NextResponse.json({ settings });
}
