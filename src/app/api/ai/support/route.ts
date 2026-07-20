import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiSupportReply } from "@/lib/ai/bakingKnowledge";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`ai-support:${ip}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "請求過於頻繁，請稍後再試" }, { status: 429 });
  }

  const body = await request.json();
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "請輸入訊息" }, { status: 400 });

  const reply = aiSupportReply(content);
  const auth = await getAuthUser();

  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const sessionId = String(body.sessionId ?? `web-${Date.now()}`);
      await admin.from("ai_chat_logs").insert({
        user_id: auth?.profile.id ?? null,
        session_id: sessionId,
        role: "user",
        message: content,
      });
      await admin.from("ai_chat_logs").insert({
        user_id: auth?.profile.id ?? null,
        session_id: sessionId,
        role: "assistant",
        message: reply,
      });
    } catch {
      // optional logging
    }
  }

  return NextResponse.json({ reply });
}
