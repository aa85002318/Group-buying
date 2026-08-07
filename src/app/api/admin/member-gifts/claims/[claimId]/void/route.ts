import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { voidAvailableGiftClaim } from "@/lib/gifts/maintenance";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** 作廢尚未核銷的兌換券（行銷／總管） */
export async function POST(
  request: Request,
  context: { params: Promise<{ claimId: string }> }
) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;
  const { claimId } = await context.params;

  const body = await request.json().catch(() => null);
  const reason = String(body?.reason ?? "").trim();
  const restoreInventory = body?.restore_inventory !== false;

  if (reason.length < 2) {
    return NextResponse.json({ error: "請填寫作廢原因" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, claim_id: claimId });
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("member_gift_claims")
    .select("*")
    .eq("id", claimId)
    .maybeSingle();

  const result = await voidAvailableGiftClaim({
    claimId,
    adminId: auth!.profile.id,
    reason,
    restoreInventory,
  });

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.code === "not_found" ? 404 : 400 }
    );
  }

  const { data: after } = await admin
    .from("member_gift_claims")
    .select("*")
    .eq("id", claimId)
    .single();

  await logAudit(
    auth!.profile.id,
    "update",
    "member_gift_claim",
    claimId,
    before,
    { action: "void", reason, restore_inventory: restoreInventory, after },
    request as never
  );

  return NextResponse.json({
    success: true,
    claim: after,
    message: "已作廢兌換券",
  });
}
