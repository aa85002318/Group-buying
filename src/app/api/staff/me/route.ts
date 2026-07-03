import { NextResponse } from "next/server";
import { requireStaffOrAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffStoreId } from "@/lib/services/pickupService";

export async function GET() {
  const { error, auth } = await requireStaffOrAdmin();
  if (error) return error;

  const { profile, user } = auth!;
  const role = profile.role;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      staff: {
        id: profile.id,
        full_name: profile.full_name,
        email: user.email,
        role,
        store: { id: "mock-store", name: "示範門市", address: "台北市" },
      },
    });
  }

  const storeId = await getStaffStoreId(profile.id);
  let store = null;
  if (storeId) {
    const admin = createAdminClient();
    const { data } = await admin.from("stores").select("id, name, address, phone").eq("id", storeId).maybeSingle();
    store = data;
  }

  return NextResponse.json({
    staff: {
      id: profile.id,
      full_name: profile.full_name,
      email: user.email ?? profile.email,
      role,
      store,
    },
  });
}
