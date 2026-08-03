import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

/** List pending / recent branch restock requests */
export async function GET(request: Request) {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ requests: [] });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const admin = createAdminClient();

  let query = admin
    .from("store_requests")
    .select("*, products(id, name, sku)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);
  else query = query.in("status", ["pending", "approved"]);

  const { data, error: qError } = await query;
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

/** Approve / reject / fulfil a request */
export async function PATCH(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const reviewNote = (body.review_note as string | undefined)?.trim() || null;

  if (!id || !["approved", "rejected", "fulfilled", "cancelled", "pending"].includes(status)) {
    return NextResponse.json({ error: "無效參數" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ item: { id, status } });
  }

  const admin = createAdminClient();
  const { data: old } = await admin.from("store_requests").select("*").eq("id", id).single();
  const patch: Record<string, unknown> = { status };
  if (status === "approved" || status === "rejected" || status === "fulfilled") {
    patch.reviewed_by = auth!.profile.id;
    patch.reviewed_at = new Date().toISOString();
    if (reviewNote) patch.review_note = reviewNote;
  }

  const { data, error: uError } = await admin
    .from("store_requests")
    .update(patch)
    .eq("id", id)
    .select("*, products(id, name, sku)")
    .single();
  if (uError) return NextResponse.json({ error: uError.message }, { status: 500 });

  await logAudit(auth!.profile.id, "update", "store_requests", id, old, data, request as never);
  return NextResponse.json({ item: data });
}
