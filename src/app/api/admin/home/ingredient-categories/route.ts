import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

function adminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  return createAdminClient();
}

function revalidate() {
  try {
    revalidatePath("/");
    revalidatePath("/api/home/ingredient-categories");
  } catch {/* non-critical */}
}

/* ── GET: list all (including disabled) ── */
export async function GET() {
  try {
    const admin = adminClient();
    const { data, error } = await admin
      .from("home_ingredient_categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/* ── POST: create ── */
export async function POST(req: NextRequest) {
  try {
    const admin = adminClient();
    const body = await req.json();
    const { data, error } = await admin
      .from("home_ingredient_categories")
      .insert({
        display_name: body.display_name ?? "新分類",
        category_id:  body.category_id  ?? null,
        desktop_icon: body.desktop_icon  ?? null,
        mobile_icon:  body.mobile_icon   ?? null,
        alt:          body.alt           ?? null,
        custom_url:   body.custom_url    ?? null,
        sort_order:   body.sort_order    ?? 99,
        enabled:      body.enabled       ?? true,
        badge:        body.badge         ?? null,
        icon_mode:    body.icon_mode     ?? "ip",
        start_at:     body.start_at      ?? null,
        end_at:       body.end_at        ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    revalidate();
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/* ── PUT: update one ── */
export async function PUT(req: NextRequest) {
  try {
    const admin = adminClient();
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { data, error } = await admin
      .from("home_ingredient_categories")
      .update({
        display_name: body.display_name,
        category_id:  body.category_id,
        desktop_icon: body.desktop_icon,
        mobile_icon:  body.mobile_icon,
        alt:          body.alt,
        custom_url:   body.custom_url,
        sort_order:   body.sort_order,
        enabled:      body.enabled,
        badge:        body.badge,
        icon_mode:    body.icon_mode,
        start_at:     body.start_at,
        end_at:       body.end_at,
        updated_at:   new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw error;
    revalidate();
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/* ── DELETE: remove one ── */
export async function DELETE(req: NextRequest) {
  try {
    const admin = adminClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await admin
      .from("home_ingredient_categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
    revalidate();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
