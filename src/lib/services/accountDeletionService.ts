import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types/database";

const STAFF_ROLES: UserRole[] = ["admin", "store_staff"];

export function canSelfDeleteAccount(role: string | null | undefined): boolean {
  return !STAFF_ROLES.includes(role as UserRole);
}

/** Soft-delete: anonymize PII, disable profile, ban auth user. Orders kept for compliance. */
export async function deleteMemberAccount(userId: string, role: string | null | undefined) {
  if (!canSelfDeleteAccount(role)) {
    return {
      ok: false as const,
      status: 403,
      error: "門市／管理帳號請聯繫客服協助刪除，無法於前台自行刪除。",
    };
  }

  const admin = createAdminClient();
  const shortId = userId.replace(/-/g, "").slice(0, 12);
  const tombstoneEmail = `deleted-${shortId}@deleted.invalid`;
  const tombstoneMemberCode = `DEL-${shortId}`;

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: "已刪除帳號",
      email: tombstoneEmail,
      phone: null,
      birthday: null,
      avatar_url: null,
      member_code: tombstoneMemberCode,
      referrer_user_id: null,
      store_credit_balance: 0,
      is_active: false,
    })
    .eq("id", userId);

  if (profileError) {
    return { ok: false as const, status: 500, error: profileError.message };
  }

  await admin
    .from("orders")
    .update({
      customer_name: "已刪除帳號",
      customer_phone: null,
      customer_email: null,
    })
    .eq("user_id", userId);

  await admin.from("line_bindings").delete().eq("user_id", userId);
  await admin.from("carts").delete().eq("user_id", userId);
  await admin.from("user_notifications").delete().eq("user_id", userId);

  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    email: tombstoneEmail,
    ban_duration: "876600h",
    user_metadata: { account_deleted: true, deleted_at: new Date().toISOString() },
  });

  if (banError) {
    return {
      ok: false as const,
      status: 500,
      error: `帳號資料已匿名化，但停用登入失敗：${banError.message}。請聯繫客服確認。`,
    };
  }

  return { ok: true as const };
}
