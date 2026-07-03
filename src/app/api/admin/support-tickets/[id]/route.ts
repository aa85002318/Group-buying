import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, auth } = await requireRole(["admin", "store_staff"]);
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  if (!isSupabaseConfigured()) {
    const ticket = mockStore.supportTickets.find((t) => t.id === id);
    if (!ticket) return NextResponse.json({ error: "工單不存在" }, { status: 404 });
    Object.assign(ticket, body);
    ticket.updated_at = new Date().toISOString();
    return NextResponse.json({ ticket });
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = { ...body };
  if (body.status === "resolved") payload.resolved_at = new Date().toISOString();

  const { data, error: updateError } = await admin
    .from("support_tickets")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: "工單不存在" }, { status: 404 });
  await logAudit(auth!.profile.id, "update_support_ticket", "support_ticket", id, null, data);
  return NextResponse.json({ ticket: data });
}
