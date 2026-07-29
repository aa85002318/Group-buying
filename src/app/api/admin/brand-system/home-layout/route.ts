import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";

export async function GET() {
  const { error } = await requireContentAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sections: [] });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("brand_home_sections")
    .select("*")
    .order("sort_order");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ sections: data ?? [] });
}

export async function PUT(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const sections = Array.isArray(body.sections) ? body.sections : null;
  if (!sections) {
    return NextResponse.json({ error: "缺少 sections" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sections });
  }

  const admin = createAdminClient();
  const results = [];

  for (const section of sections) {
    const id = String(section.id ?? "");
    if (!id) continue;

    const updates: Record<string, unknown> = {
      updated_by: auth!.profile.id,
      updated_at: new Date().toISOString(),
    };
    for (const key of [
      "title",
      "subtitle",
      "more_label",
      "more_href",
      "mobile_visible",
      "desktop_visible",
      "sort_order",
      "enabled",
      "settings",
    ]) {
      if (key in section) updates[key] = section[key];
    }

    const { data, error } = await admin
      .from("brand_home_sections")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    results.push(data);
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "brand_home_sections",
    "batch",
    null,
    { count: results.length },
    request as never
  );

  try {
    revalidateTag("brand-system");
    revalidatePath("/");
  } catch {
    // ignore
  }

  return NextResponse.json({ sections: results });
}
