import { NextResponse } from "next/server";
import { requireAuth, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const now = new Date().toISOString();

  const ticket = {
    id: `ticket-${Date.now()}`,
    user_id: auth!.profile.id,
    order_id: body.orderId ?? null,
    subject: body.subject,
    status: "open" as const,
    priority: (body.priority ?? "medium") as "low" | "medium" | "high",
    assigned_to: null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    mockStore.supportTickets.unshift(ticket);
    return NextResponse.json({ ticket }, { status: 201 });
  }

  const supabase = await createClient();
  const { data, error: insertError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: auth!.profile.id,
      order_id: body.orderId,
      subject: body.subject,
      description: body.description ?? body.subject,
      category: body.category ?? "general",
      priority: body.priority ?? "medium",
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_support_ticket", "support_ticket", data.id, null, data);
  return NextResponse.json({ ticket: data }, { status: 201 });
}
