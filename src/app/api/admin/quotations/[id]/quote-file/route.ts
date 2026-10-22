import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 上傳／移除「自製報價單檔案」。
 *
 * 系統內建的報價單（品項、折扣、運費、可列印）照舊可用。這支是給需要用自己
 * 做好的檔案回覆的情況——例如要蓋章的正式報價單、或客戶指定格式。
 *
 * 兩種方式可以並存：有上傳檔案時以檔案為主，沒有就用系統內建的那份。
 */

const BUCKET = "cms-assets";
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/msword", "doc"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇要上傳的檔案" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "檔案不能超過 10MB" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: "只接受 PDF、Excel、Word 或圖片檔" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: quotation } = await admin
    .from("quotations")
    .select("id, quote_number, quote_file_url")
    .eq("id", id)
    .maybeSingle();
  if (!quotation) {
    return NextResponse.json({ error: "找不到報價單" }, { status: 404 });
  }

  // 路徑由伺服器決定，不用客戶端傳來的檔名組路徑（避免路徑穿越）。
  const path = `quotations/${id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await admin
    .from("quotations")
    .update({
      quote_file_url: pub.publicUrl,
      // 保留原始檔名給客戶看，實際儲存路徑另外產生。
      quote_file_name: file.name.slice(0, 200),
      quote_file_uploaded_at: new Date().toISOString(),
      quote_file_uploaded_by: auth!.profile.id,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAudit(
    auth!.profile.id,
    "update",
    "quotations",
    id,
    { quote_file_url: quotation.quote_file_url },
    { quote_file_url: pub.publicUrl, quote_file_name: file.name },
    request as never
  );

  return NextResponse.json({
    url: pub.publicUrl,
    name: file.name,
    uploaded_at: new Date().toISOString(),
  });
}

/** 移除已上傳的報價單檔案（改回使用系統內建的那份）。 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError, auth } = await requireAdmin();
  if (authError) return authError;
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未設定 Supabase" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("quotations")
    .update({
      quote_file_url: null,
      quote_file_name: null,
      quote_file_uploaded_at: null,
      quote_file_uploaded_by: null,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 儲存體的檔案刻意不刪：審計上可能還需要查得到曾經發出去的版本。
  await logAudit(auth!.profile.id, "update", "quotations", id, null, { quote_file_url: null }, request as never);
  return NextResponse.json({ ok: true });
}
