import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildProfileUpdates, isPhoneTaken } from "@/lib/services/profileService";

export async function GET() {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ profile: null }, { status: 401 });
  return NextResponse.json({ profile: auth.profile, user: { id: auth.user.id, email: auth.user.email } });
}

export async function PATCH(request: Request) {
  const auth = await getAuthUser();
  if (!auth) return NextResponse.json({ error: "未登入" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const parsed = buildProfileUpdates(body as Parameters<typeof buildProfileUpdates>[0]);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status ?? 400 });
  }

  const admin = createAdminClient();
  if (parsed.updates.phone) {
    const taken = await isPhoneTaken(admin, parsed.updates.phone, auth.user.id);
    if (taken) {
      return NextResponse.json({ error: "此手機號碼已被其他會員使用" }, { status: 409 });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.updates)
    .eq("id", auth.user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
