import { NextResponse } from "next/server";
import { requireStoreOps, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      logs: [],
      status: {
        connected: false,
        account: null,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? null,
        clientIdConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      },
    });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("store_backup_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    logs: data ?? [],
    status: {
      connected: false,
      account: null,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? null,
      clientIdConfigured: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    },
  });
}

export async function POST(request: Request) {
  const { error, auth } = await requireStoreOps();
  if (error) return error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "本機未連線 Supabase，僅模擬紀錄",
      log: {
        id: `tmp-${Date.now()}`,
        status: "pending",
        backup_type: "manual",
        created_at: new Date().toISOString(),
        error_message: "Google Drive OAuth 第二階段啟用",
      },
    });
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("store_backup_logs")
    .insert({
      backup_type: "manual",
      status: "pending",
      created_by: auth!.profile.id,
      error_message:
        "MVP：Drive 上傳尚未啟用。請設定 NEXT_PUBLIC_GOOGLE_CLIENT_ID / GOOGLE_DRIVE_FOLDER_ID 後於第二階段完成。",
      files: [
        { name: "產品效期", formats: ["xlsx", "json"] },
        { name: "產品報廢", formats: ["xlsx", "json"] },
        { name: "產品列表", formats: ["xlsx", "json"] },
        { name: "產品資料庫", formats: ["xlsx", "json"] },
      ],
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await logAudit(
    auth!.profile.id,
    "backup_request",
    "store_backup_logs",
    data.id,
    null,
    data,
    request as never
  );

  return NextResponse.json({
    message: "已建立備份請求紀錄（Drive 上傳待第二階段）",
    log: data,
  });
}
