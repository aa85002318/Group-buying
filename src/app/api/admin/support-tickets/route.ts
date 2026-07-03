import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { error } = await requireRole(["admin", "store_staff"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (!isSupabaseConfigured()) {
    let tickets = [...mockStore.supportTickets];
    if (status) tickets = tickets.filter((t) => t.status === status);
    return NextResponse.json({ tickets });
  }

  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select("*, profiles(full_name, phone)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error: fetchError } = await query;
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json({ tickets: data });
}
