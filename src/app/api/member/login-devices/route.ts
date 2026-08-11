import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hashDeviceFingerprint,
  summarizeUserAgent,
} from "@/lib/member/account-security";

function requestMeta(request: Request) {
  const ua = request.headers.get("user-agent");
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;
  return { ua, ip };
}

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ devices: [] });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("member_login_devices")
    .select(
      "id, device_label, user_agent, ip_address, first_seen_at, last_seen_at, is_trusted, is_revoked"
    )
    .eq("user_id", auth!.profile.id)
    .eq("is_revoked", false)
    .order("last_seen_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ devices: data ?? [] });
}

/** Record current login device (called after successful login). */
export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { ua, ip } = requestMeta(request);
  const fingerprint = hashDeviceFingerprint({ userAgent: ua, ip });
  const label = summarizeUserAgent(ua);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("member_login_devices")
    .select("id, is_revoked")
    .eq("user_id", auth!.profile.id)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();

  if (existing?.is_revoked) {
    return NextResponse.json(
      { error: "此裝置已被撤銷，請使用其他裝置登入或聯繫客服", revoked: true },
      { status: 403 }
    );
  }

  const { error: upsertError } = await admin.from("member_login_devices").upsert(
    {
      user_id: auth!.profile.id,
      device_fingerprint: fingerprint,
      device_label: label,
      user_agent: ua,
      ip_address: ip,
      last_seen_at: new Date().toISOString(),
      is_revoked: false,
    },
    { onConflict: "user_id,device_fingerprint" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Count devices — flag if new device (optional signal for UI)
  const { count } = await admin
    .from("member_login_devices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth!.profile.id)
    .eq("is_revoked", false);

  return NextResponse.json({
    ok: true,
    isNewDevice: !existing,
    deviceCount: count ?? 1,
  });
}

export async function DELETE(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "缺少裝置 id" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  const { error: updError } = await admin
    .from("member_login_devices")
    .update({ is_revoked: true })
    .eq("id", id)
    .eq("user_id", auth!.profile.id);

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
