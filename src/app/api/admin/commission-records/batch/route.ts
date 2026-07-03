import { NextResponse } from "next/server";
import { requireRole, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { mockStore } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { error, auth } = await requireRole("admin");
  if (error) return error;

  const body = await request.json();
  const { ids, action } = body as { ids: string[]; action: "approve" | "reject" | "issue" };
  const now = new Date().toISOString();
  const statusMap = { approve: "approved", reject: "rejected", issue: "issued" } as const;
  const status = statusMap[action];

  if (!isSupabaseConfigured()) {
    const updated = mockStore.commissions.filter((r) => ids.includes(r.id));
    updated.forEach((r) => {
      r.status = status;
      r.reviewed_by = auth!.profile.id;
      r.reviewed_at = now;
      if (action === "issue") {
        r.issued_by = auth!.profile.id;
        r.issued_at = now;
      }
    });
    return NextResponse.json({ records: updated, count: updated.length });
  }

  const admin = createAdminClient();
  const payload: Record<string, unknown> = { status };
  if (action !== "issue") {
    payload.reviewed_by = auth!.profile.id;
    payload.reviewed_at = now;
  } else {
    payload.issued_by = auth!.profile.id;
    payload.issued_at = now;
  }

  const { data, error: updateError } = await admin
    .from("commission_records")
    .update(payload)
    .in("id", ids)
    .select();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await logAudit(auth!.profile.id, `batch_${action}_commission`, "commission_record", null, null, { ids });
  return NextResponse.json({ records: data, count: data?.length ?? 0 });
}
