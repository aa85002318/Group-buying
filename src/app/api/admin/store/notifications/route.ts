import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMessageUnreadCount,
  getNotificationUnreadCount,
  markMessagesRead,
} from "@/lib/admin/store-notifications";

export const dynamic = "force-dynamic";

const MISSING_RE = /store_notifications|store_read_cursors|does not exist|schema cache/i;

async function resolveStoreId(
  admin: ReturnType<typeof createAdminClient>,
  preferred?: string | null
) {
  if (preferred) return preferred;
  const { data } = await admin
    .from("stores")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/** GET — list notifications + unread counts */
export async function GET(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      items: [],
      unread: { notifications: 0, messages: 0, total: 0 },
    });
  }

  const url = new URL(request.url);
  const countsOnly = url.searchParams.get("counts") === "1";
  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, url.searchParams.get("store_id"));
  if (!storeId) {
    return NextResponse.json({
      items: [],
      unread: { notifications: 0, messages: 0, total: 0 },
    });
  }

  const userId = auth!.profile.id;
  const [notificationsUnread, messagesUnread] = await Promise.all([
    getNotificationUnreadCount(admin, storeId),
    getMessageUnreadCount(admin, { storeId, userId }),
  ]);

  const unread = {
    notifications: notificationsUnread,
    messages: messagesUnread,
    total: notificationsUnread + messagesUnread,
  };

  if (countsOnly) {
    return NextResponse.json({ unread, store_id: storeId });
  }

  const { data, error: fetchError } = await admin
    .from("store_notifications")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (fetchError) {
    if (MISSING_RE.test(fetchError.message)) {
      return NextResponse.json({
        items: [],
        unread,
        store_id: storeId,
        warning: "跨店通知表尚未就緒，請套用 migration",
      });
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    unread,
    store_id: storeId,
  });
}

/**
 * PATCH
 * - { action: "mark_read", id } — single notification
 * - { action: "mark_all_read" } — all notifications for store
 * - { action: "mark_messages_read" } — update message cursor
 */
export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "").trim();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const storeId = await resolveStoreId(admin, body.store_id);
  if (!storeId) return NextResponse.json({ error: "找不到門市" }, { status: 400 });

  const userId = auth!.profile.id;
  const now = new Date().toISOString();

  try {
    if (action === "mark_messages_read") {
      await markMessagesRead(admin, { storeId, userId });
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_all_read") {
      const { error: updErr } = await admin
        .from("store_notifications")
        .update({ is_read: true, read_at: now, read_by: userId })
        .eq("store_id", storeId)
        .eq("is_read", false);
      if (updErr && !MISSING_RE.test(updErr.message)) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      await logAudit(
        userId,
        "mark_all_read",
        "store_notifications",
        storeId,
        null,
        { store_id: storeId },
        request as never
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_read") {
      const id = String(body.id ?? "").trim();
      if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
      const { error: updErr } = await admin
        .from("store_notifications")
        .update({ is_read: true, read_at: now, read_by: userId })
        .eq("id", id)
        .eq("store_id", storeId);
      if (updErr && !MISSING_RE.test(updErr.message)) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "未知 action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "操作失敗" },
      { status: 500 }
    );
  }
}
