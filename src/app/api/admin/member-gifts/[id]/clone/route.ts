import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GiftCampaign } from "@/lib/gifts/types";

export const dynamic = "force-dynamic";

const SKIP_CAMPAIGN_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "reserved_quantity",
  "redeemed_quantity",
]);

function generateCode() {
  return `MG${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** 複製活動為草稿（含品項與門市庫存配額，計數歸零） */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ campaign: { id: "mock-clone", name: "複製活動" } }, { status: 201 });
  }

  const admin = createAdminClient();
  const { data: source, error: sErr } = await admin
    .from("gift_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
  if (!source) return NextResponse.json({ error: "找不到活動" }, { status: 404 });

  const src = source as GiftCampaign & Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (SKIP_CAMPAIGN_KEYS.has(key)) continue;
    payload[key] = value;
  }

  payload.name = `${String(src.name ?? "活動")}（複製）`;
  payload.campaign_code = generateCode();
  payload.status = "draft";
  payload.reserved_quantity = 0;
  payload.redeemed_quantity = 0;
  payload.created_by = auth!.profile.id;
  payload.updated_by = auth!.profile.id;
  payload.show_on_frontend = false;

  const { data: created, error: cErr } = await admin
    .from("gift_campaigns")
    .insert(payload)
    .select("*")
    .single();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });

  const newId = created.id as string;

  const [{ data: items }, { data: storeInv }] = await Promise.all([
    admin.from("gift_campaign_items").select("*").eq("campaign_id", id),
    admin.from("gift_campaign_store_inventory").select("*").eq("campaign_id", id),
  ]);

  if (items?.length) {
    const itemRows = items.map((row) => {
      const r = { ...row } as Record<string, unknown>;
      delete r.id;
      delete r.created_at;
      delete r.updated_at;
      r.campaign_id = newId;
      r.reserved_quantity = 0;
      r.redeemed_quantity = 0;
      return r;
    });
    const { error: iErr } = await admin.from("gift_campaign_items").insert(itemRows);
    if (iErr) {
      return NextResponse.json(
        { error: `活動已建立，但品項複製失敗：${iErr.message}`, campaign: created },
        { status: 207 }
      );
    }
  }

  if (storeInv?.length) {
    const invRows = storeInv.map((row) => {
      const r = { ...row } as Record<string, unknown>;
      delete r.id;
      delete r.created_at;
      delete r.updated_at;
      r.campaign_id = newId;
      r.reserved_quantity = 0;
      r.redeemed_quantity = 0;
      return r;
    });
    await admin.from("gift_campaign_store_inventory").insert(invRows);
  }

  await logAudit(
    auth!.profile.id,
    "clone",
    "gift_campaign",
    newId,
    { source_id: id },
    { name: payload.name },
    request as never
  );

  return NextResponse.json({ campaign: created }, { status: 201 });
}
