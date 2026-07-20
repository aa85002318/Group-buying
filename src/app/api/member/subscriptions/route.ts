import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

const DEFAULTS = {
  new_products: true,
  livestreams: true,
  courses: true,
  newsletter: false,
};

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ subscription: { ...DEFAULTS, email: auth!.user.email } });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("marketing_subscriptions")
    .select("*")
    .eq("user_id", auth!.profile.id)
    .maybeSingle();

  return NextResponse.json({
    subscription: data ?? { ...DEFAULTS, email: auth!.user.email, user_id: auth!.profile.id },
  });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ subscription: { ...DEFAULTS, ...body } });
  }

  const supabase = await createClient();
  const row = {
    user_id: auth!.profile.id,
    email: body.email ?? auth!.user.email ?? null,
    new_products: body.new_products ?? true,
    livestreams: body.livestreams ?? true,
    courses: body.courses ?? true,
    newsletter: body.newsletter ?? false,
  };

  const { data, error: upsertError } = await supabase
    .from("marketing_subscriptions")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  return NextResponse.json({ subscription: data });
}
