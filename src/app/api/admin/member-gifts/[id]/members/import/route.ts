import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import { requireGiftMarketing } from "@/lib/gifts/permissions";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function tokensFromCsv(raw: string): string[] {
  return raw
    .split(/[\r\n,，\t;；]+/)
    .map((s) => s.trim())
    .filter((s) => s && !/^member_?(id|number|code)$/i.test(s) && !/^phone$/i.test(s) && !/^email$/i.test(s));
}

/** 匯入指定會員名單：支援 UUID／會員編號／手機／Email */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error, auth } = await requireGiftMarketing();
  if (error) return error;
  const { id } = await context.params;

  const contentType = request.headers.get("content-type") ?? "";
  let raw = "";
  let mode: "replace" | "merge" = "merge";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file instanceof File) {
      raw = await file.text();
    } else {
      raw = String(form.get("text") ?? "");
    }
    mode = String(form.get("mode") ?? "merge") === "replace" ? "replace" : "merge";
  } else {
    const body = await request.json().catch(() => null);
    raw = String(body?.text ?? body?.csv ?? "");
    mode = body?.mode === "replace" ? "replace" : "merge";
  }

  const tokens = tokensFromCsv(raw);
  if (!tokens.length) {
    return NextResponse.json({ error: "沒有可匯入的會員資料" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      matched: tokens.length,
      unresolved: [],
      eligible_member_ids: tokens,
      mode,
    });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("gift_campaigns")
    .select("id, eligible_member_ids, eligibility_type")
    .eq("id", id)
    .maybeSingle();
  if (!campaign) {
    return NextResponse.json({ error: "找不到活動" }, { status: 404 });
  }

  const uuids = tokens.filter((t) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)
  );
  const others = tokens.filter((t) => !uuids.includes(t));

  const matched = new Set<string>(uuids);
  const unresolved: string[] = [];

  // Batch lookup by member_number / member_code / phone / email
  const chunk = 80;
  for (let i = 0; i < others.length; i += chunk) {
    const slice = others.slice(i, i + chunk);
    const [{ data: byNumber }, { data: byCode }, { data: byPhone }, { data: byEmail }] =
      await Promise.all([
        admin.from("profiles").select("id, member_number").in("member_number", slice),
        admin.from("profiles").select("id, member_code").in("member_code", slice),
        admin.from("profiles").select("id, phone").in("phone", slice),
        admin.from("profiles").select("id, email").in("email", slice),
      ]);

    const map = new Map<string, string>();
    for (const row of byNumber ?? []) {
      if (row.member_number) map.set(String(row.member_number), row.id);
    }
    for (const row of byCode ?? []) {
      if (row.member_code) map.set(String(row.member_code), row.id);
    }
    for (const row of byPhone ?? []) {
      if (row.phone) map.set(String(row.phone), row.id);
    }
    for (const row of byEmail ?? []) {
      if (row.email) map.set(String(row.email).toLowerCase(), row.id);
    }

    for (const token of slice) {
      const idFound =
        map.get(token) || map.get(token.toLowerCase()) || map.get(token.replace(/\s+/g, ""));
      if (idFound) matched.add(idFound);
      else unresolved.push(token);
    }
  }

  // Validate UUID tokens exist
  if (uuids.length) {
    const { data: existing } = await admin.from("profiles").select("id").in("id", uuids);
    const ok = new Set((existing ?? []).map((r) => r.id));
    for (const u of uuids) {
      if (!ok.has(u)) {
        matched.delete(u);
        unresolved.push(u);
      }
    }
  }

  const prev = Array.isArray(campaign.eligible_member_ids)
    ? (campaign.eligible_member_ids as string[])
    : [];
  const nextIds =
    mode === "replace"
      ? Array.from(matched)
      : Array.from(new Set([...prev, ...Array.from(matched)]));

  const { data: updated, error: uErr } = await admin
    .from("gift_campaigns")
    .update({
      eligible_member_ids: nextIds,
      eligibility_type: "member_list",
      updated_at: new Date().toISOString(),
      updated_by: auth!.profile.id,
    })
    .eq("id", id)
    .select("id, eligible_member_ids, eligibility_type")
    .single();

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 });

  await logAudit(
    auth!.profile.id,
    "update",
    "gift_campaign",
    id,
    { eligible_count: prev.length },
    {
      action: "import_members",
      mode,
      matched: matched.size,
      unresolved: unresolved.length,
      eligible_count: nextIds.length,
    },
    request as never
  );

  return NextResponse.json({
    campaign: updated,
    matched: matched.size,
    unresolved,
    eligible_member_ids: nextIds,
    mode,
  });
}
