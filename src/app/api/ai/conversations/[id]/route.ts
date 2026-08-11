import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { aiError, aiOk } from "@/lib/ai/response";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, { params }: Ctx) {
  const { error, auth } = await requireAuth();
  if (error) return aiError("UNAUTHORIZED", "請先登入後再查看對話", { status: 401 });
  if (!isSupabaseConfigured()) return aiOk({ conversation: null, messages: [] });

  const admin = createAdminClient();
  const { data: conversation } = await admin
    .from("ai_conversations")
    .select("id, title, tool, updated_at, created_at")
    .eq("id", params.id)
    .eq("user_id", auth!.profile.id)
    .maybeSingle();
  if (!conversation) return aiError("NOT_FOUND", "找不到這則對話", { status: 404 });

  const { data: messages } = await admin
    .from("ai_messages")
    .select("id, role, content, payload, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return aiOk({ conversation, messages: messages ?? [] });
}
