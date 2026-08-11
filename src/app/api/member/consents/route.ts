import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

const DOC_KEYS = new Set(["privacy", "terms", "marketing"]);

export async function GET() {
  const { error, auth } = await requireAuth();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      consents: [
        {
          document_key: "privacy",
          document_version: "1.0",
          agreed: true,
          agreed_at: new Date().toISOString(),
        },
        {
          document_key: "terms",
          document_version: "1.0",
          agreed: true,
          agreed_at: new Date().toISOString(),
        },
      ],
      marketing: {
        email: false,
        line: false,
        sms: false,
      },
    });
  }

  const admin = createAdminClient();
  const userId = auth!.profile.id;

  const [consentsRes, profileRes] = await Promise.all([
    admin
      .from("member_legal_consents")
      .select("document_key, document_version, agreed, agreed_at")
      .eq("user_id", userId)
      .order("agreed_at", { ascending: false }),
    admin
      .from("profiles")
      .select(
        "marketing_email_opt_in, marketing_line_opt_in, marketing_sms_opt_in"
      )
      .eq("id", userId)
      .single(),
  ]);

  return NextResponse.json({
    consents: consentsRes.data ?? [],
    marketing: {
      email: Boolean(profileRes.data?.marketing_email_opt_in),
      line: Boolean(profileRes.data?.marketing_line_opt_in),
      sms: Boolean(profileRes.data?.marketing_sms_opt_in),
    },
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const documentKey =
    typeof body.documentKey === "string" ? body.documentKey.trim() : "";
  const documentVersion =
    typeof body.documentVersion === "string" && body.documentVersion.trim()
      ? body.documentVersion.trim()
      : "1.0";
  const agreed = body.agreed !== false;

  if (!DOC_KEYS.has(documentKey)) {
    return NextResponse.json({ error: "無效的文件類型" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const admin = createAdminClient();
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = request.headers.get("user-agent");

  const { error: upsertError } = await admin.from("member_legal_consents").upsert(
    {
      user_id: auth!.profile.id,
      document_key: documentKey,
      document_version: documentVersion,
      agreed,
      agreed_at: new Date().toISOString(),
      ip_address: ip,
      user_agent: ua,
    },
    { onConflict: "user_id,document_key,document_version" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  if (documentKey === "marketing") {
    await admin
      .from("profiles")
      .update({
        marketing_email_opt_in: agreed,
        marketing_line_opt_in: agreed,
        marketing_sms_opt_in: agreed,
      })
      .eq("id", auth!.profile.id);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const { error, auth } = await requireAuth();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const updates: Record<string, boolean> = {};
  if (typeof body.email === "boolean") updates.marketing_email_opt_in = body.email;
  if (typeof body.line === "boolean") updates.marketing_line_opt_in = body.line;
  if (typeof body.sms === "boolean") updates.marketing_sms_opt_in = body.sms;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "沒有可更新的欄位" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: updError } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", auth!.profile.id);

  if (updError) {
    return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  // Keep consent history for marketing channel changes
  const anyOptIn = Object.values(updates).some(Boolean);
  await admin.from("member_legal_consents").upsert(
    {
      user_id: auth!.profile.id,
      document_key: "marketing",
      document_version: "1.0",
      agreed: anyOptIn,
      agreed_at: new Date().toISOString(),
      ip_address:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    },
    { onConflict: "user_id,document_key,document_version" }
  );

  return NextResponse.json({ ok: true });
}
