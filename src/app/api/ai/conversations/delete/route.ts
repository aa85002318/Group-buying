import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { aiError, aiOk } from "@/lib/ai/response";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) {
    return aiError("UNAUTHORIZED", "請先登入後再刪除對話", { status: 401 });
  }
  if (!isSupabaseConfigured()) return aiOk({ deleted: 0 });

  const body = await request.json().catch(() => ({}));
  const all = Boolean(body.all);
  const id = typeof body.id === "string" ? body.id : null;
  const admin = createAdminClient();

  if (all) {
    const { data } = await admin
      .from("ai_conversations")
      .delete()
      .eq("user_id", auth!.profile.id)
      .select("id");
    return aiOk({ deleted: data?.length ?? 0 });
  }

  if (!id) return aiError("VALIDATION", "缺少對話 id", { status: 400 });

  const { data: row } = await admin
    .from("ai_conversations")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.user_id !== auth!.profile.id) {
    return aiError("FORBIDDEN", "只能刪除自己的對話", { status: 403 });
  }
  await admin.from("ai_conversations").delete().eq("id", id);
  return aiOk({ deleted: 1 });
}
