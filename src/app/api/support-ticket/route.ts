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
  const subject = body.subject?.trim();
  const description = (body.description ?? body.message ?? body.subject)?.trim();
  const contactName = body.contactName?.trim() || auth!.profile.full_name || "會員";

  if (!subject || !description) {
    return NextResponse.json({ error: "請填寫問題主旨與內容" }, { status: 400 });
  }

  const ticket = {
    id: `ticket-${Date.now()}`,
    user_id: auth!.profile.id,
    order_id: body.orderId ?? null,
    subject,
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
      order_id: body.orderId ?? null,
      subject,
      description,
      category: body.category ?? "other",
      priority: body.priority ?? "medium",
      contact_name: contactName,
      contact_phone: body.contactPhone ?? auth!.profile.phone ?? null,
      contact_email: body.contactEmail ?? auth!.user?.email ?? null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  await logAudit(auth!.profile.id, "create_support_ticket", "support_ticket", data.id, null, data);
  return NextResponse.json({ ticket: data }, { status: 201 });
}
