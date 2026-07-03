import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockCategories } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ categories: mockCategories });
  }

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("product_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const category = {
      id: `cat-${Date.now()}`,
      name: body.name,
      slug: body.slug ?? body.name,
      sort_order: body.sort_order ?? 99,
      icon_emoji: body.icon_emoji ?? null,
      icon_url: body.icon_url ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCategories.push(category);
    return NextResponse.json({ category }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("product_categories")
    .insert({
      name: body.name,
      slug: body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-"),
      sort_order: body.sort_order ?? 99,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}
