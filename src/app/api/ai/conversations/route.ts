import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { aiError, aiOk } from "@/lib/ai/response";

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return aiError("UNAUTHORIZED", "請先登入後再查看對話", { status: 401 });
  if (!isSupabaseConfigured()) return aiOk({ conversations: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_conversations")
    .select("id, title, tool, updated_at, created_at")
    .eq("user_id", auth!.profile.id)
    .order("updated_at", { ascending: false })
    .limit(40);

  return aiOk({ conversations: data ?? [] });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return aiError("UNAUTHORIZED", "請先登入", { status: 401 });
  if (!isSupabaseConfigured()) return aiOk({ updated: false });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : null;
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";
  if (!id || !title) return aiError("VALIDATION", "請提供對話與名稱", { status: 400 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth!.profile.id)
    .select("id")
    .maybeSingle();
  if (!data) return aiError("FORBIDDEN", "只能修改自己的對話", { status: 403 });
  return aiOk({ updated: true });
}
