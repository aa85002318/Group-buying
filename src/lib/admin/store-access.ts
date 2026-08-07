import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";

type AuthLike = {
  profile: { id: string; role?: string | null };
};

/**
 * Resolve which store a store_staff user may operate on.
 * Admin may use preferred id or fall back to first active store.
 * Store staff is locked to their assigned store (preferred ignored if mismatched).
 */
export async function resolveOpsStoreId(
  auth: AuthLike,
  preferred?: string | null
): Promise<string | null> {
  const role = auth.profile.role ?? "store_staff";
  const preferredId = preferred?.trim() || null;

  if (role === "admin") {
    if (preferredId) return preferredId;
    const admin = createAdminClient();
    const { data } = await admin
      .from("stores")
      .select("id")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  }

  const staffStoreId = await getStaffStoreId(auth.profile.id);
  if (!staffStoreId) return null;
  if (preferredId && preferredId !== staffStoreId) return null;
  return staffStoreId;
}

/** Block store_staff from writing another store's operational data. */
export async function assertCanWriteStore(
  auth: AuthLike,
  storeId: string | null | undefined
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!storeId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "缺少門市" }, { status: 400 }),
    };
  }

  if ((auth.profile.role ?? "") === "admin") {
    return { ok: true };
  }

  const staffStoreId = await getStaffStoreId(auth.profile.id);
  if (!staffStoreId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "尚未綁定所屬門市，無法寫入分店資料" },
        { status: 403 }
      ),
    };
  }

  if (staffStoreId !== storeId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "不可修改其他分店的庫存或作業資料" },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}
