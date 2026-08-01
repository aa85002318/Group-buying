import { NextResponse } from "next/server";
import { requireContentAdmin, logAudit } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/config";
import { DEFAULT_AI_CHIPS, mapAiChipRow } from "@/lib/shop/ai-assistant";

export const dynamic = "force-dynamic";

/** GET /api/admin/shop/ai-chips */
export async function GET() {
  const { error: authError } = await requireContentAdmin();
  if (authError) return authError;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ chips: DEFAULT_AI_CHIPS });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shop_ai_chips")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    chips: data?.length
      ? data.map((row) => mapAiChipRow(row as Record<string, unknown>))
      : DEFAULT_AI_CHIPS,
  });
}

/** POST /api/admin/shop/ai-chips */
export async function POST(request: Request) {
  const { error: authError, auth } = await requireContentAdmin();
  if (authError) return authError;

  const body = await request.json();
  const label = String(body.label ?? "").trim();
  if (!label) {
    return NextResponse.json({ error: "標籤必填" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { chip: { id: `mock-${Date.now()}`, label } },
      { status: 201 }
    );
  }

  const payload = {
    label,
    emoji: String(body.emoji ?? "✨").trim() || "✨",
    prompt: String(body.prompt ?? label).trim() || label,
    sort_order: Number(body.sort_order ?? 100) || 100,
    is_active: body.is_active !== false,
  };

  const admin = createAdminClient();
  const { data, error } = await admin.from("shop_ai_chips").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(auth!.profile.id, "create", "shop_ai_chip", data.id, null, data, request as never);
  return NextResponse.json({ chip: mapAiChipRow(data as Record<string, unknown>) }, { status: 201 });
}
