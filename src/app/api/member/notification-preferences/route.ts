import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PREFS = {
  order_updates: true,
  pickup_reminders: true,
  new_products: true,
  closing_soon: true,
  livestreams: true,
  marketing: false,
};

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ preferences: DEFAULT_PREFS });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", auth!.profile.id)
    .maybeSingle();

  return NextResponse.json({ preferences: data ?? DEFAULT_PREFS });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ preferences: { ...DEFAULT_PREFS, ...body } });
  }

  const supabase = await createClient();
  const row = {
    user_id: auth!.profile.id,
    order_updates: body.order_updates ?? true,
    pickup_reminders: body.pickup_reminders ?? true,
    new_products: body.new_products ?? true,
    closing_soon: body.closing_soon ?? true,
    livestreams: body.livestreams ?? true,
    marketing: body.marketing ?? false,
  };

  const { data, error: upsertError } = await supabase
    .from("notification_preferences")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();

  if (upsertError) return NextResponse.json({ error: "儲存失敗" }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
