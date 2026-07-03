import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      reply: `感謝您的訊息：「${body.content}」。客服將盡快回覆您。`,
    });
  }

  const admin = createAdminClient();
  let conversationId = body.conversationId;

  if (!conversationId) {
    const { data: conv } = await admin
      .from("support_conversations")
      .insert({ user_id: auth!.profile.id })
      .select()
      .single();
    conversationId = conv?.id;
  }

  await admin.from("support_messages").insert({
    conversation_id: conversationId,
    sender_type: "user",
    sender_id: auth!.profile.id,
    content: body.content,
  });

  const reply =
    body.content.includes("訂單")
      ? "如需查詢訂單，請提供訂單編號，我們將協助您處理。"
      : "感謝您的訊息，客服人員將於營業時間內回覆。";

  await admin.from("support_messages").insert({
    conversation_id: conversationId,
    sender_type: "bot",
    content: reply,
  });

  return NextResponse.json({ reply, conversationId });
}
