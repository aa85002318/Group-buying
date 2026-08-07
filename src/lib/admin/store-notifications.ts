import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";

type AdminClient = ReturnType<typeof createAdminClient>;

const MISSING_RE = /store_notifications|store_read_cursors|does not exist|schema cache/i;

export type StoreNotificationKind =
  | "restock_request"
  | "request_reply"
  | "message"
  | "customer_request"
  | "general";

export type StoreNotificationInput = {
  storeId: string;
  actorStoreId?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  kind: StoreNotificationKind;
  title: string;
  body?: string | null;
  href?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
};

export async function createStoreNotification(
  admin: AdminClient,
  input: StoreNotificationInput
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  if (!input.storeId || !input.title.trim()) return false;

  // Don't notify the same store about its own outbound request unless actor differs
  const { error } = await admin.from("store_notifications").insert({
    store_id: input.storeId,
    actor_store_id: input.actorStoreId ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_name: input.actorName ?? null,
    kind: input.kind,
    title: input.title.trim().slice(0, 200),
    body: input.body?.trim().slice(0, 1000) || null,
    href: input.href ?? null,
    resource_type: input.resourceType ?? null,
    resource_id: input.resourceId ?? null,
  });

  if (error) {
    if (MISSING_RE.test(error.message)) return false;
    console.error("createStoreNotification:", error.message);
    return false;
  }
  return true;
}

export async function getMessageUnreadCount(
  admin: AdminClient,
  opts: { storeId: string; userId: string }
): Promise<number> {
  const { data: cursor } = await admin
    .from("store_read_cursors")
    .select("last_read_at")
    .eq("user_id", opts.userId)
    .eq("store_id", opts.storeId)
    .eq("channel", "messages")
    .maybeSingle();

  let query = admin
    .from("store_messages")
    .select("id", { count: "exact", head: true })
    .eq("store_id", opts.storeId)
    .neq("author_id", opts.userId);

  if (cursor?.last_read_at) {
    query = query.gt("created_at", cursor.last_read_at);
  } else {
    // No cursor yet: only count today's messages from others
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
    query = query.gte("created_at", `${day}T00:00:00+08:00`);
  }

  const { count, error } = await query;
  if (error && MISSING_RE.test(error.message)) return 0;
  return count ?? 0;
}

export async function getNotificationUnreadCount(
  admin: AdminClient,
  storeId: string
): Promise<number> {
  const { count, error } = await admin
    .from("store_notifications")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("is_read", false);
  if (error) {
    if (MISSING_RE.test(error.message)) return 0;
    return 0;
  }
  return count ?? 0;
}

export async function markMessagesRead(
  admin: AdminClient,
  opts: { storeId: string; userId: string }
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await admin.from("store_read_cursors").upsert(
    {
      user_id: opts.userId,
      store_id: opts.storeId,
      channel: "messages",
      last_read_at: now,
    },
    { onConflict: "user_id,store_id,channel" }
  );
  if (error && !MISSING_RE.test(error.message)) {
    console.error("markMessagesRead:", error.message);
  }
}

export const STATUS_REPLY_LABEL: Record<string, string> = {
  approved: "可供應",
  partial: "部分供應",
  rejected: "無法供應",
  arranged: "已安排",
  handed_over: "已交接",
  fulfilled: "已完成",
  cancelled: "已取消",
  pending: "待確認",
};
